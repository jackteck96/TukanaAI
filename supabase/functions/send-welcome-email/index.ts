import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  processId: string;
  clientName: string;
  clientEmail: string;
  processName: string;
  companyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: WelcomeEmailRequest = await req.json();
    
    if (!requestData) {
      throw new Error('Request data is required');
    }

    const { processId, clientName, clientEmail, processName, companyId } = requestData;

    console.log("Welcome email logged:", {
      to: clientEmail,
      clientName,
      processName,
      processId,
      companyId
    });

    // Mock successful email response
    const emailResponse = {
      data: { id: `mock-welcome-${Date.now()}` },
      error: null
    };

    console.log("Welcome email logged successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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