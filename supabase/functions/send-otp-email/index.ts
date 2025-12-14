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

// HTML escape function to prevent XSS/injection
const escapeHtml = (text: string): string => {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
};

// Input validation
const validateInput = (data: any): { valid: boolean; error?: string; data?: OTPEmailRequest } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { email, code, signerName, documentName } = data;

  // Validate email
  if (!email || typeof email !== 'string' || email.length > 255) {
    return { valid: false, error: 'Invalid email' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Validate code (6 digit OTP)
  if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return { valid: false, error: 'Invalid verification code' };
  }

  // Validate signerName
  if (!signerName || typeof signerName !== 'string' || signerName.trim().length === 0 || signerName.length > 200) {
    return { valid: false, error: 'Invalid signer name' };
  }

  // Validate documentName
  if (!documentName || typeof documentName !== 'string' || documentName.trim().length === 0 || documentName.length > 500) {
    return { valid: false, error: 'Invalid document name' };
  }

  return {
    valid: true,
    data: {
      email: email.trim(),
      code: code.trim(),
      signerName: signerName.trim(),
      documentName: documentName.trim(),
    },
  };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate input
    const validation = validateInput(body);
    if (!validation.valid || !validation.data) {
      console.error("Input validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error || 'Invalid input' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, code, signerName, documentName } = validation.data;

    // Escape HTML to prevent injection
    const safeSignerName = escapeHtml(signerName);
    const safeDocumentName = escapeHtml(documentName);

    console.log("Enviando código OTP:", {
      to: email,
      document: safeDocumentName,
      signer: safeSignerName
    });

    const emailResponse = await resend.emails.send({
      from: Deno.env.get('RESEND_FROM') || "Assinatura Digital <onboarding@resend.dev>",
      to: [email],
      subject: `Código de verificação - ${safeDocumentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Código de Verificação</h2>
          <p>Olá ${safeSignerName},</p>
          <p>Você solicitou assinar o documento: <strong>${safeDocumentName}</strong></p>
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
