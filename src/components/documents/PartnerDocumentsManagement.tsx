import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  History,
  Eye,
  Download
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentField {
  key: 'social_contract' | 'rg' | 'cpf' | 'address_proof';
  label: string;
  pathField: string;
  dateField: string;
  statusField: string;
  accept: string;
  required: boolean;
}

const DOCUMENT_FIELDS: DocumentField[] = [
  {
    key: 'social_contract',
    label: 'Contrato Social',
    pathField: 'social_contract_path',
    dateField: 'social_contract_uploaded_at',
    statusField: 'social_contract_status',
    accept: '.pdf',
    required: true
  },
  {
    key: 'rg',
    label: 'RG',
    pathField: 'rg_path',
    dateField: 'rg_uploaded_at',
    statusField: 'rg_status',
    accept: '.pdf,.jpg,.jpeg,.png',
    required: true
  },
  {
    key: 'cpf',
    label: 'CPF',
    pathField: 'cpf_path',
    dateField: 'cpf_uploaded_at',
    statusField: 'cpf_status',
    accept: '.pdf,.jpg,.jpeg,.png',
    required: true
  },
  {
    key: 'address_proof',
    label: 'Comprovante de Residência',
    pathField: 'address_proof_path',
    dateField: 'address_proof_uploaded_at',
    statusField: 'address_proof_status',
    accept: '.pdf,.jpg,.jpeg,.png',
    required: false
  }
];

interface PartnerDocumentsManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PartnerDocumentsManagement({ 
  open, 
  onOpenChange 
}: PartnerDocumentsManagementProps) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (open && user?.email && company?.id) {
      fetchDocuments();
      fetchHistory();
    }
  }, [open, user?.email, company?.id]);

  const fetchDocuments = async () => {
    if (!user?.email || !company?.id) return;

    try {
      const { data, error } = await supabase
        .from('partner_documents')
        .select('*')
        .eq('client_email', user.email)
        .eq('company_id', company.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setDocuments(data);
    } catch (error) {
      console.error('Error fetching partner documents:', error);
    }
  };

  const fetchHistory = async () => {
    if (!user?.email || !company?.id) return;

    try {
      // First get the partner document id
      const { data: docData } = await supabase
        .from('partner_documents')
        .select('id')
        .eq('client_email', user.email)
        .eq('company_id', company.id)
        .maybeSingle();

      if (!docData) return;

      const { data, error } = await supabase
        .from('partner_documents_history')
        .select('*')
        .eq('partner_document_id', docData.id)
        .order('replaced_at', { ascending: false });

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleFileUpload = async (field: DocumentField, file: File) => {
    if (!user?.email || !company?.id) {
      toast.error('Erro ao identificar usuário ou empresa');
      return;
    }

    setUploadingField(field.key);
    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.email}/${field.key}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('partner-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const updateData = {
        client_email: user.email,
        company_id: company.id,
        [field.pathField]: fileName,
        [field.dateField]: new Date().toISOString(),
        [field.statusField]: 'valid'
      };

      const { error: dbError } = await supabase
        .from('partner_documents')
        .upsert(updateData as any, {
          onConflict: 'client_email,company_id'
        });

      if (dbError) throw dbError;

      toast.success(`${field.label} atualizado com sucesso!`);
      await fetchDocuments();
      await fetchHistory();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(`Erro ao enviar ${field.label}: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadingField(null);
    }
  };

  const handleDownload = async (filePath: string, documentName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('partner-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'outdated':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending':
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">🟢 Válido</Badge>;
      case 'outdated':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">🟡 Desatualizado</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">🔴 Pendente</Badge>;
    }
  };

  const isDocumentUploaded = (field: DocumentField) => {
    return documents && documents[field.pathField];
  };

  const getUploadDate = (field: DocumentField) => {
    if (!documents || !documents[field.dateField]) return null;
    return new Date(documents[field.dateField]).toLocaleDateString('pt-BR');
  };

  const getDocumentStatus = (field: DocumentField) => {
    return documents?.[field.statusField] || 'pending';
  };

  const getHistoryForDocument = (documentType: string) => {
    return history.filter(h => h.document_type === documentType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos do Sócio Administrador
          </DialogTitle>
          <DialogDescription>
            Gerencie os documentos do sócio administrador da empresa
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="current" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Documentos Atuais</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="flex-1 overflow-auto">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seus documentos são armazenados de forma segura e criptografada.
                    Apenas você e a empresa que solicitou seu cadastro podem visualizá-los.
                  </AlertDescription>
                </Alert>

                {DOCUMENT_FIELDS.map((field) => {
                  const isUploaded = isDocumentUploaded(field);
                  const uploadDate = getUploadDate(field);
                  const status = getDocumentStatus(field);
                  const documentHistory = getHistoryForDocument(field.key);

                  return (
                    <Card key={field.key}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{field.label}</CardTitle>
                            {field.required && <Badge variant="outline">Obrigatório</Badge>}
                          </div>
                          {isUploaded && getStatusBadge(status)}
                        </div>
                        {uploadDate && (
                          <CardDescription>
                            Enviado em: {uploadDate}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {isUploaded && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(documents[field.pathField], `${field.label}.pdf`)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </Button>
                            {documentHistory.length > 0 && (
                              <Badge variant="secondary">
                                {documentHistory.length} {documentHistory.length === 1 ? 'versão anterior' : 'versões anteriores'}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Input
                            id={`${field.key}-update`}
                            type="file"
                            accept={field.accept}
                            disabled={loading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(field, file);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            variant={isUploaded ? "outline" : "default"}
                            size="sm"
                            onClick={() => document.getElementById(`${field.key}-update`)?.click()}
                            disabled={loading || uploadingField === field.key}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingField === field.key 
                              ? "Enviando..." 
                              : isUploaded ? "Atualizar" : "Enviar"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-auto">
            <ScrollArea className="h-[500px] pr-4">
              {history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhum histórico encontrado</p>
                  <p className="text-sm">Documentos substituídos aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => {
                    const field = DOCUMENT_FIELDS.find(f => f.key === item.document_type);
                    return (
                      <Card key={item.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{field?.label || item.document_type}</span>
                                <Badge variant="outline">Substituído</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Enviado em: {new Date(item.uploaded_at).toLocaleDateString('pt-BR')}</p>
                                <p>Substituído em: {new Date(item.replaced_at).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(item.file_path, `${field?.label}_antigo.pdf`)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
