import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[list-company-invites] Missing Supabase URL or ANON key");
      return new Response(JSON.stringify({ error: "Configuração do Supabase ausente" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: userErr,
    } = await authClient.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Descobrir company_id do admin
    const { data: roleRow, error: roleErr } = await authClient
      .from("user_roles")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("role", "company_admin")
      .maybeSingle();

    if (roleErr) {
      console.error("[list-company-invites] roleErr:", roleErr);
      return new Response(JSON.stringify({ error: "Erro ao validar papel do usuário" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const companyId = roleRow?.company_id as string | undefined;
    if (!companyId) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!SERVICE_ROLE_KEY) {
      console.error("[list-company-invites] Missing service role key");
      return new Response(JSON.stringify({ error: "Configuração do servidor ausente" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: invites, error: invitesErr } = await adminClient
      .from("user_invites")
      .select("id, email, full_name, token, role, status, expires_at, created_at")
      .eq("company_id", companyId)
      .in("status", ["pending", "sent"])
      .order("created_at", { ascending: false });

    if (invitesErr) {
      console.error("[list-company-invites] invitesErr:", invitesErr);
      return new Response(JSON.stringify({ error: "Erro ao buscar convites" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, invites }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("[list-company-invites] unexpected error:", err);
    return new Response(JSON.stringify({ error: "Erro inesperado" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
