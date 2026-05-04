import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Upload, FileText, Loader2, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import DocumentPreviewModal from './DocumentPreviewModal';
import { updateProcessProgress } from '@/utils/processProgressUpdater';
import { ensureCanAdd } from '@/lib/planLimits';

interface DocumentType {
  id: string;
  name: string;
  has_issue_date?: boolean;
  has_expiration_date?: boolean;
  requires_issuing_location?: boolean;
}

interface DocumentUploadProps {
  processId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ processId, open, onOpenChange, onUploadComplete }: DocumentUploadProps) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [issueDate, setIssueDate] = useState<Date | undefined>(undefined);

  // Limpar estados de preview quando o modal principal é fechado
  useEffect(() => {
    if (!open) {
      setShowPreviewModal(false);
      setPreviewDocument(null);
    }
  }, [open]);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
  const [issuingLocation, setIssuingLocation] = useState('');
  const [processCompanyId, setProcessCompanyId] = useState<string | null>(null);

  // Buscar company_id do processo
  useEffect(() => {
    const fetchProcessCompanyId = async () => {
      if (!processId) return;
      
      try {
        const { data, error } = await supabase
          .from('processes')
          .select('company_id')
          .eq('id', processId)
          .single();
        
        if (error) throw error;
        setProcessCompanyId(data?.company_id || null);
      } catch (error) {
        console.error('Erro ao buscar company_id do processo:', error);
      }
    };

    fetchProcessCompanyId();
  }, [processId]);

  // Buscar tipos de documentos cadastrados pela empresa
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      setLoadingTypes(true);
      try {
        // Usar company do contexto OU processCompanyId (para clientes)
        const companyId = company?.id || processCompanyId;
        
        const [{ data: companyData, error: companyError }, { data: globalData, error: globalError }] = await Promise.all([
          companyId
            ? supabase
                .from('document_types')
                .select('id, name, has_issue_date, has_expiration_date, requires_issuing_location')
                .eq('company_id', companyId)
                .order('name')
            : Promise.resolve({ data: [], error: null } as any),
          supabase
            .from('global_document_types')
            .select('id, name, has_issue_date, has_expiration_date, requires_issuing_location')
            .order('name')
        ]);

        if (companyError) throw companyError;
        if (globalError) throw globalError;
        
        const combined = [
          ...((companyData as any[]) || []),
          ...((globalData as any[]) || [])
        ];

        // Deduplicar por nome (prioriza tipos da empresa)
        const uniqueByName = Array.from(new Map(combined.map((d: any) => [d.name, d])).values());

        console.info('[DocumentUpload] Tipos de documentos (empresa + globais):', uniqueByName);
        setDocumentTypes(uniqueByName);

      } catch (error) {
        console.error('Erro ao carregar tipos de documentos:', error);
        toast.error('Erro ao carregar tipos de documentos');
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchDocumentTypes();
  }, [company?.id, processCompanyId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Verificar se é PDF
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Apenas arquivos PDF são permitidos');
        event.target.value = ''; // Limpar o input
        return;
      }
      setFile(selectedFile);
    }
  };

  const selectedDocType = documentTypes.find(dt => dt.name === documentType);

  const handleUpload = async () => {
    if (!file || !documentType || !uploaderName) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    // Validar campos obrigatórios baseado no tipo de documento
    if (selectedDocType?.has_issue_date && !issueDate) {
      toast.error('Por favor, informe a data de emissão');
      return;
    }
    if (selectedDocType?.has_expiration_date && !expirationDate) {
      toast.error('Por favor, informe a data de validade');
      return;
    }
    if (selectedDocType?.requires_issuing_location && !issuingLocation.trim()) {
      toast.error('Por favor, informe o local de emissão');
      return;
    }

    setIsUploading(true);

    try {
      // Renomear o arquivo com o tipo do documento
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const sanitizedDocumentType = documentType.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const newFileName = `${sanitizedDocumentType}_${timestamp}.${fileExtension}`;
      const filePath = `${processId}/${newFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Buscar informações do processo para determinar quem está enviando
      const { data: processData } = await supabase
        .from('processes')
        .select('client_email, company_id')
        .eq('id', processId)
        .single();

      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userData.user?.id || '')
        .single();

      // Determinar status de assinatura baseado em quem está enviando
      // Se requer assinatura, quem envia deve assinar primeiro
      let signatureStatus = 'not_required';
      if (requiresSignature && processData && profile) {
        const isClient = profile.email === processData.client_email;
        // Quem envia assina primeiro: cliente envia → pending_client, empresa envia → pending_company
        signatureStatus = isClient ? 'pending_client' : 'pending_company';
      }

      // Salvar informações do documento na tabela
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          process_id: processId,
          company_id: company?.id,
          file_name: newFileName,
          file_path: uploadData.path,
          file_type: file.type,
          file_size: file.size,
          document_type: documentType,
          uploaded_by: uploaderName,
          requires_signature: requiresSignature,
          signature_status: signatureStatus,
          issue_date: issueDate ? issueDate.toISOString().split('T')[0] : null,
          expiration_date: expirationDate ? expirationDate.toISOString().split('T')[0] : null,
          issuing_location: issuingLocation.trim() || null
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Sucesso! Mostrar feedback imediato e fechar modal
      toast.success('Documento enviado com sucesso!');
      
      // Limpar formulário imediatamente
      setFile(null);
      setDocumentType('');
      setUploaderName('');
      setRequiresSignature(false);
      setIssueDate(undefined);
      setExpirationDate(undefined);
      setIssuingLocation('');
      
      // Fechar modal principal
      onOpenChange(false);
      
      // Callback para atualizar a interface pai
      onUploadComplete?.();

      // === Operações em background (não bloqueiam UI) ===
      
      // Se requer assinatura, abrir modal de assinatura
      if (requiresSignature && docData) {
        setTimeout(() => {
          setPreviewDocument({
            id: docData.id,
            file_name: docData.file_name,
            file_path: docData.file_path,
            file_type: docData.file_type
          });
          setShowPreviewModal(true);
        }, 100);
      }

      // Executar operações não-críticas em paralelo sem bloquear
      Promise.allSettled([
        // Gerar relatório
        Promise.resolve(supabase.rpc('generate_document_report', { process_uuid: processId }))
          .then(() => console.log('[DocumentUpload] Relatório gerado'))
          .catch(e => console.warn('[DocumentUpload] Erro ao gerar relatório:', e)),
        
        // Atualizar progresso
        updateProcessProgress(processId)
          .then(() => console.log('[DocumentUpload] Progresso atualizado'))
          .catch(e => console.warn('[DocumentUpload] Erro ao atualizar progresso:', e)),
        
        // Enviar notificação se requer assinatura
        requiresSignature && docData ? supabase.functions.invoke('send-document-notification', {
          body: {
            documentId: docData.id,
            processId: processId,
            documentName: docData.file_name,
            senderType: profile?.email === processData?.client_email ? 'client' : 'company',
            requiresSignature: true
          }
        }).then(() => console.log('[DocumentUpload] Notificação enviada'))
          .catch(e => console.warn('[DocumentUpload] Erro ao enviar notificação:', e))
        : Promise.resolve()
      ]);

    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar documento. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enviar Documento
            </DialogTitle>
            <DialogDescription>
              Faça o upload dos documentos necessários para o processo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="uploader">Seu Nome</Label>
              <Input
                id="uploader"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>

            <div>
              <Label htmlFor="document-type">Tipo de Documento</Label>
              <Select value={documentType} onValueChange={setDocumentType} disabled={loadingTypes}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={loadingTypes ? "Carregando..." : "Selecione o tipo"} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50" position="popper">
                  {loadingTypes ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Carregando tipos...
                    </div>
                  ) : documentTypes.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Nenhum tipo cadastrado. Cadastre tipos em "Tipos de Documentos"
                    </div>
                  ) : (
                    documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,application/pdf"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Apenas arquivos PDF são permitidos
              </p>
              {file && (
                <p className="text-sm text-muted-foreground mt-1">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Campos condicionais baseados no tipo de documento */}
            {selectedDocType?.has_issue_date && (
              <div>
                <Label htmlFor="issue-date">Data de Emissão *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !issueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {issueDate ? format(issueDate, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={issueDate}
                      onSelect={setIssueDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {selectedDocType?.has_expiration_date && (
              <div>
                <Label htmlFor="expiration-date">Data de Validade *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expirationDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expirationDate ? format(expirationDate, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expirationDate}
                      onSelect={setExpirationDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {selectedDocType?.requires_issuing_location && (
              <div>
                <Label htmlFor="issuing-location">Local de Emissão *</Label>
                <Input
                  id="issuing-location"
                  value={issuingLocation}
                  onChange={(e) => setIssuingLocation(e.target.value)}
                  placeholder="Digite o local de emissão"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresSignature"
                checked={requiresSignature}
                onCheckedChange={(checked) => setRequiresSignature(checked as boolean)}
              />
              <Label
                htmlFor="requiresSignature"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Requer assinatura
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || !documentType || !uploaderName || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Documento
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {previewDocument && (
        <DocumentPreviewModal
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          document={previewDocument}
          onDownload={() => {}}
          onApprove={() => {}}
          onReject={() => {}}
          onRequestAdjustment={() => {}}
        />
      )}
    </>
  );
}