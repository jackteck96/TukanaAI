import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  PenTool
} from "lucide-react";
import { Link } from "react-router-dom";
import { PdfConverter } from "@/components/PdfConverter";

const ClientDashboard = () => {
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
      color: "text-blue-600"
    },
    {
      title: "Pendentes de Envio",
      value: "3",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Aprovados",
      value: "18",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Em Análise",
      value: "3",
      icon: AlertCircle,
      color: "text-yellow-600"
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
      pending: 2
    },
    {
      id: 2,
      title: "Documentação Fiscal 2024",
      description: "Documentos para declaração anual",
      status: "Pendente",
      progress: 30,
      dueDate: "2024-08-26",
      documents: 8,
      pending: 5
    },
    {
      id: 3,
      title: "Certificações de Qualidade",
      description: "Renovação de certificados ISO",
      status: "Aguardando Documentos",
      progress: 20,
      dueDate: "2024-08-30",
      documents: 4,
      pending: 8
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
      priority: "Alta"
    },
    {
      id: 2,
      title: "Declaração de Faturamento",
      description: "Declaração assinada pelo contador",
      dueDate: "2024-08-22",
      priority: "Média"
    },
    {
      id: 3,
      title: "Ata da Última Assembleia",
      description: "Documento autenticado em cartório",
      dueDate: "2024-08-25",
      priority: "Baixa"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "bg-green-100 text-green-800";
      case "Em Análise":
        return "bg-blue-100 text-blue-800";
      case "Pendente":
      case "Aguardando Documentos":
      case "Pendente Correção":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "border-l-red-500 bg-red-50";
      case "Média":
        return "border-l-yellow-500 bg-yellow-50";
      case "Baixa":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-300 bg-gray-50";
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
              <Button variant="hero">
                <Upload className="h-4 w-4 mr-2" />
                Enviar Documento
              </Button>
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
              <Badge className="bg-green-100 text-green-800">
                {clientInfo.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-card transition-all duration-300">
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
                    className={`p-4 rounded-lg border-l-4 ${getPriorityColor(request.priority)}`}
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
                    <p className="text-sm text-muted-foreground mb-3">
                      {request.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Prazo: {new Date(request.dueDate).toLocaleDateString('pt-BR')}</span>
                      </span>
                      <Button size="sm" variant="outline">
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Documentos Recentes</span>
              </CardTitle>
              <Link to="/meus-documentos">
                <Button variant="ghost" size="sm">
                  Ver Todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
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
                    <Button variant="ghost" size="sm">
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <PdfConverter />
              <Link to="/cliente?tab=assinaturas" className="block">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <PenTool className="h-6 w-6 mb-2" />
                  <span className="text-xs">Assinaturas</span>
                </Button>
              </Link>
              <Button variant="outline" className="h-20 flex-col">
                <Upload className="h-6 w-6 mb-2" />
                <span className="text-xs">Enviar Documento</span>
              </Button>
              <Link to="/meus-documentos" className="block">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-xs">Meus Documentos</span>
                </Button>
              </Link>
              <Button variant="outline" className="h-20 flex-col">
                <MessageSquare className="h-6 w-6 mb-2" />
                <span className="text-xs">Suporte</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;