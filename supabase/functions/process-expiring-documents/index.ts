import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ExpiringDocument {
  document_id: string;
  document_name: string;
  document_type: string;
  expiration_date: string;
  days_until_expiration: number;
  process_id: string;
  client_name: string;
  client_email: string;
  company_id: string;
  status: 'expired' | 'expiring_soon' | 'valid';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[process-expiring-documents] Iniciando verificação de documentos vencidos...");

    // Buscar documentos que vencem nos próximos 30 dias ou já venceram
    const { data: expiringDocs, error: docsError } = await supabase
      .rpc('check_expiring_documents', { days_ahead: 30 });

    if (docsError) {
      console.error("[process-expiring-documents] Erro ao buscar documentos:", docsError);
      throw docsError;
    }

    console.log(`[process-expiring-documents] Encontrados ${expiringDocs?.length || 0} documentos`);

    if (!expiringDocs || expiringDocs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum documento vencido ou expirando" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    let notificationsCreated = 0;
    let emailsSent = 0;

    for (const doc of expiringDocs as ExpiringDocument[]) {
      try {
        // Verificar se já existe notificação para este documento nos últimos 7 dias
        const { data: existingNotification } = await supabase
          .from('client_notifications')
          .select('id')
          .eq('document_id', doc.document_id)
          .eq('notification_type', doc.status === 'expired' ? 'document_expired' : 'document_expiring')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .single();

        if (existingNotification) {
          console.log(`[process-expiring-documents] Notificação já existe para documento ${doc.document_id}`);
          continue;
        }

        // Criar notificação in-app
        const notificationTitle = doc.status === 'expired'
          ? `Documento Vencido: ${doc.document_name}`
          : `Documento Expirando: ${doc.document_name}`;

        const notificationMessage = doc.status === 'expired'
          ? `O documento "${doc.document_name}" (${doc.document_type}) venceu há ${Math.abs(doc.days_until_expiration)} dia(s). É necessário enviar uma versão atualizada o mais rápido possível.\n\nData de expiração: ${new Date(doc.expiration_date).toLocaleDateString('pt-BR')}`
          : `O documento "${doc.document_name}" (${doc.document_type}) expira em ${doc.days_until_expiration} dia(s). Por favor, providencie a atualização do documento.\n\nData de expiração: ${new Date(doc.expiration_date).toLocaleDateString('pt-BR')}`;

        const { error: notificationError } = await supabase
          .from('client_notifications')
          .insert({
            process_id: doc.process_id,
            document_id: doc.document_id,
            client_email: doc.client_email,
            company_id: doc.company_id,
            notification_type: doc.status === 'expired' ? 'document_expired' : 'document_expiring',
            title: notificationTitle,
            message: notificationMessage,
            is_read: false
          });

        if (notificationError) {
          console.error(`[process-expiring-documents] Erro ao criar notificação:`, notificationError);
        } else {
          notificationsCreated++;
          console.log(`[process-expiring-documents] Notificação criada para ${doc.client_email}`);
        }

        // Enviar email para o cliente
        const emailSubject = doc.status === 'expired'
          ? `⚠️ Documento Vencido - Ação Necessária`
          : `📅 Documento Próximo do Vencimento`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${doc.status === 'expired' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">${emailSubject}</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Olá ${doc.client_name},
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${doc.status === 'expired' ? '#dc2626' : '#f59e0b'}; margin-bottom: 20px;">
                <h2 style="margin-top: 0; color: #111827; font-size: 18px;">
                  ${doc.document_name}
                </h2>
                <p style="color: #6b7280; margin: 10px 0;">
                  <strong>Tipo:</strong> ${doc.document_type}
                </p>
                <p style="color: #6b7280; margin: 10px 0;">
                  <strong>Data de Expiração:</strong> ${new Date(doc.expiration_date).toLocaleDateString('pt-BR')}
                </p>
                ${doc.status === 'expired' 
                  ? `<p style="color: #dc2626; margin: 10px 0; font-weight: bold;">
                      ⚠️ Este documento venceu há ${Math.abs(doc.days_until_expiration)} dia(s)
                    </p>`
                  : `<p style="color: #f59e0b; margin: 10px 0; font-weight: bold;">
                      📅 Este documento expira em ${doc.days_until_expiration} dia(s)
                    </p>`
                }
              </div>

              <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #1e40af; margin: 0;">
                  ${doc.status === 'expired'
                    ? '⚠️ <strong>Ação Urgente Necessária:</strong> Por favor, atualize este documento o mais rápido possível para evitar problemas.'
                    : '📋 <strong>Ação Necessária:</strong> Providencie a atualização deste documento antes da data de expiração.'
                  }
                </p>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Acesse a plataforma para enviar o documento atualizado.
              </p>
            </div>
          </div>
        `;

        try {
          const { error: emailError } = await resend.emails.send({
            from: "Fuzen <onboarding@resend.dev>",
            to: [doc.client_email],
            subject: emailSubject,
            html: emailHtml,
          });

          if (emailError) {
            console.error(`[process-expiring-documents] Erro ao enviar email:`, emailError);
          } else {
            emailsSent++;
            console.log(`[process-expiring-documents] Email enviado para ${doc.client_email}`);
          }
        } catch (emailErr) {
          console.error(`[process-expiring-documents] Erro ao enviar email:`, emailErr);
        }

      } catch (docError) {
        console.error(`[process-expiring-documents] Erro ao processar documento ${doc.document_id}:`, docError);
      }
    }

    console.log(`[process-expiring-documents] Processo concluído. Notificações: ${notificationsCreated}, Emails: ${emailsSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        documentsProcessed: expiringDocs.length,
        notificationsCreated,
        emailsSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("[process-expiring-documents] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
