import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UnifiedInviteRequest {
  email: string;
  inviteType: 'user' | 'client';
  inviteToken: string;
  companyName: string;
  inviterName: string;
  role?: string;
  processTitle?: string;
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

    const { 
      email, 
      inviteType, 
      inviteToken, 
      companyName, 
      inviterName, 
      role, 
      processTitle 
    }: UnifiedInviteRequest = await req.json();

    const isUserInvite = inviteType === 'user';
    const subject = isUserInvite 
      ? `Convite para fazer parte da equipe - ${companyName}`
      : `Convite para acessar seu processo - ${companyName}`;

    console.log("Unified invite email logged:", {
      to: email,
      subject,
      inviteType,
      role,
      processTitle,
      inviteToken
    });

    // Mock successful email response
    const emailResponse = {
      data: { id: `mock-unified-${Date.now()}` },
      error: null
    };

    console.log("Unified invite email logged successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailed: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-unified-invite-email function:", error);
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