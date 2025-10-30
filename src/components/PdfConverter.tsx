import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, Eye, Send, Shield } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Process {
  id: string;
  project_name: string;
  client_name: string;
}

export const PdfConverter = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [convertedPdf, setConvertedPdf] = useState<Blob | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setConvertedPdf(null);
      setPreviewUrl("");
      setSelectedProcess("");
    }
  };

  const convertImageToPdf = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const pdf = new jsPDF({
              orientation: img.width > img.height ? 'landscape' : 'portrait',
              unit: 'px',
              format: [img.width, img.height]
            });
            
            pdf.addImage(img.src, 'JPEG', 0, 0, img.width, img.height);
            const pdfBlob = pdf.output('blob');
            resolve(pdfBlob);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const convertTextToPdf = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const pdf = new jsPDF();
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 20;
          const maxWidth = pageWidth - 2 * margin;
          
          const lines = pdf.splitTextToSize(text, maxWidth);
          let y = margin;
          
          lines.forEach((line: string) => {
            if (y > pageHeight - margin) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(line, margin, y);
            y += 7;
          });
          
          const pdfBlob = pdf.output('blob');
          resolve(pdfBlob);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleConvert = async () => {
    if (!file) {
      toast.error("Por favor, selecione um arquivo");
      return;
    }

    setIsConverting(true);

    try {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      let pdfBlob: Blob;

      if (fileType.includes('image') && (fileType.includes('jpeg') || fileType.includes('jpg') || fileType.includes('png'))) {
        pdfBlob = await convertImageToPdf(file);
        toast.success("Imagem convertida para PDF com sucesso!");
      } else if (fileType.includes('text/plain')) {
        pdfBlob = await convertTextToPdf(file);
        toast.success("Texto convertido para PDF com sucesso!");
      } else {
        toast.error("Formato não suportado para conversão local. Formatos suportados: JPG, PNG, TXT");
        setIsConverting(false);
        return;
      }

      setConvertedPdf(pdfBlob);
      setConvertedFileName(`${fileName} (PDF).pdf`);
      
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);

      await fetchProcesses();
    } catch (error) {
      console.error("Erro na conversão:", error);
      toast.error("Erro ao converter arquivo para PDF");
    } finally {
      setIsConverting(false);
    }
  };

  const fetchProcesses = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('processes')
        .select('id, project_name, client_name')
        .order('created_at', { ascending: false })
        .limit(50);

      if (profile?.role === 'client') {
        query = query.eq('client_email', user.email);
      } else if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProcesses(data || []);
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
    }
  };

  const handleDownload = () => {
    if (!convertedPdf || !convertedFileName) return;

    const url = URL.createObjectURL(convertedPdf);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Download iniciado!");
  };

  const handleSendToProcess = async () => {
    if (!selectedProcess || !convertedPdf || !convertedFileName) {
      toast.error("Selecione um processo");
      return;
    }

    setIsSending(true);

    try {
      const { data: processData } = await supabase
        .from('processes')
        .select('client_email, company_id')
        .eq('id', selectedProcess)
        .single();

      if (!processData?.client_email) {
        throw new Error("Processo não encontrado");
      }

      // Obter ou criar um document_request padrão para o processo
      let { data: existingRequest } = await supabase
        .from('document_requests')
        .select('id')
        .eq('process_id', selectedProcess)
        .eq('document_name', 'Documento Convertido')
        .maybeSingle();

      let documentRequestId = existingRequest?.id;

      if (!documentRequestId) {
        const { data: newRequest, error: requestError } = await supabase
          .from('document_requests')
          .insert({
            process_id: selectedProcess,
            document_name: 'Documento Convertido',
            instructions: 'Documento convertido para PDF pela ferramenta da plataforma',
            required: false,
            company_id: processData.company_id
          })
          .select('id')
          .single();

        if (requestError) throw requestError;
        documentRequestId = newRequest.id;
      }

      const filePath = `${processData.client_email}/${selectedProcess}/${Date.now()}_${convertedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, convertedPdf);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('document_uploads')
        .insert({
          process_id: selectedProcess,
          document_request_id: documentRequestId,
          company_id: processData.company_id,
          client_email: processData.client_email,
          file_path: filePath,
          file_type: 'application/pdf',
          file_size: convertedPdf.size,
          status: 'enviado'
        });

      if (insertError) throw insertError;

      toast.success("PDF enviado para o processo com sucesso!");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao enviar PDF:", error);
      toast.error("Erro ao enviar PDF para o processo");
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setConvertedPdf(null);
    setConvertedFileName("");
    setPreviewUrl("");
    setSelectedProcess("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="hero" 
          className="h-20 flex-col shadow-elegant hover:shadow-glow transition-all duration-300"
        >
          <FileText className="h-6 w-6 mb-2" />
          <span className="text-xs font-semibold">Converter para PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Converter para PDF
          </DialogTitle>
        </DialogHeader>

        <Alert className="border-primary/20 bg-primary/5">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            A conversão é segura e feita internamente pela Fuzen. Nenhum arquivo é enviado para serviços externos.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecione o arquivo para converter
            </label>
            <Input
              type="file"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.txt"
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Formatos suportados: JPG, PNG, TXT
            </p>
          </div>

          {file && !convertedPdf && (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleConvert} 
                disabled={isConverting}
                variant="gradient"
              >
                {isConverting ? "Convertendo..." : "Converter"}
              </Button>
            </div>
          )}

          {convertedPdf && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">{convertedFileName}</p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      PDF convertido com sucesso
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(previewUrl, '_blank')}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enviar para processo (opcional)
                </label>
                <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {processes.map((process) => (
                      <SelectItem key={process.id} value={process.id}>
                        {process.project_name} - {process.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedProcess && (
                  <Button
                    onClick={handleSendToProcess}
                    disabled={isSending}
                    className="w-full mt-3"
                    variant="hero"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? "Enviando..." : "Enviar para Processo"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
