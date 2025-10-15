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
  Settings
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CreateProcessWithInvite from "@/components/CreateProcessWithInvite";
import DocumentList from "@/components/DocumentList";
import DocumentProgressBattery from "@/components/DocumentProgressBattery";
import DocumentProgressBar from "@/components/DocumentProgressBar";
import ProcessTimeline from "@/components/ProcessTimeline";
import EmailResendButton from "@/components/EmailResendButton";

import ProcessNotes from "@/components/ProcessNotes";
import { BusinessDocumentAnalyzer } from "@/components/BusinessDocumentAnalyzer";
import ProcessEditDialog from "@/components/ProcessEditDialog";
import { calculateProgressFromStatus } from "@/utils/progressCalculator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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

      // Calcular progresso baseado nos documentos
      const docs = processData.documents || [];
      const total = docs.length;
      const approved = docs.filter((d: any) => d.status === 'Aprovado').length;
      const calculatedProgress = total > 0 ? Math.round((approved / total) * 100) : 0;

      setCurrentProcess({
        id: processData.id,
        project_name: processData.project_name,
        client_name: processData.client_name,
        client_email: processData.client_email,
        cpf_cnpj: processData.cpf_cnpj,
        process_type: processData.process_type,
        description: processData.description,
        status: processData.status,
        priority: processData.priority,
        progress: calculatedProgress,
        due_date: processData.due_date,
        created_at: processData.created_at,
        updated_at: processData.updated_at,
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
      const { data: processesData, error } = await supabase
        .from('processes')
        .select(`
          *,
          documents (
            id,
            file_name,
            document_type,
            status,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedProcesses = processesData?.map(process => {
        const receivedDocuments = process.documents?.filter(doc => doc.status === 'Aprovado') || [];
        const pendingDocuments = process.documents?.filter(doc => doc.status === 'Pendente') || [];
        
        return {
          id: process.id,
          client: process.client_name,
          processType: process.process_type,
          description: process.description,
          dueDate: process.due_date ? new Date(process.due_date).toLocaleDateString('pt-BR') : 'Sem prazo',
          priority: process.priority?.toLowerCase() || 'medium',
          status: process.status,
          progress: process.progress || 0,
          receivedDocuments: receivedDocuments.map(doc => ({
            name: doc.document_type,
            status: "recebido",
            dateReceived: new Date(doc.created_at).toLocaleDateString('pt-BR'),
            url: "#"
          })),
          pendingDocuments: pendingDocuments.map(doc => doc.document_type),
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

          {/* Documents, Notes and Email Log Section */}
          <div className="space-y-6">
            <DocumentList processId={currentProcess.id} refreshKey={Date.now()} />
            <ProcessNotes 
              processId={currentProcess.id} 
              companyId={currentProcess.company_id || ''}
            />
          </div>
        </div>

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
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Create Process Button */}
        <CreateProcessWithInvite onProcessCreated={fetchProcesses} />
        
        {/* Processes List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando processos...</p>
            </div>
          ) : processes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum processo encontrado. Crie seu primeiro processo acima.</p>
            </div>
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
      </div>
    </div>
  );
};

export default GerenciarProcessos;