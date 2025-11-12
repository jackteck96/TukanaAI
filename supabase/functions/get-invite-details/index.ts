import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema for security
const GetInviteDetailsSchema = z.object({
  token: z.string().min(32).max(100)
});

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

    // Validate input to prevent attacks
    const body = await req.json();
    const validationResult = GetInviteDetailsSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('[get-invite-details] Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { token } = validationResult.data;

    console.log('[get-invite-details] Buscando convite com token:', token);

    // 1) Tentar buscar na tabela client_invites primeiro
    let invite: any = null;
    let isCollaboratorInvite = false;
    
    const { data: clientInvite, error: clientInviteError } = await supabase
      .from('client_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (clientInvite) {
      invite = clientInvite;
      console.log('[get-invite-details] Convite de cliente encontrado');
    } else {
      // Se não encontrou em client_invites, tentar em user_invites (colaboradores)
      console.log('[get-invite-details] Não encontrado em client_invites, tentando user_invites...');
      const { data: userInvite, error: userInviteError } = await supabase
        .from('user_invites')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (userInvite) {
        invite = userInvite;
        isCollaboratorInvite = true;
        console.log('[get-invite-details] Convite de colaborador encontrado');
      } else {
        console.error('[get-invite-details] Convite não encontrado em nenhuma tabela ou já foi usado');
        return new Response(
          JSON.stringify({ success: false, error: 'Convite inválido, expirado ou já utilizado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!invite) {
      console.error('[get-invite-details] Convite não encontrado');
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

    console.log('[get-invite-details] Convite encontrado:', invite, 'isCollaboratorInvite:', isCollaboratorInvite);

    // 2) Para convites de colaborador, não há processo vinculado
    let process = null;
    let company = null;
    let documentRequests: any[] = [];

    if (isCollaboratorInvite) {
      // Para colaboradores, apenas buscar a empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', invite.company_id)
        .single();

      if (companyError) {
        console.error('[get-invite-details] Empresa não encontrada para colaborador:', companyError);
        return new Response(
          JSON.stringify({ success: false, error: 'Empresa não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      company = companyData;
      console.log('[get-invite-details] Empresa encontrada para colaborador:', company);

      // Retornar resposta para colaborador sem processo
      const response: GetInviteDetailsResponse = {
        success: true,
        invite: { ...invite, isCollaboratorInvite: true },
        process: null,
        company: company,
        documentRequests: [],
      };

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para convites de cliente, buscar processo vinculado
    const { data: processData, error: processError } = await supabase
      .from('processes')
      .select('*')
      .eq('id', invite.process_id)
      .single();

    if (processError || !processData) {
      console.error('[get-invite-details] Processo não encontrado:', processError);
      return new Response(
        JSON.stringify({ success: false, error: 'Processo vinculado não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    process = processData;

    console.log('[get-invite-details] Processo encontrado:', process);

    // 3) Buscar empresa solicitante
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', process.company_id)
      .single();

    if (companyError) {
      console.warn('[get-invite-details] Empresa não encontrada:', companyError);
    }

    company = companyData;
    console.log('[get-invite-details] Empresa encontrada:', company);

    // 4) Buscar documentos solicitados
    const { data: docRequestsData, error: docReqError } = await supabase
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

    console.log('[get-invite-details] Documentos solicitados:', docRequestsData?.length || 0);

    let effectiveDocumentRequests = docRequestsData || [];

    // 4b) Fallback: se não houver document_requests, materializar a partir das tasks
    if (!effectiveDocumentRequests || effectiveDocumentRequests.length === 0) {
      console.log('[get-invite-details] Sem document_requests; buscando tasks para o processo...');
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('process_id', invite.process_id)
        .order('created_at', { ascending: true });

      if (tasksError) {
        console.warn('[get-invite-details] Erro ao buscar tasks:', tasksError);
      }

      if (tasks && tasks.length > 0) {
        console.log('[get-invite-details] Tasks encontradas:', tasks.length);
        const toInsert = tasks.map((t: any) => ({
          process_id: invite.process_id,
          company_id: process.company_id,
          required: true,
          document_name: t.document_type || t.title,
          instructions: t.description,
          current_status: t.status === 'completed' ? 'aprovado' : 'pendente',
        }));
        const { data: inserted, error: insertError } = await supabase
          .from('document_requests')
          .insert(toInsert)
          .select(`*, document_uploads:document_uploads!document_uploads_document_request_id_fkey(*)`);
        if (insertError) {
          console.warn('[get-invite-details] Falha ao materializar document_requests; retornando tasks mapeadas:', insertError);
          effectiveDocumentRequests = tasks.map((t: any) => ({
            id: t.id,
            process_id: invite.process_id,
            company_id: process.company_id,
            required: true,
            created_at: t.created_at,
            updated_at: t.updated_at,
            last_upload_id: null,
            last_uploaded_at: null,
            current_status: t.status === 'completed' ? 'aprovado' : 'pendente',
            document_name: t.document_type || t.title,
            instructions: t.description,
            document_uploads: []
          }));
        } else {
          effectiveDocumentRequests = inserted || [];
        }
      }
    }

    // 5) Retornar dados completos
    const response: GetInviteDetailsResponse = {
      success: true,
      invite,
      process,
      company: company || null,
      documentRequests: effectiveDocumentRequests,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[get-invite-details] Erro interno:', error);
    // Return generic error message to client, log details server-side
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar detalhes do convite. Por favor, tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
