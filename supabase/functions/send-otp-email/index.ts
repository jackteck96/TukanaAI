import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  verificationCode: string;
  documentName?: string;
  processTitle?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, verificationCode, documentName, processTitle }: OTPEmailRequest = await req.json();

    console.log("OTP email logged:", {
      to: email,
      code: verificationCode,
      document: documentName,
      process: processTitle
    });

    // Mock successful email response
    const emailResponse = {
      data: { id: `mock-otp-${Date.now()}` },
      error: null
    };

    console.log("OTP email logged successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
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