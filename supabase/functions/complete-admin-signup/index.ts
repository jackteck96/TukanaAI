import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, email, password, full_name } = await req.json();

    if (!token || !email || !password) {
      throw new Error('Token, email e senha são obrigatórios');
    }

    // Buscar o convite de usuário
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .eq('status', 'pending')
      .is('company_id', null) // Admin de plataforma
      .single();

    if (inviteError || !invite) {
      throw new Error('Convite não encontrado ou inválido');
    }

    // Verificar se expirou
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Este convite expirou');
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || invite.full_name
      }
    });

    if (authError) {
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    const userId = authData.user.id;

    // Criar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: full_name || invite.full_name,
        role: 'admin', // Para compatibilidade com código legado
        company_id: null
      });

    if (profileError) {
      console.error('Erro ao criar profile:', profileError);
      // Tentar deletar o usuário criado se falhar
      await supabase.auth.admin.deleteUser(userId);
      throw new Error('Erro ao criar perfil do usuário');
    }

    // Adicionar role de platform_admin na tabela user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'platform_admin',
        company_id: null,
        client_email: null
      });

    if (roleError) {
      console.error('Erro ao adicionar role:', roleError);
      // Tentar deletar o usuário e perfil criados se falhar
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
      throw new Error('Erro ao adicionar permissões de administrador');
    }

    // Marcar convite como usado
    const { error: updateError } = await supabase
      .from('user_invites')
      .update({ 
        status: 'accepted',
        used_at: new Date().toISOString()
      })
      .eq('id', invite.id);

    if (updateError) {
      console.error('Erro ao atualizar convite:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conta de administrador criada com sucesso!',
        user_id: userId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in complete-admin-signup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
