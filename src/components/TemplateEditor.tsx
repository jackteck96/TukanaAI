import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    if (template && processData) {
      // Replace template variables with actual data
      let processedContent = template.content;
      
      // Replace common variables
      processedContent = processedContent.replace(/\[CLIENTE_NOME\]/g, processData.client_name || '');
      processedContent = processedContent.replace(/\[CLIENTE_EMAIL\]/g, processData.client_email || '');
      processedContent = processedContent.replace(/\[CPF_CNPJ\]/g, processData.cpf_cnpj || '');
      processedContent = processedContent.replace(/\[PROCESSO_NOME\]/g, processData.project_name || '');
      processedContent = processedContent.replace(/\[DATA_ATUAL\]/g, new Date().toLocaleDateString('pt-BR'));
      
      setContent(processedContent);
      setFileName(`${template.title}.txt`);
    }
  }, [template, processData]);

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

      // Create a blob from the content
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], fileName, { type: 'text/plain' });

      // Generate unique file path
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${processId}/${timestamp}-${safeFileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document record in database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          process_id: processId,
          company_id: companyId,
          file_name: fileName,
          file_path: filePath,
          file_type: 'text/plain',
          file_size: blob.size,
          document_type: template?.category || 'Documento',
          uploaded_by: 'Sistema',
          status: 'Aprovado'
        });

      if (dbError) throw dbError;

      toast.success("Documento gerado e anexado com sucesso!");
      onDocumentCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast.error('Erro ao salvar documento no processo');
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

          {template?.variables && template.variables.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm font-medium mb-2">Variáveis disponíveis:</p>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((variable) => (
                  <code key={variable} className="text-xs bg-background px-2 py-1 rounded">
                    {variable}
                  </code>
                ))}
              </div>
            </div>
          )}
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