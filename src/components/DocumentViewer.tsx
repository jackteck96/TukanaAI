import React, { useEffect, useState } from 'react';
import InternalSignatureManager from './InternalSignatureManager';
import MultiSignatureManager from './MultiSignatureManager';
import SignatureTermDownloadButton from './SignatureTermDownloadButton';
import PdfInlineRenderer from './PdfInlineRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, PenTool } from 'lucide-react';
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
  const [viewerBlob, setViewerBlob] = useState<Blob | null>(null);
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
    if (!resolvedUrl) {
      setViewerBlob(null);
      return;
    }
    let aborted = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(resolvedUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!aborted) setViewerBlob(blob);
      } catch (err) {
        console.error('Erro ao baixar PDF:', err);
        if (!aborted) setViewerBlob(null);
      } finally {
        if (!aborted) setLoading(false);
      }
    };
    load();
    return () => { aborted = true; };
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
              ) : viewerBlob ? (
                <PdfInlineRenderer blob={viewerBlob} />
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Não foi possível visualizar o documento inline.</p>
                    {resolvedUrl && (
                      <a href={resolvedUrl} target="_blank" rel="noreferrer" className="underline">Abrir em nova aba</a>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Documento não disponível para visualização</p>
                  <p className="text-sm">Não foi possível gerar uma URL para o arquivo</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assinatura */}
      {showSignature && (
        <Tabs defaultValue="sign" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign" className="flex items-center space-x-2">
              <PenTool className="h-4 w-4" />
              <span>Assinar Agora</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Gerenciar Signatários</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sign" className="mt-6">
            <InternalSignatureManager
              documentId={documentId}
              processId={processId}
              documentName={documentName}
            />
          </TabsContent>
          
          <TabsContent value="manage" className="mt-6">
            <MultiSignatureManager
              documentId={documentId}
              processId={processId}
              documentName={documentName}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default DocumentViewer;