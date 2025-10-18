import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Validation schema for security
const InviteCollaboratorSchema = z.object({
  email: z.string().email().max(255),
  full_name: z.string().trim().min(1).max(200),
  inviteLink: z.string().url().max(1000),
  inviterName: z.string().trim().min(1).max(200)
});

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
    // Validate input to prevent attacks
    const body = await req.json();
    const validationResult = InviteCollaboratorSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("[invite-collaborator] Validation failed:", validationResult.error);
      return new Response(
        JSON.stringify({ error: "Dados inválidos fornecidos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const validatedBody = validationResult.data;
    console.log("[invite-collaborator] Starting function with validated body");

    console.log("[invite-collaborator] Processing invite for:", validatedBody.email);
    console.log("[invite-collaborator] Invite link:", validatedBody.inviteLink);

    // Este edge function agora apenas valida os dados
    // O envio real do email é feito via send-unified-email no frontend
    // após criar o registro em user_invites
    
    console.log("[invite-collaborator] Invite processed successfully for:", validatedBody.email);
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
