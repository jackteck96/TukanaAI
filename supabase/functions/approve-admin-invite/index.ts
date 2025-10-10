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

    const { token, action } = await req.json();

    if (!token) {
      throw new Error('Token é obrigatório');
    }

    // Buscar o convite
    const { data: invite, error: inviteError } = await supabase
      .from('admin_invites')
      .select('*')
      .eq('approval_token', token)
      .single();

    if (inviteError || !invite) {
      throw new Error('Convite não encontrado');
    }

    // Verificar se já foi processado
    if (invite.status !== 'pending') {
      throw new Error('Este convite já foi processado');
    }

    // Verificar se expirou
    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Este convite expirou');
    }

    // Atualizar status do convite
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await supabase
      .from('admin_invites')
      .update({ 
        status: newStatus,
        approved_at: new Date().toISOString()
      })
      .eq('id', invite.id);

    if (updateError) {
      throw new Error('Erro ao atualizar convite');
    }

    if (action === 'approve') {
      // Criar convite de usuário para que ele possa se cadastrar
      const inviteToken = crypto.randomUUID().replace(/-/g, '');
      
      const { error: userInviteError } = await supabase
        .from('user_invites')
        .insert({
          email: invite.email,
          full_name: invite.full_name,
          role: 'admin',
          company_id: null, // Admin de plataforma não tem company_id
          invited_by: invite.invited_by,
          token: inviteToken,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (userInviteError) {
        console.error('Erro ao criar user_invite:', userInviteError);
      }

      // Enviar email para o novo admin com link de cadastro
      const signupLink = `${supabaseUrl.replace('.supabase.co', '')}/cadastro-via-convite?token=${inviteToken}`;
      
      await supabase.functions.invoke('send-unified-email', {
        body: {
          to: invite.email,
          recipientName: invite.full_name,
          companyName: 'Plataforma',
          inviteLink: signupLink,
          isCollaboratorInvite: false
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: action === 'approve' 
          ? 'Administrador aprovado com sucesso! Um email foi enviado para completar o cadastro.' 
          : 'Convite rejeitado com sucesso.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in approve-admin-invite:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
