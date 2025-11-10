import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, FileText } from 'lucide-react';

interface Client {
  client_email: string;
  client_name: string;
}

interface StandaloneDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const StandaloneDocumentUpload = ({
  open,
  onOpenChange,
  onSuccess
}: StandaloneDocumentUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    client_email: '',
    client_name: '',
    document_name: '',
    signature_deadline: '',
    notes: '',
    file: null as File | null
  });

  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    if (!user) return;
    
    setLoadingClients(true);
    try {
      // Buscar company_id do usuário
      const { data: userData } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user.id)
        .in('role', ['company_admin', 'company_collaborator'])
        .single();

      if (userData?.company_id) {
        setCompanyId(userData.company_id);

        // Buscar clientes únicos dos processos da empresa
        const { data: processData } = await supabase
          .from('processes')
          .select('client_email, client_name')
          .eq('company_id', userData.company_id);

        if (processData) {
          // Remover duplicatas por email
          const uniqueClients = Array.from(
            new Map(
              processData.map(item => [item.client_email, item])
            ).values()
          );
          setClients(uniqueClients);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar lista de clientes',
        variant: 'destructive'
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleClientChange = (email: string) => {
    const selectedClient = clients.find(c => c.client_email === email);
    if (selectedClient) {
      setFormData({
        ...formData,
        client_email: email,
        client_name: selectedClient.client_name
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        file,
        document_name: formData.document_name || file.name
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.client_email || !formData.file || !companyId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios e selecione um arquivo',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Upload do arquivo para o storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `standalone-signatures/${companyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // Inserir registro no banco
      const { error: insertError } = await supabase
        .from('standalone_signature_documents')
        .insert({
          company_id: companyId,
          client_email: formData.client_email,
          client_name: formData.client_name,
          document_name: formData.document_name,
          file_path: filePath,
          file_type: formData.file.type,
          file_size: formData.file.size,
          signature_deadline: formData.signature_deadline || null,
          signature_status: 'pending',
          uploaded_by: user!.id,
          notes: formData.notes || null
        });

      if (insertError) throw insertError;

      toast({
        title: 'Sucesso',
        description: 'Documento enviado para assinatura com sucesso'
      });

      // Reset form
      setFormData({
        client_email: '',
        client_name: '',
        document_name: '',
        signature_deadline: '',
        notes: '',
        file: null
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar documento para assinatura',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enviar Documento para Assinatura
          </DialogTitle>
        </DialogHeader>

        {loadingClients ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select
                value={formData.client_email}
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.client_email} value={client.client_email}>
                      {client.client_name} ({client.client_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_name">Nome do Documento *</Label>
              <Input
                id="document_name"
                value={formData.document_name}
                onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="flex-1"
                />
                {formData.file && (
                  <span className="text-sm text-muted-foreground">
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo para Assinatura</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.signature_deadline}
                onChange={(e) => setFormData({ ...formData, signature_deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Adicione informações ou instruções adicionais..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingClients}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="mr-2 h-4 w-4" />
            Enviar para Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
