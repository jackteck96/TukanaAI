import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  code: string;
  signerName: string;
  documentName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, signerName, documentName }: SendOTPRequest = await req.json();

    console.log("Sending OTP email to:", email);

    const fromPrimary = `Sistema de Assinatura <${Deno.env.get('RESEND_FROM') || 'onboarding@resend.dev'}>`;
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=true">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #333; margin-bottom: 30px; font-size: 24px;">Código de Verificação</h1>
            
            <p style="color: #666; margin-bottom: 20px; font-size: 16px;">
              Olá <strong>${signerName}</strong>,
            </p>
            
            <p style="color: #666; margin-bottom: 30px; font-size: 16px;">
              Você solicitou a assinatura do documento <strong>"${documentName}"</strong>.
              Use o código abaixo para confirmar sua identidade:
            </p>
            
            <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; color: #0d6efd; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            
            <p style="color: #666; margin-bottom: 10px; font-size: 14px;">
              <strong>⏰ Este código expira em 10 minutos</strong>
            </p>
            
            <p style="color: #666; margin-bottom: 30px; font-size: 14px;">
              Se você não solicitou esta assinatura, pode ignorar este email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este é um email automático do sistema de assinatura digital.
            </p>
          </div>
        </body>
        </html>
      `;

    let emailResponse = await resend.emails.send({
      from: fromPrimary,
      to: [email],
      subject: `Código de verificação para assinatura - ${documentName}`,
      html: htmlContent,
    });

    if (emailResponse.error || !emailResponse.data?.id) {
      const errMsg = emailResponse.error?.error || '';
      const statusCode = (emailResponse as any).error?.statusCode;
      const domainIssue = errMsg.includes('domain is not verified') || statusCode === 403;
      if (domainIssue && !fromPrimary.includes('onboarding@resend.dev')) {
        console.warn("Resend domain not verified, retrying with onboarding@resend.dev");
        emailResponse = await resend.emails.send({
          from: `Sistema de Assinatura <onboarding@resend.dev>`,
          to: [email],
          subject: `Código de verificação para assinatura - ${documentName}`,
          html: htmlContent,
        });
      }
    }

    if (emailResponse.error || !emailResponse.data?.id) {
      console.error("Resend send-otp-email error:", emailResponse.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: emailResponse.error?.error || 'Falha ao enviar email com código' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
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