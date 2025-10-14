import { useState } from 'react';
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

interface DocumentUploadProps {
  processId: string;
  onUploadComplete?: () => void;
}

const documentTypes = [
  'RG',
  'CPF',
  'Comprovante de Residência',
  'Certidão de Nascimento',
  'Certidão de Casamento',
  'Procuração',
  'Contrato',
  'Laudo Médico',
  'Receita Médica',
  'Exame Médico',
  'Outros'
];

export default function DocumentUpload({ processId, onUploadComplete }: DocumentUploadProps) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

      // Salvar informações do documento na tabela
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          process_id: processId,
          company_id: company?.id,
          file_name: newFileName,
          file_path: uploadData.path,
          file_type: file.type,
          file_size: file.size,
          document_type: documentType,
          uploaded_by: uploaderName
        });

      if (dbError) {
        throw dbError;
      }

      // Gerar relatório atualizado
      await supabase.rpc('generate_document_report', { 
        process_uuid: processId 
      });

      toast.success('Documento enviado com sucesso!');
      
      // Limpar formulário
      setFile(null);
      setDocumentType('');
      setUploaderName('');
      
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
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
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