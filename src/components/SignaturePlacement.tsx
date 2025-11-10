import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

interface SignaturePlacementProps {
  documentId: string;
  onChange?: (pos: { x: number; y: number } | null) => void;
  value?: { x: number; y: number } | null;
}

const SignaturePlacement: React.FC<SignaturePlacementProps> = ({ documentId, onChange, value }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    loadAndRenderPdf();
  }, [documentId]);

  const loadAndRenderPdf = async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar documento
      const { data: docData } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (!docData?.file_path) {
        setError('Documento não encontrado');
        return;
      }

      // Buscar URL assinada do storage
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(docData.file_path, 3600);

      if (!urlData?.signedUrl) {
        setError('Erro ao carregar documento');
        return;
      }

      // Baixar PDF
      const response = await fetch(urlData.signedUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Renderizar primeira página do PDF
      const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setPdfDimensions({ width: viewport.width, height: viewport.height });

      const renderContext = { canvasContext: context, viewport };
      await page.render(renderContext as any).promise;

      setLoading(false);
    } catch (e: any) {
      console.error('[SignaturePlacement] erro ao carregar PDF:', e);
      setError('Falha ao carregar o documento');
      setLoading(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onChange?.({ 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    });
  };

  const handleClear = () => {
    onChange?.(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Clique no documento onde deseja posicionar a assinatura
        </p>
        {value && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            <X className="h-4 w-4 mr-2" />
            Limpar seleção
          </Button>
        )}
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[60vh] overflow-auto border border-border rounded-lg bg-muted/30"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Carregando documento...
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="cursor-crosshair mx-auto block"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            
            {/* Preview da caixa de assinatura */}
            {value && pdfDimensions.width > 0 && (
              <div
                className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
                style={{
                  left: `${value.x}%`,
                  top: `${value.y}%`,
                  width: '200px',
                  height: '50px',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary">
                  Assinatura aqui
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SignaturePlacement;
