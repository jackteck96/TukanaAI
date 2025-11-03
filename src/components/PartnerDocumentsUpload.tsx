import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2 } from "lucide-react";
import PartnerDocumentsManagement from "./PartnerDocumentsManagement";

interface DocumentField {
  key: string;
  pathField: string;
  required: boolean;
}

const REQUIRED_DOCUMENT_FIELDS: DocumentField[] = [
  { key: 'social_contract', pathField: 'social_contract_path', required: true },
  { key: 'rg', pathField: 'rg_path', required: true },
  { key: 'cpf', pathField: 'cpf_path', required: true }
];

export default function PartnerDocumentsUpload() {
  const { user } = useAuth();
  const { company } = useCompany();
  const [documents, setDocuments] = useState<any>(null);
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  useEffect(() => {
    if (user?.email && company?.id) {
      fetchDocuments();
    }
  }, [user?.email, company?.id, isManagementOpen]);

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

  const areAllRequiredDocumentsUploaded = () => {
    if (!documents) return false;
    return REQUIRED_DOCUMENT_FIELDS.every(field => documents[field.pathField]);
  };

  const hasAnyDocument = () => {
    if (!documents) return false;
    return REQUIRED_DOCUMENT_FIELDS.some(field => documents[field.pathField]);
  };

  // Se todos os documentos obrigatórios foram enviados, mostrar apenas botão
  if (areAllRequiredDocumentsUploaded()) {
    return (
      <>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-auto py-4 text-left"
          onClick={() => setIsManagementOpen(true)}
        >
          <div className="flex items-center gap-2 flex-1">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">📄 Atualizar documentos do sócio administrador</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os documentos obrigatórios foram enviados
              </p>
            </div>
          </div>
        </Button>
        
        <PartnerDocumentsManagement 
          open={isManagementOpen}
          onOpenChange={setIsManagementOpen}
        />
      </>
    );
  }

  // Se ainda há documentos pendentes, não mostrar nada (será exibido em outro lugar)
  return null;
}
