import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Mail, Send, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

interface EmailResendButtonProps {
  processId: string;
  clientName: string;
  clientEmail: string;
  processName?: string;
}

const EmailResendButton: React.FC<EmailResendButtonProps> = ({
  processId,
  clientName,
  clientEmail,
  processName
}) => {
  const [loading, setLoading] = useState<'welcome' | 'invite' | null>(null);
  const { company } = useCompany();

  const handleResendWelcomeEmail = async () => {
    if (!company?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    setLoading('welcome');
    try {
      const { error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          processId,
          clientName,
          clientEmail,
          processName: processName || `Processo - ${clientName}`,
          companyId: company.id,
        },
      });

      if (error) throw error;

      toast.success('Email de boas-vindas reenviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao reenviar email de boas-vindas:', error);
      toast.error('Erro ao reenviar email de boas-vindas');
    } finally {
      setLoading(null);
    }
  };

  const handleResendInviteEmail = async () => {
    if (!company?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    setLoading('invite');
    try {
      // Buscar token de convite existente
      const { data: inviteData, error: inviteError } = await supabase
        .from('client_invites')
        .select('token')
        .eq('process_id', processId)
        .eq('email', clientEmail)
        .single();

      if (inviteError || !inviteData) {
        toast.error('Convite não encontrado');
        return;
      }

      const { error } = await supabase.functions.invoke('invite-collaborator', {
        body: {
          email: clientEmail,
          full_name: clientName,
          inviterName: company?.name || 'Equipe',
          inviteLink: `${window.location.origin}/cadastro-via-convite?token=${inviteData.token}`,
        },
      });

      if (error) throw error;

      toast.success('Convite reenviado por email com sucesso!');
    } catch (error: any) {
      console.error('Erro ao reenviar email de convite:', error);
      toast.error('Erro ao reenviar email de convite');
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Mail className="h-4 w-4" />
          <span>Reenviar Email</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={handleResendWelcomeEmail}
          disabled={loading !== null}
          className="flex items-center space-x-2"
        >
          {loading === 'welcome' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <div className="flex flex-col">
            <span>Email de Boas-vindas</span>
            <span className="text-xs text-muted-foreground">
              Link direto ao processo
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleResendInviteEmail}
          disabled={loading !== null}
          className="flex items-center space-x-2"
        >
          {loading === 'invite' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          <div className="flex flex-col">
            <span>Email de Convite</span>
            <span className="text-xs text-muted-foreground">
              Para cadastro na plataforma
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmailResendButton;