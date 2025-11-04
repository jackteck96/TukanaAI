import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sendEmail = async (emailData: any) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.error("RESEND_API_KEY não configurada");
    return { data: null, error: "API key não configurada" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Erro ao enviar email:", data);
      return { data: null, error: data };
    }

    console.log("Email enviado com sucesso:", data);
    return { data, error: null };
  } catch (error: any) {
    console.error("Erro na requisição para Resend:", error);
    return { data: null, error: error.message };
  }
};

interface NotifyDocumentRequestBody {
  processId: string;
  documentName: string;
  documentRequestId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[notify-document-request] Function invoked');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: NotifyDocumentRequestBody = await req.json();
    console.log('[notify-document-request] Body received:', body);

    const { processId, documentName, documentRequestId } = body;

    if (!processId || !documentName || !documentRequestId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get process and company information
    const { data: process, error: processError } = await supabase
      .from('processes')
      .select(`
        *,
        companies (
          name,
          logo_url
        )
      `)
      .eq('id', processId)
      .single();

    if (processError || !process) {
      console.error('[notify-document-request] Error fetching process:', processError);
      return new Response(
        JSON.stringify({ error: "Process not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const clientEmail = process.client_email;
    const clientName = process.client_name;
    const processName = process.project_name || process.process_type;
    const companyName = (process.companies as any)?.name || "Fuzen";

    // Create access link for the client
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('https://', 'https://');
    const accessLink = `https://devnkdyfzlgspdlfuyam.lovable.app/area-cliente?id=${processId}`;

    const subject = `📋 Nova Solicitação de Documento - ${processName}`;
    const fromEmail = "convites@fuzen.online";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
          }
          .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 16px; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .greeting { 
            font-size: 18px; 
            margin-bottom: 20px; 
            color: #374151; 
          }
          .document-info { 
            background: #fef3c7; 
            border-left: 4px solid #f59e0b; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 6px; 
          }
          .document-info h3 { 
            margin: 0 0 10px 0; 
            color: #92400e; 
            font-size: 16px; 
          }
          .document-info p {
            margin: 5px 0;
            color: #78350f;
          }
          .cta-button { 
            display: inline-block; 
            padding: 16px 32px; 
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px; 
            margin: 30px 0; 
            text-align: center; 
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .footer { 
            background: #f9fafb; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
          }
          .footer p { 
            margin: 5px 0; 
            color: #6b7280; 
            font-size: 14px; 
          }
          .company-name { 
            color: #667eea; 
            font-weight: 600; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Nova Solicitação de Documento</h1>
            <p>Um novo documento foi solicitado em seu processo</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Olá <strong>${clientName}</strong>,
            </div>
            
            <p>Informamos que um novo documento foi solicitado para o seu processo.</p>
            
            <div class="document-info">
              <h3>📄 Documento Solicitado</h3>
              <p><strong>Tipo:</strong> ${documentName}</p>
              <p><strong>Processo:</strong> ${processName}</p>
              <p><strong>Empresa:</strong> ${companyName}</p>
              <p><strong>Status:</strong> Aguardando envio</p>
            </div>
            
            <p>Por favor, acesse sua área do cliente para enviar o documento solicitado:</p>
            
            <div style="text-align: center;">
              <a href="${accessLink}" class="cta-button">
                📤 Enviar Documento
              </a>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              💡 <strong>Dica:</strong> Acesse a aba "Solicitações" para ver todos os documentos pendentes e fazer o upload.
            </p>
            
            <p style="margin-top: 30px;">
              Se você tiver alguma dúvida sobre o documento solicitado, não hesite em entrar em contato conosco.
            </p>
            
            <p>
              Atenciosamente,<br>
              <strong class="company-name">${companyName}</strong>
            </p>
          </div>
          
          <div class="footer">
            <p class="company-name"><strong>Fuzen - Sistema de Gestão Documental</strong></p>
            <p>Sistema de Gestão Documental Inteligente</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('[notify-document-request] Sending email to:', clientEmail);
    
    const emailResponse = await sendEmail({
      from: `Fuzen <${fromEmail}>`,
      to: [clientEmail],
      subject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('[notify-document-request] Email error:', emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          emailed: false, 
          error: emailResponse.error 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('[notify-document-request] Email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailed: true,
        messageId: emailResponse.data?.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[notify-document-request] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        emailed: false 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
