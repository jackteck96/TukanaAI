import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      code, 
      document_id, 
      process_id, 
      signer_email 
    } = await req.json();

    console.log('Recebendo callback gov.br:', { code, document_id, process_id, signer_email });

    // 1. Trocar código por token de acesso gov.br
    const tokenResponse = await fetch('https://sso.acesso.gov.br/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${Deno.env.get('GOV_BR_CLIENT_ID')}:${Deno.env.get('GOV_BR_CLIENT_SECRET')}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/gov-br-callback`
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Falha na autenticação gov.br');
    }

    const tokenData = await tokenResponse.json();
    console.log('Token obtido do gov.br');

    // 2. Obter dados do usuário gov.br
    const userResponse = await fetch('https://sso.acesso.gov.br/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      throw new Error('Falha ao obter dados do usuário gov.br');
    }

    const userData = await userResponse.json();
    console.log('Dados do usuário obtidos:', userData);

    // 3. Verificar se pode assinar o documento
    const { data: canSignData, error: canSignError } = await supabaseClient
      .rpc('can_sign_document', {
        document_uuid: document_id,
        signer_email_param: signer_email
      });

    if (canSignError || !canSignData) {
      throw new Error('Usuário não autorizado a assinar este documento');
    }

    // 4. Simular processo de assinatura digital
    // Em produção, aqui seria feita a integração com o Assinador ICP-Brasil
    const signatureHash = await generateSignatureHash(document_id, userData);
    const certificateData = extractCertificateData(userData);

    // 5. Registrar assinatura no banco
    const { data: companyData } = await supabaseClient
      .from('processes')
      .select('company_id')
      .eq('id', process_id)
      .single();

    const { error: signatureError } = await supabaseClient
      .from('digital_signatures')
      .insert({
        document_id: document_id,
        process_id: process_id,
        company_id: companyData?.company_id,
        signer_cpf: userData.cpf,
        signer_name: userData.name,
        signer_email: signer_email,
        certificate_serial: certificateData.serial,
        certificate_issuer: certificateData.issuer,
        certificate_subject: certificateData.subject,
        signature_hash: signatureHash,
        signature_status: 'signed',
        signature_order: await getSignatureOrder(document_id, signer_email),
        gov_br_access_token: tokenData.access_token,
        signature_metadata: {
          gov_br_user_data: userData,
          certificate_data: certificateData,
          signature_timestamp: new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        }
      });

    if (signatureError) {
      throw signatureError;
    }

    // 6. Verificar se todas as assinaturas foram concluídas
    await checkAndCompleteSignatureFlow(document_id);

    console.log('Assinatura registrada com sucesso');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Documento assinado com sucesso',
      signature_data: {
        signer_name: userData.name,
        signer_cpf: userData.cpf,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no processo de assinatura:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Função para gerar hash da assinatura
async function generateSignatureHash(documentId: string, userData: any): Promise<string> {
  const signatureData = `${documentId}-${userData.cpf}-${new Date().toISOString()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Função para extrair dados do certificado
function extractCertificateData(userData: any) {
  // Em produção, extrair dados reais do certificado ICP-Brasil
  return {
    serial: `CERT-${userData.cpf}-${Date.now()}`,
    issuer: 'AC Serpro RFB v5',
    subject: `CN=${userData.name}, emailAddress=${userData.email}, C=BR`
  };
}

// Função para obter ordem de assinatura
async function getSignatureOrder(documentId: string, signerEmail: string): Promise<number> {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data } = await supabaseClient
    .from('signature_requirements')
    .select('signature_order')
    .eq('signer_email', signerEmail)
    .in('signature_flow_id', 
      supabaseClient
        .from('signature_flows')
        .select('id')
        .eq('document_id', documentId)
    )
    .single();

  return data?.signature_order || 1;
}

// Função para verificar e completar fluxo de assinatura
async function checkAndCompleteSignatureFlow(documentId: string) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Buscar fluxo ativo
  const { data: flowData } = await supabaseClient
    .from('signature_flows')
    .select('*')
    .eq('document_id', documentId)
    .eq('flow_status', 'active')
    .single();

  if (!flowData) return;

  // Contar assinaturas concluídas
  const { count } = await supabaseClient
    .from('digital_signatures')
    .select('*', { count: 'exact' })
    .eq('document_id', documentId)
    .eq('signature_status', 'signed');

  // Se todas as assinaturas foram concluídas, marcar fluxo como completo
  if (count === flowData.total_steps) {
    await supabaseClient
      .from('signature_flows')
      .update({ flow_status: 'completed' })
      .eq('id', flowData.id);

    console.log('Fluxo de assinatura completado');
  }
}