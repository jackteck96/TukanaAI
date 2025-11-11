import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PenTool } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StandaloneSignedDocuments } from "@/components/StandaloneSignedDocuments";
import { PendingSignatureDocuments } from "@/components/PendingSignatureDocuments";

const ClientDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/cliente')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <PenTool className="h-6 w-6" />
                  Assinaturas
                </h1>
                <p className="text-muted-foreground">
                  Gerencie seus documentos para assinatura
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Documentos Pendentes de Assinatura */}
        <PendingSignatureDocuments />

        {/* Documentos Assinados */}
        <StandaloneSignedDocuments />

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Documentos Pendentes:</strong> Documentos que aguardam sua assinatura</p>
            <p>• <strong>Documentos Assinados:</strong> Documentos já assinados por você e pela empresa</p>
            <p>• Você receberá notificações quando novos documentos estiverem disponíveis para assinatura</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;