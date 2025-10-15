import React, { useEffect, useState } from 'react';
import InternalSignatureManager from './InternalSignatureManager';
import MultiSignatureManager from './MultiSignatureManager';
import SignatureTermDownloadButton from './SignatureTermDownloadButton';
import PdfInlineRenderer from './PdfInlineRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, PenTool, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  const [signedCount, setSignedCount] = useState(0);

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

  // Verificar quantidade de assinaturas para exibir o botão de download
  const checkSignatures = async () => {
    try {
      const { data } = await supabase
        .from('internal_signatures')
        .select('id')
        .eq('document_id', documentId);
      setSignedCount(data?.length || 0);
    } catch (err) {
      console.error('Erro ao checar assinaturas:', err);
    }
  };

  useEffect(() => {
    checkSignatures();
  }, [documentId]);

  const downloadSignedDocument = async () => {
    try {
      const { data: doc } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (!doc?.file_path) {
        toast.error('Documento não encontrado');
        return;
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentName}_assinado.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro ao baixar documento assinado:', error);
      toast.error('Erro ao baixar documento assinado');
    }
  };

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
            <div className="flex items-center gap-2">
              {signedCount > 0 && (
                <Button variant="default" onClick={downloadSignedDocument}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Documento Assinado
                </Button>
              )}
              <SignatureTermDownloadButton documentId={documentId} />
            </div>
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
              onSigned={() => {
                checkSignatures();
              }}
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