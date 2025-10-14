import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, Check, X, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PreviewDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
}

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PreviewDocument;
  onApprove: (documentId: string) => void;
  onReject: (documentId: string, documentName: string) => void;
  onRequestAdjustment: (documentId: string, documentName: string) => void;
  onDownload: (filePath: string, fileName: string) => void;
}

const DocumentPreviewModal = ({
  open,
  onOpenChange,
  document,
  onApprove,
  onReject,
  onRequestAdjustment,
  onDownload,
}: DocumentPreviewModalProps) => {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let createdUrl: string | null = null;

    const load = async () => {
      if (!open) return;
      setError(null);
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .download(document.file_path);

        if (error) throw error;
        if (!data) throw new Error('Arquivo não encontrado');

        createdUrl = URL.createObjectURL(data);
        setViewerUrl(createdUrl);
      } catch (e: any) {
        console.error('[DocumentPreviewModal] Erro ao carregar documento:', e);
        setError('Não foi possível carregar o documento.');
        setViewerUrl(null);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, document.file_path]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.file_name}
          </DialogTitle>
          <DialogDescription>
            Visualize o documento, baixe ou aprove/recuse com comentários.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-4">
          <div className="rounded-md border bg-muted/30 min-h-[70vh]">
            {loading ? (
              <div className="h-[70vh] flex items-center justify-center text-muted-foreground">
                Carregando documento…
              </div>
            ) : viewerUrl ? (
              <object
                data={viewerUrl}
                type="application/pdf"
                className="w-full h-[70vh]"
              >
                <div className="h-full w-full flex items-center justify-center text-muted-foreground p-6 text-center">
                  <div>
                    <p>Não foi possível exibir o documento dentro da página.</p>
                    <a
                      href={viewerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Abrir em nova aba
                    </a>
                  </div>
                </div>
              </object>
            ) : (
              <div className="h-[70vh] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{error ?? 'Documento não disponível para visualização'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onDownload(document.file_path, document.file_name)}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => onApprove(document.id)}
              >
                <Check className="h-4 w-4 mr-2" /> Aprovar
              </Button>
              <Button
                variant="destructive"
                onClick={() => onReject(document.id, document.file_name)}
              >
                <X className="h-4 w-4 mr-2" /> Rejeitar
              </Button>
              <Button
                variant="outline"
                onClick={() => onRequestAdjustment(document.id, document.file_name)}
              >
                <MessageSquare className="h-4 w-4 mr-2" /> Solicitar ajuste
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;
