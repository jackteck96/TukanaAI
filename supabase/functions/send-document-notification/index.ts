import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  documentId?: string;
  processId?: string;
  documentName?: string;
  senderType?: 'client' | 'company';
  requiresSignature?: boolean;
  // Legacy fields
  clientEmail?: string;
  clientName?: string;
  processTitle?: string;
  notificationType?: 'document_rejected' | 'document_adjustment_requested';
  message?: string;
  companyName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: NotificationRequest = await req.json();

    // Se é notificação nova (com documentId)
    if (requestData.documentId && requestData.processId) {
      const { documentId, processId, documentName, senderType, requiresSignature } = requestData;

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Buscar informações do processo
      const { data: process, error: processError } = await supabaseClient
        .from('processes')
        .select('client_email, client_name, company_id, companies(name)')
        .eq('id', processId)
        .single();

      if (processError || !process) {
        throw new Error('Processo não encontrado');
      }

      // Determinar destinatário baseado em quem enviou
      const recipientEmail = senderType === 'client' 
        ? (await getCompanyAdminEmail(supabaseClient, process.company_id))
        : process.client_email;

      const senderName = senderType === 'client' 
        ? process.client_name 
        : (process as any).companies?.name || 'Empresa';

      // Criar notificação na plataforma
      await supabaseClient
        .from('client_notifications')
        .insert({
          process_id: processId,
          document_id: documentId,
          company_id: process.company_id,
          client_email: process.client_email,
          notification_type: requiresSignature ? 'signature_request' : 'document_uploaded',
          title: requiresSignature 
            ? `Documento requer sua assinatura` 
            : `Novo documento enviado`,
          message: requiresSignature
            ? `O documento "${documentName}" foi enviado por ${senderName} e requer sua assinatura.`
            : `${senderName} enviou o documento "${documentName}".`
        });

      // Enviar email se requer assinatura
      if (requiresSignature) {
        await supabaseClient.functions.invoke('send-unified-email', {
          body: {
            to: recipientEmail,
            subject: `Documento requer sua assinatura - ${documentName}`,
            template: 'signature_request',
            data: {
              documentName,
              senderName,
              processId
            }
          }
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Legacy: notificação de rejeição/ajuste
    const { 
      clientEmail, 
      clientName, 
      documentName, 
      processTitle, 
      notificationType, 
      message,
      companyName = "Sistema Jurídico"
    } = requestData;

    const isRejection = notificationType === 'document_rejected';
    const subject = isRejection 
      ? `📋 Documento rejeitado - ${documentName}`
      : `📝 Ajustes solicitados - ${documentName}`;

    console.log("Document notification logged:", {
      to: clientEmail,
      subject,
      type: notificationType,
      document: documentName,
      process: processTitle,
      message: message?.substring(0, 100) + "..."
    });

    const emailResponse = {
      id: `mock-${Date.now()}`,
      status: "sent",
      to: clientEmail,
      subject,
      message: "Email notification logged successfully (mock response)"
    };

    console.log("Document notification processed successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Erro ao enviar notificação:', error);
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
