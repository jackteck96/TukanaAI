import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteDualSignatureRequest {
  documentId: string;
  processId: string;
  signerType: 'client' | 'company';
  signatureId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, processId, signerType, signatureId }: CompleteDualSignatureRequest = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Atualizar o documento com a assinatura
    const updateField = signerType === 'client' ? 'client_signed_at' : 'company_signed_at';
    
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', documentId)
      .select('client_signed_at, company_signed_at, file_name, process_id, company_id')
      .single();

    if (docError) throw docError;

    // Verificar se ambas as partes assinaram
    const bothSigned = document.client_signed_at && document.company_signed_at;

    if (bothSigned) {
      // Marcar como totalmente assinado
      await supabaseClient
        .from('documents')
        .update({ 
          signature_status: 'fully_signed',
          status: 'Aprovado' // Marcar como aprovado quando totalmente assinado
        })
        .eq('id', documentId);

      // Gerar termo de autenticidade consolidado
      const { data: termData, error: termError } = await supabaseClient.functions.invoke('generate-final-authenticity-term', {
        body: { documentId }
      });

      if (!termError && termData?.authenticityTermUrl) {
        await supabaseClient
          .from('documents')
          .update({ authenticity_term_url: termData.authenticityTermUrl })
          .eq('id', documentId);
      }

      // Notificar ambas as partes
      const { data: process } = await supabaseClient
        .from('processes')
        .select('client_email, client_name, companies(name)')
        .eq('id', processId)
        .single();

      if (process) {
        // Notificar cliente
        await supabaseClient
          .from('client_notifications')
          .insert({
            process_id: processId,
            document_id: documentId,
            company_id: document.company_id,
            client_email: process.client_email,
            notification_type: 'signatures_complete',
            title: `Documento totalmente assinado`,
            message: `O documento "${document.file_name}" foi assinado por todas as partes.`
          });

        // Enviar emails
        const companyEmail = await getCompanyAdminEmail(supabaseClient, document.company_id);
        
        for (const email of [process.client_email, companyEmail]) {
          await supabaseClient.functions.invoke('send-unified-email', {
            body: {
              to: email,
              subject: `Documento totalmente assinado - ${document.file_name}`,
              template: 'signatures_complete',
              data: {
                documentName: document.file_name,
                clientName: process.client_name,
                companyName: (process as any).companies?.name || 'Empresa'
              }
            }
          });
        }
      }
    } else {
      // Atualizar status para parcialmente assinado
      await supabaseClient
        .from('documents')
        .update({ signature_status: 'partially_signed' })
        .eq('id', documentId);

      // Notificar a outra parte que precisa assinar
      const { data: process } = await supabaseClient
        .from('processes')
        .select('client_email, client_name, companies(name)')
        .eq('id', processId)
        .single();

      if (process) {
        const recipientEmail = signerType === 'client' 
          ? await getCompanyAdminEmail(supabaseClient, document.company_id)
          : process.client_email;

        const signerName = signerType === 'client' 
          ? process.client_name 
          : (process as any).companies?.name || 'Empresa';

        await supabaseClient
          .from('client_notifications')
          .insert({
            process_id: processId,
            document_id: documentId,
            company_id: document.company_id,
            client_email: process.client_email,
            notification_type: 'signature_completed',
            title: `Uma assinatura foi concluída`,
            message: `${signerName} assinou o documento "${document.file_name}". Aguardando sua assinatura.`
          });

        await supabaseClient.functions.invoke('send-unified-email', {
          body: {
            to: recipientEmail,
            subject: `Aguardando sua assinatura - ${document.file_name}`,
            template: 'pending_signature',
            data: {
              documentName: document.file_name,
              signerName
            }
          }
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, bothSigned }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao completar assinatura dupla:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getCompanyAdminEmail(supabaseClient: any, companyId: string): Promise<string> {
  const { data } = await supabaseClient
    .from('user_roles')
    .select('user_id')
    .eq('company_id', companyId)
    .eq('role', 'company_admin')
    .limit(1)
    .single();

  if (data) {
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', data.user_id)
      .single();
    return profile?.email || '';
  }

  return '';
}
