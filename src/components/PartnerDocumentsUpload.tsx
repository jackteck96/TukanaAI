import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DocumentField {
  key: 'social_contract' | 'rg' | 'cpf' | 'address_proof';
  label: string;
  pathField: string;
  dateField: string;
  accept: string;
}

const DOCUMENT_FIELDS: DocumentField[] = [
  {
    key: 'social_contract',
    label: 'Contrato Social',
    pathField: 'social_contract_path',
    dateField: 'social_contract_uploaded_at',
    accept: '.pdf'
  },
  {
    key: 'rg',
    label: 'RG',
    pathField: 'rg_path',
    dateField: 'rg_uploaded_at',
    accept: '.pdf,.jpg,.jpeg,.png'
  },
  {
    key: 'cpf',
    label: 'CPF',
    pathField: 'cpf_path',
    dateField: 'cpf_uploaded_at',
    accept: '.pdf,.jpg,.jpeg,.png'
  },
  {
    key: 'address_proof',
    label: 'Comprovante de Residência',
    pathField: 'address_proof_path',
    dateField: 'address_proof_uploaded_at',
    accept: '.pdf,.jpg,.jpeg,.png'
  }
];

export default function PartnerDocumentsUpload() {
  const { user } = useAuth();
  const { company } = useCompany();
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(true);

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
        .single();

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
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.email}/${field.key}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('partner-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Update or insert database record
      const updateData = {
        client_email: user.email,
        company_id: company.id,
        [field.pathField]: fileName,
        [field.dateField]: new Date().toISOString()
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

  const areAllDocumentsUploaded = () => {
    return DOCUMENT_FIELDS.every(field => isDocumentUploaded(field));
  };

  const uploadedCount = DOCUMENT_FIELDS.filter(field => isDocumentUploaded(field)).length;

  // Auto-colapsar quando todos os documentos foram enviados
  useEffect(() => {
    if (areAllDocumentsUploaded()) {
      setIsOpen(false);
    }
  }, [documents]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos do Sócio Administrador
                {areAllDocumentsUploaded() && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </CardTitle>
              <CardDescription>
                {areAllDocumentsUploaded() 
                  ? `Todos os documentos enviados! Clique para visualizar ou atualizar.`
                  : `${uploadedCount} de ${DOCUMENT_FIELDS.length} documentos enviados`
                }
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            O envio desses documentos é opcional, mas recomendado para agilizar processos futuros.
            Seus documentos são armazenados de forma segura e apenas a empresa que solicitou seu cadastro pode visualizá-los.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {DOCUMENT_FIELDS.map((field) => {
            const isUploaded = isDocumentUploaded(field);
            const uploadDate = getUploadDate(field);

            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="flex items-center gap-2">
                  {field.label}
                  {isUploaded && (
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
                    {uploadingField === field.key && (
                      <span className="text-sm text-muted-foreground">Enviando...</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
