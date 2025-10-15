import React, { useEffect, useState } from 'react';
import InternalSignatureManager from './InternalSignatureManager';
import SignatureTermDownloadButton from './SignatureTermDownloadButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentViewerProps {
  documentId: string;
  processId: string;
  documentName: string;
  documentUrl?: string;
  showSignature?: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  processId,
  documentName,
  documentUrl,
  showSignature = true
}) => {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(documentUrl || null);

  useEffect(() => {
    const resolve = async () => {
      try {
        if (documentUrl) {
          setResolvedUrl(documentUrl);
          return;
        }
        // Buscar file_path e gerar URL assinada
        const { data, error } = await supabase
          .from('documents')
          .select('file_path')
          .eq('id', documentId)
          .single();
        if (error) throw error;
        if (data?.file_path) {
          const { data: signed, error: signErr } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(data.file_path, 60 * 15);
          if (signErr) throw signErr;
          setResolvedUrl(signed?.signedUrl || null);
        } else {
          setResolvedUrl(null);
        }
      } catch (err) {
        console.error('Erro ao resolver URL do documento:', err);
        setResolvedUrl(null);
      }
    };
    resolve();
  }, [documentUrl, documentId]);

  useEffect(() => {
    setLoading(true);
    try {
      setViewerUrl(resolvedUrl);
    } finally {
      setLoading(false);
    }
  }, [resolvedUrl]);

  return (
    <div className="space-y-6">
      {/* Visualizador do Documento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{documentName}</span>
            </CardTitle>
            <SignatureTermDownloadButton documentId={documentId} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 min-h-[400px] bg-muted/30">
            {resolvedUrl ? (
              loading ? (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <p>Carregando documento…</p>
                </div>
              ) : viewerUrl ? (
                <object
                  data={viewerUrl}
                  type="application/pdf"
                  className="w-full h-96"
                >
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Não foi possível exibir o documento. </p>
                    <a href={viewerUrl} target="_blank" rel="noreferrer" className="underline ml-2">Abrir em nova aba</a>
                  </div>
                </object>
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Não foi possível visualizar o documento inline.</p>
                    <a href={documentUrl} target="_blank" rel="noreferrer" className="underline">Abrir original</a>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Documento não disponível para visualização</p>
                  <p className="text-sm">Faça o download para visualizar o arquivo</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assinatura Interna */}
      {showSignature && (
        <InternalSignatureManager
          documentId={documentId}
          processId={processId}
          documentName={documentName}
        />
      )}
    </div>
  );
};

export default DocumentViewer;