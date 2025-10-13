import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteCollaboratorRequest {
  email: string;
  full_name: string;
  inviteLink: string;
  inviterName: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: InviteCollaboratorRequest = await req.json();
    console.log("[invite-collaborator] Starting function with body:", body);

    if (!body?.email) {
      console.error("[invite-collaborator] Missing email in request");
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[invite-collaborator] Processing invite for:", body.email);
    console.log("[invite-collaborator] Invite link:", body.inviteLink);

    // Este edge function agora apenas valida os dados
    // O envio real do email é feito via send-unified-email no frontend
    // após criar o registro em user_invites
    
    console.log("[invite-collaborator] Invite processed successfully for:", body.email);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Convite validado - prosseguir com envio de email"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("invite-collaborator unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erro inesperado" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
