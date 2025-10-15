// Supabase Edge Function: complete-internal-signature
// Validates OTP server-side and creates an internal signature record using service role

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function toHex(buffer: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x: number) => ('00' + x.toString(16)).slice(-2))
    .join('');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders } });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client bound to user JWT for auth context
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // Admin client with service role for RLS-bypassing writes (use carefully!)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      verificationId,
      otpCode,
      documentId,
      processId,
      signerName,
      signerEmail,
      authContact,
      placement,
      userAgent,
    } = await req.json();

    if (!verificationId || !otpCode || !documentId || !processId || !signerName || !signerEmail || !authContact) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get current user from JWT
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const userId = userData.user.id;

    // Validate OTP server-side
    const nowIso = new Date().toISOString();
    const { data: otpRow, error: otpErr } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('id', verificationId)
      .eq('verification_code', otpCode)
      .gt('expires_at', nowIso)
      .single();

    if (otpErr || !otpRow) {
      console.error('[complete-internal-signature] OTP validation failed', { otpErr, verificationId, otpCode });
      return new Response(JSON.stringify({ error: 'Invalid or expired code', details: otpErr?.message || otpErr }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (otpRow.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Code does not belong to user' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Mark OTP as verified
    const { error: markErr } = await supabaseAdmin
      .from('otp_verifications')
      .update({ is_verified: true })
      .eq('id', verificationId);
    if (markErr) {
      return new Response(JSON.stringify({ error: 'Failed to mark verification' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch process to get company_id
    const { data: process, error: processErr } = await supabaseAdmin
      .from('processes')
      .select('company_id, client_email')
      .eq('id', processId)
      .single();
    if (processErr || !process?.company_id) {
      console.error('[complete-internal-signature] Process fetch error', processErr);
      return new Response(JSON.stringify({ error: 'Process or company not found', details: processErr?.message || processErr }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch document path for hashing context (optional)
    const { data: docInfo } = await supabaseAdmin
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    const signatureTimestamp = new Date();
    const signatureHash = await sha256Hex(`${documentId}|${userId}|${signatureTimestamp.toISOString()}`);
    const documentHash = await sha256Hex(`${documentId}|${docInfo?.file_path || ''}`);

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const signatureMetadata: any = {
      timestamp: signatureTimestamp.toISOString(),
      method: 'internal_otp',
      verification_id: verificationId,
      ip_address: ip,
      browser: userAgent || 'unknown',
      device: 'unknown',
      signature_position: placement || null,
    };

    const { data: signatureRow, error: insertErr } = await supabaseAdmin
      .from('internal_signatures')
      .insert({
        document_id: documentId,
        process_id: processId,
        company_id: process.company_id,
        signer_id: userId,
        signer_name: signerName,
        signer_email: signerEmail,
        authentication_method: 'email',
        authentication_contact: authContact,
        signature_hash: signatureHash,
        document_hash: documentHash,
        signature_order: 1,
        signature_metadata: signatureMetadata,
      })
      .select()
      .single();

    if (insertErr || !signatureRow) {
      console.error('[complete-internal-signature] Insert failed', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to create signature record', details: insertErr?.message || insertErr }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, signatureId: signatureRow.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.error('[complete-internal-signature] Unexpected error', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});