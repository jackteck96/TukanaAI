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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[invite-collaborator] Missing Supabase env vars");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor ausente" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!body?.email) {
      console.error("[invite-collaborator] Missing email in request");
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[invite-collaborator] Processing invite for:", body.email);

    // Envia convite via mailer nativo do Supabase normalizando o domínio do redirect
    const baseUrl = "https://fuzen.online";
    let redirectUrl = body.inviteLink;
    try {
      const provided = new URL(body.inviteLink);
      const host = provided.host;
      const base = new URL(baseUrl);
      const isPreview = host.endsWith('.lovableproject.com');
      const isLocal = host.includes('localhost');
      const isProd = host === base.host;

      if (isPreview || isProd) {
        // Mantém o domínio fornecido (preview ou produção já válidos)
        redirectUrl = provided.toString();
      } else if (isLocal) {
        // Força domínio de produção quando vier de localhost
        provided.protocol = base.protocol;
        provided.host = base.host;
        redirectUrl = provided.toString();
      } else {
        // Fallback seguro para produção
        provided.protocol = base.protocol;
        provided.host = base.host;
        redirectUrl = provided.toString();
      }
    } catch (_) {
      // Fallback seguro
      redirectUrl = `${baseUrl}/cadastro-via-convite`;
    }
    
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(body.email, {
      redirectTo: redirectUrl,
      data: {
        full_name: body.full_name,
        role: 'staff',
        inviter_name: body.inviterName
      }
    });

    console.log("[invite-collaborator] Supabase invite result:", { data: data?.user?.id, error });

    // Tratar "email_exists" como sucesso - usuário já existe, apenas continuar o fluxo
    if (error && error.message !== "A user with this email address has already been registered") {
      console.error("[invite-collaborator] invite error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userExists = error?.message === "A user with this email address has already been registered";
    if (userExists) {
      console.log("[invite-collaborator] User already exists, skipping Supabase invite but continuing with email");
    }

    console.log("[invite-collaborator] Invite processed successfully for:", body.email);
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: data?.user ?? null, 
        userExists: userExists,
        message: userExists ? "Usuário já existe - continuando fluxo" : "Convite enviado com sucesso"
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
