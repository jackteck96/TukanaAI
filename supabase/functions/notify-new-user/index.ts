import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewUserPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    email: string;
    full_name?: string;
    created_at: string;
  };
  schema: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NewUserPayload = await req.json();
    
    console.log("Received new user notification:", payload);

    const { record } = payload;
    const userEmail = record.email;
    const userName = record.full_name || "Não informado";
    const createdAt = new Date(record.created_at).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "full",
      timeStyle: "short",
    });

    const adminEmail = Deno.env.get("RESEND_FROM") || "onboarding@resend.dev";

    // Send email notification to admin
    const emailResponse = await resend.emails.send({
      from: `Fuzen <${adminEmail}>`,
      to: ["raul-cordoni@hotmail.com"],
      subject: `[Fuzen] 🎉 Novo usuário cadastrado - ${userName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Novo Usuário Cadastrado!</h1>
            </div>
            
            <div style="padding: 30px;">
              <p style="color: #3f3f46; font-size: 16px; margin-bottom: 20px;">
                Parabéns! Um novo usuário se cadastrou na plataforma <strong>Fuzen</strong>.
              </p>
              
              <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #a7f3d0;">
                <h3 style="color: #065f46; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📋 Dados do Usuário</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #047857; font-weight: 600; width: 130px; border-bottom: 1px solid #d1fae5;">Nome:</td>
                    <td style="padding: 10px 0; color: #18181b; border-bottom: 1px solid #d1fae5;">${userName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #047857; font-weight: 600; border-bottom: 1px solid #d1fae5;">E-mail:</td>
                    <td style="padding: 10px 0; color: #18181b; border-bottom: 1px solid #d1fae5;">
                      <a href="mailto:${userEmail}" style="color: #059669; text-decoration: none;">${userEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #047857; font-weight: 600;">Data/Hora:</td>
                    <td style="padding: 10px 0; color: #18181b;">${createdAt}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 0 8px 8px 0; padding: 15px; margin-bottom: 20px;">
                <p style="color: #0369a1; margin: 0; font-size: 14px;">
                  💡 <strong>Dica:</strong> Entre em contato com o novo usuário para dar as boas-vindas e ajudá-lo a começar a usar a plataforma.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="https://fuzen.app/admin" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600;">
                  Ver no Painel Admin
                </a>
              </div>
            </div>
            
            <div style="background-color: #f4f4f5; padding: 20px; text-align: center;">
              <p style="color: #71717a; font-size: 14px; margin: 0;">
                Este e-mail foi gerado automaticamente pela plataforma <strong>Fuzen</strong>.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("New user notification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notificação enviada com sucesso" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-new-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
