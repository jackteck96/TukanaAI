import React from 'react';
import DigitalSignatureManager from './DigitalSignatureManager';
import InternalSignatureManager from './InternalSignatureManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, PenTool, Shield } from 'lucide-react';

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
  return (
    <div className="space-y-6">
      {/* Visualizador do Documento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{documentName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 min-h-[400px] bg-muted/30">
            {documentUrl ? (
              <iframe
                src={documentUrl}
                className="w-full h-96 border-0"
                title="Visualização do documento"
              />
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

      {/* Módulos de Assinatura Digital */}
      {showSignature && (
        <Tabs defaultValue="gov-br" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gov-br" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Gov.br</span>
            </TabsTrigger>
            <TabsTrigger value="internal" className="flex items-center space-x-2">
              <PenTool className="h-4 w-4" />
              <span>Assinatura Interna</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gov-br" className="mt-6">
            <DigitalSignatureManager
              documentId={documentId}
              processId={processId}
              documentName={documentName}
            />
          </TabsContent>
          
          <TabsContent value="internal" className="mt-6">
            <InternalSignatureManager
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