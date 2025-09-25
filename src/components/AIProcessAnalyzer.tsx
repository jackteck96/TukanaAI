import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Brain, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Lightbulb,
  Target,
  TrendingUp
} from "lucide-react";

interface ProcessAnalysis {
  missingDocuments: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  completionPercentage: number;
  recommendations: string[];
  purposeAnalysis: {
    detectedPurpose: string;
    confidenceLevel: number;
    criticalGaps: string[];
  };
  intelligentSuggestions: Array<{
    document: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    basedOn: string;
  }>;
}

interface TrainingRule {
  id: string;
  process_type: string;
  keywords: string[];
  required_documents: string[];
  suggested_documents: string[];
  conditions: string | null;
  priority: number;
  is_active: boolean;
}

interface TrainingCase {
  id: string;
  process_type: string;
  description: string;
  documents_received: string[];
  correct_documents: string[];
  result: string;
  feedback: string | null;
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
  const [trainingRules, setTrainingRules] = useState<TrainingRule[]>([]);
  const [trainingCases, setTrainingCases] = useState<TrainingCase[]>([]);

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      const [rulesResponse, casesResponse] = await Promise.all([
        supabase.from('ai_training_data').select('*').eq('is_active', true).order('priority', { ascending: false }),
        supabase.from('ai_training_cases').select('*').order('created_at', { ascending: false })
      ]);

