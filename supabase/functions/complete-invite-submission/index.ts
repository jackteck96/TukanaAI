import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteInviteSubmissionRequest {
  token: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token }: CompleteInviteSubmissionRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[complete-invite-submission] token:', token);

    // 1) Buscar convite
    const { data: invite, error: inviteError } = await supabase
      .from('client_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      console.error('[complete-invite-submission] Convite inválido:', inviteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Convite inválido ou expirado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Convite expirado. Solicite um novo link à empresa.' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Buscar documentos obrigatórios do processo
    const { data: requests, error: reqError } = await supabase
      .from('document_requests')
      .select('id')
      .eq('process_id', invite.process_id)
      .eq('required', true);

    if (reqError) {
      console.error('[complete-invite-submission] Erro ao buscar requests:', reqError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao validar solicitações' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requiredIds = (requests ?? []).map((r: any) => r.id);

    if (requiredIds.length === 0) {
      // Se nada obrigatório, considerar como completo
      console.log('[complete-invite-submission] Nenhum documento obrigatório. Marcando como Sent.');
    } else {
      // 3) Contar uploads por request
      const { data: uploads, error: uploadsError } = await supabase
        .from('document_uploads')
        .select('document_request_id, id')
        .in('document_request_id', requiredIds)
        .eq('process_id', invite.process_id);

      if (uploadsError) {
        console.error('[complete-invite-submission] Erro ao buscar uploads:', uploadsError);
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao validar uploads' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const uploadedSet = new Set((uploads ?? []).map((u: any) => u.document_request_id));
      const missing = requiredIds.filter((id: string) => !uploadedSet.has(id));
      if (missing.length > 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Envie todos os documentos obrigatórios antes de finalizar.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4) Atualizar status do processo para "Sent"
    const { error: updateProcessError } = await supabase
      .from('processes')
      .update({ status: 'Sent', updated_at: new Date().toISOString() })
      .eq('id', invite.process_id);

    if (updateProcessError) {
      console.error('[complete-invite-submission] Erro ao atualizar processo:', updateProcessError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao finalizar processo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5) Opcional: marcar convite como usado
    const { error: inviteStatusErr } = await supabase
      .from('client_invites')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (inviteStatusErr) {
      console.warn('[complete-invite-submission] Falha ao atualizar status do convite (ignorado):', inviteStatusErr);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[complete-invite-submission] Erro interno:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
