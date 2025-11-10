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
  isStandalone?: boolean;
}

const SignaturePlacement: React.FC<SignaturePlacementProps> = ({ documentId, onChange, value, isStandalone = false }) => {
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
      // Buscar documento da tabela correta
      let filePath: string | null = null;
      
      if (isStandalone) {
        const { data: standaloneDoc, error: fetchError } = await supabase
          .from('standalone_signature_documents')
          .select('file_path')
          .eq('id', documentId)
          .maybeSingle();

        if (fetchError) {
          console.error('[SignaturePlacement] Erro ao buscar documento standalone:', fetchError);
          setError('Erro ao buscar documento');
          return;
        }

        filePath = standaloneDoc?.file_path || null;
      } else {
        const { data: docData, error: fetchError } = await supabase
          .from('documents')
          .select('file_path')
          .eq('id', documentId)
          .maybeSingle();

        if (fetchError) {
          console.error('[SignaturePlacement] Erro ao buscar documento:', fetchError);
          setError('Erro ao buscar documento');
          return;
        }

        filePath = docData?.file_path || null;
      }

      if (!filePath) {
        console.error('[SignaturePlacement] Documento não encontrado. ID:', documentId, 'isStandalone:', isStandalone);
        setError('Documento não encontrado. Aguarde um momento e tente novamente.');
        return;
      }

      console.log('[SignaturePlacement] Carregando documento:', filePath);

      // Buscar URL assinada do storage
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (urlError || !urlData?.signedUrl) {
        console.error('[SignaturePlacement] Erro ao gerar URL:', urlError);
        setError('Erro ao carregar documento do storage');
        return;
      }

      console.log('[SignaturePlacement] URL gerada com sucesso');

      // Baixar PDF
      console.log('[SignaturePlacement] Iniciando download do PDF...');
      const response = await fetch(urlData.signedUrl);
      if (!response.ok) {
        throw new Error(`Falha ao baixar PDF: ${response.status} ${response.statusText}`);
      }
      console.log('[SignaturePlacement] PDF baixado, convertendo para blob...');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      console.log('[SignaturePlacement] ArrayBuffer criado, tamanho:', arrayBuffer.byteLength, 'bytes');

      // Renderizar primeira página do PDF
      console.log('[SignaturePlacement] Carregando PDF com pdfjs...');
      const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      console.log('[SignaturePlacement] PDF carregado, total de páginas:', pdf.numPages);
      
      const page = await pdf.getPage(1);
      console.log('[SignaturePlacement] Primeira página obtida');

      const scale = 1.2;
      const viewport = page.getViewport({ scale });
      console.log('[SignaturePlacement] Viewport calculado:', viewport.width, 'x', viewport.height);

      // Garantir que o canvas e o contexto 2D estão prontos (tenta algumas vezes)
      const getCanvasContext = async (attempts = 5): Promise<{ canvas: HTMLCanvasElement; context: CanvasRenderingContext2D }> => {
        for (let i = 0; i < attempts; i++) {
          const c = canvasRef.current;
          if (c) {
            const ctx = c.getContext('2d');
            if (ctx) return { canvas: c, context: ctx };
          }
          await new Promise((r) => setTimeout(r, 50));
        }
        throw new Error('Contexto 2D indisponível após tentativas');
      };

      const { canvas, context } = await getCanvasContext();

      console.log('[SignaturePlacement] Configurando canvas...');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setPdfDimensions({ width: viewport.width, height: viewport.height });

      console.log('[SignaturePlacement] Renderizando página no canvas...');
      const renderContext = { canvasContext: context, viewport };
      await page.render(renderContext as any).promise;
      
      console.log('[SignaturePlacement] PDF renderizado com sucesso!');
      setLoading(false);
    } catch (e: any) {
      console.error('[SignaturePlacement] erro ao carregar PDF:', e);
      setError(`Falha ao carregar o documento${e?.message ? ': ' + String(e.message) : ''}`);
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
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Carregando documento...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="rounded-full bg-destructive/10 p-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAndRenderPdf}
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {value ? 'Posição selecionada ✓' : 'Clique no documento onde deseja posicionar a assinatura'}
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
          </div>
        </>
      )}
    </div>
  );
};

export default SignaturePlacement;
