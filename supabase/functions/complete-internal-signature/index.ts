// Supabase Edge Function: complete-internal-signature
// Validates OTP server-side and creates an internal signature record using service role

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

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

    // Admin client with service role for RLS-bypassing writes
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
      isStandalone,
    } = await req.json();

    if (!verificationId || !otpCode || !documentId || !signerName || !signerEmail || !authContact) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // processId é opcional para standalone signatures
    if (!isStandalone && !processId) {
      return new Response(JSON.stringify({ error: 'processId required for non-standalone signatures' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Public function: user will be derived from OTP row
    let userId: string | null = null;

    // Validate OTP server-side
    const nowIso = new Date().toISOString();
    // Fetch OTP row by ID only, compare code server-side to avoid column/type mismatches
    const { data: otpRow, error: otpErr } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (otpErr || !otpRow) {
      console.error('[complete-internal-signature] OTP validation failed', { otpErr, verificationId, otpCode });
      return new Response(JSON.stringify({ error: 'Invalid or expired code', details: otpErr?.message || otpErr }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Expiration check (server-side)
    if (otpRow.expires_at && new Date(otpRow.expires_at).getTime() <= Date.now()) {
      console.error('[complete-internal-signature] OTP expired', { verificationId });
      return new Response(JSON.stringify({ error: 'Invalid or expired code', details: 'expired' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Compare user-provided code with stored code (supporting different possible column names/types)
    const storedCode = otpRow.verification_code ?? otpRow.code ?? otpRow.otp_code ?? null;
    if (!storedCode || String(storedCode).trim() !== String(otpCode).trim()) {
      console.error('[complete-internal-signature] OTP code mismatch', { verificationId });
      return new Response(JSON.stringify({ error: 'Invalid or expired code', details: 'mismatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Derive the user from the OTP row (public function)
    userId = otpRow.user_id;

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

    // Fetch company_id and file_path based on signature type
    let companyId: string;
    let clientEmail: string | null = null;
    let filePath: string | null = null;

    if (isStandalone) {
      // Standalone signature: fetch from standalone_signature_documents
      const { data: standaloneDoc, error: standaloneErr } = await supabaseAdmin
        .from('standalone_signature_documents')
        .select('company_id, client_email, file_path')
        .eq('id', documentId)
        .single();
      
      if (standaloneErr || !standaloneDoc?.company_id) {
        console.error('[complete-internal-signature] Standalone document fetch error', standaloneErr);
        return new Response(JSON.stringify({ error: 'Standalone document not found', details: standaloneErr?.message || standaloneErr }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      companyId = standaloneDoc.company_id;
      clientEmail = standaloneDoc.client_email;
      filePath = standaloneDoc.file_path;
    } else {
      // Process-based signature: fetch from processes and documents
      const { data: process, error: processErr } = await supabaseAdmin
        .from('processes')
        .select('company_id, client_email')
        .eq('id', processId!)
        .single();
      
      if (processErr || !process?.company_id) {
        console.error('[complete-internal-signature] Process fetch error', processErr);
        return new Response(JSON.stringify({ error: 'Process or company not found', details: processErr?.message || processErr }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      companyId = process.company_id;
      clientEmail = process.client_email;

      // Fetch document path
      const { data: docInfo } = await supabaseAdmin
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();
      
      filePath = docInfo?.file_path || null;
    }

    const signatureTimestamp = new Date();
    const signatureHash = await sha256Hex(`${documentId}|${userId}|${signatureTimestamp.toISOString()}`);
    const documentHash = await sha256Hex(`${documentId}|${filePath || ''}`);

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Obter localização aproximada via IP (geolocalização)
    let location = 'Não especificado';
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        location = `${geoData.city || ''}, ${geoData.region || ''} - ${geoData.country_name || ''}`.trim();
      }
    } catch (e) {
      console.warn('[complete-internal-signature] Não foi possível obter localização:', e);
    }

    const signatureMetadata: any = {
      timestamp: signatureTimestamp.toISOString(),
      method: 'internal_otp',
      verification_id: verificationId,
      ip_address: ip,
      browser: userAgent || 'unknown',
      device: 'unknown',
      location: location,
      signature_position: placement || null,
    };

    const insertPayload: any = {
      document_id: documentId,
      company_id: companyId,
      signer_id: userId,
      signer_name: signerName,
      signer_email: signerEmail,
      authentication_method: 'email',
      authentication_contact: authContact,
      signature_hash: signatureHash,
      document_hash: documentHash,
      signature_order: 1,
      signature_metadata: signatureMetadata,
    };

    // Adicionar process_id apenas se não for standalone
    if (!isStandalone && processId) {
      insertPayload.process_id = processId;
    }

    const { data: signatureRow, error: insertErr } = await supabaseAdmin
      .from('internal_signatures')
      .insert(insertPayload)
      .select()
      .single();

    if (insertErr || !signatureRow) {
      console.error('[complete-internal-signature] Insert failed', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to create signature record', details: insertErr?.message || insertErr }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Tentar aplicar assinatura visual no PDF e atualizar arquivo
    try {
      if (filePath) {
        console.log('[complete-internal-signature] Baixando PDF original', filePath);
        const { data: origBlob, error: dlErr } = await supabaseAdmin.storage
          .from('documents')
          .download(filePath);
        if (dlErr) {
          console.warn('[complete-internal-signature] Falha ao baixar PDF original', dlErr);
        }
        if (!dlErr && origBlob) {
          const origBytes = new Uint8Array(await origBlob.arrayBuffer());
          const pdfDoc = await PDFDocument.load(origBytes);
          const pages = pdfDoc.getPages();
          const pageIndex = (placement?.page ? Math.max(1, placement.page) - 1 : 0);
          const page = pages[Math.min(pageIndex, pages.length - 1)];
          const { width, height } = page.getSize();
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

          // Calcular posição
          let x = width - 220;
          let y = 40;
          if (placement && typeof placement.x_percent === 'number' && typeof placement.y_percent === 'number') {
            x = Math.max(20, Math.min(width - 220, Math.round(placement.x_percent * width)));
            // y_percent normalmente vem do topo; converter para coordenadas do pdf-lib (origem bottom-left)
            y = Math.max(20, Math.min(height - 60, Math.round((1 - placement.y_percent) * height)));
          }

          // Caixa e textos
          page.drawRectangle({ x, y, width: 200, height: 50, color: rgb(1, 1, 1), opacity: 0.85, borderColor: rgb(0,0,0), borderWidth: 0.5 });
          page.drawText('Assinado eletronicamente', { x: x + 8, y: y + 32, size: 10, font, color: rgb(0,0,0) });
          page.drawText(`Por: ${signerName}`, { x: x + 8, y: y + 18, size: 10, font, color: rgb(0,0,0) });
          page.drawText(new Date(signatureTimestamp).toLocaleString('pt-BR'), { x: x + 8, y: y + 6, size: 9, font, color: rgb(0,0,0) });

          const stampedBytes = await pdfDoc.save();
          const signedPath = `signed/${filePath}`;
          const stampedBlob = new Blob([stampedBytes], { type: 'application/pdf' });
          console.log('[complete-internal-signature] Enviando PDF assinado para', signedPath, 'tamanho', stampedBytes.byteLength);
          const { error: upErr } = await supabaseAdmin.storage
            .from('documents')
            .upload(signedPath, stampedBlob, { contentType: 'application/pdf', upsert: true });

          if (!upErr) {
            console.log('[complete-internal-signature] Upload do PDF assinado concluído');
            
            // Atualizar documento para apontar para a versão assinada
            if (isStandalone) {
              const { error: updDocErr } = await supabaseAdmin
                .from('standalone_signature_documents')
                .update({ file_path: signedPath })
                .eq('id', documentId);
              if (updDocErr) {
                console.warn('[complete-internal-signature] Falha ao atualizar file_path standalone', updDocErr);
              } else {
                console.log('[complete-internal-signature] file_path standalone atualizado para', signedPath);
              }
            } else {
              const { error: updDocErr } = await supabaseAdmin
                .from('documents')
                .update({ file_path: signedPath })
                .eq('id', documentId);
              if (updDocErr) {
                console.warn('[complete-internal-signature] Falha ao atualizar file_path para assinado', updDocErr);
              } else {
                console.log('[complete-internal-signature] file_path do documento atualizado para', signedPath);
              }
            }
          } else {
            console.warn('[complete-internal-signature] Falha ao subir PDF assinado', upErr);
          }
        }
      }
    } catch (e) {
      console.warn('[complete-internal-signature] Não foi possível aplicar assinatura visual', e);
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