import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignatureTermDownloadButtonProps {
  documentId: string;
}

const SignatureTermDownloadButton: React.FC<SignatureTermDownloadButtonProps> = ({
  documentId
}) => {
  const [termUrl, setTermUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSignatureTerm();
  }, [documentId]);

  const loadSignatureTerm = async () => {
    try {
      setLoading(true);
      
      // Buscar assinaturas internas do documento
      const { data: signatures, error } = await supabase
        .from('internal_signatures')
        .select('auth_report_url, signer_email')
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
      const userSignature = signatures?.find(sig => sig.signer_email === profile.email);
      
      if (userSignature?.auth_report_url) {
        setTermUrl(userSignature.auth_report_url);
      } else if (signatures && signatures.length > 0) {
        // Se não encontrou assinatura do usuário, mas há assinaturas, mostrar a primeira
        // (útil para admins que querem ver termos)
        setTermUrl(signatures[0].auth_report_url);
      }
    } catch (error) {
      console.error('Erro ao carregar termo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (termUrl) {
      window.open(termUrl, '_blank');
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
