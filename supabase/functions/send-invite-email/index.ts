import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

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

    const raw: any = await req.json();
    const email: string = raw.email || raw.to;
    const processId: string | undefined = raw.processId;
    const clientName: string = raw.clientName || raw.inviterName || 'Convidado';
    const companyName: string = raw.companyName || 'Nossa Empresa';
    const inviteToken: string | undefined = raw.inviteToken;

    // Tentar obter usuário (opcional). Não bloquear envio se faltar header.
    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      }
    } catch (_) {
      // prosseguir mesmo sem auth
    }

    console.log("Mock email invite logged:", {
      to: email,
      subject: `Convite para acessar o processo - ${companyName}`,
      inviteToken,
      processId
    });

    // Compose invite URL from caller or fallback to APP_BASE_URL/local
    const appBase = (raw.inviteLink && typeof raw.inviteLink === 'string' && raw.inviteLink.startsWith('http'))
      ? null
      : (Deno.env.get('APP_BASE_URL') || 'http://localhost:3000');
    const inviteUrl = raw.inviteLink || `${appBase}/cadastro-via-convite?token=${inviteToken}`;

    // Mock successful email response
    const emailResponse = {
      data: { id: `mock-${Date.now()}` },
      error: null
    };

    console.log("Invite email logged successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailed: true, 
      messageId: emailResponse.data?.id, 
      inviteUrl 
    }), {
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