import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const badRequest = (message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ContactFormRequest;
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const company = String(body.company ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!fullName || fullName.length < 2 || fullName.length > 100) {
      return badRequest("Nome inválido");
    }
    if (!email || email.length > 255 || !emailPattern.test(email)) {
      return badRequest("E-mail inválido");
    }
    if (!phone || phone.length < 8 || phone.length > 20) {
      return badRequest("Celular inválido");
    }
    if (company.length > 100) {
      return badRequest("Empresa inválida");
    }
    if (!message || message.length < 10 || message.length > 1000) {
      return badRequest("Mensagem inválida");
    }

    const safeFullName = escapeHtml(fullName);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeCompany = escapeHtml(company);
    const safeMessage = escapeHtml(message);

    const adminEmail = Deno.env.get("RESEND_FROM") || "onboarding@resend.dev";
    const timestamp = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const emailResponse = await resend.emails.send({
      from: `Tukana AI <${adminEmail}>`,
      to: ["raul-cordoni@hotmail.com"],
      subject: `[Tukana AI] Nova solicitação de contato - ${safeFullName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #10b981 45%, #f59e0b 75%, #f97316 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nova Solicitação de Contato</h1>
            </div>

            <div style="padding: 30px;">
              <p style="color: #3f3f46; font-size: 16px; margin-bottom: 20px;">
                Um visitante preencheu o formulário de contato em <strong>Tukana AI</strong>.
              </p>

              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #18181b; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Dados do Contato</h3>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-weight: 600; width: 120px;">Nome:</td>
                    <td style="padding: 8px 0; color: #18181b;">${safeFullName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-weight: 600;">E-mail:</td>
                    <td style="padding: 8px 0; color: #18181b;"><a href="mailto:${safeEmail}" style="color: #0f9f6e; text-decoration: none;">${safeEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Celular:</td>
                    <td style="padding: 8px 0; color: #18181b;"><a href="tel:${safePhone}" style="color: #0f9f6e; text-decoration: none;">${safePhone}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Empresa:</td>
                    <td style="padding: 8px 0; color: #18181b;">${safeCompany || "Não informada"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Data/Hora:</td>
                    <td style="padding: 8px 0; color: #18181b;">${timestamp}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #92400e; margin-top: 0; margin-bottom: 10px;">Mensagem:</h4>
                <p style="color: #78350f; margin: 0; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
              </div>

              <div style="text-align: center; margin-top: 25px;">
                <a href="mailto:${safeEmail}?subject=Re: Contato via Tukana AI" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #f59e0b 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600;">
                  Responder Agora
                </a>
              </div>
            </div>

            <div style="background-color: #f4f4f5; padding: 20px; text-align: center;">
              <p style="color: #71717a; font-size: 14px; margin: 0;">
                Este e-mail foi gerado automaticamente pela plataforma <strong>Tukana AI</strong>.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Resend rejected contact form email:", emailResponse.error);
      throw new Error(emailResponse.error.message || "Falha ao enviar e-mail");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Formulário enviado com sucesso" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-form function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
