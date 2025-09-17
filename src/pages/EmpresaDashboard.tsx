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
  Brain,
  UserPlus,
  Shield
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import UserInviteSystem from "@/components/UserInviteSystem";
import CreateProcessWithInvite from "@/components/CreateProcessWithInvite";
import CompletedTodayModal from "@/components/CompletedTodayModal";
import DocumentSearchModal from "@/components/DocumentSearchModal";
import { supabase } from "@/integrations/supabase/client";

const EmpresaDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { stats: dashboardStats, recentClients, recentProcesses, loading, refreshData } = useDashboardData();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    console.log('[EmpresaDashboard] mounted', { user: user?.email });
  }, [user]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin role:', error);
      }
    };

    checkAdminRole();
  }, [user]);

  // Redirect clients to their area if they land here accidentally
  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'client') {
        navigate('/cliente', { replace: true });
      }
    };
    checkRoleAndRedirect();
  }, [user, navigate]);
  const stats = [
    {
      title: "Total de Clientes",
      value: dashboardStats.totalClients.toString(),
      change: dashboardStats.totalClients > 0 ? "+100%" : "0%",
      icon: Users,
      color: "text-primary",
      route: "/cliente"
    },
    {
      title: "Processos Ativos",
      value: dashboardStats.totalProcesses.toString(),
      change: dashboardStats.totalProcesses > 0 ? "+100%" : "0%",
      icon: FileText,
      color: "text-accent",
      route: "/gerenciar-processos"
    },
    {
      title: "Pendentes",
      value: dashboardStats.pendingProcesses.toString(),
      change: dashboardStats.pendingProcesses > 0 ? "+100%" : "0%",
      icon: Clock,
      color: "text-orange-500",
      route: "/gerenciar-processos?status=pendente"
    },
    {
      title: "Concluídos Hoje",
      value: dashboardStats.completedToday.toString(),
      change: dashboardStats.completedToday > 0 ? "+100%" : "0%",
      icon: CheckCircle,
      color: "text-green-500",
      route: "/relatorios",
      onClick: () => setIsCompletedTodayModalOpen(true)
    }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)} dia(s) atrás`;
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return 'Sem prazo';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCompletedTodayModalOpen, setIsCompletedTodayModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: ""
  });

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Novo cliente:", clientForm);
    setIsClientModalOpen(false);
    setClientForm({ name: "", email: "", phone: "", company: "", status: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard - Empresa</h1>
              <p className="text-muted-foreground">Visão geral dos processos e clientes</p>
            </div>
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Button variant="outline" onClick={() => navigate('/admin')}>
                    <Shield className="h-4 w-4 mr-2" />
                    Painel Admin
                  </Button>
                )}
                <Button variant="hero" onClick={refreshData} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Atualizando...' : 'Atualizar'}
                </Button>
                <UserInviteSystem onInviteSent={refreshData} />
                <CreateProcessWithInvite />
                <Button variant="ghost" size="sm" onClick={handleLogout}>
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
            <Card 
              key={index} 
              className="hover:shadow-card transition-all duration-300 cursor-pointer hover:scale-105" 
              onClick={() => stat.onClick ? stat.onClick() : navigate(stat.route)}
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
                  <Link to="/gestao-colaboradores">
                    <Button variant="ghost" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Gerenciar Colaboradores
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/30 animate-pulse">
                      <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  ))
                ) : recentClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum cliente ainda</p>
                    <p className="text-sm">Crie seu primeiro processo para começar</p>
                  </div>
                ) : (
                  recentClients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-4 rounded-lg border-l-4 ${getPriorityColor(client.priority)} bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer`}
                    onClick={() => navigate(`/cliente/${encodeURIComponent(client.client_email)}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{client.client_name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {client.document_count} documentos
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Atualizado {formatLastUpdate(client.last_update)}
                        </p>
                      </div>
                    </div>
                  </div>
                  ))
                )}
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
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/gerenciar-processos">
                    Ver Todos
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/30 animate-pulse">
                      <div className="h-4 bg-muted rounded w-40 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-2 bg-muted rounded w-full"></div>
                    </div>
                  ))
                ) : recentProcesses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum processo ainda</p>
                    <p className="text-sm">Crie seu primeiro processo</p>
                  </div>
                ) : (
                  recentProcesses.map((process) => (
                  <div
                    key={process.id}
                    className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/gerenciar-processos?id=${process.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground text-sm">
                        {process.process_type}
                      </h3>
                      <Badge className={getStatusColor(process.status)}>
                        {process.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Cliente: {process.client_name}
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
                          Prazo: {formatDueDate(process.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  ))
                )}
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-24 flex-col w-full" onClick={() => setIsClientModalOpen(true)}>
                    <Plus className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">Novo Cliente</span>
                  </Button>
                  <Link to="/gerenciar-processos" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Gerenciar Processos</span>
                    </Button>
                  </Link>
                  <Button variant="outline" className="h-24 flex-col w-full" onClick={() => setIsSearchModalOpen(true)}>
                    <Search className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">Buscar Documentos</span>
                  </Button>
                  <Link to="/relatorios" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Gerar Relatórios</span>
                    </Button>
                  </Link>
                  <Link to="/relatorios-ponto" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <Clock className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Rel. Ponto</span>
                    </Button>
                  </Link>
                  <Link to="/gestao-colaboradores" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <Users className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Colaboradores</span>
                    </Button>
                  </Link>
                  <Link to="/modelos-documentos" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Modelos de Docs</span>
                    </Button>
                  </Link>
                  <Link to="/treinar-ia" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <Brain className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Treinar IA</span>
                    </Button>
                  </Link>
                  <Link to="/cadastro-tipos-documentos" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Tipos de Docs</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Client Modal */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleClientSubmit} className="space-y-4">
            <div>
              <Label htmlFor="clientName">Nome</Label>
              <Input
                id="clientName"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                placeholder="Nome do cliente"
                required
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                placeholder="email@cliente.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="clientPhone">Telefone</Label>
              <Input
                id="clientPhone"
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div>
              <Label htmlFor="clientCompany">Empresa</Label>
              <Input
                id="clientCompany"
                value={clientForm.company}
                onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                placeholder="Empresa do cliente"
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

      {/* Search Modal */}
      <DocumentSearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />

      {/* Completed Today Modal */}
      <CompletedTodayModal 
        isOpen={isCompletedTodayModalOpen} 
        onClose={() => setIsCompletedTodayModalOpen(false)} 
      />
      {/* Search Modal */}
      <DocumentSearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />

      {/* Completed Today Modal */}
      <CompletedTodayModal 
        isOpen={isCompletedTodayModalOpen} 
        onClose={() => setIsCompletedTodayModalOpen(false)} 
      />
    </div>
  );
};

export default EmpresaDashboard;