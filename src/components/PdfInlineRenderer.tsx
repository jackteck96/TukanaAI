import React, { useEffect, useRef, useState } from 'react';
// pdfjs 4.x ESM: usamos o worker via import de URL para funcionar no Vite
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Vite irá resolver o worker para URL estática
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfInlineRendererProps {
  blob: Blob;
}

const PdfInlineRenderer: React.FC<PdfInlineRendererProps> = ({ blob }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let destroyed = false;

    const render = async () => {
      setError(null);
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = (pdfjsLib as any).getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        if (destroyed) return;

        // Limpar container
        if (containerRef.current) containerRef.current.innerHTML = '';

        // Renderizar todas as páginas (simples e robusto). Para muitos pages, poderíamos paginar.
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.25 });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 16px auto';

          const renderContext = { canvasContext: context, viewport };
          await page.render(renderContext as any).promise;

          if (destroyed) break;
          containerRef.current?.appendChild(canvas);
        }
      } catch (e: any) {
        console.error('[PdfInlineRenderer] erro:', e);
        setError('Falha ao renderizar o PDF.');
      }
    };

    render();

    return () => {
      destroyed = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [blob]);

  return (
    <div className="w-full h-[70vh] overflow-auto p-2 bg-background" ref={containerRef}>
      {error && (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
          {error}
        </div>
      )}
    </div>
  );
};

export default PdfInlineRenderer;
