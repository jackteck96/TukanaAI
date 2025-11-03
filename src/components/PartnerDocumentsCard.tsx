import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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

export default function PartnerDocumentsCard() {
  const { user } = useAuth();
  const { company } = useCompany();
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any>(null);

  useEffect(() => {
    if (user?.email && company?.id) {
      fetchDocuments();
    }
  }, [user?.email, company?.id]);

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
        .upsert(updateData, {
          onConflict: 'client_email,company_id'
        });

      if (dbError) throw dbError;

      toast.success(`${field.label} enviado com sucesso!`);
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(`Erro ao enviar ${field.label}: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadingField(null);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return '🟢';
      case 'outdated':
        return '🟡';
      case 'pending':
      default:
        return '🔴';
    }
  };

  const areAllRequiredDocumentsUploaded = () => {
    if (!documents) return false;
    const requiredFields = DOCUMENT_FIELDS.filter(f => f.required);
    return requiredFields.every(field => documents[field.pathField]);
  };

  // Se todos documentos obrigatórios foram enviados, não renderizar este card
  if (areAllRequiredDocumentsUploaded()) {
    return null;
  }

  const uploadedCount = DOCUMENT_FIELDS.filter(field => isDocumentUploaded(field)).length;

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <CardTitle>Documentos do Sócio Administrador</CardTitle>
        </div>
        <CardDescription>
          Para agilizar futuros processos, envie os documentos do sócio administrador.
          <Badge variant="outline" className="ml-2">
            {uploadedCount} de {DOCUMENT_FIELDS.length} documentos enviados
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Seus documentos são armazenados de forma segura e criptografada.
            Apenas você e a empresa que solicitou seu cadastro podem visualizá-los.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {DOCUMENT_FIELDS.map((field) => {
            const isUploaded = isDocumentUploaded(field);
            const uploadDate = getUploadDate(field);
            const status = getDocumentStatus(field);

            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="flex items-center gap-2">
                  {getStatusIcon(status)} {field.label}
                  {field.required && <Badge variant="outline" className="text-xs">Obrigatório</Badge>}
                  {isUploaded && status === 'valid' && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </Label>
                
                {isUploaded ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-300">
                            Documento enviado em: {uploadDate}
                          </span>
                        </div>
                      </div>
                    </div>
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
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`${field.key}-update`)?.click()}
                        disabled={loading || uploadingField === field.key}
                      >
                        {uploadingField === field.key ? "Enviando..." : "Atualizar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      id={field.key}
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
                      size="sm"
                      onClick={() => document.getElementById(field.key)?.click()}
                      disabled={loading || uploadingField === field.key}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingField === field.key ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
