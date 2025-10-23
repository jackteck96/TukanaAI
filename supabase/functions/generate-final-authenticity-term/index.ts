import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import jsPDF from 'npm:jspdf@2.5.2';
import QRCode from 'npm:qrcode@1.5.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FinalTermRequest {
  documentId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId }: FinalTermRequest = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar todas as assinaturas do documento
    const { data: signatures, error: sigError } = await supabaseClient
      .from('internal_signatures')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (sigError || !signatures || signatures.length === 0) {
      throw new Error('Assinaturas não encontradas');
    }

    // Buscar informações do documento
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('file_name, file_path, process_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Documento não encontrado');
    }

    // Buscar informações do processo
    const { data: process, error: processError } = await supabaseClient
      .from('processes')
      .select('client_name, project_name, companies(name)')
      .eq('id', document.process_id)
      .single();

    if (processError || !process) {
      throw new Error('Processo não encontrado');
    }

    // Gerar PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Título
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMO DE AUTENTICIDADE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Subtítulo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Certificado de Assinaturas Digitais', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Informações do documento
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES DO DOCUMENTO', 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Nome do Documento: ${document.file_name}`, 20, yPos);
    yPos += 7;
    doc.text(`Processo: ${process.project_name || process.client_name}`, 20, yPos);
    yPos += 7;
    doc.text(`Empresa: ${(process as any).companies?.name || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Data de Geração: ${new Date().toLocaleString('pt-BR')}`, 20, yPos);
    yPos += 15;

    // Assinaturas
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURAS DIGITAIS', 20, yPos);
    yPos += 10;

    for (const sig of signatures) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Signatário ${signatures.indexOf(sig) + 1}:`, 20, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${sig.signer_name}`, 25, yPos);
      yPos += 6;
      doc.text(`Email: ${sig.signer_email}`, 25, yPos);
      yPos += 6;
      doc.text(`Método: ${sig.authentication_method === 'email' ? 'Email' : 'SMS'}`, 25, yPos);
      yPos += 6;
      doc.text(`Contato: ${sig.authentication_contact}`, 25, yPos);
      yPos += 6;
      const sigDate = new Date(sig.created_at).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      doc.text(`Data/Hora (Horário de Brasília): ${sigDate}`, 25, yPos);
      yPos += 6;
      
      const metadata = sig.signature_metadata || {};
      const location = metadata.location || 'Não especificado';
      doc.text(`Local: ${location}`, 25, yPos);
      yPos += 6;

      if (sig.signature_ip) {
        doc.text(`IP: ${sig.signature_ip}`, 25, yPos);
        yPos += 6;
      }

      doc.setFontSize(8);
      doc.text(`Hash: ${sig.signature_hash.substring(0, 60)}...`, 25, yPos);
      yPos += 10;
      doc.setFontSize(12);
    }

    // Certificação
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICAÇÃO', 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    const certText = 'Este termo certifica que as assinaturas eletrônicas acima foram realizadas mediante verificação de identidade via e-mail/SMS e que o documento não sofreu alterações após as assinaturas. As assinaturas possuem validade jurídica conforme MP 2.200-2/2001.';
    const splitText = doc.splitTextToSize(certText, pageWidth - 40);
    doc.text(splitText, 20, yPos);
    yPos += splitText.length * 5 + 10;

    // QR Code para verificação
    const verificationUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/verify-signature/${signatures[0].signature_hash}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 100 });
    
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 50, pageHeight - 60, 40, 40);
    doc.setFontSize(8);
    doc.text('Verificar autenticidade', pageWidth - 50, pageHeight - 15, { maxWidth: 40, align: 'center' });

    // Gerar PDF como blob
    const pdfBlob = doc.output('blob');
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // Fazer upload para storage
    const termPath = `authenticity-terms/final-${documentId}.pdf`;
    const { error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(termPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro ao fazer upload do termo:', uploadError);
      throw uploadError;
    }

    // Gerar URL assinada
    const { data: signedUrl, error: urlError } = await supabaseClient.storage
      .from('documents')
      .createSignedUrl(termPath, 60 * 60 * 24 * 365); // 1 ano

    if (urlError) {
      console.error('Erro ao gerar URL assinada:', urlError);
      throw urlError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        authenticityTermUrl: signedUrl.signedUrl,
        verificationUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao gerar termo final:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
