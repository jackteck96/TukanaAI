import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

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
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "",
    description: "",
    file: null as File | null
  });

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
              <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Documento
                  </Button>
                </DialogTrigger>
              </Dialog>
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
                      <Button size="sm" variant="outline" onClick={() => setIsUploadModalOpen(true)}>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col" onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="h-6 w-6 mb-2" />
                <span className="text-xs">Enviar Documento</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span className="text-xs">Meus Documentos</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MessageSquare className="h-6 w-6 mb-2" />
                <span className="text-xs">Suporte</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <User className="h-6 w-6 mb-2" />
                <span className="text-xs">Meu Perfil</span>
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
    </div>
  );
};

export default AreaCliente;