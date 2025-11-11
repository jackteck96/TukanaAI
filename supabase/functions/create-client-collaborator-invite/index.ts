import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const InviteSchema = z.object({
  email: z.string().email().max(255),
  full_name: z.string().trim().min(1).max(200),
  access_type: z.enum(["full", "limited"]).default("limited"),
  allowed_process_ids: z.array(z.string().uuid()).default([]),
});

type InviteInput = z.infer<typeof InviteSchema>;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client as requester (propagates JWT)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    // Admin client (bypasses RLS for the insert)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const parsed = InviteSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const input: InviteInput = parsed.data;

    // Identify requester and email
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: profile, error: profErr } = await supabase
      .from("profiles").select("email").eq("id", user.id).single();
    if (profErr || !profile?.email) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Ensure requester is a client or client collaborator and email matches
    // Use the same logic as can_create_client_invite()
    let isClientContext = false;

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role, client_email")
      .eq("user_id", user.id);

    if (rolesData?.some(r => (r.role === 'client' || r.role === 'client_collaborator') && r.client_email === profile.email)) {
      isClientContext = true;
    } else {
      // legacy: profiles.role = 'client'
      const { data: legacy } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (legacy?.role === 'client') isClientContext = true;
    }

    if (!isClientContext) {
      return new Response(JSON.stringify({ error: "Sem permissão para criar convites de cliente" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create token
    const token = crypto.randomUUID().replace(/-/g, "");

    // Insert invite with service role (bypasses RLS) but constrained by our checks
    const { error: insertErr } = await admin.from("user_invites").insert({
      token,
      email: input.email,
      full_name: input.full_name,
      role: 'staff',
      client_email: profile.email,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      access_type: input.access_type,
      allowed_process_ids: input.access_type === 'limited' ? input.allowed_process_ids : [],
    });

    if (insertErr) {
      console.error('[create-client-collaborator-invite] insert error', insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, token }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error('[create-client-collaborator-invite] unexpected', e);
    return new Response(
      JSON.stringify({ error: e?.message || 'Erro inesperado' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
