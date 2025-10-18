import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Validation schema for security
const VerifyInviteSchema = z.object({
  token: z.string().min(32).max(100)
});

interface VerifyInviteRequest {
  token: string;
}

interface VerifyInviteResponse {
  type: 'user' | 'client';
  email: string;
  company_id: string;
  full_name?: string | null;
  role?: string | null;
  process_id?: string | null;
  expires_at: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase env vars");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor ausente" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Validate input to prevent attacks
    const body = await req.json();
    const validationResult = VerifyInviteSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('[verify-invite] Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ error: "Token inválido fornecido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { token } = validationResult.data;
    console.log('[verify-invite] Checking token:', token);

    // Try user_invites first
    const { data: userInvite, error: userErr } = await supabase
      .from('user_invites')
      .select('email, company_id, full_name, role, expires_at, status')
      .eq('token', token)
      .maybeSingle();

    console.log('[verify-invite] User invite result:', { userInvite, userErr });

    if (userErr) {
      console.error('verify-invite user_invites error:', userErr);
    }

    if (userInvite) {
      console.log('[verify-invite] Found user invite, status:', userInvite.status, 'expires_at:', userInvite.expires_at);
      const now = new Date();
      const expiresAt = new Date(userInvite.expires_at);
      console.log('[verify-invite] Current time:', now.toISOString(), 'Expires at:', expiresAt.toISOString(), 'Is expired:', expiresAt <= now);
    }

    if (userInvite && userInvite.status === 'pending' && new Date(userInvite.expires_at) > new Date()) {
      const resp: VerifyInviteResponse = {
        type: 'user',
        email: userInvite.email,
        company_id: userInvite.company_id,
        full_name: userInvite.full_name ?? null,
        role: userInvite.role ?? 'staff',
        expires_at: userInvite.expires_at,
      };
      return new Response(JSON.stringify(resp), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Then try client_invites
    const { data: clientInvite, error: clientErr } = await supabase
      .from('client_invites')
      .select('email, company_id, process_id, expires_at, status')
      .eq('token', token)
      .maybeSingle();

    console.log('[verify-invite] Client invite result:', { clientInvite, clientErr });

    if (clientErr) {
      console.error('verify-invite client_invites error:', clientErr);
    }

    if (clientInvite) {
      console.log('[verify-invite] Found client invite, status:', clientInvite.status, 'expires_at:', clientInvite.expires_at);
      const now = new Date();
      const expiresAt = new Date(clientInvite.expires_at);
      console.log('[verify-invite] Current time:', now.toISOString(), 'Expires at:', expiresAt.toISOString(), 'Is expired:', expiresAt <= now);
    }

    if (clientInvite && clientInvite.status === 'pending' && new Date(clientInvite.expires_at) > new Date()) {
      const resp: VerifyInviteResponse = {
        type: 'client',
        email: clientInvite.email,
        company_id: clientInvite.company_id,
        process_id: clientInvite.process_id,
        expires_at: clientInvite.expires_at,
      };
      return new Response(JSON.stringify(resp), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('[verify-invite] No valid invite found for token:', token);
    return new Response(JSON.stringify({ error: 'Convite inválido ou expirado' }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error('verify-invite unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Erro inesperado' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});