      if (rulesResponse.data) setTrainingRules(rulesResponse.data);
      if (casesResponse.data) setTrainingCases(casesResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados de treinamento:', error);
    }
  };

  const analyzeProcess = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simular processamento de IA mais complexo
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const receivedDocNames = process.receivedDocuments.map(doc => doc.name);
      
      // Análise de finalidade baseada em ML pattern matching
      const purposeAnalysis = analyzePurpose(process.processType, process.description);
      
      // Encontrar regras de treinamento aplicáveis
      const applicableRules = findApplicableRules(process.processType, process.description);
      
      // Análise baseada em casos similares
      const similarCases = findSimilarCases(process.processType, process.description, receivedDocNames);
      
      // Documentos obrigatórios faltantes
      const missingFromRequired = process.requiredDocuments.filter(
        doc => !receivedDocNames.includes(doc)
      );
      
      // Sugestões inteligentes baseadas em IA
      const intelligentSuggestions = generateIntelligentSuggestions(
        applicableRules, 
        similarCases, 
        receivedDocNames,
        purposeAnalysis
      );
      
      // Sugestões básicas (fallback)
      const basicSuggestions = getAdditionalDocumentsByProcessType(
        process.processType, 
        process.description,
        receivedDocNames
      );
      
      // Combinar sugestões, priorizando as inteligentes
      const allSuggestions = [
        ...intelligentSuggestions.map(s => s.document),
        ...basicSuggestions.filter(bs => !intelligentSuggestions.some(is => is.document === bs))
      ];
      
      const totalExpectedDocs = process.requiredDocuments.length + allSuggestions.length;
      const completionPercentage = totalExpectedDocs > 0 ? 
        Math.round((receivedDocNames.length / totalExpectedDocs) * 100) : 100;
      
      const riskLevel = calculateIntelligentRiskLevel(
        completionPercentage, 
        purposeAnalysis, 
        missingFromRequired.length,
        intelligentSuggestions
      );
      
      const recommendations = generateIntelligentRecommendations(
        process.processType,
        missingFromRequired,
        intelligentSuggestions,
        riskLevel,
        purposeAnalysis
      );

      setAnalysis({
        missingDocuments: missingFromRequired,
        suggestions: allSuggestions,
        riskLevel,
        completionPercentage,
        recommendations,
        purposeAnalysis,
        intelligentSuggestions
      });
      
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar processo. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzePurpose = (processType: string, description: string) => {
    const keywords = [processType, description].join(' ').toLowerCase();
    
    let detectedPurpose = 'Finalidade não identificada';
    let confidenceLevel = 0;
    const criticalGaps: string[] = [];
    
    // Análise de finalidade baseada em padrões
    if (keywords.includes('abertura') || keywords.includes('constituição')) {
      detectedPurpose = 'Constituição de nova empresa';
      confidenceLevel = 0.9;
      if (!keywords.includes('contrato social')) criticalGaps.push('Documentação societária');
      if (!keywords.includes('capital')) criticalGaps.push('Comprovação de capital');
    } else if (keywords.includes('trabalhista') || keywords.includes('rescisão')) {
      detectedPurpose = 'Processo trabalhista ou rescisório';
      confidenceLevel = 0.85;
      if (!keywords.includes('ctps')) criticalGaps.push('Documentação trabalhista');
      if (!keywords.includes('renda')) criticalGaps.push('Comprovação de vínculos');
    } else if (keywords.includes('fiscal') || keywords.includes('tributário')) {
      detectedPurpose = 'Regularização fiscal e tributária';
      confidenceLevel = 0.8;
      if (!keywords.includes('cnpj')) criticalGaps.push('Documentação empresarial');
      if (!keywords.includes('receita')) criticalGaps.push('Declarações fiscais');
    }
    
    return { detectedPurpose, confidenceLevel, criticalGaps };
  };

  const findApplicableRules = (processType: string, description: string): TrainingRule[] => {
    return trainingRules.filter(rule => {
      const typeMatch = rule.process_type.toLowerCase() === processType.toLowerCase();
      const keywordMatch = rule.keywords.some(keyword => 
        processType.toLowerCase().includes(keyword.toLowerCase()) ||
        description.toLowerCase().includes(keyword.toLowerCase())
      );
      return typeMatch || keywordMatch;
    });
  };

  const findSimilarCases = (processType: string, description: string, receivedDocs: string[]): TrainingCase[] => {
    return trainingCases.filter(case_ => {
      const typeMatch = case_.process_type.toLowerCase() === processType.toLowerCase();
      const descMatch = calculateDescriptionSimilarity(case_.description, description) > 0.3;
      const docSimilarity = calculateDocumentSimilarity(case_.documents_received, receivedDocs) > 0.2;
      return typeMatch && (descMatch || docSimilarity);
    });
  };

  const calculateDescriptionSimilarity = (desc1: string, desc2: string): number => {
    const words1 = desc1.toLowerCase().split(' ');
    const words2 = desc2.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  };

  const calculateDocumentSimilarity = (docs1: string[], docs2: string[]): number => {
    const intersection = docs1.filter(doc => docs2.includes(doc));
    return intersection.length / Math.max(docs1.length, docs2.length);
  };

  const generateIntelligentSuggestions = (
    rules: TrainingRule[],
    cases: TrainingCase[],
    receivedDocs: string[],
    purposeAnalysis: any
  ) => {
    const suggestions: Array<{
      document: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
      basedOn: string;
    }> = [];

    // Sugestões baseadas em regras de treinamento
    rules.forEach(rule => {
      rule.suggested_documents.forEach(doc => {
        if (!receivedDocs.includes(doc)) {
          suggestions.push({
            document: doc,
            reason: `Recomendado para processos de ${rule.process_type}`,
            priority: rule.priority > 1 ? 'high' : 'medium',
            basedOn: 'Regras de treinamento'
          });
        }
      });
    });

    // Sugestões baseadas em casos similares
    cases.forEach(case_ => {
      case_.correct_documents.forEach(doc => {
        if (!receivedDocs.includes(doc) && !suggestions.some(s => s.document === doc)) {
          suggestions.push({
            document: doc,
            reason: `Necessário em casos similares: ${case_.description.substring(0, 50)}...`,
            priority: case_.result === 'success' ? 'high' : 'medium',
            basedOn: 'Casos similares'
          });
        }
      });
    });

    // Sugestões baseadas na finalidade detectada
    purposeAnalysis.criticalGaps.forEach((gap: string) => {
      if (gap === 'Documentação societária' && !receivedDocs.some(doc => doc.toLowerCase().includes('contrato'))) {
        suggestions.push({
          document: 'Contrato Social',
          reason: 'Essencial para a finalidade detectada',
          priority: 'high',
          basedOn: 'Análise de finalidade'
        });
      }
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getAdditionalDocumentsByProcessType = (
    processType: string, 
    description: string, 
    receivedDocs: string[]
  ): string[] => {
    const suggestions: string[] = [];
    
    // Análise básica como fallback
    if (processType.toLowerCase().includes('contrato')) {
      if (!receivedDocs.some(doc => doc.toLowerCase().includes('procuração'))) {
        suggestions.push('Procuração');
      }
    }
    
    if (processType.toLowerCase().includes('fiscal')) {
      if (!receivedDocs.some(doc => doc.toLowerCase().includes('alvará'))) {
        suggestions.push('Alvará de Funcionamento');
      }
    }
    
    return suggestions;
  };

  const calculateIntelligentRiskLevel = (
    completion: number, 
    purposeAnalysis: any, 
    missingCount: number,
    intelligentSuggestions: any[]
  ): 'low' | 'medium' | 'high' => {
    let riskScore = 0;
    
    // Fatores de risco
    if (completion < 50) riskScore += 3;
    else if (completion < 80) riskScore += 1;
    
    if (purposeAnalysis.confidenceLevel < 0.5) riskScore += 2;
    if (missingCount > 2) riskScore += 2;
    if (intelligentSuggestions.filter(s => s.priority === 'high').length > 1) riskScore += 1;
    
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  };

  const generateIntelligentRecommendations = (
    processType: string,
    missing: string[],
    intelligentSuggestions: any[],
    risk: string,
    purposeAnalysis: any
  ): string[] => {
    const recommendations: string[] = [];
    
    // Análise de finalidade
    if (purposeAnalysis.confidenceLevel > 0.7) {
      recommendations.push(`🎯 Finalidade identificada: ${purposeAnalysis.detectedPurpose} (${Math.round(purposeAnalysis.confidenceLevel * 100)}% confiança)`);
    }
    
    if (missing.length > 0) {
      recommendations.push(`⚠️ CRÍTICO: Documentos obrigatórios faltantes: ${missing.join(', ')}`);
    }
    
    const highPrioritySuggestions = intelligentSuggestions.filter(s => s.priority === 'high');
    if (highPrioritySuggestions.length > 0) {
      recommendations.push(`🔥 ALTA PRIORIDADE: ${highPrioritySuggestions.map(s => s.document).join(', ')}`);
    }
    
    const mediumPrioritySuggestions = intelligentSuggestions.filter(s => s.priority === 'medium');
    if (mediumPrioritySuggestions.length > 0) {
      recommendations.push(`📋 Documentos recomendados: ${mediumPrioritySuggestions.map(s => s.document).join(', ')}`);
    }
    
    if (risk === 'high') {
      recommendations.push('🚨 ATENÇÃO: Alto risco de problemas - revisar urgentemente');
    }
    
    // Gaps críticos na finalidade
    if (purposeAnalysis.criticalGaps.length > 0) {
      recommendations.push(`⚡ Lacunas críticas detectadas: ${purposeAnalysis.criticalGaps.join(', ')}`);
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
            {/* Análise de Finalidade */}
            <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Análise de Finalidade</h4>
              </div>
              <p className="text-sm font-medium">{analysis.purposeAnalysis.detectedPurpose}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${analysis.purposeAnalysis.confidenceLevel * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(analysis.purposeAnalysis.confidenceLevel * 100)}% confiança
                </span>
              </div>
            </div>

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

            {/* Sugestões Inteligentes */}
            {analysis.intelligentSuggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                  Análise Inteligente de Documentos
                </h4>
                {analysis.intelligentSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{suggestion.document}</span>
                      <Badge 
                        variant={suggestion.priority === 'high' ? 'destructive' : 
                                suggestion.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {suggestion.priority === 'high' ? 'Alta' : 
                         suggestion.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                    <p className="text-xs text-primary">Baseado em: {suggestion.basedOn}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sugestões Básicas (se não houver inteligentes) */}
            {analysis.intelligentSuggestions.length === 0 && analysis.suggestions.length > 0 && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Documentos Recomendados:</strong>
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