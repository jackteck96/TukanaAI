import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Clock,
  CheckCircle,
  Download,
  Upload,
  AlertCircle,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  FileDown,
  ExternalLink,
  Printer,
  ArrowLeft,
  Mail,
  FileIcon
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DocumentUpload from "@/components/DocumentUpload";
import { toast } from "sonner";
import DocumentList from "@/components/DocumentList";
import DocumentReport from "@/components/DocumentReport";
import { CollaboratorsModal } from "./AreaClienteCollaborators";
import DocumentProgressBattery from "@/components/DocumentProgressBattery";
import ProcessTimeline from "@/components/ProcessTimeline";
import { calculateProgressFromStatus } from "@/utils/progressCalculator";
import ClientNotifications from "@/components/ClientNotifications";
import ProcessNotes from "@/components/ProcessNotes";
import TaskManager from "@/components/TaskManager";
import { TemplateSelector } from "@/components/TemplateSelector";
import { TemplateEditor } from "@/components/TemplateEditor";
import ClientTaskView from "@/components/ClientTaskView";
import DigitalSignatureManager from "@/components/DigitalSignatureManager";
import ClientDocumentRequests from "@/components/ClientDocumentRequests";

const AreaCliente = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Get process ID from URL (vindo do convite)
  const urlParams = new URLSearchParams(location.search);
  const inviteProcessId = urlParams.get('id');
  
  // Carregar perfil real do cliente
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*, company_id')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('[AreaCliente] fetch profile error', error);
        return;
      }
      setUserProfile(data);
      setCompanyId(data.company_id);
    };
    loadProfile();
  }, [user]);

  const clientInfo = {
    name: userProfile?.full_name || user?.email || "Cliente",
    email: userProfile?.email || user?.email || "",
    phone: "+55 (11) 9999-9999",
    status: "Ativo"
  };

  // Estatísticas reais calculadas
  const [realStats, setRealStats] = useState({
    totalDocuments: 0,
    pendingTasks: 0,
    approvedDocuments: 0,
    inReview: 0
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Em Análise":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Pendente":
      case "Aguardando Documentos":
      case "Pendente Correção":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "border-l-red-500 bg-red-50 dark:bg-red-950/50";
      case "Média":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/50";
      case "Baixa":
        return "border-l-green-500 bg-green-50 dark:bg-green-950/50";
      default:
        return "border-l-muted bg-muted/30";
    }
  };

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDocumentDetailsModalOpen, setIsDocumentDetailsModalOpen] = useState(false);
  const [isProcessDetailsModalOpen, setIsProcessDetailsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "",
    description: "",
    file: null as File | null
  });
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState("");
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [processDocuments, setProcessDocuments] = useState<any>({});
  // Carregar processos reais do cliente logado
  const [loadedProcesses, setLoadedProcesses] = useState<any[]>([]);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  // Carregar estatísticas reais
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.email) return;
      
      try {
        // Buscar todos os processos do cliente
        const { data: processesData } = await supabase
          .from('processes')
          .select('id')
          .eq('client_email', user.email);
        
        if (!processesData || processesData.length === 0) return;
        
        const processIds = processesData.map(p => p.id);
        
        // Buscar documentos
        const { data: documents } = await supabase
          .from('documents')
          .select('status')
          .in('process_id', processIds);
        
        // Buscar tarefas pendentes
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, status')
          .in('process_id', processIds)
          .eq('status', 'pending');
        
        const totalDocs = documents?.length || 0;
        const approved = documents?.filter(d => d.status === 'Aprovado').length || 0;
        const inReview = documents?.filter(d => d.status === 'Pendente').length || 0;
        const pendingTasks = tasks?.length || 0;
        
        setRealStats({
          totalDocuments: totalDocs,
          pendingTasks,
          approvedDocuments: approved,
          inReview
        });
      } catch (error) {
        console.error('[AreaCliente] Erro ao carregar estatísticas:', error);
      }
    };
    
    loadStats();
  }, [user?.email]);

  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      
      setLoadingProcesses(true);
      setProcessError(null);
      
      try {
        // Se há um inviteProcessId, carregar apenas esse processo
        if (inviteProcessId) {
          console.log('[AreaCliente] Carregando processo do convite:', inviteProcessId);
          
          const { data: processData, error: processError } = await supabase
            .from('processes')
            .select('id, project_name, description, status, progress, due_date, company_id, client_email')
            .eq('id', inviteProcessId)
            .single();
          
          if (processError || !processData) {
            console.error('[AreaCliente] Erro ao carregar processo do convite:', processError);
            setProcessError('Processo não encontrado ou você não tem acesso a ele.');
            return;
          }
          
          // Validar que o cliente tem acesso ao processo
          if (processData.client_email !== user.email) {
            console.error('[AreaCliente] Cliente não tem acesso ao processo');
            setProcessError('Você não tem acesso a este processo.');
            return;
          }
          
          // Buscar informações da empresa
          let companyName = 'Empresa não identificada';
          let companyLogo = null;
          
          if (processData.company_id) {
            const { data: companyData } = await supabase
              .from('companies')
              .select('name, logo_url')
              .eq('id', processData.company_id)
              .single();
            
            if (companyData) {
              companyName = companyData.name;
              companyLogo = companyData.logo_url;
            }
          }
          
          const mappedProcess = {
            id: processData.id,
            title: processData.project_name || 'Processo',
            description: processData.description || '',
            status: processData.status,
            progress: Number(processData.progress || 0),
            dueDate: processData.due_date,
            documents: 0,
            pending: 0,
            company: companyName,
            company_id: processData.company_id,
            company_logo: companyLogo,
            responsibleLawyer: ''
          };
          
          setLoadedProcesses([mappedProcess]);
          setSelectedProcess(mappedProcess);
          
          // Carregar documentos deste processo
          const { data: docs } = await supabase
            .from('documents')
            .select('id, file_name, document_type, status, created_at')
            .eq('process_id', inviteProcessId);
          
          const docsArr = (docs || []).map((d: any) => ({
            id: d.id,
            name: d.file_name,
            type: d.document_type,
            uploadDate: new Date(d.created_at).toLocaleDateString('pt-BR'),
            status: d.status,
            size: ''
          }));
          
          const pendingCount = docsArr.filter((x: any) =>
            String(x.status || '').toLowerCase().includes('pend')
          ).length;
          
          setProcessDocuments({ [inviteProcessId]: docsArr });
          setLoadedProcesses([{ ...mappedProcess, documents: docsArr.length, pending: pendingCount }]);
          
        } else {
          // Carregar todos os processos do cliente (comportamento padrão)
          const { data: procs, error } = await supabase
            .from('processes')
            .select('id, project_name, description, status, progress, due_date, company_id')
            .eq('client_email', user.email);
            
          if (error) {
            console.error('[AreaCliente] fetch processes error', error);
            setProcessError('Não foi possível carregar seus processos. Tente fazer login novamente.');
            return;
          }
          
          // Buscar informações das empresas
          const companyIds = [...new Set((procs || []).map((p: any) => p.company_id).filter(Boolean))];
          let companiesMap: Record<string, any> = {};
          
          if (companyIds.length > 0) {
            const { data: companies } = await supabase
              .from('companies')
              .select('id, name, logo_url')
              .in('id', companyIds);
            
            if (companies) {
              companiesMap = companies.reduce((acc: any, c: any) => {
                acc[c.id] = c;
                return acc;
              }, {});
            }
          }
          
          const mapped = (procs || []).map((p: any) => {
            const company = companiesMap[p.company_id];
            return {
              id: p.id,
              title: p.project_name || 'Processo',
              description: p.description || '',
              status: p.status,
              progress: Number(p.progress || 0),
              dueDate: p.due_date,
              documents: 0,
              pending: 0,
              company: company?.name || 'Empresa não identificada',
              company_id: p.company_id,
              company_logo: company?.logo_url,
              responsibleLawyer: ''
            };
          });
          
          setLoadedProcesses(mapped);
          if (mapped.length) {
            setSelectedProcess((prev: any) => prev ?? mapped[0]);
          }
          
          const ids = (procs || []).map((p: any) => p.id);
          if (ids.length) {
            const { data: docs } = await supabase
              .from('documents')
              .select('id, file_name, document_type, status, created_at, process_id')
              .in('process_id', ids);
            const docsByProcess: Record<string, any[]> = {};
            (docs || []).forEach((d: any) => {
              const item = {
                id: d.id,
                name: d.file_name,
                type: d.document_type,
                uploadDate: new Date(d.created_at).toLocaleDateString('pt-BR'),
                status: d.status,
                size: ''
              };
              const key = d.process_id;
              if (!docsByProcess[key]) docsByProcess[key] = [];
              docsByProcess[key].push(item);
            });
            setProcessDocuments((prev: any) => ({ ...prev, ...docsByProcess }));
            setLoadedProcesses((prev) =>
              prev.map((p) => {
                const docsArr = docsByProcess[p.id] || [];
                const pendingCount = docsArr.filter((x: any) =>
                  String(x.status || '').toLowerCase().includes('pend')
                ).length;
                return { ...p, documents: docsArr.length, pending: pendingCount };
              })
            );
          }
        }
      } catch (error) {
        console.error('[AreaCliente] Error loading processes:', error);
        setProcessError('Erro inesperado ao carregar dados. Tente novamente.');
      } finally {
        setLoadingProcesses(false);
      }
    };
    load();
  }, [user, inviteProcessId]);

  // Usar apenas processos reais, nunca mostrar dados mockados
  const activeProcesses = loadedProcesses;

  // Usar apenas documentos reais do processo selecionado
  const recentDocuments = selectedProcess ? (processDocuments[selectedProcess.id] || []) : [];

  // Remover dados mockados de solicitações pendentes - será implementado futuramente
  const pendingRequests: any[] = [];

  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([
    { id: 1, name: "João Silva", email: "joao@empresa.com", role: "Admin", status: "Ativo", joinedAt: "2024-01-15" },
    { id: 2, name: "Maria Santos", email: "maria@empresa.com", role: "Usuário", status: "Ativo", joinedAt: "2024-02-01" },
  ]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyPlan, setCompanyPlan] = useState({ currentUsers: 2, userLimit: 5, plan: "professional" });
  const [newCollaborator, setNewCollaborator] = useState({ name: "", email: "", role: "staff" });
  const [currentProcess, setCurrentProcess] = useState<any>(null);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load detailed process if inviteProcessId is in URL
  useEffect(() => {
    if (inviteProcessId && user?.email) {
      loadProcessDetails(inviteProcessId);
    }
  }, [inviteProcessId, user]);

  const loadProcessDetails = async (id: string) => {
    try {
      const { data: processData, error } = await supabase
        .from('processes')
        .select(`
          *,
          documents (
            id,
            file_name,
            file_path,
            file_type,
            document_type,
            status,
            created_at
          )
        `)
        .eq('id', id)
        .eq('client_email', user?.email)
        .single();

      if (error) throw error;
      if (!processData) {
        toast.error("Processo não encontrado ou você não tem permissão para acessá-lo");
        navigate('/area-cliente');
        return;
      }

      console.log('[AreaCliente] Processo carregado:', processData);

      // Buscar informações da empresa que solicitou os documentos
      if (processData.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('name, logo_url')
          .eq('id', processData.company_id)
          .single();
        
        console.log('[AreaCliente] Empresa carregada:', companyData, 'Erro:', companyError);
        
        if (!companyError && companyData) {
          (processData as any).company_name = companyData.name;
          (processData as any).company_logo = companyData.logo_url;
        } else {
          console.error('Erro ao carregar empresa:', companyError);
          // Se não conseguir carregar a empresa, tentar obter do perfil do criador
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('full_name, company_id')
            .eq('id', processData.created_by)
            .single();
          
          console.log('[AreaCliente] Perfil do criador:', creatorProfile);
          
          if (creatorProfile) {
            (processData as any).company_name = creatorProfile.full_name || 'Solicitante';
          }
        }
      }

      console.log('[AreaCliente] Processo final com empresa:', processData);
      setCurrentProcess(processData);
    } catch (error) {
      console.error('Error loading process details:', error);
      toast.error("Erro ao carregar detalhes do processo");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo de 10MB.");
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Enviando documento:", uploadForm);
    toast.success("Documento enviado com sucesso!");
    setIsUploadModalOpen(false);
    setUploadForm({ title: "", type: "", description: "", file: null });
  };

  const handleViewDocumentDetails = (doc: any) => {
    setSelectedDocument(doc);
    setIsDocumentDetailsModalOpen(true);
  };

  const handleViewProcess = (processId: string | number) => {
    const process = activeProcesses.find(p => String(p.id) === String(processId));
    if (process) {
      setSelectedProcess(process);
      setSelectedDocumentCategory("documents"); // Garantir que a aba de documentos seja aberta por padrão
      setIsProcessDetailsModalOpen(true);
    }
  };

  const handleGenerateReport = (process: any) => {
    console.log("Gerando relatório para:", process.title);
    toast.success("Relatório gerado com sucesso!");
  };

  const handleViewDocuments = (category: string) => {
    if (category === "Pendentes de Envio") {
      setSelectedDocumentCategory(category);
      setIsDocumentsModalOpen(true);
    } else {
      setSelectedDocumentCategory(category);
      setIsDocumentsModalOpen(true);
    }
  };

  const getDocumentsByCategory = (category: string) => {
    switch (category) {
      case "Documentos Enviados":
        return recentDocuments.filter(doc => doc.status === "Aprovado");
      case "Pendentes de Envio":
        return pendingRequests.map(req => ({
          id: req.id,
          name: req.title,
          type: "Pendente",
          uploadDate: req.dueDate,
          status: "Pendente",
          size: "-",
          processId: req.processId,
          processTitle: req.processTitle,
          priority: req.priority,
          requestedBy: req.requestedBy,
          description: req.description
        }));
      case "Aprovados":
        return recentDocuments.filter(doc => doc.status === "Aprovado");
      case "Em Análise":
        return recentDocuments.filter(doc => doc.status === "Em Análise");
      default:
        return recentDocuments;
    }
  };

  const handleInviteCollaborator = () => {
    if (collaborators.length >= companyPlan.userLimit) {
      toast.error(`Limite do plano atingido (${companyPlan.userLimit} usuários)`);
      return;
    }
    
    const newCollab = {
      id: Date.now(),
      name: newCollaborator.name,
      email: newCollaborator.email,
      role: newCollaborator.role === "admin" ? "Admin" : "Usuário",
      status: "Pendente",
      joinedAt: new Date().toISOString().split('T')[0]
    };
    
    setCollaborators([...collaborators, newCollab]);
    setNewCollaborator({ name: "", email: "", role: "staff" });
    toast.success("Convite enviado com sucesso!");
  };

  // If viewing a specific process, show detailed view
  if (inviteProcessId && currentProcess) {
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

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/area-cliente')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {currentProcess.project_name || currentProcess.process_type}
                  </h1>
                  <p className="text-muted-foreground">
                    Meu Processo
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(currentProcess.status)}>
                  {currentProcess.status}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Company Information - VISIBLE */}
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-2 border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {(currentProcess as any).company_logo && (
                  <div className="h-20 w-20 rounded-lg bg-white p-3 flex items-center justify-center shadow-md">
                    <img 
                      src={(currentProcess as any).company_logo} 
                      alt={(currentProcess as any).company_name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Processo solicitado por</p>
                  <h2 className="text-3xl font-bold text-foreground mb-1">
                    {(currentProcess as any).company_name || 'Carregando...'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe o andamento e envie os documentos solicitados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <Progress value={currentProcess.progress || 0} />
                    <p className="text-sm text-muted-foreground">{currentProcess.progress || 0}% concluído</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Datas Importantes
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

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{currentProcess.description || 'Sem descrição'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <ProcessTimeline currentStatus={currentProcess.status} />

          {/* Tabs Section */}
          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="tasks">Solicitações</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="templates">Modelos</TabsTrigger>
              <TabsTrigger value="notes">Anotações</TabsTrigger>
              <TabsTrigger value="signatures">Assinaturas</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              <ClientDocumentRequests 
                processId={currentProcess.id} 
                companyName={(currentProcess as any).company_name}
              />
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos do Processo</CardTitle>
                  <CardDescription>
                    Todos os documentos relacionados a este processo (exceto solicitações específicas)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Documentos gerais do processo</p>
                    <p className="text-sm mt-2">
                      Os documentos solicitados pela empresa estão na aba "Solicitações"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Modelos de Documentos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Utilize nossos modelos para criar documentos padronizados
                  </p>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsTemplateSelectorOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Selecionar Modelo
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <ProcessNotes 
                processId={currentProcess.id} 
                companyId={currentProcess.company_id || ''}
              />
            </TabsContent>

            <TabsContent value="signatures" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assinaturas Digitais</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Assine documentos digitalmente ou envie novos documentos para assinatura
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload de novo documento para assinatura */}
                  <div className="p-4 border-2 border-dashed rounded-lg bg-muted/30">
                    <div className="text-center space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Enviar Documento para Assinatura</p>
                        <p className="text-xs text-muted-foreground">
                          Envie um documento que você e a empresa precisam assinar
                        </p>
                      </div>
                      <DocumentUpload
                        processId={currentProcess.id}
                        onUploadComplete={() => {
                          loadProcessDetails(currentProcess.id);
                          setRefreshKey(prev => prev + 1);
                        }}
                      />
                    </div>
                  </div>

                  {/* Documentos existentes para assinatura */}
                  {currentProcess.documents && currentProcess.documents.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Documentos Disponíveis</h3>
                      {currentProcess.documents.map((doc: any) => (
                        <Card key={doc.id} className="border-l-4 border-l-primary">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              {doc.file_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Tipo: {doc.document_type} | Status: {doc.status}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <DigitalSignatureManager
                              documentId={doc.id}
                              processId={currentProcess.id}
                              documentName={doc.file_name}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum documento disponível para assinatura</p>
                        <p className="text-sm">Envie documentos primeiro na aba "Solicitações"</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Template Selector */}
        <TemplateSelector
          open={isTemplateSelectorOpen}
          onOpenChange={setIsTemplateSelectorOpen}
          companyId={currentProcess.company_id || ''}
          processData={currentProcess}
          onTemplateSelected={(template) => {
            setSelectedTemplate(template);
            setIsTemplateSelectorOpen(false);
            setIsTemplateEditorOpen(true);
          }}
        />

        {/* Template Editor */}
        {selectedTemplate && (
          <TemplateEditor
            open={isTemplateEditorOpen}
            onOpenChange={setIsTemplateEditorOpen}
            template={selectedTemplate}
            processId={currentProcess.id}
            processData={currentProcess}
            companyId={currentProcess.company_id || ''}
            onDocumentCreated={() => {
              setRefreshKey(prev => prev + 1);
              setIsTemplateEditorOpen(false);
              setSelectedTemplate(null);
              toast.success("Documento criado com sucesso!");
            }}
          />
        )}
      </div>
    );
  }

  // Default dashboard view (list of processes)
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">Fuzen</span>
              </div>
              <div className="hidden md:block">
                <span className="text-sm text-muted-foreground">
                  Área do Cliente - {clientInfo.name}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Meu Perfil</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Nome</Label>
                      <p className="text-sm text-muted-foreground">{clientInfo.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{clientInfo.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Telefone</Label>
                      <p className="text-sm text-muted-foreground">{clientInfo.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant="outline">{clientInfo.status}</Badge>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Erro de carregamento */}
        {processError && (
          <Card className="mb-8 border-destructive">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <h3 className="font-medium text-foreground">Problema de Acesso</h3>
                    <p className="text-sm text-muted-foreground">{processError}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}
                >
                  Fazer Login Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loadingProcesses && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Carregando seus processos...</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Documentos Enviados
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {realStats.totalDocuments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendentes de Envio
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {realStats.pendingTasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Aprovados
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {realStats.approvedDocuments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Em Análise
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {realStats.inReview}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Notifications */}
        <ClientNotifications className="mb-8" />

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                className="h-12 justify-start"
                variant="outline"
                onClick={() => handleViewDocuments("Pendentes de Envio")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Meus Documentos
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="h-12 justify-start" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Suporte
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Suporte ao Cliente</DialogTitle>
                    <DialogDescription>
                      Entre em contato conosco para qualquer dúvida ou suporte técnico.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Email de Suporte</Label>
                      <p className="text-sm text-muted-foreground">suporte@fuzen.online</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Telefone</Label>
                      <p className="text-sm text-muted-foreground">+55 (11) 3333-4444</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Horário de Atendimento</Label>
                      <p className="text-sm text-muted-foreground">
                        Segunda a Sexta: 9h às 18h<br />
                        Sábado: 9h às 12h
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                className="h-12 justify-start"
                variant="outline"
                onClick={() => setIsCollaboratorsModalOpen(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Gerenciar Colaboradores
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Processes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Processos Ativos</CardTitle>
              <Badge variant="outline">
                {activeProcesses.length} processos
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeProcesses.map((process) => (
                  <div
                    key={process.id}
                    className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/area-cliente?id=${process.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-foreground">
                          {process.title}
                        </h3>
                        <DocumentProgressBattery 
                          progress={calculateProgressFromStatus(process.status)} 
                          size="md" 
                        />
                      </div>
                      <Badge className={getStatusColor(process.status)}>
                        {process.status}
                      </Badge>
                    </div>
                    {process.company && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Empresa:</span>
                        <span className="text-xs text-foreground font-semibold">{process.company}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-3">
                      {process.description}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(process.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {process.documents} docs
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Progress value={process.progress} className="h-2 flex-1" />
                      <span className="text-xs font-medium">{process.progress}%</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/area-cliente?id=${process.id}`);
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProcess(process);
                          setIsUploadModalOpen(true);
                        }}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Enviar Doc
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pendentes de Envio</CardTitle>
              <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                {pendingRequests.length} pendentes
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer hover:bg-muted/30 transition-colors ${getPriorityColor(request.priority)}`}
                    onClick={() => navigate(`/area-cliente?id=${request.processId}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground text-sm">
                        {request.title}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={
                          request.priority === "Alta" ? "border-red-500 text-red-700 dark:text-red-400" :
                          request.priority === "Média" ? "border-yellow-500 text-yellow-700 dark:text-yellow-400" :
                          "border-green-500 text-green-700 dark:text-green-400"
                        }
                      >
                        {request.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {request.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>Solicitado por: {request.requestedBy}</span>
                      <span>Prazo: {new Date(request.dueDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      Processo: {request.processTitle}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProcess(request.processId);
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver Processo
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Encontrar processo pelo processId da solicitação
                          const process = activeProcesses.find(p => String(p.id) === String(request.processId));
                          if (process) setSelectedProcess(process);
                          setIsUploadModalOpen(true);
                        }}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documentos Recentes</CardTitle>
            <div className="flex space-x-2">
              {["Enviados", "Aprovados", "Em Análise"].map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDocuments(`Documentos ${category}`)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {recentDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum documento encontrado</p>
                <p className="text-sm">Seus documentos aparecerão aqui quando forem adicionados aos processos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.type} • {doc.uploadDate}
                        </p>
                      </div>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Process Details Modal */}
      <Dialog open={isProcessDetailsModalOpen} onOpenChange={setIsProcessDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Processo</DialogTitle>
            <DialogDescription>
              Informações completas sobre o processo, documentos e comunicações.
            </DialogDescription>
          </DialogHeader>
          {selectedProcess && (
            <div className="space-y-4">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Título</Label>
                  <p className="text-sm font-medium">{selectedProcess.title}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedProcess.status)}>
                    {selectedProcess.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Progresso</Label>
                  <div className="flex items-center space-x-2">
                    <Progress value={selectedProcess.progress} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{selectedProcess.progress}%</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Empresa Responsável</Label>
                  <p className="text-sm">{selectedProcess.company}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Advogado</Label>
                  <p className="text-sm">{selectedProcess.responsibleLawyer}</p>
                </div>
              </div>

              {/* Tabs for Documents and Communication */}
              <div className="border-b">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setSelectedDocumentCategory("documents")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedDocumentCategory === "documents" || !selectedDocumentCategory
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    }`}
                  >
                    Documentos ({processDocuments[selectedProcess.id]?.length || 0})
                  </button>
                  <button
                    onClick={() => setSelectedDocumentCategory("notes")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedDocumentCategory === "notes"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                    }`}
                  >
                    Comunicação
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
                {(!selectedDocumentCategory || selectedDocumentCategory === "documents") && (
                  <div className="space-y-6">
                    <ProcessTimeline currentStatus={selectedProcess.status} />
                    <div className="space-y-2">
                      {processDocuments[selectedProcess.id]?.length ? (
                        processDocuments[selectedProcess.id].map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{doc.name}</span>
                              <DocumentProgressBattery 
                                progress={calculateProgressFromStatus(doc.status)} 
                                size="sm" 
                              />
                            </div>
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum documento enviado ainda</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedDocumentCategory === "notes" && (
                  <ProcessNotes 
                    processId={selectedProcess.id} 
                    companyId={companyId || ''}
                  />
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsProcessDetailsModalOpen(false)}>
                  Fechar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsProcessDetailsModalOpen(false);
                    setIsUploadModalOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Documento
                </Button>
                <Button onClick={() => {
                  setIsProcessDetailsModalOpen(false);
                  handleGenerateReport(selectedProcess);
                }}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
            <DialogDescription>
              Envie um documento para o processo selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedProcess && (
            <DocumentUpload
              processId={String(selectedProcess.id)}
              onUploadComplete={() => {
                setIsUploadModalOpen(false);
                // Recarregar documentos
                const load = async () => {
                  if (!user?.email) return;
                  const { data: procs } = await supabase
                    .from('processes')
                    .select('id')
                    .eq('client_email', user.email);
                  const ids = (procs || []).map((p: any) => p.id);
                  if (ids.length) {
                    const { data: docs } = await supabase
                      .from('documents')
                      .select('id, file_name, document_type, status, created_at, process_id')
                      .in('process_id', ids);
                    const docsByProcess: Record<string, any[]> = {};
                    (docs || []).forEach((d: any) => {
                      const item = {
                        id: d.id,
                        name: d.file_name,
                        type: d.document_type,
                        uploadDate: new Date(d.created_at).toLocaleDateString('pt-BR'),
                        status: d.status,
                        size: ''
                      };
                      const key = d.process_id;
                      if (!docsByProcess[key]) docsByProcess[key] = [];
                      docsByProcess[key].push(item);
                    });
                    setProcessDocuments((prev: any) => ({ ...prev, ...docsByProcess }));
                  }
                };
                load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Collaborators Modal */}
      <CollaboratorsModal
        isOpen={isCollaboratorsModalOpen}
        onClose={() => setIsCollaboratorsModalOpen(false)}
        collaborators={collaborators}
        companyPlan={companyPlan}
        newCollaborator={newCollaborator}
        setNewCollaborator={setNewCollaborator}
        onInvite={handleInviteCollaborator}
      />
    </div>
  );
};

export default AreaCliente;
