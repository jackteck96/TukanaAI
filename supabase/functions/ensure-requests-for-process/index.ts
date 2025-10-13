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

    // Verificar se já existem document_requests
    const { data: existingReqs, error: existingErr } = await supabase
      .from('document_requests')
      .select('*')
      .eq('process_id', processId);

    if (existingErr) {
      console.warn('[ensure-requests-for-process] Erro verificando document_requests:', existingErr);
    }

    let created = 0;

    if (!existingReqs || existingReqs.length === 0) {
      console.log('[ensure-requests-for-process] Nenhum document_request; buscando tasks...');
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('process_id', processId)
        .order('created_at', { ascending: true });

      if (tasksError) {
        console.error('[ensure-requests-for-process] Erro ao buscar tasks:', tasksError);
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao buscar tasks' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (tasks && tasks.length > 0) {
        const toInsert = tasks.map((t: any) => ({
          process_id: processId,
          company_id: process.company_id,
          required: true,
          document_name: t.document_type || t.title,
          instructions: t.description,
          current_status: t.status === 'completed' ? 'aprovado' : 'pendente',
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('document_requests')
          .insert(toInsert)
          .select('*');

        if (insertError) {
          console.error('[ensure-requests-for-process] Erro ao criar document_requests a partir das tasks:', insertError);
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao criar solicitações' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        created = inserted?.length || 0;
        console.log('[ensure-requests-for-process] document_requests criados:', created);
      } else {
        console.log('[ensure-requests-for-process] Nenhuma task encontrada para o processo.');
      }

      // Fallback 1: criar a partir de process.process_type (empresa selecionou tipos no processo)
      try {
        // Checar novamente se ainda não há solicitações
        const { data: checkReqs1 } = await supabase
          .from('document_requests')
          .select('id')
          .eq('process_id', processId)
          .limit(1);

        if (!checkReqs1 || checkReqs1.length === 0) {
          const rawType: string = (process.process_type || '').toString();
          if (rawType) {
            // Extrair parte após os dois pontos, se houver, e separar por vírgulas
            const afterColon = rawType.includes(':') ? (rawType.split(':').pop() || rawType) : rawType;
            const names = afterColon.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

            if (names.length > 0) {
              const toInsertFromProcessType = names.map((name: string) => ({
                process_id: processId,
                company_id: process.company_id,
                required: true,
                document_name: name,
                instructions: null,
                current_status: 'pendente',
              }));

              const { data: insertedFromPT, error: insertPTError } = await supabase
                .from('document_requests')
                .insert(toInsertFromProcessType)
                .select('*');

              if (insertPTError) {
                console.warn('[ensure-requests-for-process] Erro ao criar a partir de process_type:', insertPTError);
              } else {
                const addedPT = insertedFromPT?.length || 0;
                created += addedPT;
                console.log('[ensure-requests-for-process] document_requests criados a partir de process_type:', addedPT, names);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[ensure-requests-for-process] Fallback process_type falhou:', e);
      }

      // Fallback 2: criar solicitações a partir dos tipos de documentos da empresa
      try {
        // Verificar novamente se ainda não há solicitações
        const { data: checkReqs } = await supabase
          .from('document_requests')
          .select('id')
          .eq('process_id', processId)
          .limit(1);

        if (!checkReqs || checkReqs.length === 0) {
          const { data: types, error: typesError } = await supabase
            .from('document_types')
            .select('*')
            .eq('company_id', process.company_id)
            .order('created_at', { ascending: true });

          if (typesError) {
            console.warn('[ensure-requests-for-process] Erro ao buscar document_types:', typesError);
          } else if (types && types.length > 0) {
            const toInsertFromTypes = types.map((dt: any) => ({
              process_id: processId,
              company_id: process.company_id,
              required: true,
              document_name: dt.name,
              instructions: dt.notes || null,
              current_status: 'pendente',
            }));

            const { data: insertedFromTypes, error: insertTypesError } = await supabase
              .from('document_requests')
              .insert(toInsertFromTypes)
              .select('*');

            if (insertTypesError) {
              console.error('[ensure-requests-for-process] Erro ao criar document_requests a partir de document_types:', insertTypesError);
            } else {
              const added = insertedFromTypes?.length || 0;
              created += added;
              console.log('[ensure-requests-for-process] document_requests criados a partir de document_types:', added);
            }
          } else {
            console.log('[ensure-requests-for-process] Nenhum document_type encontrado para a empresa.');
          }
        }
      } catch (e) {
        console.warn('[ensure-requests-for-process] Fallback de document_types falhou:', e);
      }
    }

    // Retornar lista atualizada de document_requests com seus uploads
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
      existing: (existingReqs?.length || 0),
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
