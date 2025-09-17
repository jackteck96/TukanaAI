import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
  Printer
} from "lucide-react";
import { Link } from "react-router-dom";
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

const AreaCliente = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Carregar perfil real do cliente
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('[AreaCliente] fetch profile error', error);
        return;
      }
      setUserProfile(data);
    };
    loadProfile();
  }, [user]);

  const clientInfo = {
    name: userProfile?.full_name || user?.email || "Cliente",
    email: userProfile?.email || user?.email || "",
    phone: "+55 (11) 9999-9999",
    status: "Ativo"
  };

  const stats = [
    {
      title: "Documentos Enviados",
      value: "24",
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Pendentes de Envio",
      value: "3",
      icon: Clock,
      color: "text-orange-500"
    },
    {
      title: "Aprovados",
      value: "18",
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Em Análise",
      value: "3",
      icon: AlertCircle,
      color: "text-yellow-500"
    }
  ];

  let activeProcesses: any[] = [
    {
      id: 1,
      title: "Contrato de Prestação de Serviços",
      description: "Renovação anual do contrato principal",
      status: "Em Análise",
      progress: 75,
      dueDate: "2024-08-24",
      documents: 12,
      pending: 2,
      company: "Silva & Associados Advocacia",
      responsibleLawyer: "Dr. Carlos Silva"
    },
    {
      id: 2,
      title: "Documentação Fiscal 2024",
      description: "Documentos para declaração anual",
      status: "Pendente",
      progress: 30,
      dueDate: "2024-08-26",
      documents: 8,
      pending: 5,
      company: "Santos Consultoria Jurídica",
      responsibleLawyer: "Dra. Ana Santos"
    },
    {
      id: 3,
      title: "Certificações de Qualidade",
      description: "Renovação de certificados ISO",
      status: "Aguardando Documentos",
      progress: 20,
      dueDate: "2024-08-30",
      documents: 4,
      pending: 8,
      company: "Lima & Partners",
      responsibleLawyer: "Dr. Roberto Lima"
    }
  ];

  const recentDocuments = [
    {
      id: 1,
      name: "Contrato Social Atualizado.pdf",
      type: "Contrato",
      uploadDate: "2024-08-15",
      status: "Aprovado",
      size: "2.4 MB"
    },
    {
      id: 2,
      name: "Balanço Patrimonial Q2.pdf",
      type: "Financeiro",
      uploadDate: "2024-08-14",
      status: "Em Análise",
      size: "1.8 MB"
    },
    {
      id: 3,
      name: "Certidão Negativa Federal.pdf",
      type: "Certidão",
      uploadDate: "2024-08-13",
      status: "Aprovado",
      size: "512 KB"
    },
    {
      id: 4,
      name: "RG Representante Legal.pdf",
      type: "Identificação",
      uploadDate: "2024-08-12",
      status: "Pendente Correção",
      size: "1.2 MB"
    }
  ];

  const pendingRequests = [
    {
      id: 1,
      title: "Comprovante de Endereço Atualizado",
      description: "Documento com data dos últimos 90 dias",
      dueDate: "2024-08-20",
      priority: "Alta",
      requestedBy: "Dr. Carlos Silva",
      processId: 1,
      processTitle: "Contrato de Prestação de Serviços"
    },
    {
      id: 2,
      title: "Declaração de Faturamento",
      description: "Declaração assinada pelo contador",
      dueDate: "2024-08-22",
      priority: "Média",
      requestedBy: "Dra. Ana Santos",
      processId: 2,
      processTitle: "Documentação Fiscal 2024"
    },
    {
      id: 3,
      title: "Ata da Última Assembleia",
      description: "Documento autenticado em cartório",
      dueDate: "2024-08-25",
      priority: "Baixa",
      requestedBy: "Dr. Roberto Lima",
      processId: 3,
      processTitle: "Certificações de Qualidade"
    }
  ];

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

  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      
      setLoadingProcesses(true);
      setProcessError(null);
      
      try {
        const { data: procs, error } = await supabase
          .from('processes')
          .select('id, project_name, description, status, progress, due_date')
          .eq('client_email', user.email);
          
        if (error) {
          console.error('[AreaCliente] fetch processes error', error);
          setProcessError('Não foi possível carregar seus processos. Tente fazer login novamente.');
          return;
        }
        
        const mapped = (procs || []).map((p: any) => ({
          id: p.id,
          title: p.project_name || 'Processo',
          description: p.description || '',
          status: p.status,
          progress: Number(p.progress || 0),
          dueDate: p.due_date,
          documents: 0,
          pending: 0,
          company: '',
          responsibleLawyer: ''
        }));
        
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
      } catch (error) {
        console.error('[AreaCliente] Error loading processes:', error);
        setProcessError('Erro inesperado ao carregar dados. Tente novamente.');
      } finally {
        setLoadingProcesses(false);
      }
    };
    load();
  }, [user]);

  // Substituir mocks pelos processos reais quando disponíveis
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activeProcesses = loadedProcesses.length ? loadedProcesses : activeProcesses;

  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
  const [collaborators, setCollaborators] = useState([
    { id: 1, name: "João Silva", email: "joao@empresa.com", role: "Admin", status: "Ativo", joinedAt: "2024-01-15" },
    { id: 2, name: "Maria Santos", email: "maria@empresa.com", role: "Usuário", status: "Ativo", joinedAt: "2024-02-01" },
  ]);
  const [companyPlan, setCompanyPlan] = useState({ currentUsers: 2, userLimit: 5, plan: "professional" });
  const [newCollaborator, setNewCollaborator] = useState({ name: "", email: "", role: "staff" });

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
                <span className="text-xl font-bold text-foreground">DocFlow</span>
              </div>
              <div className="hidden md:block">
                <span className="text-sm text-muted-foreground">
                  Área do Cliente - {clientInfo.name}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Link>
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
                  onClick={() => {
                    supabase.auth.signOut();
                    window.location.href = '/auth';
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
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center p-6">
                <div className="flex items-center">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                      <p className="text-sm text-muted-foreground">suporte@docflow.com</p>
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
                    onClick={() => handleViewProcess(process.id)}
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
                          handleViewProcess(process.id);
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
                    onClick={() => handleViewProcess(request.processId)}
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
            <div className="space-y-3">
              {recentDocuments.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDocumentDetails(doc)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} • {doc.size} • {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(doc.status)}>
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
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
                  <div className="space-y-4">
                    {/* Add new note */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Adicione uma observação..."
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                        className="min-h-[60px]"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => {
                          if (uploadForm.description.trim()) {
                            console.log("Nova observação:", uploadForm.description);
                            setUploadForm({ ...uploadForm, description: "" });
                          }
                        }}
                        disabled={!uploadForm.description.trim()}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>

                    <Separator />

                    {/* Notes history */}
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/30 rounded border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">Dr. Carlos Silva</span>
                          <span className="text-xs text-muted-foreground">15/08 14:30</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Documento aprovado. Aguardamos declaração de faturamento.
                        </p>
                      </div>
                      
                      <div className="p-3 bg-muted/30 rounded border-l-4 border-l-green-500">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">Você</span>
                          <span className="text-xs text-muted-foreground">14/08 16:45</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Comprovante enviado. Declaração será enviada amanhã.
                        </p>
                      </div>
                    </div>
                  </div>
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
