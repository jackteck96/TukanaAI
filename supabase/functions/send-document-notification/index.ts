import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  clientEmail: string;
  clientName: string;
  documentName: string;
  processTitle: string;
  notificationType: 'document_rejected' | 'document_adjustment_requested';
  message: string;
  companyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientEmail, 
      clientName, 
      documentName, 
      processTitle, 
      notificationType, 
      message,
      companyName = "Sistema Jurídico"
    }: NotificationRequest = await req.json();

    const isRejection = notificationType === 'document_rejected';
    const subject = isRejection 
      ? `📋 Documento rejeitado - ${documentName}`
      : `📝 Ajustes solicitados - ${documentName}`;

    const actionText = isRejection ? 'rejeitado' : 'precisa de ajustes';
    const actionColor = isRejection ? '#ef4444' : '#f59e0b';
    const actionIcon = isRejection ? '❌' : '⚠️';

    const emailResponse = await resend.emails.send({
      from: `${companyName} <${Deno.env.get("RESEND_FROM")}>`,
      to: [clientEmail],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6b7280; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; background-color: ${actionColor}; }
            .message-box { background: #f8fafc; border-left: 4px solid ${actionColor}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .process-info { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${actionIcon} Documento ${actionText}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Processo: ${processTitle}</p>
            </div>
            
            <div class="content">
              <p>Olá <strong>${clientName}</strong>,</p>
              
              <p>Informamos que o documento <strong>"${documentName}"</strong> foi analisado e ${actionText}.</p>
              
              <div class="process-info">
                <h3 style="margin: 0 0 10px 0; color: #374151;">📁 Detalhes do Processo</h3>
                <p style="margin: 5px 0;"><strong>Processo:</strong> ${processTitle}</p>
                <p style="margin: 5px 0;"><strong>Documento:</strong> ${documentName}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span class="status-badge">${isRejection ? 'Rejeitado' : 'Ajustes Necessários'}</span></p>
              </div>

              <div class="message-box">
                <h3 style="margin: 0 0 15px 0; color: ${actionColor};">
                  ${isRejection ? '❌ Motivo da Rejeição' : '📝 Ajustes Solicitados'}
                </h3>
                <p style="margin: 0; font-weight: 500;">${message}</p>
              </div>
              
              <p><strong>Próximos passos:</strong></p>
              <ul>
                <li>${isRejection ? 'Revise as informações do documento conforme orientações acima' : 'Faça os ajustes solicitados no documento'}</li>
                <li>Prepare um novo arquivo com as correções necessárias</li>
                <li>Acesse sua área do cliente para enviar o documento corrigido</li>
                <li>Em caso de dúvidas, entre em contato conosco</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get("SUPABASE_URL") || 'https://app.docflow.com'}/area-cliente" class="btn">
                  🔗 Acessar Área do Cliente
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>${companyName}</strong></p>
              <p>Este é um e-mail automático, não responda. Em caso de dúvidas, utilize os canais de suporte disponíveis em sua área do cliente.</p>
              <p style="font-size: 12px; margin-top: 20px;">
                📧 Notificação enviada automaticamente pelo sistema de gerenciamento de documentos.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Document notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-document-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);