import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import DocumentViewer from '../documents/DocumentViewer';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  requires_signature: boolean;
  signature_status?: string;
  status: string;
}

interface CollapsibleDocumentSignatureProps {
  documents: Document[];
  processId: string;
  onDocumentSigned?: () => void;
}

const CollapsibleDocumentSignature: React.FC<CollapsibleDocumentSignatureProps> = ({
  documents,
  processId,
  onDocumentSigned
}) => {
  const [expandedDocs, setExpandedDocs] = useState<string[]>([]);

  // Filtrar apenas documentos que requerem assinatura
  const signatureDocuments = documents.filter(doc => doc.requires_signature);

  if (signatureDocuments.length === 0) {
    return null;
  }

  const getSignatureStatusBadge = (doc: Document) => {
    if (doc.signature_status === 'fully_signed') {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Totalmente Assinado
        </Badge>
      );
    }
    if (doc.signature_status === 'partially_signed') {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          <Clock className="h-3 w-3 mr-1" />
          Parcialmente Assinado
        </Badge>
      );
    }
    return (
      <Badge className="bg-muted/10 text-muted-foreground border-muted/20">
        <Clock className="h-3 w-3 mr-1" />
        Aguardando Assinatura
      </Badge>
    );
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos para Assinatura ({signatureDocuments.length})
        </h3>
        
        <Accordion
          type="multiple"
          value={expandedDocs}
          onValueChange={setExpandedDocs}
          className="space-y-4"
        >
          {signatureDocuments.map((doc) => (
            <AccordionItem
              key={doc.id}
              value={doc.id}
              className="border rounded-lg overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.document_type}
                      </p>
                    </div>
                  </div>
                  {getSignatureStatusBadge(doc)}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="mt-4">
                  <DocumentViewer
                    documentId={doc.id}
                    processId={processId}
                    documentName={doc.file_name}
                    showSignature={true}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Card>
  );
};

export default CollapsibleDocumentSignature;
