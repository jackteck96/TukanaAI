import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetProcessRequestsRequest {
  processId: string;
}

interface GetProcessRequestsResponse {
  success: boolean;
  documentRequests?: any[];
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const accessToken = authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '').trim()
      : null;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { processId }: GetProcessRequestsRequest = await req.json();

    if (!processId) {
      return new Response(
        JSON.stringify({ success: false, error: 'processId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Identificar usuário a partir do token recebido
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      console.error('[get-process-requests] Erro ao obter usuário do token:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requesterEmail = userData.user.email || null;
    if (!requesterEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email do usuário não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar acesso ao processo: o email do usuário deve ser o client_email do processo
    const { data: process, error: processError } = await supabase
      .from('processes')
      .select('id, client_email')
      .eq('id', processId)
      .maybeSingle();

    if (processError || !process) {
      console.error('[get-process-requests] Processo não encontrado:', processError);
      return new Response(
        JSON.stringify({ success: false, error: 'Processo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (process.client_email !== requesterEmail) {
      console.warn('[get-process-requests] Acesso negado: email não corresponde ao cliente do processo');
      return new Response(
        JSON.stringify({ success: false, error: 'Acesso negado ao processo' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar solicitações de documentos do processo
    const { data: documentRequests, error: docReqError } = await supabase
      .from('document_requests')
      .select(`
        *,
        document_uploads:document_uploads!document_uploads_document_request_id_fkey(*)
      `)
      .eq('process_id', processId)
      .order('created_at', { ascending: true });

    if (docReqError) {
      console.error('[get-process-requests] Erro ao buscar document_requests:', docReqError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao carregar solicitações' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response: GetProcessRequestsResponse = {
      success: true,
      documentRequests: documentRequests || [],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[get-process-requests] Erro interno:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});