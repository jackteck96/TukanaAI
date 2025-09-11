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

const AreaCliente = () => {
  const clientInfo = {
    name: "TechCorp Ltda",
    email: "contato@techcorp.com",
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

  const activeProcesses = [
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
        return "border-l-muted bg-muted/50";
    }
  };

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [isDocumentDetailsModalOpen, setIsDocumentDetailsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isProcessDetailsModalOpen, setIsProcessDetailsModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<string>("");
  const [isRequestUploadModalOpen, setIsRequestUploadModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
  const [newCollaborator, setNewCollaborator] = useState({
    name: "",
    email: "",
    role: ""
  });
  const [companyPlan, setCompanyPlan] = useState({
    plan: "starter",
    currentUsers: 2,
    userLimit: 3
  });
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "",
    description: "",
    file: null as File | null
  });

  const collaborators = [
    {
      id: 1,
      name: "João Silva",
      email: "joao@techcorp.com",
      role: "Administrador",
      status: "Ativo",
      joinedAt: "2024-07-15"
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@techcorp.com", 
      role: "Colaborador",
      status: "Ativo",
      joinedAt: "2024-08-01"
    }
  ];

  const processDocuments = {
    1: [
      { id: 1, name: "Contrato Original.pdf", link: "/docs/contrato-original.pdf", status: "Aprovado" },
      { id: 2, name: "Proposta Comercial.pdf", link: "/docs/proposta-comercial.pdf", status: "Aprovado" },
      { id: 3, name: "Termo Aditivo.pdf", link: "/docs/termo-aditivo.pdf", status: "Em Análise" },
      { id: 4, name: "Comprovante de Pagamento.pdf", link: "/docs/comprovante-pagamento.pdf", status: "Pendente" }
    ],
    2: [
      { id: 5, name: "Balanço Patrimonial.pdf", link: "/docs/balanco-patrimonial.pdf", status: "Aprovado" },
      { id: 6, name: "DRE 2024.pdf", link: "/docs/dre-2024.pdf", status: "Em Análise" },
      { id: 7, name: "Certidões Negativas.pdf", link: "/docs/certidoes-negativas.pdf", status: "Pendente" }
    ],
    3: [
      { id: 8, name: "ISO 9001 Atual.pdf", link: "/docs/iso-9001.pdf", status: "Aprovado" },
      { id: 9, name: "Auditoria Interna.pdf", link: "/docs/auditoria-interna.pdf", status: "Pendente" }
    ]
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Documento enviado:", uploadForm);
    setIsUploadModalOpen(false);
    setUploadForm({ title: "", type: "", description: "", file: null });
  };

  const handleInviteCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyPlan.currentUsers >= companyPlan.userLimit) {
      toast.error("Limite de colaboradores atingido para o seu plano");
      return;
    }
    console.log("Convidando colaborador:", newCollaborator);
    toast.success("Convite enviado com sucesso!");
    setNewCollaborator({ name: "", email: "", role: "" });
  };

  const handleGenerateReport = (process: any) => {
    setSelectedProcess(process);
    setIsReportModalOpen(true);
  };

  const handleDownloadReport = () => {
    if (selectedProcess) {
      // Simular geração e download de PDF
      const reportContent = `
        RELATÓRIO DO PROCESSO
        
        Título: ${selectedProcess.title}
        Status: ${selectedProcess.status}
        Progresso: ${selectedProcess.progress}%
        Prazo: ${new Date(selectedProcess.dueDate).toLocaleDateString('pt-BR')}
        Empresa Responsável: ${selectedProcess.company}
        Advogado Responsável: ${selectedProcess.responsibleLawyer}
        
        Descrição: ${selectedProcess.description}
        
        Documentos: ${selectedProcess.documents} enviados, ${selectedProcess.pending} pendentes
        
        Data de Geração: ${new Date().toLocaleString('pt-BR')}
      `;
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${selectedProcess.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setIsReportModalOpen(false);
    }
  };

  const handleViewDocuments = (category: string) => {
    setSelectedDocumentCategory(category);
    setIsDocumentsModalOpen(true);
  };

  const handleViewProcess = (processId: number) => {
    const process = activeProcesses.find(p => p.id === processId);
    if (process) {
      setSelectedProcess(process);
      setIsProcessDetailsModalOpen(true);
    }
  };

  const handleViewDocumentDetails = (document: any) => {
    setSelectedDocument(document);
    setIsDocumentDetailsModalOpen(true);
  };

  const handleRequestUpload = (request: any) => {
    setSelectedRequest(request);
    setIsRequestUploadModalOpen(true);
  };

  const getDocumentsByCategory = (category: string) => {
    switch (category) {
      case "Documentos Enviados":
        return recentDocuments;
      case "Pendentes de Envio":
        return recentDocuments.filter(doc => doc.status === "Pendente Correção");
      case "Aprovados":
        return recentDocuments.filter(doc => doc.status === "Aprovado");
      case "Em Análise":
        return recentDocuments.filter(doc => doc.status === "Em Análise");
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Área do Cliente</h1>
              <p className="text-muted-foreground">Acompanhe seus processos e documentos</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Client Info Card */}
        <Card className="bg-gradient-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{clientInfo.name}</h2>
                  <p className="text-muted-foreground">{clientInfo.email}</p>
                  <p className="text-sm text-muted-foreground">{clientInfo.phone}</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {clientInfo.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="hover:shadow-card transition-all duration-300 cursor-pointer"
              onClick={() => handleViewDocuments(stat.title)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Processes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Processos Ativos</span>
              </CardTitle>
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
                      <h3 className="font-semibold text-foreground">
                        {process.title}
                      </h3>
                      <Badge className={getStatusColor(process.status)}>
                        {process.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {process.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{process.progress}%</span>
                      </div>
                      <Progress value={process.progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{process.documents} docs enviados • {process.pending} pendentes</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(process.dueDate).toLocaleDateString('pt-BR')}</span>
                        </span>
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
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateReport(process);
                          }}
                        >
                          <FileDown className="h-3 w-3 mr-1" />
                          Gerar Relatório
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Document Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>Documentos Solicitados</span>
              </CardTitle>
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
                          request.priority === "Alta" ? "border-red-500 text-red-600" :
                          request.priority === "Média" ? "border-yellow-500 text-yellow-600" :
                          "border-green-500 text-green-600"
                        }
                      >
                        {request.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {request.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-3">
                      <User className="h-3 w-3" />
                      <span>Solicitado por: <strong>{request.requestedBy}</strong></span>
                      <span>•</span>
                      <span>Processo: {request.processTitle}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Prazo: {new Date(request.dueDate).toLocaleDateString('pt-BR')}</span>
                      </span>
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
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestUpload(request);
                          }}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Enviar Documento
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Documentos Recentes</span>
              </CardTitle>
              <Button variant="ghost" size="sm">
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDocumentDetails(doc)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">{doc.name}</h4>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Baixando documento:", doc.name);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col" 
                onClick={() => handleViewDocuments("Documentos Enviados")}
              >
                <FileText className="h-6 w-6 mb-2" />
                <span className="text-xs">Meus Documentos</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col" 
                onClick={() => setIsCollaboratorsModalOpen(true)}
              >
                <User className="h-6 w-6 mb-2" />
                <span className="text-xs">Gerenciar Colaboradores</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => {
                  toast.success("Entre em contato pelo email: suporte@empresa.com ou telefone (11) 9999-9999");
                }}
              >
                <MessageSquare className="h-6 w-6 mb-2" />
                <span className="text-xs">Suporte</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Documento</DialogTitle>
            <DialogDescription>
              Selecione um arquivo para enviar. Formatos aceitos: PDF, DOC, DOCX, JPG, PNG.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <Label htmlFor="documentTitle">Título do Documento</Label>
              <Input
                id="documentTitle"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="Ex: Contrato Social Atualizado"
                required
              />
            </div>
            <div>
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <Select value={uploadForm.type} onValueChange={(value) => setUploadForm({ ...uploadForm, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="certidao">Certidão</SelectItem>
                  <SelectItem value="identificacao">Identificação</SelectItem>
                  <SelectItem value="comprovante">Comprovante</SelectItem>
                  <SelectItem value="declaracao">Declaração</SelectItem>
                  <SelectItem value="ata">Ata</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="documentFile">Arquivo</Label>
              <Input
                id="documentFile"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
              </p>
            </div>
            <div>
              <Label htmlFor="documentDescription">Observações</Label>
              <Textarea
                id="documentDescription"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Observações adicionais sobre o documento..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Enviar Documento</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document Details Modal */}
      <Dialog open={isDocumentDetailsModalOpen} onOpenChange={setIsDocumentDetailsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Documento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o documento selecionado.
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Nome do Arquivo</Label>
                <p className="text-sm text-muted-foreground">{selectedDocument.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tipo</Label>
                <p className="text-sm text-muted-foreground">{selectedDocument.type}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={getStatusColor(selectedDocument.status)}>
                  {selectedDocument.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Tamanho</Label>
                <p className="text-sm text-muted-foreground">{selectedDocument.size}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Data de Upload</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedDocument.uploadDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDocumentDetailsModalOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => console.log("Baixando documento:", selectedDocument.name)}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  <div className="space-y-2">
                    {processDocuments[selectedProcess.id]?.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{doc.name}</span>
                        </div>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
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

      {/* Documents by Category Modal */}
      <Dialog open={isDocumentsModalOpen} onOpenChange={setIsDocumentsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedDocumentCategory}</DialogTitle>
            <DialogDescription>
              Lista de documentos na categoria selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {getDocumentsByCategory(selectedDocumentCategory).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDocumentDetails(doc)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{doc.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Baixando documento:", doc.name);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {getDocumentsByCategory(selectedDocumentCategory).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento encontrado nesta categoria</p>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDocumentsModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Upload Modal */}
      <Dialog open={isRequestUploadModalOpen} onOpenChange={setIsRequestUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Documento Solicitado</DialogTitle>
            <DialogDescription>
              Envie o documento solicitado para o processo correspondente.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Documento Solicitado</Label>
                <p className="text-sm text-muted-foreground">{selectedRequest.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedRequest.description}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Solicitado por</Label>
                <p className="text-sm text-muted-foreground">{selectedRequest.requestedBy}</p>
                <p className="text-xs text-muted-foreground">Processo: {selectedRequest.processTitle}</p>
              </div>

              <div>
                <Label htmlFor="request-file">Arquivo *</Label>
                <Input
                  id="request-file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="request-description">Observações</Label>
                <Textarea
                  id="request-description"
                  placeholder="Adicione observações sobre o documento (opcional)"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsRequestUploadModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Documento
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Printer className="h-5 w-5" />
              <span>Relatório do Processo</span>
            </DialogTitle>
            <DialogDescription>
              Relatório detalhado com todas as informações do processo.
            </DialogDescription>
          </DialogHeader>
          {selectedProcess && (
            <div className="space-y-6">
              {/* Process Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedProcess.title}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={`ml-2 ${getStatusColor(selectedProcess.status)}`}>
                      {selectedProcess.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progresso:</span>
                    <span className="ml-2 font-medium">{selectedProcess.progress}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prazo:</span>
                    <span className="ml-2">{new Date(selectedProcess.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Documentos:</span>
                    <span className="ml-2">{selectedProcess.documents} enviados, {selectedProcess.pending} pendentes</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Descrição:</span>
                  <p className="mt-1">{selectedProcess.description}</p>
                </div>
              </div>

              <Separator />

              {/* Documents List */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Documentos Relacionados</h4>
                <div className="space-y-3">
                  {(processDocuments[selectedProcess.id as keyof typeof processDocuments] || []).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h5 className="font-medium text-foreground text-sm">{doc.name}</h5>
                          <Badge className={`${getStatusColor(doc.status)} text-xs`}>
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Simula download do documento
                            const link = document.createElement('a');
                            link.href = doc.link;
                            link.download = doc.name;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Report Actions */}
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  onClick={handleDownloadReport}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar Relatório PDF
                </Button>
              </div>
            </div>
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