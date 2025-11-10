import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Send,
  MessageSquare,
  Plus,
  User,
  Mail,
  Calendar,
  FileIcon,
  Edit,
  Brain,
  Settings,
  BarChart3,
  Copy,
  Shield
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CreateProcessWithInvite from "@/components/CreateProcessWithInvite";
import DocumentList from "@/components/DocumentList";
import DocumentProgressBattery from "@/components/DocumentProgressBattery";
import DocumentProgressBar from "@/components/DocumentProgressBar";
import ProcessTimeline from "@/components/ProcessTimeline";
import EmailResendButton from "@/components/EmailResendButton";
import DocumentReport from "@/components/DocumentReport";

import ProcessNotes from "@/components/ProcessNotes";
import { BusinessDocumentAnalyzer } from "@/components/BusinessDocumentAnalyzer";
import ProcessEditDialog from "@/components/ProcessEditDialog";
import { InternalProcessChat } from "@/components/InternalProcessChat";
import { calculateProgressFromStatus } from "@/utils/progressCalculator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { updateProcessProgress } from "@/utils/processProgressUpdater";
import { StandaloneDocumentUpload } from "@/components/StandaloneDocumentUpload";
import { StandaloneSignedDocuments } from "@/components/StandaloneSignedDocuments";
import { PendingSignatureDocuments } from "@/components/PendingSignatureDocuments";

