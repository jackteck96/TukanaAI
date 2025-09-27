import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, FileText, CheckCircle, AlertCircle, Clock, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Document {
  name: string;
  type: string;
  content?: string;
}

interface AnalysisResult {
  processType: string;
  checklist: string[];
  missingDocuments: string[];
  documentAnalysis: any[];
  finalReport: {
    processIdentification: string;
    strongPoints: string[];
    weakPoints: string[];
    needsImprovement: string[];
    missing: string[];
    contractualAnalysis: string[];
    status: 'incomplete' | 'ready_for_validation';
  };
}

interface AIProcessAnalyzerProps {
  companyId: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export const AIProcessAnalyzer = ({ companyId, onAnalysisComplete }: AIProcessAnalyzerProps) => {
  const { toast } = useToast();
  const [processDescription, setProcessDescription] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const addDocument = (name: string, type: string) => {
    setDocuments(prev => [...prev, { name, type }]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!processDescription.trim()) {
      toast({
        title: "Descrição necessária",
        description: "Por favor, descreva o processo de documentação que precisa ser analisado.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      toast({
        title: "Análise iniciada",
        description: "A IA está analisando seu processo de documentação...",
      });

      const { data, error } = await supabase.functions.invoke('analyze-document-process', {
        body: {
          processDescription,
          documents,
          companyId
        }
      });

      if (error) throw error;

      setAnalysisResult(data);
      onAnalysisComplete?.(data);
      
      toast({
        title: "Análise concluída",
        description: `Processo identificado: ${data.processType}`,
      });

    } catch (error) {
      console.error("Erro na análise:", error);
      toast({
        title: "Erro na análise",
        description: "Falha ao analisar o processo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            IA de Análise de Processos de Documentação
          </CardTitle>
          <CardDescription>
            Sistema inteligente para análise de processos empresariais e administrativos (não judiciais)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Descrição do Processo */}
          <div className="space-y-2">
            <Label htmlFor="process-description">Descrição do Processo de Documentação</Label>
            <Textarea
              id="process-description"
              placeholder="Descreva o tipo de processo de documentação (ex: abertura de empresa, alteração contratual, due diligence, regularização de cadastros, licenciamento, etc.)"
              value={processDescription}
              onChange={(e) => setProcessDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Documentos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Documentos do Processo</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const name = prompt("Nome do documento:");
                  const type = prompt("Tipo do documento:");
                  if (name && type) addDocument(name, type);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Documento
              </Button>
            </div>

            {documents.length > 0 && (
              <div className="grid gap-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-sm text-muted-foreground">{doc.type}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            onClick={handleAnalyze} 
            className="w-full"
            disabled={isAnalyzing || !processDescription.trim()}
          >
            {isAnalyzing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analisar Processo de Documentação
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado da Análise */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Parecer Final de Documentação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Identificação do Processo */}
            <div>
              <h4 className="font-semibold mb-2">Identificação do processo/documentação:</h4>
              <p className="text-sm">{analysisResult.finalReport.processIdentification}</p>
            </div>

            <Separator />

            {/* Pontos Fortes */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Pontos fortes:
              </h4>
              <ul className="text-sm space-y-1">
                {analysisResult.finalReport.strongPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pontos Fracos */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Pontos fracos:
              </h4>
              <ul className="text-sm space-y-1">
                {analysisResult.finalReport.weakPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* O que precisa ser melhorado */}
            <div>
              <h4 className="font-semibold mb-2">O que precisa ser melhorado:</h4>
              <ul className="text-sm space-y-1">
                {analysisResult.finalReport.needsImprovement.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* O que falta */}
            <div>
              <h4 className="font-semibold mb-2">O que falta:</h4>
              <ul className="text-sm space-y-1">
                {analysisResult.finalReport.missing.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Análise Contratual */}
            <div>
              <h4 className="font-semibold mb-2">Análise contratual (quando aplicável):</h4>
              <ul className="text-sm space-y-1">
                {analysisResult.finalReport.contractualAnalysis.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">Status do Processo:</span>
              <Badge variant={analysisResult.finalReport.status === 'ready_for_validation' ? 'default' : 'secondary'}>
                {analysisResult.finalReport.status === 'ready_for_validation' 
                  ? 'Pronto para Validação' 
                  : 'Incompleto'
                }
              </Badge>
            </div>

            {/* Checklist de Documentos */}
            {analysisResult.checklist.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Checklist de Documentos Necessários:</h4>
                <div className="grid gap-2">
                  {analysisResult.checklist.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                      {doc}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};