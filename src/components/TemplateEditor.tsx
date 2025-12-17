import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { formatLegalQualification, LegalData } from "@/utils/legalQualification";

interface Template {
  id: string;
  title: string;
  category: string;
  content: string;
  variables: string[];
  is_global?: boolean;
}

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  processId: string;
  processData?: {
    client_name: string;
    client_email: string;
    cpf_cnpj?: string;
    project_name?: string;
    company_id?: string;
  };
  companyId: string;
  onDocumentCreated: () => void;
}

export const TemplateEditor = ({
  open,
  onOpenChange,
  template,
  processId,
  processData,
  companyId,
  onDocumentCreated
}: TemplateEditorProps) => {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadAndProcessTemplate = async () => {
      if (!template || !processData) return;

      // Use company_id from processData (process context) or fallback to prop
      const effectiveCompanyId = processData.company_id || companyId;

      // Fetch company legal data
      let companyQualification = '[QUALIFICAÇÃO DA EMPRESA NÃO DISPONÍVEL]';
      if (effectiveCompanyId) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', effectiveCompanyId)
          .single();

        if (companyData) {
          const companyLegalData: LegalData = {
            person_type: 'pj',
            company_name: companyData.name,
            cnpj: companyData.cnpj || undefined,
            address: companyData.address || undefined,
            legal_representative_name: companyData.legal_representative_name || undefined,
            legal_representative_cpf: companyData.legal_representative_cpf || undefined,
            email: companyData.email || undefined,
            phone: companyData.phone || undefined
          };
          companyQualification = formatLegalQualification(companyLegalData);
        }
      }

      // Fetch client legal data
      let clientQualification = '[QUALIFICAÇÃO DO CLIENTE NÃO DISPONÍVEL]';
      if (processData.client_email && effectiveCompanyId) {
        const { data: clientLegalData } = await supabase
          .from('client_legal_data')
          .select('*')
          .eq('client_email', processData.client_email)
          .eq('company_id', effectiveCompanyId)
          .maybeSingle();

        if (clientLegalData) {
          if (clientLegalData.person_type === 'pf') {
            const clientData: LegalData = {
              person_type: 'pf',
              client_name: clientLegalData.client_name,
              cpf: clientLegalData.cpf || undefined,
              rg: clientLegalData.rg || undefined,
              nationality: clientLegalData.nationality || undefined,
              marital_status: clientLegalData.marital_status || undefined,
              profession: clientLegalData.profession || undefined,
              address: clientLegalData.address || undefined,
              email: clientLegalData.email || processData.client_email,
              phone: clientLegalData.phone || undefined
            };
            clientQualification = formatLegalQualification(clientData);
          } else {
            const clientData: LegalData = {
              person_type: 'pj',
              company_name: clientLegalData.company_name || clientLegalData.client_name,
              cnpj: clientLegalData.cnpj || undefined,
              address: clientLegalData.address || undefined,
              legal_representative_name: clientLegalData.legal_representative_name || undefined,
              legal_representative_cpf: clientLegalData.legal_representative_cpf || undefined,
              email: clientLegalData.email || processData.client_email,
              phone: clientLegalData.phone || undefined
            };
            clientQualification = formatLegalQualification(clientData);
          }
        } else {
          // Fallback: try to get basic info from clients table
          const { data: clientBasicData } = await supabase
            .from('clients')
            .select('*')
            .eq('email', processData.client_email)
            .eq('company_id', effectiveCompanyId)
            .maybeSingle();

          if (clientBasicData) {
            const address = [
              clientBasicData.address_street,
              clientBasicData.address_number,
              clientBasicData.address_complement,
              clientBasicData.address_neighborhood,
              clientBasicData.address_city,
              clientBasicData.address_state,
              clientBasicData.address_zipcode
            ].filter(Boolean).join(', ');

            const clientData: LegalData = {
              person_type: 'pj',
              company_name: clientBasicData.company_name,
              cnpj: clientBasicData.cnpj || undefined,
              address: address || undefined,
              legal_representative_name: clientBasicData.admin_full_name || undefined,
              legal_representative_cpf: clientBasicData.admin_cpf || undefined,
              email: clientBasicData.email,
              phone: clientBasicData.phone || undefined
            };
            clientQualification = formatLegalQualification(clientData);
          }
        }
      }

      // Replace template variables with actual data
      let processedContent = template.content;
      
      // Replace legal qualification variables (full qualification)
      processedContent = processedContent.replace(/\[QUALIFICACAO_EMPRESA\]/gi, companyQualification);
      processedContent = processedContent.replace(/\[QUALIFICAÇÃO_EMPRESA\]/gi, companyQualification);
      processedContent = processedContent.replace(/\[QUALIFICACAO_CLIENTE\]/gi, clientQualification);
      processedContent = processedContent.replace(/\[QUALIFICAÇÃO_CLIENTE\]/gi, clientQualification);
      
      // Common contract variables - replace with full legal qualification
      processedContent = processedContent.replace(/\[EMPRESA\]/gi, companyQualification);
      processedContent = processedContent.replace(/\[CONTRATANTE\]/gi, companyQualification);
      processedContent = processedContent.replace(/\[OUTORGANTE\]/gi, companyQualification);
      processedContent = processedContent.replace(/\[CONTRATADA\]/gi, clientQualification);
      processedContent = processedContent.replace(/\[CONTRATADO\]/gi, clientQualification);
      processedContent = processedContent.replace(/\[OUTORGADO\]/gi, clientQualification);
      processedContent = processedContent.replace(/\[PARTE_1\]/gi, companyQualification);
      processedContent = processedContent.replace(/\[PARTE_2\]/gi, clientQualification);
      
      // Replace common variables with validation
      processedContent = processedContent.replace(/\[CLIENTE_NOME\]/gi, processData.client_name || '[NOME NÃO INFORMADO]');
      processedContent = processedContent.replace(/\[CLIENTE\]/gi, processData.client_name || '[NOME NÃO INFORMADO]');
      processedContent = processedContent.replace(/\[CLIENTE_EMAIL\]/gi, processData.client_email || '[EMAIL NÃO INFORMADO]');
      processedContent = processedContent.replace(/\[CPF_CNPJ\]/gi, processData.cpf_cnpj || '[CPF/CNPJ NÃO INFORMADO]');
      processedContent = processedContent.replace(/\[PROCESSO_NOME\]/gi, processData.project_name || '[PROCESSO SEM NOME]');
      processedContent = processedContent.replace(/\[DATA_ATUAL\]/gi, new Date().toLocaleDateString('pt-BR'));
      processedContent = processedContent.replace(/\[DATA\]/gi, new Date().toLocaleDateString('pt-BR'));
      
      setContent(processedContent);
      setFileName(`${template.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    };

    loadAndProcessTemplate();
  }, [template, processData, companyId]);

  const handleSaveToProcess = async () => {
    if (!content.trim()) {
      toast.error("O conteúdo não pode estar vazio");
      return;
    }

    if (!fileName.trim()) {
      toast.error("Digite um nome para o arquivo");
      return;
    }

    try {
      setIsSaving(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Convert content to PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      let yPosition = margin;
      const baseFontSize = 11;
      
      doc.setFontSize(baseFontSize);
      
      // Split content into paragraphs
      const paragraphs = content.split('\n');
      
      paragraphs.forEach((paragraph: string) => {
        const trimmed = paragraph.trim();
        
        // Check if new page is needed
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }
        
        if (trimmed) {
          // Split text to fit page width
          const lines = doc.splitTextToSize(trimmed, maxWidth);
          
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - margin - 10) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += 6;
          });
          
          // Add paragraph spacing
          yPosition += 4;
        } else {
          // Empty line
          yPosition += 6;
        }
      });
      
      // Convert PDF to blob
      const pdfBlob = doc.output('blob');
      const pdfFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      const file = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

      // Get process name to include in file path
      const { data: processData } = await supabase
        .from('processes')
        .select('project_name, client_name')
        .eq('id', processId)
        .single();

      const processName = (processData?.project_name || processData?.client_name || 'Processo').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const documentType = (template?.category || 'Documento').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const safeFileName = pdfFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${processId}/${processName}_${documentType}_${safeFileName}`;

      // Upload to Supabase Storage (upsert to allow overwriting existing files)
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      // Get user name for uploaded_by field
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const uploaderName = profile?.full_name || user.email || 'Sistema';

      // Save document record in database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          process_id: processId,
          company_id: companyId,
          file_name: `${processName}_${documentType}_${safeFileName}`,
          file_path: filePath,
          file_type: 'application/pdf',
          file_size: pdfBlob.size,
          document_type: template?.category || 'Documento',
          uploaded_by: uploaderName,
          status: 'Aprovado'
        });

      if (dbError) {
        console.error('Erro ao inserir no banco:', dbError);
        throw dbError;
      }

      toast.success("Documento gerado e anexado com sucesso!");
      onDocumentCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar documento:', error);
      toast.error(error?.message || 'Erro ao salvar documento no processo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Editar Documento - {template?.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileName">Nome do Arquivo</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="nome-do-documento.txt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo do Documento</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Edite o conteúdo do documento aqui..."
              className="min-h-[400px] font-mono text-sm"
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Variáveis disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              <code className="text-xs bg-background px-2 py-1 rounded">[QUALIFICAÇÃO_EMPRESA]</code>
              <code className="text-xs bg-background px-2 py-1 rounded">[QUALIFICAÇÃO_CLIENTE]</code>
              <code className="text-xs bg-background px-2 py-1 rounded">[CLIENTE_NOME]</code>
              <code className="text-xs bg-background px-2 py-1 rounded">[CLIENTE_EMAIL]</code>
              <code className="text-xs bg-background px-2 py-1 rounded">[CPF_CNPJ]</code>
              <code className="text-xs bg-background px-2 py-1 rounded">[PROCESSO_NOME]</code>
              <code className="text-xs bg-background px-2 py-1 rounded">[DATA_ATUAL]</code>
              {template?.variables && template.variables.map((variable) => (
                <code key={variable} className="text-xs bg-background px-2 py-1 rounded">
                  {variable}
                </code>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveToProcess}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Juntar ao Processo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};