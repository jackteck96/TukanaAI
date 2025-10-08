import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
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
    const { email, code, signerName, documentName }: OTPEmailRequest = await req.json();

    console.log("Enviando código OTP:", {
      to: email,
      document: documentName,
      signer: signerName
    });

    const emailResponse = await resend.emails.send({
      from: Deno.env.get('RESEND_FROM') || "Assinatura Digital <onboarding@resend.dev>",
      to: [email],
      subject: `Código de verificação - ${documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Código de Verificação</h2>
          <p>Olá ${signerName},</p>
          <p>Você solicitou assinar o documento: <strong>${documentName}</strong></p>
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
            <h1 style="color: #4F46E5; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
          </div>
          <p>Este código é válido por 10 minutos.</p>
          <p style="color: #666; font-size: 14px;">Se você não solicitou este código, ignore este email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Este é um email automático, por favor não responda.</p>
        </div>
      `,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log("Email enviado com sucesso:", emailResponse.data?.id);

    return new Response(JSON.stringify({ 
      success: true,
      data: emailResponse.data 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email OTP:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao enviar email'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);