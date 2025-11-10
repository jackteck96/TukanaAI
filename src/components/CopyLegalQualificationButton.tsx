import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { copyLegalQualificationToClipboard, LegalData } from '@/utils/legalQualification';
import { toast } from 'sonner';

interface CopyLegalQualificationButtonProps {
  data: LegalData;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function CopyLegalQualificationButton({ 
  data, 
  variant = 'outline',
  size = 'default',
  className 
}: CopyLegalQualificationButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyLegalQualificationToClipboard(data);
    
    if (success) {
      setCopied(true);
      toast.success('Qualificação jurídica copiada para área de transferência!');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } else {
      toast.error('Erro ao copiar qualificação jurídica');
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant={variant}
      size={size}
      className={className}
      disabled={copied}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copiar qualificação jurídica
        </>
      )}
    </Button>
  );
}