const GerenciarProcessos = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageForm, setMessageForm] = useState({
    message: "",
    requestDocs: [] as string[]
  });
  const [processes, setProcesses] = useState<any[]>([]);
  const [currentProcess, setCurrentProcess] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<string>("");
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isAIAnalysisModalOpen, setIsAIAnalysisModalOpen] = useState(false);
  const [selectedProcessForAnalysis, setSelectedProcessForAnalysis] = useState<any>(null);
  const [isEditProcessModalOpen, setIsEditProcessModalOpen] = useState(false);
  const [selectedProcessForEdit, setSelectedProcessForEdit] = useState<string | null>(null);
  const [isStandaloneUploadOpen, setIsStandaloneUploadOpen] = useState(false);
  const { toast } = useToast();

  // Check if we have a specific process ID in the URL
  const urlParams = new URLSearchParams(location.search);
  const processId = urlParams.get('id');

  useEffect(() => {
    if (processId) {
      fetchProcessDetails(processId);
    } else {
      fetchProcesses();
    }
  }, [processId]);

  const fetchProcessDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data: processData, error } = await supabase
        .from('processes')
        .select(`
          *,
          documents (
            id,
            file_name,
            file_path,
            file_type,
            file_size,
            document_type,
            status,
            uploaded_by,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Garantir progresso correto baseado em solicitações e atualizar processo
      try {
        await updateProcessProgress(id);
      } catch (e) {
        console.warn('[GerenciarProcessos] Falha ao recalcular progresso (não crítico):', e);
      }

      // Buscar status e progresso atualizados
      const { data: procStatus } = await supabase
        .from('processes')
        .select('status, progress')
        .eq('id', id)
        .single();

      const docs = processData.documents || [];

      setCurrentProcess({
        id: processData.id,
        project_name: processData.project_name,
        client_name: processData.client_name,
        client_email: processData.client_email,
        cpf_cnpj: processData.cpf_cnpj,
        process_type: processData.process_type,
        description: processData.description,
        status: procStatus?.status || processData.status,
        priority: processData.priority,
        progress: procStatus?.progress ?? processData.progress ?? 0,
        due_date: processData.due_date,
        created_at: processData.created_at,
        updated_at: processData.updated_at,
        company_id: processData.company_id,
        documents: docs
      });
      
      setNotes(processData.description || "");
    } catch (error) {
      console.error('Error fetching process details:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do processo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProcessNotes = async () => {
    if (!currentProcess) return;
    
    try {
      const { error } = await supabase
        .from('processes')
        .update({ description: notes })
        .eq('id', currentProcess.id);

      if (error) throw error;

      setCurrentProcess({...currentProcess, description: notes});
      setIsNotesModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Anotações atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar anotações",
        variant: "destructive",
      });
    }
  };

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      
      // Buscar IDs de processos acessíveis
      const { data: accessibleIds, error: accessError } = await supabase
        .rpc('get_accessible_process_ids');
      
      if (accessError) throw accessError;
      
      if (!accessibleIds || accessibleIds.length === 0) {
        setProcesses([]);
        setLoading(false);
        return;
      }
      
      const processIds = accessibleIds.map((item: any) => item.process_id);
      
      const { data: processesData, error } = await supabase
        .from('processes')
        .select(`
          *,
          documents (
            id,
            file_name,
            document_type,
            status,
            requires_signature,
            signature_status,
            created_at
          )
        `)
        .in('id', processIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedProcesses = processesData?.map(process => {
        const docs = process.documents || [];
        const total = docs.length;
        
        // Calcular progresso de forma consistente
        let calculatedProgress = 0;
        if (total > 0) {
          const progressSum = docs.reduce((sum: number, doc: any) => {
            let docProgress = 0;
            
            // Se requer assinatura, considerar status de assinatura
            if (doc.requires_signature) {
              switch (doc.signature_status) {
                case 'fully_signed':
                  docProgress = 100;
                  break;
                case 'partially_signed':
                  docProgress = 50;
                  break;
                case 'pending_client':
                case 'pending_company':
                  docProgress = 25;
                  break;
                default:
                  docProgress = 0;
              }
            } else {
              // Documentos sem assinatura, usar status normal
              switch (doc.status) {
                case 'Aprovado':
                  docProgress = 100;
                  break;
                case 'Pendente':
                  docProgress = 30;
                  break;
                case 'Em Análise':
                  docProgress = 60;
                  break;
                case 'Rejeitado':
                  docProgress = 0;
                  break;
                default:
                  docProgress = 0;
              }
            }
            
            return sum + docProgress;
          }, 0);
          
          calculatedProgress = Math.round(progressSum / total);
        }
        
        const receivedDocuments = docs.filter((doc: any) => doc.status === 'Aprovado' || doc.signature_status === 'fully_signed') || [];
        const pendingDocuments = docs.filter((doc: any) => doc.status === 'Pendente' || ['pending_client', 'pending_company', 'partially_signed'].includes(doc.signature_status)) || [];
        
        return {
          id: process.id,
          client: process.client_name,
          processType: process.project_name || process.process_type,
          description: process.description,
          dueDate: process.due_date ? new Date(process.due_date).toLocaleDateString('pt-BR') : 'Sem prazo',
          priority: process.priority?.toLowerCase() || 'medium',
          status: process.status,
          progress: Number(process.progress || 0),
          receivedDocuments: receivedDocuments.map((doc: any) => ({
            name: doc.document_type,
            status: "recebido",
            dateReceived: new Date(doc.created_at).toLocaleDateString('pt-BR'),
            url: "#"
          })),
          pendingDocuments: pendingDocuments.map((doc: any) => doc.document_type),
          lastContact: new Date(process.updated_at).toLocaleDateString('pt-BR')
        };
      }) || [];

      setProcesses(transformedProcesses);
    } catch (error) {
      console.error('Error fetching processes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar processos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Em andamento":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Pendente":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "alta":
        return "border-l-red-500";
      case "média":
        return "border-l-yellow-500";
      case "baixa":
        return "border-l-green-500";
      default:
        return "border-l-muted";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If we're viewing a specific process, show the detailed view
  if (processId && currentProcess && !loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/gerenciar-processos')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Processos
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {currentProcess.project_name || currentProcess.process_type}
                  </h1>
                  <p className="text-muted-foreground">
                    Cliente: {currentProcess.client_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(currentProcess.status)}>
                  {currentProcess.status}
                </Badge>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedProcessForEdit(currentProcess.id);
                      setIsEditProcessModalOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Processo
                  </Button>
                  <Button variant="outline" onClick={() => setIsNotesModalOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Anotações
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProcessForAnalysis(currentProcess);
                      setIsAIAnalysisModalOpen(true);
                    }}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Análise IA
                  </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Process Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                  <p className="text-sm">{currentProcess.client_name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm break-all">{currentProcess.client_email}</p>
                  </div>
                  <EmailResendButton
                    processId={currentProcess.id}
                    clientName={currentProcess.client_name}
                    clientEmail={currentProcess.client_email}
                    processName={currentProcess.project_name || currentProcess.process_type}
                  />
                  <div className="mt-2 p-3 bg-muted/30 rounded-lg border">
                    <Label className="text-xs font-medium text-muted-foreground">Link de Acesso do Cliente</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={`${window.location.origin}/cliente?id=${currentProcess.id}`}
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/cliente?id=${currentProcess.id}`);
                          toast({ title: "Link copiado!", description: "Link de acesso copiado para a área de transferência." });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Compartilhe este link com o cliente para acesso direto ao processo
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">CPF/CNPJ</Label>
                  <p className="text-sm">{currentProcess.cpf_cnpj || 'Não informado'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Process Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5" />
                  Detalhes do Processo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                  <p className="text-sm">{currentProcess.process_type}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Prioridade</Label>
                  <Badge variant={currentProcess.priority === 'Alta' ? 'destructive' : 
                              currentProcess.priority === 'Média' ? 'default' : 'secondary'}>
                    {currentProcess.priority}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Progresso</Label>
                  <div className="space-y-2">
                    <Progress value={currentProcess.progress} />
                    <p className="text-sm text-muted-foreground">{currentProcess.progress}% concluído</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                  <p className="text-sm">{formatDate(currentProcess.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Última atualização</Label>
                  <p className="text-sm">{formatDate(currentProcess.updated_at)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Prazo</Label>
                  <p className="text-sm">{formatDate(currentProcess.due_date)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Process Description/Notes */}
          {currentProcess.description && (
            <Card>
              <CardHeader>
                <CardTitle>Anotações do Processo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{currentProcess.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <ProcessTimeline currentStatus={currentProcess.status} />

          {/* Documentos, Anotações e Relatórios */}
          <div className="space-y-6">
            <DocumentList processId={currentProcess.id} refreshKey={Date.now()} />
            <ProcessNotes 
              processId={currentProcess.id} 
              companyId={currentProcess.company_id || ''}
            />
            {/* Relatórios de Documentos - agora abaixo das anotações */}
            <DocumentReport processId={currentProcess.id} refreshKey={Date.now()} />
          </div>
        </div>

        {/* Chat Interno Flutuante */}
        <InternalProcessChat 
          processId={currentProcess.id}
          companyId={currentProcess.company_id || ''}
        />

        {/* Notes Edit Modal */}
        <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Anotações do Processo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Anotações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione suas anotações sobre o processo..."
                  rows={6}
                  className="min-h-[150px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNotesModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={updateProcessNotes}>
                  Salvar Anotações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Analysis Modal */}
        <Dialog open={isAIAnalysisModalOpen} onOpenChange={setIsAIAnalysisModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Análise Inteligente de Documentos</DialogTitle>
            </DialogHeader>
            {selectedProcessForAnalysis && (
              <BusinessDocumentAnalyzer 
                companyId={selectedProcessForAnalysis.company_id || ''}
                processId={selectedProcessForAnalysis.id}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Process Modal */}
        <Dialog open={isEditProcessModalOpen} onOpenChange={setIsEditProcessModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Editar Processo</DialogTitle>
            </DialogHeader>
            {selectedProcessForEdit && (
              <ProcessEditDialog
                isOpen={isEditProcessModalOpen}
                processId={selectedProcessForEdit}
                onClose={() => {
                  setIsEditProcessModalOpen(false);
                  setSelectedProcessForEdit(null);
                }}
                onProcessUpdated={() => {
                  setIsEditProcessModalOpen(false);
                  setSelectedProcessForEdit(null);
                  if (processId) {
                    fetchProcessDetails(processId);
                  }
                }}
                onProcessDeleted={() => {
                  setIsEditProcessModalOpen(false);
                  setSelectedProcessForEdit(null);
                  if (processId) {
                    navigate('/gerenciar-processos');
                  }
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/empresa">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gerenciar Processos</h1>
                <p className="text-muted-foreground">Acompanhe o status dos documentos e comunique-se com os clientes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsStandaloneUploadOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Documento para Assinatura
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Documentos Pendentes de Assinatura */}
        <PendingSignatureDocuments />

        {/* Documentos Assinados */}
        <StandaloneSignedDocuments />
        
        {/* Processes List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando processos...</p>
            </div>
          ) : processes.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-muted p-4">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum processo disponível</h3>
                  <p className="text-muted-foreground max-w-md">
                    Você ainda não tem acesso a nenhum processo. Se você é um colaborador com acesso limitado, 
                    entre em contato com o administrador para solicitar permissões.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            processes.map((process) => (
            <Card key={process.id} className={`border-l-4 ${getPriorityColor(process.priority)} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => navigate(`/gerenciar-processos?id=${process.id}`)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{process.processType}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      Cliente: {process.client}
                    </p>
                    <div className="flex items-center space-x-3">
                      <DocumentProgressBattery 
                        progress={calculateProgressFromStatus(process.status)} 
                        size="md" 
                      />
                      <Badge className={getStatusColor(process.status)}>
                        {process.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Prazo: {process.dueDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProcessForEdit(process.id);
                        setIsEditProcessModalOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progresso do Processo</span>
                      <span className="text-sm text-muted-foreground">{calculateProgressFromStatus(process.status)}%</span>
                    </div>
                    <DocumentProgressBar 
                      progress={calculateProgressFromStatus(process.status)} 
                      height="medium" 
                      showPercentage={false}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Documentos Recebidos */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Documentos Recebidos ({process.receivedDocuments.length})
                      </h3>
                      <div className="space-y-2">
                        {process.receivedDocuments.slice(0, 3).map((doc: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Recebido em {doc.dateReceived}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {process.receivedDocuments.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{process.receivedDocuments.length - 3} documentos...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Documentos Pendentes */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-orange-500" />
                        Documentos Pendentes ({process.pendingDocuments.length})
                      </h3>
                      <div className="space-y-2">
                        {process.pendingDocuments.slice(0, 3).map((doc: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <div>
                                <p className="text-sm font-medium">{doc}</p>
                                <p className="text-xs text-muted-foreground">
                                  Último contato: {process.lastContact}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {process.pendingDocuments.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{process.pendingDocuments.length - 3} documentos...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
        
        {/* Process Edit Modal */}
        {selectedProcessForEdit && (
          <ProcessEditDialog
            isOpen={isEditProcessModalOpen}
            onClose={() => {
              setIsEditProcessModalOpen(false);
              setSelectedProcessForEdit(null);
            }}
            processId={selectedProcessForEdit}
            onProcessUpdated={() => {
              setIsEditProcessModalOpen(false);
              setSelectedProcessForEdit(null);
              if (processId) {
                fetchProcessDetails(processId);
              } else {
                fetchProcesses();
              }
            }}
            onProcessDeleted={() => {
              setIsEditProcessModalOpen(false);
              setSelectedProcessForEdit(null);
              if (processId) {
                navigate('/gerenciar-processos');
              } else {
                fetchProcesses();
              }
            }}
          />
        )}

        {/* AI Analysis Modal */}
        <Dialog open={isAIAnalysisModalOpen} onOpenChange={setIsAIAnalysisModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Análise Inteligente de Documentos</DialogTitle>
            </DialogHeader>
            {selectedProcessForAnalysis && (
              <BusinessDocumentAnalyzer 
                companyId={selectedProcessForAnalysis.company_id || ''}
                processId={selectedProcessForAnalysis.id}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Standalone Document Upload Modal */}
        <StandaloneDocumentUpload
          open={isStandaloneUploadOpen}
          onOpenChange={setIsStandaloneUploadOpen}
          onSuccess={() => {
            toast({
              title: 'Sucesso',
              description: 'Documento enviado para assinatura'
            });
          }}
        />
      </div>
    </div>
  );
};

export default GerenciarProcessos;