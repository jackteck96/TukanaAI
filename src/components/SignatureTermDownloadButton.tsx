import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignatureTermDownloadButtonProps {
  documentId: string;
  refreshKey?: number;
}

const SignatureTermDownloadButton: React.FC<SignatureTermDownloadButtonProps> = ({
  documentId,
  refreshKey
}) => {
  const [termUrl, setTermUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSignatureTerm();
  }, [documentId, refreshKey]);

  const loadSignatureTerm = async () => {
    try {
      setLoading(true);
      
      // Buscar assinaturas internas do documento
      const { data: signatures, error } = await supabase
        .from('internal_signatures')
        .select('auth_report_url, signer_email, signature_hash')
        .eq('document_id', documentId)
        .not('auth_report_url', 'is', null);

      if (error) {
        console.error('Erro ao buscar assinaturas:', error);
        return;
      }

      // Verificar se o usuário atual tem assinatura neste documento
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userData.user.id)
        .single();

      if (!profile) return;

      // Verificar se o usuário assinou este documento
      const userSignature = signatures?.find(sig => sig.signer_email === profile.email) || signatures?.[0];

      // Sempre gerar uma URL assinada fresca para evitar problemas com URLs antigas públicas
      if (userSignature?.signature_hash) {
        const path = `authenticity-terms/${userSignature.signature_hash}.pdf`;
        const { data: signed, error: signErr } = await supabase.storage
          .from('documents')
          .createSignedUrl(path, 60 * 60 * 24 * 7);
        if (signed?.signedUrl) {
          setTermUrl(signed.signedUrl);
        } else if (userSignature?.auth_report_url) {
          // Fallback para URL antiga gravada
          console.warn('Falha ao gerar URL assinada nova, usando URL salva', signErr);
          setTermUrl(userSignature.auth_report_url);
        }
      }

    } catch (error) {
      console.error('Erro ao carregar termo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (termUrl) {
      try {
        const response = await fetch(termUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'termo-autenticidade.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Termo de autenticidade baixado com sucesso');
      } catch (error) {
        console.error('Erro ao baixar termo:', error);
        toast.error('Erro ao baixar termo de autenticidade');
      }
    } else {
      toast.error('Termo de autenticidade não disponível');
    }
  };

  if (loading || !termUrl) {
    return null;
  }

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
    >
      <Download className="h-4 w-4" />
      <span>Baixar Termo de Autenticidade</span>
    </Button>
  );
};

export default SignatureTermDownloadButton;
