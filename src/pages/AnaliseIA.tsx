import { useCompany } from '@/contexts/CompanyContext';
import { BusinessDocumentAnalyzer } from '@/components/BusinessDocumentAnalyzer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

export default function AnaliseIA() {
  const { company } = useCompany();
  const navigate = useNavigate();

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
            Carregando informações da empresa...
          </p>
        </Card>
      </main>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/empresa-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Análise Inteligente de Documentos</h1>
          </div>
          <p className="text-muted-foreground">
            Use a IA especializada em documentação empresarial para analisar processos, identificar documentos faltantes e obter recomendações práticas
          </p>
        </div>

        <BusinessDocumentAnalyzer 
          companyId={company.id}
          onAnalysisComplete={(result) => {
          console.log('Análise concluída:', result);
        }}
      />
    </main>
  </div>
  );
}
