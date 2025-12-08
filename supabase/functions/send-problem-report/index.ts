import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProblemReportRequest {
  userEmail: string;
  userId: string;
  userType: "empresa" | "cliente";
  category: string;
  subject: string;
  description: string;
}

const categoryLabels: Record<string, string> = {
  bug: "Bug / Erro no sistema",
  usability: "Dificuldade de uso",
  feature: "Sugestão de melhoria",
  document: "Problema com documento",
  signature: "Problema com assinatura",
  notification: "Problema com notificação",
  other: "Outro",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userId, userType, category, subject, description }: ProblemReportRequest = await req.json();

    console.log("Received problem report:", { userEmail, userType, category, subject });

    if (!category || !subject || !description) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const adminEmail = Deno.env.get("RESEND_FROM") || "onboarding@resend.dev";
    const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const userTypeLabel = userType === "empresa" ? "Empresa" : "Cliente";
    const categoryLabel = categoryLabels[category] || category;

    const emailResponse = await resend.emails.send({
      from: `Fuzen <${adminEmail}>`,
      to: ["raul-cordoni@hotmail.com"],
      subject: `[Fuzen] 🚨 Problema Relatado - ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚨 Problema Relatado</h1>
            </div>
            
            <div style="padding: 30px;">
              <p style="color: #3f3f46; font-size: 16px; margin-bottom: 20px;">
                Um usuário relatou um problema na plataforma <strong>Fuzen</strong>.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #92400e; margin-top: 0; margin-bottom: 5px;">📋 ${subject}</h3>
                <span style="display: inline-block; background-color: #fbbf24; color: #78350f; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${categoryLabel}</span>
              </div>
              
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #18181b; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Informações do Usuário</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-weight: 600; width: 120px;">E-mail:</td>
                    <td style="padding: 8px 0; color: #18181b;"><a href="mailto:${userEmail}" style="color: #6366f1; text-decoration: none;">${userEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-weight: 600;">User ID:</td>
                    <td style="padding: 8px 0; color: #18181b; font-family: monospace; font-size: 12px;">${userId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Tipo:</td>
                    <td style="padding: 8px 0; color: #18181b;">
                      <span style="display: inline-block; background-color: ${userType === 'empresa' ? '#dbeafe' : '#dcfce7'}; color: ${userType === 'empresa' ? '#1e40af' : '#166534'}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${userTypeLabel}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Data/Hora:</td>
                    <td style="padding: 8px 0; color: #18181b;">${timestamp}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #991b1b; margin-top: 0; margin-bottom: 10px;">📝 Descrição do Problema:</h4>
                <p style="color: #7f1d1d; margin: 0; line-height: 1.6; white-space: pre-wrap;">${description}</p>
              </div>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="mailto:${userEmail}?subject=Re: Problema Relatado - ${subject}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600;">
                  Responder Usuário
                </a>
              </div>
            </div>
            
            <div style="background-color: #f4f4f5; padding: 20px; text-align: center;">
              <p style="color: #71717a; font-size: 14px; margin: 0;">
                Este relatório foi gerado automaticamente pela plataforma <strong>Fuzen</strong>.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Problem report email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Relatório enviado com sucesso" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-problem-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
