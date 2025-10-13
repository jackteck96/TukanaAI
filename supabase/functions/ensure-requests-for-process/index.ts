import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnsureRequestsRequest {
  processId: string;
}

interface EnsureRequestsResponse {
  success: boolean;
  created: number;
  existing: number;
  documentRequests: any[];
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

    const { processId }: EnsureRequestsRequest = await req.json();

    if (!processId) {
      return new Response(
        JSON.stringify({ success: false, error: 'processId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ensure-requests-for-process] Garantindo solicitações para processo:', processId);

    // Buscar processo
    const { data: process, error: processError } = await supabase
      .from('processes')
      .select('*')
      .eq('id', processId)
      .single();

    if (processError || !process) {
      console.error('[ensure-requests-for-process] Processo não encontrado:', processError);
      return new Response(
        JSON.stringify({ success: false, error: 'Processo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sincronizar solicitações com o que a empresa realmente pediu para ESTE processo
    let created = 0;

    // 1) Determinar a fonte da verdade
    // 1.a) Tasks do processo (mais específico)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('process_id', processId)
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('[ensure-requests-for-process] Erro ao buscar tasks:', tasksError);
    }

    let desiredNames: string[] = [];
    if (tasks && tasks.length > 0) {
      desiredNames = Array.from(new Set((tasks || []).map((t: any) => (t.document_type || t.title || '').toString().trim()).filter(Boolean)));
      console.log('[ensure-requests-for-process] Fonte: tasks →', desiredNames);
    }

    // 1.b) Campo process.process_type (ex.: "Documento: RG, CPF")
    if (desiredNames.length === 0) {
      const rawType: string = (process.process_type || '').toString();
      if (rawType) {
        const afterColon = rawType.includes(':') ? (rawType.split(':').pop() || rawType) : rawType;
        desiredNames = Array.from(new Set(afterColon.split(',').map((s) => s.trim()).filter((s) => s.length > 0)));
        if (desiredNames.length) console.log('[ensure-requests-for-process] Fonte: process.process_type →', desiredNames);
      }
    }

    // 1.c) Tipos cadastrados na empresa (catálogo) como último recurso
    if (desiredNames.length === 0) {
      const { data: types, error: typesError } = await supabase
        .from('document_types')
        .select('name, notes')
        .eq('company_id', process.company_id)
        .order('created_at', { ascending: true });
      if (!typesError && types && types.length > 0) {
        desiredNames = Array.from(new Set(types.map((t: any) => t.name)));
        console.log('[ensure-requests-for-process] Fonte: document_types →', desiredNames);
      }
    }

    // 2) Carregar existentes (com uploads)
    const { data: existingReqsFull } = await supabase
      .from('document_requests')
      .select('id, document_name, document_uploads:document_uploads!document_uploads_document_request_id_fkey(id)')
      .eq('process_id', processId);

    const existingByName = new Map<string, { id: string; uploads: number }>();
    (existingReqsFull || []).forEach((r: any) => {
      existingByName.set((r.document_name || '').toString(), { id: r.id, uploads: (r.document_uploads || []).length });
    });

    // 3) Inserir o que falta
    const toInsertNames = desiredNames.filter((name) => !existingByName.has(name));
    if (toInsertNames.length > 0) {
      const toInsert = toInsertNames.map((name) => ({
        process_id: processId,
        company_id: process.company_id,
        required: true,
        document_name: name,
        instructions: null,
        current_status: 'pendente',
      }));
      const { data: insertedReqs, error: insertErr } = await supabase
        .from('document_requests')
        .insert(toInsert)
        .select('id');
      if (insertErr) {
        console.error('[ensure-requests-for-process] Erro ao inserir faltantes:', insertErr);
      } else {
        created += insertedReqs?.length || 0;
        console.log('[ensure-requests-for-process] Inseridos faltantes:', created);
      }
    }

    // 4) Remover o que não foi pedido (sem uploads)
    const toDeleteIds: string[] = [];
    (existingReqsFull || []).forEach((r: any) => {
      const name = (r.document_name || '').toString();
      const uploads = (r.document_uploads || []).length;
      if (!desiredNames.includes(name) && uploads === 0) {
        toDeleteIds.push(r.id);
      }
    });
    if (toDeleteIds.length > 0) {
      const { error: delErr } = await supabase
        .from('document_requests')
        .delete()
        .in('id', toDeleteIds);
      if (delErr) {
        console.warn('[ensure-requests-for-process] Falha ao remover não pedidos:', delErr);
      } else {
        console.log('[ensure-requests-for-process] Removidos não pedidos:', toDeleteIds.length);
      }
    }

    // 5) Retornar lista atualizada de document_requests com seus uploads
    const { data: finalReqs, error: finalErr } = await supabase
      .from('document_requests')
      .select('*, document_uploads:document_uploads!document_uploads_document_request_id_fkey(*)')
      .eq('process_id', processId)
      .order('created_at', { ascending: true });


    if (finalErr) {
      console.warn('[ensure-requests-for-process] Erro ao carregar solicitações finais:', finalErr);
    }

    const response: EnsureRequestsResponse = {
      success: true,
      created,
      existing: (finalReqs?.length || 0),
      documentRequests: finalReqs || [],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[ensure-requests-for-process] Erro interno:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
