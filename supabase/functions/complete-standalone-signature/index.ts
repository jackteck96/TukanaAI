import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteStandaloneSignatureRequest {
  documentId: string;
  signerType: 'client' | 'company';
  signatureId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, signerType, signatureId }: CompleteStandaloneSignatureRequest = await req.json();

    console.log('Processing standalone signature:', { documentId, signerType, signatureId });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Atualizar o documento com a assinatura
    const updateField = signerType === 'client' ? 'client_signed_at' : 'company_signed_at';
    
    const { data: document, error: docError } = await supabaseClient
      .from('standalone_signature_documents')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', documentId)
      .select('client_signed_at, company_signed_at, document_name, company_id, client_email, client_name')
      .single();

    if (docError) {
      console.error('Error updating document:', docError);
      throw docError;
    }

    console.log('Document updated:', document);

    // Verificar se ambas as partes assinaram
    const bothSigned = document.client_signed_at && document.company_signed_at;

    if (bothSigned) {
      console.log('Both signatures completed!');
      
      // Marcar como totalmente assinado
      await supabaseClient
        .from('standalone_signature_documents')
        .update({ signature_status: 'fully_signed' })
        .eq('id', documentId);

      // Buscar informações da empresa
      const { data: company } = await supabaseClient
        .from('companies')
        .select('name')
        .eq('id', document.company_id)
        .single();

      // Notificar cliente com detalhes sobre o documento assinado
      await supabaseClient
        .from('client_notifications')
        .insert({
          company_id: document.company_id,
          client_email: document.client_email,
          notification_type: 'signatures_complete',
          title: `✅ Documento Totalmente Assinado`,
          message: `O documento "${document.document_name}" foi assinado por todas as partes e está disponível para download na aba de Assinaturas.`
        });

      // Enviar emails para ambas as partes
      const companyEmail = await getCompanyAdminEmail(supabaseClient, document.company_id);
      
      // Enviar emails individualmente com o schema esperado pela função
      // 1) Para o cliente
      await supabaseClient.functions.invoke('send-unified-email', {
        body: {
          email: document.client_email,
          full_name: document.client_name,
          companyId: document.company_id,
          inviterName: company?.name || 'Empresa',
          subject: `Documento totalmente assinado - ${document.document_name}`,
          template: 'signatures_complete',
          data: {
            documentName: document.document_name,
            clientName: document.client_name,
            companyName: company?.name || 'Empresa'
          }
        }
      });

      // 2) Para a empresa (admin)
      await supabaseClient.functions.invoke('send-unified-email', {
        body: {
          email: companyEmail,
          full_name: company?.name || 'Empresa',
          companyId: document.company_id,
          inviterName: document.client_name,
          subject: `Documento totalmente assinado - ${document.document_name}`,
          template: 'signatures_complete',
          data: {
            documentName: document.document_name,
            clientName: document.client_name,
            companyName: company?.name || 'Empresa'
          }
        }
      });
    } else {
      console.log('Only one signature completed, waiting for the other');
      
      // Atualizar status baseado em quem assinou
      const newStatus = signerType === 'company' ? 'company_signed' : 'partially_signed';
      
      await supabaseClient
        .from('standalone_signature_documents')
        .update({ signature_status: newStatus })
        .eq('id', documentId);

      // Se a empresa acabou de assinar, notificar o cliente
      if (signerType === 'company') {
        console.log('Company signed, notifying client');
        
        const { data: company } = await supabaseClient
          .from('companies')
          .select('name')
          .eq('id', document.company_id)
          .single();

        await supabaseClient
          .from('client_notifications')
          .insert({
            company_id: document.company_id,
            client_email: document.client_email,
            notification_type: 'signature_request',
            title: `📝 Documento Aguardando Sua Assinatura`,
            message: `O documento "${document.document_name}" foi enviado por ${company?.name || 'Empresa'} e aguarda sua assinatura. Acesse a aba de Assinaturas para assinar.`
          });

        await supabaseClient.functions.invoke('send-unified-email', {
          body: {
            email: document.client_email,
            full_name: document.client_name,
            companyId: document.company_id,
            inviterName: company?.name || 'Empresa',
            subject: `Documento aguardando sua assinatura - ${document.document_name}`,
            template: 'signature_request',
            data: {
              documentName: document.document_name,
              companyName: company?.name || 'Empresa',
              clientName: document.client_name
            }
          }
        });
      } else {
        // Se o cliente assinou primeiro, notificar a empresa
        console.log('Client signed, notifying company');
        
        const companyEmail = await getCompanyAdminEmail(supabaseClient, document.company_id);
        
        // Criar notificação para a empresa
        await supabaseClient
          .from('client_notifications')
          .insert({
            company_id: document.company_id,
            client_email: document.client_email,
            notification_type: 'signature_request',
            title: `📝 Documento Aguardando Assinatura da Empresa`,
            message: `O cliente "${document.client_name}" assinou o documento "${document.document_name}". Acesse a aba de Assinaturas para assinar.`
          });
        
        await supabaseClient.functions.invoke('send-unified-email', {
          body: {
            email: companyEmail,
            full_name: (await supabaseClient.from('companies').select('name').eq('id', document.company_id).single()).data?.name || 'Empresa',
            companyId: document.company_id,
            inviterName: document.client_name,
            subject: `Cliente assinou o documento - ${document.document_name}`,
            template: 'pending_signature',
            data: {
              documentName: document.document_name,
              signerName: document.client_name
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
    console.error('Erro ao completar assinatura standalone:', error);
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
