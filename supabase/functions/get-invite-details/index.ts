import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetInviteDetailsRequest {
  token: string;
}

interface GetInviteDetailsResponse {
  success: boolean;
  invite?: any;
  process?: any;
  company?: any;
  documentRequests?: any[];
  error?: string;
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

    const { token }: GetInviteDetailsRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-invite-details] Buscando convite com token:', token);

    // 1) Buscar convite na tabela client_invites
    const { data: invite, error: inviteError } = await supabase
      .from('client_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      console.error('[get-invite-details] Convite não encontrado:', inviteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Convite inválido ou expirado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o convite expirou
    if (new Date(invite.expires_at) < new Date()) {
      console.error('[get-invite-details] Convite expirado');
      return new Response(
        JSON.stringify({ success: false, error: 'Convite expirado. Solicite um novo link à empresa.' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-invite-details] Convite encontrado:', invite);

    // 2) Buscar processo vinculado
    const { data: process, error: processError } = await supabase
      .from('processes')
      .select('*')
      .eq('id', invite.process_id)
      .single();

    if (processError || !process) {
      console.error('[get-invite-details] Processo não encontrado:', processError);
      return new Response(
        JSON.stringify({ success: false, error: 'Processo vinculado não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-invite-details] Processo encontrado:', process);

    // 3) Buscar empresa solicitante
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', process.company_id)
      .single();

    if (companyError) {
      console.warn('[get-invite-details] Empresa não encontrada:', companyError);
    }

    console.log('[get-invite-details] Empresa encontrada:', company);

    // 4) Buscar documentos solicitados
    const { data: documentRequests, error: docReqError } = await supabase
      .from('document_requests')
      .select(`
        *,
        document_uploads:document_uploads!document_uploads_document_request_id_fkey(*)
      `)
      .eq('process_id', invite.process_id)
      .order('created_at', { ascending: true });

    if (docReqError) {
      console.warn('[get-invite-details] Erro ao buscar documentos solicitados:', docReqError);
    }

    console.log('[get-invite-details] Documentos solicitados:', documentRequests?.length || 0);

    // 5) Retornar dados completos
    const response: GetInviteDetailsResponse = {
      success: true,
      invite,
      process,
      company: company || null,
      documentRequests: documentRequests || [],
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[get-invite-details] Erro interno:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
