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
  Shield,
  PenTool,
  List
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
import EditCompanyProfileModal from "@/components/EditCompanyProfileModal";
import ExpiringDocumentsAlert from "@/components/ExpiringDocumentsAlert";
import { PdfConverter } from "@/components/PdfConverter";
import CreateClientDialog from "@/components/CreateClientDialog";
import { CompanyLegalDataCard } from "@/components/CompanyLegalDataCard";
import { CopyLegalQualificationButton } from "@/components/CopyLegalQualificationButton";
import { LegalData } from "@/utils/legalQualification";
import CompanyNotifications from "@/components/CompanyNotifications";
import { useUserRole } from "@/hooks/useUserRole";
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect";

const EmpresaDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hasRole } = useUserRole();
  const { stats: dashboardStats, recentClients, recentProcesses, loading, refreshData } = useDashboardData();
  const [isAdmin, setIsAdmin] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyLegalData, setCompanyLegalData] = useState<LegalData | null>(null);
  const [isCompanyDataComplete, setIsCompanyDataComplete] = useState(false);
  
  useEffect(() => {
    console.log('[EmpresaDashboard] mounted', { user: user?.email });
  }, [user]);

  // Redirect clients to their area
  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (!user?.id) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'client') {
        navigate('/cliente', { replace: true });
      }
    };
    
    checkRoleAndRedirect();
  }, [user, navigate]);

  // Check if user is admin and fetch company legal data
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, company_id')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.role === 'admin');
        const fetchedCompanyId = profile?.company_id || null;
        setCompanyId(fetchedCompanyId);

        // Fetch company legal data if company_id exists
        if (fetchedCompanyId) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', fetchedCompanyId)
            .single();

          if (companyData) {
            // Check if data is complete
            const isComplete = !!(
              companyData.cnpj &&
              companyData.name &&
              companyData.address &&
              companyData.legal_representative_name &&
              companyData.legal_representative_cpf &&
              companyData.email &&
              companyData.phone
            );

            setIsCompanyDataComplete(isComplete);

            // Always prepare legal data for copy button, even if incomplete
            const legalData: LegalData = {
              person_type: 'pj',
              company_name: companyData.name,
              cnpj: companyData.cnpj,
              address: companyData.address,
              legal_representative_name: companyData.legal_representative_name,
              legal_representative_cpf: companyData.legal_representative_cpf,
              email: companyData.email,
              phone: companyData.phone
            };
            setCompanyLegalData(legalData);
          }
        }
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
      route: "/gestao-clientes"
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

  
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCompletedTodayModalOpen, setIsCompletedTodayModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [processSearchTerm, setProcessSearchTerm] = useState("");


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard - Empresa</h1>
                <p className="text-sm text-muted-foreground">Visão geral dos processos e clientes</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Painel Admin
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditProfileModalOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              <Button variant="hero" size="sm" onClick={refreshData} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <UserInviteSystem onInviteSent={refreshData} />
              <CreateProcessWithInvite />
              {companyLegalData && (
                <CopyLegalQualificationButton 
                  data={companyLegalData}
                  variant="outline"
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Expiring Documents Alert */}
        <ExpiringDocumentsAlert />
        
        {/* Company Notifications */}
        <CompanyNotifications />
        
        {/* Google Calendar Integration */}
        <GoogleCalendarConnect />
        
        {/* Company Legal Data Card - Only show if data is incomplete */}
        {companyId && !isCompanyDataComplete && (
          <CompanyLegalDataCard companyId={companyId} />
        )}
        
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
                  <Link to="/gestao-clientes">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Ver Todos
                    </Button>
                  </Link>
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
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome do processo, cliente ou CNPJ..."
                    value={processSearchTerm}
                    onChange={(e) => setProcessSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
                  <Card className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Shield className="h-10 w-10 text-muted-foreground opacity-50" />
                      <div>
                        <p className="text-sm font-medium mb-1">Nenhum processo disponível</p>
                        <p className="text-xs text-muted-foreground">
                          Aguarde liberação do administrador
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  (() => {
                    // Normalizar a busca removendo caracteres especiais
                    const normalizeSearch = (text: string) => {
                      return text.replace(/[.\-/]/g, '').toLowerCase();
                    };

                    const filteredProcesses = recentProcesses.filter((process) => {
                      if (!processSearchTerm) return true;
                      const searchLower = normalizeSearch(processSearchTerm);
                      
                      console.log('[EmpresaDashboard] Filtering:', {
                        searchTerm: processSearchTerm,
                        normalized: searchLower,
                        process: {
                          project_name: process.project_name,
                          client_name: process.client_name,
                          cpf_cnpj: process.cpf_cnpj
                        }
                      });
                      
                      return (
                        normalizeSearch(process.project_name || '').includes(searchLower) ||
                        normalizeSearch(process.client_name || '').includes(searchLower) ||
                        normalizeSearch(process.cpf_cnpj || '').includes(searchLower)
                      );
                    });

                    if (filteredProcesses.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum processo encontrado</p>
                          <p className="text-sm">Tente outro termo de busca</p>
                        </div>
                      );
                    }

                    return filteredProcesses.map((process) => (
                  <div
                    key={process.id}
                    className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/gerenciar-processos?id=${process.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {process.project_name || 'Sem nome'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {process.client_name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(process.status)}>
                        {process.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
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
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          Prazo: {formatDueDate(process.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  ));
                  })()
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
                  <PdfConverter />
                  <CreateClientDialog onClientCreated={refreshData} />
                  <Link to="/gerenciar-processos?tab=assinaturas" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <PenTool className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Assinaturas</span>
                    </Button>
                  </Link>
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
                  <Link to="/analise-ia" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <Brain className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Análise IA</span>
                    </Button>
                  </Link>
                  <Link to="/cadastro-tipos-documentos" className="w-full">
                    <Button variant="outline" className="h-24 flex-col w-full">
                      <List className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Tipos de Docs</span>
                    </Button>
                  </Link>
                  {hasRole('company_admin') && (
                    <Link to="/gestao-permissoes" className="w-full">
                      <Button variant="outline" className="h-24 flex-col w-full">
                        <Shield className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">Permissões</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Client Modal */}

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

      {/* Edit Profile Modal */}
      <EditCompanyProfileModal
        open={isEditProfileModalOpen}
        onOpenChange={setIsEditProfileModalOpen}
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