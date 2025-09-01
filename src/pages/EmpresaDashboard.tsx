import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import PontoClock from "@/components/PontoClock";
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Filter,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  LogOut,
  Brain
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const EmpresaDashboard = () => {
  const { profile, signOut } = useAuth();
  const stats = [
    {
      title: "Total de Clientes",
      value: "156",
      change: "+12%",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Documentos Ativos",
      value: "2.847",
      change: "+8%",
      icon: FileText,
      color: "text-accent"
    },
    {
      title: "Pendentes",
      value: "23",
      change: "-15%",
      icon: Clock,
      color: "text-orange-500"
    },
    {
      title: "Concluídos Hoje",
      value: "89",
      change: "+22%",
      icon: CheckCircle,
      color: "text-green-500"
    }
  ];

  const recentClients = [
    {
      id: 1,
      name: "TechCorp Ltda",
      status: "Documentos Pendentes",
      documents: 12,
      lastUpdate: "2 horas atrás",
      priority: "high"
    },
    {
      id: 2,
      name: "Inovação Digital",
      status: "Em Análise",
      documents: 8,
      lastUpdate: "4 horas atrás",
      priority: "medium"
    },
    {
      id: 3,
      name: "Consultoria Moderna",
      status: "Aprovado",
      documents: 15,
      lastUpdate: "1 dia atrás",
      priority: "low"
    },
    {
      id: 4,
      name: "StartupXYZ",
      status: "Documentos Pendentes",
      documents: 6,
      lastUpdate: "2 dias atrás",
      priority: "high"
    }
  ];

  const recentProcesses = [
    {
      id: 1,
      client: "TechCorp Ltda",
      process: "Contrato de Prestação de Serviços",
      status: "Em Análise",
      progress: 75,
      dueDate: "24/08/2024"
    },
    {
      id: 2,
      client: "Inovação Digital",
      process: "Documentação Fiscal",
      status: "Pendente",
      progress: 30,
      dueDate: "26/08/2024"
    },
    {
      id: 3,
      client: "Consultoria Moderna",
      process: "Renovação de Licenças",
      status: "Aprovado",
      progress: 100,
      dueDate: "20/08/2024"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
      case "Concluído":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Em Análise":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Pendente":
      case "Documentos Pendentes":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-muted";
    }
  };

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: ""
  });
  const [processForm, setProcessForm] = useState({
    client: "",
    processType: "",
    description: "",
    dueDate: "",
    priority: "",
    requiredDocuments: [] as string[]
  });

  const availableDocuments = [
    "RG", "CPF", "Comprovante de Residência", "Carteira de Trabalho",
    "Contrato Social", "CNPJ", "Inscrição Estadual", "Alvará de Funcionamento",
    "Declaração de Imposto de Renda", "Comprovante de Renda", "Certidão de Nascimento",
    "Certidão de Casamento", "Procuração", "Contrato de Prestação de Serviços"
  ];

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Novo cliente:", clientForm);
    setIsClientModalOpen(false);
    setClientForm({ name: "", email: "", phone: "", company: "", status: "" });
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Novo processo:", processForm);
    setIsProcessModalOpen(false);
    setProcessForm({ client: "", processType: "", description: "", dueDate: "", priority: "", requiredDocuments: [] });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Dashboard - {profile?.company?.name || 'Empresa'}
              </h1>
              <p className="text-muted-foreground">
                Bem-vindo, {profile?.name} - Visão geral dos processos e clientes
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Processo
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
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
                    <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} vs mês anterior
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
          {/* Recent Clients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Clientes Recentes</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button variant="ghost" size="sm">
                    Ver Todos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-4 rounded-lg border-l-4 ${getPriorityColor(client.priority)} bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{client.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {client.documents} documentos
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Atualizado {client.lastUpdate}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Processes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Processos em Andamento</span>
                </CardTitle>
                <Button variant="ghost" size="sm">
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProcesses.map((process) => (
                  <div
                    key={process.id}
                    className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground text-sm">
                        {process.process}
                      </h3>
                      <Badge className={getStatusColor(process.status)}>
                        {process.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Cliente: {process.client}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${process.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {process.progress}% concluído
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Prazo: {process.dueDate}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ponto Clock and Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ponto Clock */}
          <div>
            <PontoClock />
          </div>

          {/* Quick Actions - taking 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Button variant="outline" className="h-20 flex-col" onClick={() => setIsClientModalOpen(true)}>
                    <Plus className="h-6 w-6 mb-2" />
                    <span className="text-xs">Novo Cliente</span>
                  </Button>
                  <Link to="/gerenciar-processos">
                    <Button variant="outline" className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-xs">Gerenciar Processos</span>
                    </Button>
                  </Link>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => setIsSearchModalOpen(true)}>
                    <Search className="h-6 w-6 mb-2" />
                    <span className="text-xs">Buscar Documentos</span>
                  </Button>
                  <Link to="/relatorios">
                    <Button variant="outline" className="h-20 flex-col">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      <span className="text-xs">Relatórios</span>
                    </Button>
                  </Link>
                  <Link to="/todos-clientes">
                    <Button variant="outline" className="h-20 flex-col">
                      <Users className="h-6 w-6 mb-2" />
                      <span className="text-xs">Todos os Clientes</span>
                    </Button>
                  </Link>
                  <Link to="/modelos-documentos">
                    <Button variant="outline" className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-xs">Modelos de Documentos</span>
                    </Button>
                  </Link>
                  <Link to="/treinar-ia">
                    <Button variant="outline" className="h-20 flex-col">
                      <Brain className="h-6 w-6 mb-2" />
                      <span className="text-xs">Treinar IA</span>
                    </Button>
                  </Link>
                  <Link to="/cadastro-tipos-documentos">
                    <Button variant="outline" className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-xs">Tipos de Documentos</span>
                    </Button>
                  </Link>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => setIsConfigModalOpen(true)}>
                    <MoreHorizontal className="h-6 w-6 mb-2" />
                    <span className="text-xs">Configurações</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleClientSubmit} className="space-y-4">
            <div>
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">E-mail</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientPhone">Telefone</Label>
              <Input
                id="clientPhone"
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="clientCompany">Empresa</Label>
              <Input
                id="clientCompany"
                value={clientForm.company}
                onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="clientStatus">Status</Label>
              <Select value={clientForm.status} onValueChange={(value) => setClientForm({ ...clientForm, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsClientModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Cadastrar Cliente</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Processo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProcessSubmit} className="space-y-4">
            <div>
              <Label htmlFor="processClient">Cliente</Label>
              <Select value={processForm.client} onValueChange={(value) => setProcessForm({ ...processForm, client: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="techcorp">TechCorp Ltda</SelectItem>
                  <SelectItem value="inovacao">Inovação Digital</SelectItem>
                  <SelectItem value="consultoria">Consultoria Moderna</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="processType">Tipo de Processo</Label>
              <Select value={processForm.processType} onValueChange={(value) => setProcessForm({ ...processForm, processType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="documentacao">Documentação</SelectItem>
                  <SelectItem value="licenca">Licença</SelectItem>
                  <SelectItem value="fiscal">Fiscal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="processDescription">Descrição</Label>
              <Textarea
                id="processDescription"
                value={processForm.description}
                onChange={(e) => setProcessForm({ ...processForm, description: e.target.value })}
                placeholder="Descreva o processo..."
              />
            </div>
            <div>
              <Label htmlFor="processDueDate">Data de Prazo</Label>
              <Input
                id="processDueDate"
                type="date"
                value={processForm.dueDate}
                onChange={(e) => setProcessForm({ ...processForm, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="processPriority">Prioridade</Label>
              <Select value={processForm.priority} onValueChange={(value) => setProcessForm({ ...processForm, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Documentos Necessários</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                {availableDocuments.map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <Checkbox
                      id={doc}
                      checked={processForm.requiredDocuments.includes(doc)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProcessForm({
                            ...processForm,
                            requiredDocuments: [...processForm.requiredDocuments, doc]
                          });
                        } else {
                          setProcessForm({
                            ...processForm,
                            requiredDocuments: processForm.requiredDocuments.filter(d => d !== doc)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={doc} className="text-sm">{doc}</Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {processForm.requiredDocuments.length} documento(s) selecionado(s)
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsProcessModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Processo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Search Modal */}
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buscar Documentos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="searchTerm">Termo de Busca</Label>
              <Input
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do documento, cliente ou tipo..."
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsSearchModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => {
                console.log("Buscando:", searchTerm);
                setIsSearchModalOpen(false);
                setSearchTerm("");
              }}>
                Buscar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Config Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Configurações Gerais</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Configurar Perfil da Empresa
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Gerenciar Usuários
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Configurações de Notificação
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Backup e Segurança
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setIsConfigModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmpresaDashboard;