import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentId: string;
  processId: string;
  clientEmail: string;
  companyId: string;
  action: 'reject' | 'request_adjustment';
  documentName: string;
}

export default function DocumentActionDialog({
  isOpen,
  onClose,
  onConfirm,
  documentId,
  processId,
  clientEmail,
  companyId,
  action,
  documentName
}: DocumentActionDialogProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!message.trim()) {
      toast.error('Por favor, insira uma mensagem explicando o motivo');
      return;
    }

    setLoading(true);
    try {
      // Atualizar status do documento e salvar a mensagem nos campos apropriados
      const newStatus = action === 'reject' ? 'Recusado' : 'Ajustes Solicitados';
      
      const updateData: any = { status: newStatus };
      
      // Adicionar a mensagem no campo apropriado
      if (action === 'reject') {
        updateData.rejection_reason = message.trim();
      } else {
        updateData.adjustment_comments = message.trim();
      }
      
      const { error: docError } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId);

      if (docError) throw docError;

      // Atualizar também o status da solicitação correspondente
      const { data: doc } = await supabase
        .from('documents')
        .select('document_type')
        .eq('id', documentId)
        .single();

      if (doc?.document_type) {
        const requestStatus = action === 'reject' ? 'rejeitado' : 'ajuste_solicitado';
        await supabase
          .from('document_requests')
          .update({ current_status: requestStatus })
          .eq('process_id', processId)
          .eq('document_name', doc.document_type);
      }

      // Criar notificação para o cliente
      const notificationType = action === 'reject' ? 'document_rejected' : 'document_adjustment_requested';
      const title = action === 'reject' 
        ? `Documento "${documentName}" foi rejeitado`
        : `Ajustes solicitados no documento "${documentName}"`;

      const { error: notificationError } = await supabase
        .from('client_notifications')
        .insert({
          process_id: processId,
          document_id: documentId,
          client_email: clientEmail,
          notification_type: notificationType,
          title,
          message: message.trim(),
          company_id: companyId
        });

      if (notificationError) throw notificationError;

      // Enviar email de notificação (opcional)
      try {
        await supabase.functions.invoke('send-document-notification', {
          body: {
            clientEmail,
            clientName: clientEmail.split('@')[0],
            documentName,
            processTitle: `Processo ${processId.substring(0, 8)}`,
            notificationType,
            message: message.trim(),
            companyName: 'Sistema Jurídico'
          }
        });
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
        // Não falhar a operação se o email não for enviado
      }

      toast.success(
        action === 'reject' 
          ? 'Documento rejeitado e cliente notificado'
          : 'Ajustes solicitados e cliente notificado'
      );
      
      onConfirm();
      onClose();
      setMessage('');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar ação');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === 'reject' ? 'Rejeitar Documento' : 'Solicitar Ajustes'}
          </DialogTitle>
          <DialogDescription>
            Documento: <strong>{documentName}</strong>
            <br />
            Explique o motivo para o cliente:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Mensagem para o cliente *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                action === 'reject' 
                  ? 'Explique por que o documento foi rejeitado...'
                  : 'Descreva quais ajustes são necessários...'
              }
              rows={4}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || !message.trim()}
            variant={action === 'reject' ? 'destructive' : 'default'}
          >
            {loading ? 'Processando...' : action === 'reject' ? 'Rejeitar' : 'Solicitar Ajustes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}