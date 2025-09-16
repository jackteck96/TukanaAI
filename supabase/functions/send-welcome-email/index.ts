import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  processId: string;
  clientName: string;
  clientEmail: string;
  processName?: string;
  companyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Store parsed request for error logging
  let requestData: WelcomeEmailRequest | null = null;
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    requestData = await req.json();
    const { processId, clientName, clientEmail, processName, companyId } = requestData;

    console.log("[send-welcome-email] Starting function with data:", {
      processId,
      clientName,
      clientEmail,
      processName,
      companyId
    });

    // Gerar link de acesso direto ao processo
    const processAccessLink = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://app.exemplo.com'}/processo/${processId}`;

    // Buscar informações da empresa
    const { data: companyData } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    const companyName = companyData?.name || 'Nossa Empresa';

    const fromPrimary = `${companyName} <${Deno.env.get('RESEND_FROM') || 'onboarding@resend.dev'}>`;
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0d6efd; margin-bottom: 10px; font-size: 28px;">Bem-vindo(a)!</h1>
              <div style="width: 60px; height: 4px; background-color: #0d6efd; margin: 0 auto; border-radius: 2px;"></div>
            </div>
            
            <p style="color: #333; margin-bottom: 20px; font-size: 16px;">
              Olá <strong>${clientName}</strong>,
            </p>
            
            <p style="color: #666; margin-bottom: 25px; font-size: 16px; line-height: 1.6;">
              Seja bem-vindo(a) à nossa plataforma! Criamos um novo processo de documentação especialmente para você.
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 20px; margin: 30px 0;">
              <h3 style="color: #0d6efd; margin: 0 0 10px 0; font-size: 18px;">📋 Detalhes do seu processo:</h3>
              <p style="margin: 5px 0; color: #333;"><strong>Processo:</strong> ${processName || 'Novo Processo'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Cliente:</strong> ${clientName}</p>
              <p style="margin: 5px 0; color: #333;"><strong>ID do Processo:</strong> ${processId}</p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${processAccessLink}" 
                 style="display: inline-block; background-color: #0d6efd; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">
                🔗 Acessar Meu Processo
              </a>
            </div>
            
            <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; padding: 15px; margin: 30px 0;">
              <h4 style="color: #1565c0; margin: 0 0 10px 0; font-size: 14px;">💡 O que você pode fazer:</h4>
              <ul style="color: #666; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Visualizar o status do seu processo</li>
                <li>Fazer upload de documentos necessários</li>
                <li>Acompanhar o progresso em tempo real</li>
                <li>Assinar documentos digitalmente</li>
                <li>Receber notificações sobre atualizações</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
                <strong>Precisa de ajuda?</strong>
              </p>
              <p style="color: #666; font-size: 14px; line-height: 1.5;">
                Entre em contato conosco pelo email ou telefone. Nossa equipe está pronta para ajudá-lo(a) em qualquer etapa do processo.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <div style="text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Este email foi enviado automaticamente por <strong>${companyName}</strong>
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                Se você não solicitou este processo, entre em contato conosco.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

    let emailResponse = await resend.emails.send({
      from: fromPrimary,
      to: [clientEmail],
      subject: `Bem-vindo(a) ao seu processo de documentação - ${processName || 'Novo Processo'}`,
      html: htmlContent,
    });

    console.log("[send-welcome-email] First email attempt result:", {
      success: !!emailResponse.data?.id,
      error: emailResponse.error
    });

    if (emailResponse.error || !emailResponse.data?.id) {
      const errMsg = emailResponse.error?.error || '';
      const statusCode = (emailResponse as any).error?.statusCode;
      const domainIssue = errMsg.includes('domain is not verified') || statusCode === 403;
      if (domainIssue && !fromPrimary.includes('onboarding@resend.dev')) {
        console.warn("[send-welcome-email] Resend domain not verified, retrying with onboarding@resend.dev");
        emailResponse = await resend.emails.send({
          from: `${companyName} <onboarding@resend.dev>`,
          to: [clientEmail],
          subject: `Bem-vindo(a) ao seu processo de documentação - ${processName || 'Novo Processo'}`,
          html: htmlContent,
        });
        console.log("[send-welcome-email] Retry attempt result:", {
          success: !!emailResponse.data?.id,
          error: emailResponse.error
        });
      }
    }

    if (emailResponse.error || !emailResponse.data?.id) {
      console.error("[send-welcome-email] Final error after retry:", emailResponse.error);
      throw new Error(emailResponse.error?.error || "Falha ao enviar o email de boas-vindas");
    }
    console.log("[send-welcome-email] Email sent successfully:", {
      messageId: emailResponse.data?.id,
      recipient: clientEmail
    });

    // Log do envio bem-sucedido
    await supabase
      .from('document_reports')
      .insert({
        process_id: processId,
        company_id: companyId,
        report_data: {
          email_log: true,
          type: 'welcome_email',
          status: 'success',
          recipient: clientEmail,
          sent_at: new Date().toISOString(),
          message_id: emailResponse.data?.id,
          details: 'Email de boas-vindas enviado com sucesso'
        },
        total_documents: 0,
        pending_documents: 0,
        approved_documents: 0
      });

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      processAccessLink 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);

    // Log do erro
    try {
      const { processId, companyId, clientEmail } = requestData || { processId: 'unknown', companyId: 'unknown', clientEmail: 'unknown' } as any;
      
      await supabase
        .from('document_reports')
        .insert({
          process_id: processId,
          company_id: companyId,
          report_data: {
            email_log: true,
            type: 'welcome_email',
            status: 'error',
            recipient: clientEmail,
            attempted_at: new Date().toISOString(),
            error_message: error.message,
            error_details: error.toString(),
            details: 'Falha no envio do email de boas-vindas'
          },
          total_documents: 0,
          pending_documents: 0,
          approved_documents: 0
        });
    } catch (logError) {
      console.error("Failed to log email error:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);