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

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      console.error("[list-company-invites] Missing Supabase config keys");
      return new Response(JSON.stringify({ error: "Configuração do Supabase ausente" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Client with caller's JWT to identify the user
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
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

    // Admin client (service role) for RLS-bypassed, server-side authorization checks
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Read body (companyId is optional but recommended)
    let body: any = {};
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        body = await req.json();
      }
    } catch (_) {}

    const requestedCompanyId: string | undefined = body?.companyId;

    // Check if caller is platform_admin
    const { count: platformCount, error: platformErr } = await adminClient
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "platform_admin");

    if (platformErr) {
      console.error("[list-company-invites] platformErr:", platformErr);
      return new Response(JSON.stringify({ error: "Erro ao validar permissões" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let companyId = requestedCompanyId;

    if (!companyId) {
      // If no companyId provided, try to infer from company_admin roles
      const { data: adminRoles, error: adminRolesErr } = await adminClient
        .from("user_roles")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("role", "company_admin");

      if (adminRolesErr) {
        console.error("[list-company-invites] adminRolesErr:", adminRolesErr);
        return new Response(JSON.stringify({ error: "Erro ao validar papel do usuário" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if ((adminRoles?.length || 0) === 1) {
        companyId = adminRoles![0].company_id as string;
      } else {
        // Ambiguous or none; require explicit companyId unless platform admin
        if (!platformCount) {
          return new Response(
            JSON.stringify({ error: "Informe companyId" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }
    }

    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Authorization: platform_admin OR company_admin of the requested company
    let authorized = !!platformCount && platformCount > 0;
    if (!authorized) {
      const { count: adminCount, error: adminCountErr } = await adminClient
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "company_admin")
        .eq("company_id", companyId);

      if (adminCountErr) {
        console.error("[list-company-invites] adminCountErr:", adminCountErr);
        return new Response(JSON.stringify({ error: "Erro ao validar permissões" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      authorized = !!adminCount && adminCount > 0;
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch invites for company
    const { data: invites, error: invitesErr } = await adminClient
      .from("user_invites")
      .select("id, email, full_name, token, role, status, expires_at, created_at")
      .eq("company_id", companyId)
      .in("status", ["pending", "sent"]) // include sent/pending
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
