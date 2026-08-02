import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Plus, X, Brain, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Document {
  name: string;
  type: string;
  content?: string;
  file?: File;
  description?: string;
  observations?: string;
}

interface AnalysisResult {
  processType: string;
  checklist: Array<{
    document: string;
    status: 'present' | 'missing' | 'recommended';
    observations?: string;
  }>;
  contractAnalysis?: {
    strongPoints: string[];
    weakPoints: string[];
    riskClauses: string[];
  };
  missingDocuments: string[];
  recommendations: string[];
  finalReport: string;
}

interface BusinessDocumentAnalyzerProps {
  companyId: string;
  processId?: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export function BusinessDocumentAnalyzer({ companyId, processId, onAnalysisComplete }: BusinessDocumentAnalyzerProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocObservations, setNewDocObservations] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [autoLoadedDocs, setAutoLoadedDocs] = useState(0);

  // Buscar documentos automaticamente quando processId estiver disponível
  useEffect(() => {
    if (processId) {
      loadProcessDocuments();
    }
  }, [processId]);

  const loadProcessDocuments = async () => {
    if (!processId) return;

    setLoadingDocuments(true);
    try {
      const { data: docsData, error } = await supabase
        .from('documents')
        .select('id, file_name, document_type, file_path, status')
        .eq('process_id', processId);

      if (error) throw error;

      if (docsData && docsData.length > 0) {
        const loadedDocs: Document[] = docsData.map(doc => ({
          name: doc.file_name,
          type: doc.document_type,
          content: `Status: ${doc.status}` // Informação básica do documento
        }));
        
        setDocuments(loadedDocs);
        setAutoLoadedDocs(docsData.length);
        
        toast({
          title: "Documentos carregados",
          description: `${docsData.length} documento(s) encontrado(s) no processo`,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: "Aviso",
        description: "Não foi possível carregar os documentos automaticamente",
        variant: "default",
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  const addDocument = () => {
    if (!processId) {
      // Para análise rápida, exigir upload de arquivo
      if (!uploadedFile) {
        toast({
          title: "Arquivo obrigatório",
          description: "Faça upload do documento para análise",
          variant: "destructive",
        });
        return;
      }
      if (!newDocType.trim()) {
        toast({
          title: "Tipo obrigatório",
          description: "Preencha o tipo do documento",
          variant: "destructive",
        });
        return;
      }

      setDocuments([...documents, { 
        name: uploadedFile.name,
        type: newDocType,
        file: uploadedFile,
        description: newDocDescription,
        observations: newDocObservations
      }]);
      
      setUploadedFile(null);
      setNewDocType('');
      setNewDocDescription('');
      setNewDocObservations('');
    } else {
      // Comportamento original para processo existente
      if (!newDocName.trim() || !newDocType.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha o nome e tipo do documento",
          variant: "destructive",
        });
        return;
      }

      setDocuments([...documents, { name: newDocName, type: newDocType }]);
      setNewDocName('');
      setNewDocType('');
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!processId && documents.length === 0) {
      toast({
        title: "Documentos necessários",
        description: "Selecione um processo ou adicione documentos para análise",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      console.log('Iniciando análise de documentos empresariais...');

      const { data, error } = await supabase.functions.invoke('analyze-business-documents', {
        body: {
          documents,
          companyId,
          processId,
        },
      });

      if (error) {
        console.error('Erro na análise:', error);
        throw error;
      }

      console.log('Análise concluída:', data);

      setAnalysisResult(data as AnalysisResult);
      
      toast({
        title: "Análise concluída",
        description: "A IA analisou seus documentos com sucesso",
      });

      if (onAnalysisComplete) {
        onAnalysisComplete(data as AnalysisResult);
      }
    } catch (error) {
      console.error('Erro ao analisar documentos:', error);
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Não foi possível completar a análise",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'recommended':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'missing':
        return 'Faltante';
      case 'recommended':
        return 'Recomendado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Análise Inteligente de Documentação Empresarial</h2>
          </div>
          
          {processId && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium">
                ✓ Processo selecionado - Os documentos serão carregados automaticamente
              </p>
            </div>
          )}

          <Separator />

          <div>
            <label className="text-sm font-medium mb-2 block">
              Documentos {processId ? '(Carregados automaticamente do processo)' : ''}
            </label>
            
            {loadingDocuments ? (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Carregando documentos do processo...
              </div>
            ) : (
              <>
                {processId && autoLoadedDocs > 0 && (
                  <div className="mb-3 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-primary">
                      ✓ {autoLoadedDocs} documento(s) carregado(s) automaticamente do processo
                    </p>
                  </div>
                )}
                
                {/* Formulário diferente para análise rápida vs processo */}
                {!processId ? (
                  <div className="space-y-4 mb-4 p-4 border rounded-lg bg-card">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Upload do Documento *
                      </label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setUploadedFile(file);
                        }}
                        className="cursor-pointer"
                      />
                      {uploadedFile && (
                        <p className="text-sm text-primary mt-1">
                          Arquivo selecionado: {uploadedFile.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Tipo de Documento *
                      </label>
                      <Input
                        placeholder="Ex: Contrato Social, RG, CPF, Procuração..."
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Descrição do Documento
                      </label>
                      <Textarea
                        placeholder="Descreva brevemente o documento..."
                        value={newDocDescription}
                        onChange={(e) => setNewDocDescription(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Observações
                      </label>
                      <Textarea
                        placeholder="O que é pertinente ao documento e ao caso? O que você quer que seja analisado?"
                        value={newDocObservations}
                        onChange={(e) => setNewDocObservations(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <Button onClick={addDocument} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Documento para Análise
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Nome do documento"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addDocument()}
                    />
                    <Input
                      placeholder="Tipo"
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addDocument()}
                    />
                    <Button onClick={addDocument} size="icon" variant="outline" title="Adicionar documento complementar">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{doc.name}</span>
                            <Badge variant="secondary">{doc.type}</Badge>
                          </div>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              Descrição: {doc.description}
                            </p>
                          )}
                          {doc.observations && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              Observações: {doc.observations}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => removeDocument(index)}
                          size="icon"
                          variant="ghost"
                          title="Remover documento"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {processId 
                ? 'Os documentos do processo foram carregados automaticamente. Você pode adicionar documentos complementares se necessário.'
                : 'Adicione documentos com upload de arquivo para análise pela IA.'}
            </p>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || loadingDocuments || (!processId && documents.length === 0)}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando documentos...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Analisar com IA
              </>
            )}
          </Button>
          {!processId && documents.length === 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Adicione documentos para habilitar a análise
            </p>
          )}
        </div>
      </Card>

      {analysisResult && (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Tipo de Processo Identificado</h3>
              <Badge variant="default" className="text-lg py-1 px-3">
                {analysisResult.processType}
              </Badge>
            </div>

            <Separator />

            {analysisResult.checklist && analysisResult.checklist.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Checklist de Documentos</h3>
                <div className="space-y-2">
                  {analysisResult.checklist.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                    >
                      {getStatusIcon(item.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.document}</span>
                          <Badge variant="outline">{getStatusText(item.status)}</Badge>
                        </div>
                        {item.observations && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.observations}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.contractAnalysis && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Análise Contratual</h3>
                  
                  {analysisResult.contractAnalysis.strongPoints?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Pontos Fortes
                      </h4>
                      <ul className="space-y-1 ml-6">
                        {analysisResult.contractAnalysis.strongPoints.map((point, index) => (
                          <li key={index} className="text-sm list-disc">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.contractAnalysis.weakPoints?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-yellow-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Pontos Fracos
                      </h4>
                      <ul className="space-y-1 ml-6">
                        {analysisResult.contractAnalysis.weakPoints.map((point, index) => (
                          <li key={index} className="text-sm list-disc">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.contractAnalysis.riskClauses?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Cláusulas de Risco
                      </h4>
                      <ul className="space-y-1 ml-6">
                        {analysisResult.contractAnalysis.riskClauses.map((clause, index) => (
                          <li key={index} className="text-sm list-disc">{clause}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

            {analysisResult.missingDocuments?.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Documentos Faltantes</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.missingDocuments.map((doc, index) => (
                      <Badge key={index} variant="destructive">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {analysisResult.recommendations?.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recomendações</h3>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Parecer Final</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{analysisResult.finalReport}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
