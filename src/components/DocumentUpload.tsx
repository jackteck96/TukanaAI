import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Checkbox } from '@/components/ui/checkbox';

interface DocumentUploadProps {
  processId: string;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ processId, onUploadComplete }: DocumentUploadProps) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Buscar tipos de documentos cadastrados pela empresa
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      setLoadingTypes(true);
      try {
        const [{ data: companyData, error: companyError }, { data: globalData, error: globalError }] = await Promise.all([
          company?.id
            ? supabase
                .from('document_types')
                .select('id, name')
                .eq('company_id', company.id)
                .order('name')
            : Promise.resolve({ data: [], error: null } as any),
          supabase
            .from('global_document_types')
            .select('id, name')
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
  }, [company?.id]);

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

  const handleUpload = async () => {
    if (!file || !documentType || !uploaderName) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsUploading(true);

    try {
      // Gerar nome do arquivo baseado no tipo de documento
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
          signature_status: signatureStatus
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Gerar relatório atualizado
      await supabase.rpc('generate_document_report', { 
        process_uuid: processId 
      });

      // Se requer assinatura, apenas criar notificação interna informando que o documento aguarda assinatura do remetente
      if (requiresSignature && processData && docData) {
        const isClient = profile?.email === processData.client_email;
        const senderName = isClient ? 'Cliente' : 'Empresa';
        
        toast.info(`Documento enviado! ${senderName} deve assinar primeiro antes de enviar para a outra parte.`);
      }

      toast.success('Documento enviado com sucesso!');
      
      // Limpar formulário
      setFile(null);
      setDocumentType('');
      setUploaderName('');
      setRequiresSignature(false);
      
      // Callback para atualizar a interface pai
      onUploadComplete?.();

    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar documento. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Enviar Documento
        </CardTitle>
        <CardDescription>
          Faça o upload dos documentos necessários para o processo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <Button 
          onClick={handleUpload} 
          disabled={!file || !documentType || !uploaderName || isUploading}
          className="w-full"
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
      </CardContent>
    </Card>
  );
}