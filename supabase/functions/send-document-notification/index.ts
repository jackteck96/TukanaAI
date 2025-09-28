import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    console.log("Document notification logged:", {
      to: clientEmail,
      subject,
      type: notificationType,
      document: documentName,
      process: processTitle,
      message: message.substring(0, 100) + "..."
    });

    // Simular envio de email bem-sucedido para manter compatibilidade
    const emailResponse = {
      id: `mock-${Date.now()}`,
      status: "sent",
      to: clientEmail,
      subject,
      message: "Email notification logged successfully (mock response)"
    };

    console.log("Document notification processed successfully:", emailResponse);

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