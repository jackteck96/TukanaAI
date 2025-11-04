import { supabase } from '@/integrations/supabase/client';

/**
 * Atualiza o progresso de um processo baseado nas solicitações de documentos
 * Considera todas as solicitações (document_requests) para calcular o progresso real
 */
export const updateProcessProgress = async (processId: string): Promise<void> => {
  try {
    // Buscar todas as solicitações de documentos para este processo
    const { data: requests, error: requestsError } = await supabase
      .from('document_requests')
      .select('id, current_status, required')
      .eq('process_id', processId);

    if (requestsError) throw requestsError;

    // Se não há solicitações, considerar apenas documentos enviados
    if (!requests || requests.length === 0) {
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('status')
        .eq('process_id', processId);

      if (docsError) throw docsError;
      
      if (!docs || docs.length === 0) {
        // Sem solicitações e sem documentos = início do processo
        await supabase
          .from('processes')
          .update({ progress: 0, status: 'Pendente' })
          .eq('id', processId);
        return;
      }

      const total = docs.length;
      const approved = docs.filter(d => d.status === 'Aprovado').length;
      const progress = Math.round((approved / total) * 100);

      let status = 'Em andamento';
      if (progress === 100) {
        status = 'Concluído';
      } else if (progress === 0) {
        status = 'Pendente';
      }

      await supabase
        .from('processes')
        .update({ progress, status })
        .eq('id', processId);
      
      console.log(`[ProcessProgress] Progresso (sem solicitações) atualizado: ${progress}%, Status: ${status}`);
      return;
    }

    // Calcular progresso baseado nas solicitações
    const totalRequests = requests.length;
    const approvedRequests = requests.filter(r => r.current_status === 'aprovado').length;
    const rejectedRequests = requests.filter(r => r.current_status === 'rejeitado').length;
    const pendingRequests = requests.filter(r => r.current_status === 'pendente').length;
    const sentRequests = requests.filter(r => r.current_status === 'enviado').length;

    // Progresso = (aprovados / total) * 100
    const progress = Math.round((approvedRequests / totalRequests) * 100);

    // Determinar status baseado no estado das solicitações
    let status = 'Em andamento';
    if (progress === 100) {
      status = 'Concluído';
    } else if (pendingRequests === totalRequests) {
      status = 'Pendente';
    } else if (sentRequests > 0 && approvedRequests === 0) {
      status = 'Em Análise';
    }

    const { error: updateError } = await supabase
      .from('processes')
      .update({ progress, status })
      .eq('id', processId);

    if (updateError) throw updateError;
    
    console.log(`[ProcessProgress] Progresso atualizado: ${progress}% (${approvedRequests}/${totalRequests} aprovados), Status: ${status}`);
  } catch (error) {
    console.error('[ProcessProgress] Erro ao atualizar progresso:', error);
    throw error;
  }
};
