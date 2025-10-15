import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { jsPDF } from "npm:jspdf@2.5.2";
import QRCode from "npm:qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthenticityTermRequest {
  signatureId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { signatureId }: AuthenticityTermRequest = await req.json();

    console.log("Gerando termo de autenticidade para assinatura:", signatureId);

    // Buscar dados da assinatura com melhor tratamento de erro
    const { data: signature, error: sigError } = await supabase
      .from("internal_signatures")
      .select("*")
      .eq("id", signatureId)
      .maybeSingle();

    console.log("Resultado da busca:", { signature, sigError });

    if (sigError) {
      console.error("Erro ao buscar assinatura:", sigError);
      throw new Error(`Erro ao buscar assinatura: ${sigError.message}`);
    }

    if (!signature) {
      console.error("Assinatura não encontrada no banco de dados:", signatureId);
      throw new Error("Assinatura não encontrada no banco de dados");
    }

    // Buscar dados adicionais (documento e processo)
    const { data: documentData, error: docError } = await supabase
      .from("documents")
      .select("file_name, id")
      .eq("id", signature.document_id)
      .maybeSingle();
    if (docError) {
      console.warn("Erro ao buscar documento:", docError);
    }

    const { data: processData, error: procError } = await supabase
      .from("processes")
      .select("client_name, project_name")
      .eq("id", signature.process_id)
      .maybeSingle();
    if (procError) {
      console.warn("Erro ao buscar processo:", procError);
    }

    // Gerar QR Code
    const verificationUrl = `https://fuzen.online/verify-signature/${signature.signature_hash}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
    });

    // Criar PDF
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE AUTENTICIDADE DA ASSINATURA", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Documento Digital com Validade Jurídica", 105, 28, { align: "center" });
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Dados do Signatário
    let y = 45;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO SIGNATÁRIO", 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${signature.signer_name}`, 20, y);
    y += 6;
    doc.text(`E-mail: ${signature.signer_email}`, 20, y);
    y += 10;
    
    // Dados do Documento
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO DOCUMENTO", 20, y);
    y += 8;
    
    doc.setFont("helvetica", "normal");
    doc.text(`Nome do Documento: ${documentData?.file_name || "N/A"}`, 20, y);
    y += 6;
    doc.text(`ID do Documento: ${signature.document_id}`, 20, y);
    y += 6;
    doc.text(`Processo: ${processData?.project_name || processData?.client_name || "N/A"}`, 20, y);
    y += 10;
    
    // Dados da Assinatura
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DA ASSINATURA", 20, y);
    y += 8;
    
    doc.setFont("helvetica", "normal");
    const signatureDate = new Date(signature.created_at);
    doc.text(`Data e Hora (UTC): ${signatureDate.toUTCString()}`, 20, y);
    y += 6;
    doc.text(`Método de Autenticação: ${signature.authentication_method === "email" ? "E-mail" : "SMS"}`, 20, y);
    y += 6;
    doc.text(`Contato de Autenticação: ${signature.authentication_contact}`, 20, y);
    y += 6;
    doc.text(`Endereço IP: ${signature.signature_ip || "N/A"}`, 20, y);
    y += 6;
    
    const metadata = signature.signature_metadata || {};
    doc.text(`Navegador: ${metadata.browser || "N/A"}`, 20, y);
    y += 6;
    doc.text(`Dispositivo: ${metadata.device || "N/A"}`, 20, y);
    y += 10;
    
    // Hashes
    doc.setFont("helvetica", "bold");
    doc.text("INTEGRIDADE E SEGURANÇA", 20, y);
    y += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Hash do Documento (SHA256):`, 20, y);
    y += 5;
    doc.text(signature.document_hash, 20, y);
    y += 7;
    doc.text(`Hash da Assinatura:`, 20, y);
    y += 5;
    doc.text(signature.signature_hash, 20, y);
    y += 10;
    
    // Certificação
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICAÇÃO", 20, y);
    y += 8;
    
    doc.setFont("helvetica", "italic");
    const certText = 'Este termo confirma que a assinatura eletrônica foi realizada por meio de verificação de e-mail e que o documento não sofreu alterações após a assinatura.';
    const splitCert = doc.splitTextToSize(certText, 170);
    doc.text(splitCert, 20, y);
    y += splitCert.length * 5 + 5;
    
    // QR Code e Link de Verificação
    doc.setFont("helvetica", "bold");
    doc.text("VERIFICAÇÃO PÚBLICA", 20, y);
    y += 8;
    
    // Adicionar QR Code
    doc.addImage(qrCodeDataUrl, "PNG", 20, y, 40, 40);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Escaneie o QR Code ou acesse:", 65, y + 10);
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(verificationUrl, 65, y + 16, { url: verificationUrl });
    doc.setTextColor(0, 0, 0);
    
    y += 50;
    
    // Rodapé
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Gerado automaticamente por Fuzen", 105, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Data de emissão: ${new Date().toLocaleString("pt-BR")}`, 105, y, { align: "center" });
    y += 4;
    doc.text("Este documento possui validade jurídica conforme MP 2.200-2/2001", 105, y, { align: "center" });
    
    // Converter para Uint8Array
    const pdfBytes = doc.output("arraybuffer");
    const pdfUint8Array = new Uint8Array(pdfBytes);
    
    // Salvar no Supabase Storage
    const fileName = `authenticity-terms/${signature.signature_hash}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, pdfUint8Array, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erro ao salvar PDF: ${uploadError.message}`);
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;

    // Atualizar registro da assinatura com URL do termo
    const { error: updateError } = await supabase
      .from("internal_signatures")
      .update({ auth_report_url: pdfUrl })
      .eq("id", signatureId);

    if (updateError) {
      throw new Error(`Erro ao atualizar assinatura: ${updateError.message}`);
    }

    console.log("Termo de autenticidade gerado com sucesso:", pdfUrl);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl,
        verificationUrl,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Erro ao gerar termo de autenticidade:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao gerar termo de autenticidade",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
