import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Lightbulb
} from "lucide-react";

interface ProcessAnalysis {
  missingDocuments: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  completionPercentage: number;
  recommendations: string[];
}

interface AIProcessAnalyzerProps {
  process: {
    id: number;
    processType: string;
    description: string;
    requiredDocuments: string[];
    receivedDocuments: Array<{
      name: string;
      status: string;
      dateReceived: string;
    }>;
    pendingDocuments: string[];
  };
  availableDocuments: string[];
}

const AIProcessAnalyzer = ({ process, availableDocuments }: AIProcessAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProcessAnalysis | null>(null);

  const analyzeProcess = async () => {
    setIsAnalyzing(true);
    
    // Simular análise de IA (em produção, isso seria uma chamada para uma API de IA)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const receivedDocNames = process.receivedDocuments.map(doc => doc.name);
    const missingFromRequired = process.requiredDocuments.filter(
      doc => !receivedDocNames.includes(doc)
    );
    
    // Análise inteligente baseada no tipo de processo
    const additionalSuggestions = getAdditionalDocumentsByProcessType(
      process.processType, 
      process.description,
      receivedDocNames
    );
    
    const completionPercentage = Math.round(
      (receivedDocNames.length / (process.requiredDocuments.length + additionalSuggestions.length)) * 100
    );
    
    const riskLevel = getRiskLevel(completionPercentage, process.processType);
    
    const recommendations = generateRecommendations(
      process.processType,
      missingFromRequired,
      additionalSuggestions,
      riskLevel
    );

    setAnalysis({
      missingDocuments: missingFromRequired,
      suggestions: additionalSuggestions,
      riskLevel,
      completionPercentage,
      recommendations
    });
    
    setIsAnalyzing(false);
  };

  const getAdditionalDocumentsByProcessType = (
    processType: string, 
    description: string, 
    receivedDocs: string[]
  ): string[] => {
    const suggestions: string[] = [];
    
    // Análise inteligente baseada no tipo de processo
    if (processType.toLowerCase().includes('contrato')) {
      if (!receivedDocs.some(doc => doc.toLowerCase().includes('procuração'))) {
        suggestions.push('Procuração');
      }
      if (!receivedDocs.some(doc => doc.toLowerCase().includes('contrato social'))) {
        suggestions.push('Contrato Social');
      }
    }
    
    if (processType.toLowerCase().includes('fiscal') || description.toLowerCase().includes('fiscal')) {
      if (!receivedDocs.some(doc => doc.toLowerCase().includes('inscrição estadual'))) {
        suggestions.push('Inscrição Estadual');
      }
      if (!receivedDocs.some(doc => doc.toLowerCase().includes('alvará'))) {
        suggestions.push('Alvará de Funcionamento');
      }
    }
    
    if (processType.toLowerCase().includes('trabalhista')) {
      if (!receivedDocs.some(doc => doc.toLowerCase().includes('carteira'))) {
        suggestions.push('Carteira de Trabalho');
      }
      if (!receivedDocs.some(doc => doc.toLowerCase().includes('comprovante de renda'))) {
        suggestions.push('Comprovante de Renda');
      }
    }
    
    return suggestions;
  };

  const getRiskLevel = (completion: number, processType: string): 'low' | 'medium' | 'high' => {
    if (completion >= 80) return 'low';
    if (completion >= 50) return 'medium';
    return 'high';
  };

  const generateRecommendations = (
    processType: string,
    missing: string[],
    suggestions: string[],
    risk: string
  ): string[] => {
    const recommendations: string[] = [];
    
    if (missing.length > 0) {
      recommendations.push(`Solicite urgentemente os documentos obrigatórios: ${missing.join(', ')}`);
    }
    
    if (suggestions.length > 0) {
      recommendations.push(`Considere solicitar documentos complementares: ${suggestions.join(', ')}`);
    }
    
    if (risk === 'high') {
      recommendations.push('Priorize este processo - alto risco de atraso');
    }
    
    if (processType.toLowerCase().includes('contrato')) {
      recommendations.push('Verifique se todas as partes estão devidamente representadas');
    }
    
    return recommendations;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'low': return 'Baixo Risco';
      case 'medium': return 'Risco Médio';
      case 'high': return 'Alto Risco';
      default: return 'Não Avaliado';
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <span>Análise Inteligente do Processo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <div className="text-center py-6">
            <Button 
              onClick={analyzeProcess} 
              disabled={isAnalyzing}
              size="lg"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando Processo...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analisar Processo com IA
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              A IA analisará o processo e identificará documentos faltantes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Geral */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-semibold">Status da Documentação</h4>
                <p className="text-sm text-muted-foreground">
                  {analysis.completionPercentage}% completo
                </p>
              </div>
              <div className="text-right">
                <Badge className={getRiskColor(analysis.riskLevel)}>
                  {getRiskText(analysis.riskLevel)}
                </Badge>
              </div>
            </div>

            {/* Documentos Faltantes */}
            {analysis.missingDocuments.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Documentos Obrigatórios Faltantes:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {analysis.missingDocuments.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Sugestões de Documentos */}
            {analysis.suggestions.length > 0 && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Documentos Recomendados pela IA:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {analysis.suggestions.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Recomendações */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Recomendações da IA
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              onClick={analyzeProcess} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <Brain className="h-4 w-4 mr-2" />
              Reanalizar Processo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIProcessAnalyzer;