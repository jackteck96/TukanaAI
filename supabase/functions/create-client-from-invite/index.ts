import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateClientRequest {
  token: string;
  password: string;
  fullName: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[create-client-from-invite] Missing Supabase env vars");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor ausente" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { token, password, fullName }: CreateClientRequest = await req.json();

    console.log('[create-client-from-invite] Processing invite token:', token);

    // Verificar convite válido
    const { data: invite, error: inviteError } = await supabase
      .from('client_invites')
      .select('email, company_id, process_id, expires_at, status')
      .eq('token', token)
      .maybeSingle();

    if (inviteError || !invite) {
      console.error('[create-client-from-invite] Invite not found:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Convite não encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (invite.status !== 'pending') {
      console.error('[create-client-from-invite] Invite already used:', invite.status);
      return new Response(
        JSON.stringify({ error: 'Convite já foi usado' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (new Date(invite.expires_at) <= new Date()) {
      console.error('[create-client-from-invite] Invite expired:', invite.expires_at);
      return new Response(
        JSON.stringify({ error: 'Convite expirado' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Criar usuário já confirmado usando Admin API
    let createdUser: { id: string; email: string } | null = null;

    const { data: userData, error: createError }: any = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true, // Confirma o e-mail automaticamente
      user_metadata: {
        full_name: fullName,
        role: 'client',
      },
    });

    if (createError) {
      // Se já existe, confirmar e atualizar senha do usuário existente
      const code = (createError as any).code || (createError as any).status || '';
      if (code === 'email_exists' || (createError as any).status === 422) {
        console.warn('[create-client-from-invite] User already exists, upgrading existing account');
        // Encontrar ID do usuário existente via tabela de perfis
        const { data: profileRow, error: profileLookupError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', invite.email)
          .maybeSingle();

        let existingUserId: string | null = profileRow?.id || null;

        if (!existingUserId) {
          // Fallback: varrer usuários via Admin API (último recurso)
          const { data: usersPage, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
          if (listErr) {
            console.error('[create-client-from-invite] listUsers error:', listErr);
          }
          const match = (usersPage as any)?.users?.find((u: any) => (u.email || '').toLowerCase() === invite.email.toLowerCase());
          existingUserId = match?.id || null;
        }

        if (!existingUserId) {
          console.error('[create-client-from-invite] Could not resolve existing user id by email');
          return new Response(
            JSON.stringify({ error: 'Usuário já existe mas não foi possível localizá-lo.' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const { data: updatedUser, error: updateErr } = await supabase.auth.admin.updateUserById(existingUserId, {
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: 'client',
          },
        });

        if (updateErr) {
          console.error('[create-client-from-invite] Error updating existing user:', updateErr);
          return new Response(
            JSON.stringify({ error: updateErr.message || 'Falha ao atualizar usuário existente' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        createdUser = { id: updatedUser.user.id, email: updatedUser.user.email! };
      } else {
        console.error('[create-client-from-invite] Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    } else if (userData?.user) {
      createdUser = { id: userData.user.id, email: userData.user.email! };
    }

    if (!createdUser) {
      console.error('[create-client-from-invite] No user data resolved');
      return new Response(
        JSON.stringify({ error: 'Falha ao criar/atualizar usuário' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[create-client-from-invite] User ready:', createdUser.id);

    // Atualizar perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        role: 'client',
        company_id: invite.company_id,
      })
      .eq('id', createdUser.id);

    if (profileError) {
      console.error('[create-client-from-invite] Profile update error:', profileError);
    }

    // Marcar convite como usado
    const { error: updateError } = await supabase
      .from('client_invites')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
      })
      .eq('token', token);

    if (updateError) {
      console.error('[create-client-from-invite] Error updating invite:', updateError);
    }

    console.log('[create-client-from-invite] Client created successfully:', createdUser.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: createdUser.id,
          email: createdUser.email,
          role: 'client'
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (err: any) {
    console.error('[create-client-from-invite] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Erro inesperado' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});