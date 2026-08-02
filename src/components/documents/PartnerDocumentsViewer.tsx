import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PartnerDocumentsViewerProps {
  clientEmail: string;
  companyId: string;
}

interface DocumentField {
  key: 'social_contract' | 'rg' | 'cpf' | 'address_proof';
  label: string;
  pathField: string;
  dateField: string;
}

const DOCUMENT_FIELDS: DocumentField[] = [
  {
    key: 'social_contract',
    label: 'Contrato Social',
    pathField: 'social_contract_path',
    dateField: 'social_contract_uploaded_at'
  },
  {
    key: 'rg',
    label: 'RG',
    pathField: 'rg_path',
    dateField: 'rg_uploaded_at'
  },
  {
    key: 'cpf',
    label: 'CPF',
    pathField: 'cpf_path',
    dateField: 'cpf_uploaded_at'
  },
  {
    key: 'address_proof',
    label: 'Comprovante de Residência',
    pathField: 'address_proof_path',
    dateField: 'address_proof_uploaded_at'
  }
];

export default function PartnerDocumentsViewer({ clientEmail, companyId }: PartnerDocumentsViewerProps) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [clientEmail, companyId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_documents')
        .select('*')
        .eq('client_email', clientEmail)
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setDocuments(data);
    } catch (error) {
      console.error('Error fetching partner documents:', error);
      toast.error('Erro ao carregar documentos do sócio');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (field: DocumentField) => {
    if (!documents || !documents[field.pathField]) return;

    setDownloading(field.key);
    try {
      const { data, error } = await supabase.storage
        .from('partner-documents')
        .download(documents[field.pathField]);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${field.label}_${clientEmail}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${field.label} baixado com sucesso!`);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error(`Erro ao baixar ${field.label}: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const isDocumentUploaded = (field: DocumentField) => {
    return documents && documents[field.pathField];
  };

  const getUploadDate = (field: DocumentField) => {
    if (!documents || !documents[field.dateField]) return null;
    return new Date(documents[field.dateField]).toLocaleDateString('pt-BR');
  };

  const hasAnyDocument = DOCUMENT_FIELDS.some(field => isDocumentUploaded(field));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos do Sócio Administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando documentos...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyDocument) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos do Sócio Administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Este cliente ainda não enviou os documentos do sócio administrador.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos do Sócio Administrador
        </CardTitle>
        <CardDescription>
          Documentos enviados pelo cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DOCUMENT_FIELDS.map((field) => {
          const isUploaded = isDocumentUploaded(field);
          const uploadDate = getUploadDate(field);

          if (!isUploaded) return null;

          return (
            <div key={field.key} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">{field.label}</p>
                  {uploadDate && (
                    <p className="text-sm text-muted-foreground">
                      Enviado em: {uploadDate}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(field)}
                disabled={downloading === field.key}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === field.key ? 'Baixando...' : 'Baixar'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
