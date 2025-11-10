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
import InternalSignatureManager from './InternalSignatureManager';

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
  const [createdDocumentId, setCreatedDocumentId] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSuccessStep, setShowSuccessStep] = useState(false);

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
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user.id)
        .in('role', ['company_admin', 'company_collaborator'])
        .limit(1);

      if (userError) {
        console.error('Erro ao buscar company_id:', userError);
        throw userError;
      }

      const userCompanyId = userData?.[0]?.company_id;
      
      if (userCompanyId) {
        setCompanyId(userCompanyId);

        // Buscar TODOS os clientes únicos dos processos da empresa (sem limite)
        const { data: processData, error: processError } = await supabase
          .from('processes')
          .select('client_email, client_name')
          .eq('company_id', userCompanyId)
          .order('client_name', { ascending: true });

        if (processError) {
          console.error('Erro ao buscar processos:', processError);
          throw processError;
        }

        if (processData && processData.length > 0) {
          // Remover duplicatas por email
          const uniqueClients = Array.from(
            new Map(
              processData.map(item => [item.client_email, item])
            ).values()
          );
          setClients(uniqueClients);
          console.log('Clientes carregados:', uniqueClients.length);
        } else {
          setClients([]);
          toast({
            title: 'Aviso',
            description: 'Nenhum cliente encontrado. Você precisa ter processos cadastrados com clientes primeiro.',
            variant: 'default'
          });
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
      const { data: newDocument, error: insertError } = await supabase
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
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Documento criado com sucesso',
        description: 'Clique em "Seguinte" para posicionar e assinar o documento',
      });

      // Guardar o ID do documento criado e mostrar o passo de sucesso
      console.log('Documento criado com ID:', newDocument.id);
      setCreatedDocumentId(newDocument.id);
      setShowSuccessStep(true);
      console.log('showSuccessStep definido como true');
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

  const handleSignatureComplete = () => {
    toast({
      title: 'Assinatura concluída',
      description: 'Documento assinado e enviado para o cliente com sucesso'
    });
    
    // Reset form e fechar todos os modais
    setFormData({
      client_email: '',
      client_name: '',
      document_name: '',
      signature_deadline: '',
      notes: '',
      file: null
    });
    setCreatedDocumentId(null);
    setShowSignatureModal(false);
    setShowSuccessStep(false);
    onOpenChange(false); // Fechar o modal principal também
    onSuccess?.();
  };

  const handleContinueToSignature = () => {
    console.log('handleContinueToSignature chamado, documentId:', createdDocumentId);
    // Não fechar o modal principal ainda - o modal de assinatura abrirá por cima
    setShowSignatureModal(true);
  };

  return (
    <>
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
        ) : showSuccessStep ? (
          <div className="space-y-6 py-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Documento Criado com Sucesso!</h3>
                <p className="text-muted-foreground">
                  Documento: <span className="font-medium">{formData.document_name}</span>
                </p>
                <p className="text-muted-foreground">
                  Cliente: <span className="font-medium">{formData.client_name}</span>
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Próximos Passos:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>Posicione sua assinatura no documento</li>
                <li>Preencha seus dados para autenticação</li>
                <li>Confirme com o código enviado por email</li>
                <li>Após sua assinatura, o cliente será notificado</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select
                value={formData.client_email}
                onValueChange={handleClientChange}
                disabled={clients.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    clients.length === 0 
                      ? "Nenhum cliente disponível" 
                      : "Selecione um cliente"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum cliente encontrado
                    </div>
                  ) : (
                    clients.map(client => (
                      <SelectItem key={client.client_email} value={client.client_email}>
                        {client.client_name} ({client.client_email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {clients.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Para enviar documentos, você precisa ter pelo menos um processo cadastrado com um cliente.
                </p>
              )}
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
          {showSuccessStep ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSuccessStep(false);
                  setCreatedDocumentId(null);
                  onOpenChange(false);
                  onSuccess?.();
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleContinueToSignature}
                disabled={!createdDocumentId}
              >
                Seguinte: Assinar Documento
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || loadingClients}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="mr-2 h-4 w-4" />
                Criar Documento
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de assinatura da empresa */}
    {showSignatureModal && createdDocumentId && (
      <InternalSignatureManager
        documentId={createdDocumentId}
        documentName={formData.document_name}
        isStandalone={true}
        onSuccess={handleSignatureComplete}
        onClose={() => {
          setShowSignatureModal(false);
          setCreatedDocumentId(null);
          onSuccess?.();
        }}
      />
    )}
    </>
  );
};
