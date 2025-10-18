import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation schema for security
const CreateClientSchema = z.object({
  token: z.string().min(32).max(100),
  password: z.string().min(6).max(100),
  fullName: z.string().trim().min(1).max(200)
});

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
    
    // Validate input to prevent attacks
    const body = await req.json();
    const validationResult = CreateClientSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('[create-client-from-invite] Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ error: "Dados inválidos fornecidos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const { token, password, fullName } = validationResult.data;

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
      // Se usuário já existe, retornar erro para que faça login
      const code = (createError as any).code || (createError as any).status || '';
      if (code === 'email_exists' || (createError as any).status === 422) {
        console.warn('[create-client-from-invite] User already exists');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Um usuário com este email já existe. Por favor, faça login.' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
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

    // Garantir que o processo do convite esteja vinculado a este cliente
    const { data: updatedProcess, error: processUpdateError } = await supabase
      .from('processes')
      .update({
        client_email: invite.email,
        client_name: fullName,
      })
      .eq('id', invite.process_id)
      .eq('company_id', invite.company_id)
      .select('id, client_email')
      .maybeSingle();

    if (processUpdateError) {
      console.error('[create-client-from-invite] Process update error:', processUpdateError);
    } else if (!updatedProcess) {
      console.warn('[create-client-from-invite] Process not found to update with invited client email', {
        process_id: invite.process_id,
        company_id: invite.company_id,
      });
    } else {
      console.log('[create-client-from-invite] Process client linked:', updatedProcess);
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

    // Buscar dados da empresa e do processo para o email
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', invite.company_id)
      .single();

    const { data: process } = await supabase
      .from('processes')
      .select('project_name, process_type')
      .eq('id', invite.process_id)
      .single();

    // Enviar email de boas-vindas ao cliente
    try {
      const { error: emailError } = await supabase.functions.invoke('send-unified-email', {
        body: {
          to: invite.email,
          companyName: company?.name || 'Empresa',
          inviteType: 'client',
          clientName: fullName,
          processName: process?.project_name || process?.process_type || 'Processo',
        }
      });

      if (emailError) {
        console.error('[create-client-from-invite] Error sending welcome email:', emailError);
      }
    } catch (emailErr) {
      console.error('[create-client-from-invite] Error invoking send-unified-email:', emailErr);
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
    // Return generic error message to client, log details server-side
    return new Response(
      JSON.stringify({ error: 'Erro ao criar conta. Por favor, tente novamente ou contate o suporte.' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});