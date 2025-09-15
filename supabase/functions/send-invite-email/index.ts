import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  email: string;
  processId: string;
  clientName: string;
  companyName: string;
  inviteToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, processId, clientName, companyName, inviteToken }: InviteEmailRequest = await req.json();

    // Verificar se o usuário está autenticado
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: user, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    console.log("Sending invite email to:", email);

    const inviteUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com') || 'https://app.exemplo.com'}/cadastro-via-convite?token=${inviteToken}`;

    const fromPrimary = `${companyName || 'Nossa Empresa'} <${Deno.env.get('RESEND_FROM') || 'onboarding@resend.dev'}>`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1f2937; text-align: center;">Convite para Acesso ao Processo</h1>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #374151; margin-bottom: 16px;">Olá ${clientName},</h2>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 16px;">
              Você foi convidado pela empresa <strong>${companyName}</strong> para acessar e acompanhar seu processo jurídico em nossa plataforma.
            </p>
            
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
              Para criar sua conta e acessar o processo, clique no botão abaixo:
            </p>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">
                Criar Conta e Acessar Processo
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin-top: 24px;">
              Este convite é válido por 7 dias. Se você não conseguir clicar no botão, copie e cole este link em seu navegador:<br>
              <a href="${inviteUrl}" style="color: #3b82f6; word-break: break-all;">${inviteUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">
              LegalTech Platform - Sistema de Gestão Jurídica
            </p>
          </div>
        </div>
      `;

    let emailResponse = await resend.emails.send({
      from: fromPrimary,
      to: [email],
      subject: `Convite para acessar o processo - ${companyName}`,
      html: htmlContent,
    });

    if (emailResponse.error || !emailResponse.data?.id) {
      const errMsg = emailResponse.error?.error || '';
      const statusCode = (emailResponse as any).error?.statusCode;
      const domainIssue = errMsg.includes('domain is not verified') || statusCode === 403;
      if (domainIssue && !fromPrimary.includes('onboarding@resend.dev')) {
        console.warn("Resend domain not verified, retrying with onboarding@resend.dev");
        emailResponse = await resend.emails.send({
          from: `${companyName || 'Nossa Empresa'} <onboarding@resend.dev>`,
          to: [email],
          subject: `Convite para acessar o processo - ${companyName}`,
          html: htmlContent,
        });
      }
    }

    if (emailResponse.error || !emailResponse.data?.id) {
      console.error("Resend send-invite-email error:", emailResponse.error);
      return new Response(JSON.stringify({ success: false, error: emailResponse.error?.error || "Falha ao enviar o email de convite" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    console.log("Invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invite-email function:", error);
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