import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import PontoClock from "@/components/PontoClock";
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Plus,
  Search,
  MoreVertical,
  LogOut,
  Brain,
  UserPlus,
  Shield,
  PenTool,
  List,
  UserCircle,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  LayoutDashboard,
  FolderOpen,
  Settings,
  Bell,
  Menu,
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
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
import { ReportProblemDialog } from "@/components/ReportProblemDialog";
import logo from "@/assets/logo.png";
import FirstVisitGuide from "@/components/FirstVisitGuide";
import CurrentPlanCard from "@/components/CurrentPlanCard";
import { Lightbulb, FolderOpen as FolderOpenIcon, Users as UsersIcon, FileText as FileTextIcon, TrendingUp as TrendingUpIcon, PenTool as PenToolIcon } from "lucide-react";

const EmpresaDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hasRole } = useUserRole();
  const { stats: dashboardStats, recentClients, recentProcesses, loading, refreshData } = useDashboardData();
  const [isAdmin, setIsAdmin] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [companyLegalData, setCompanyLegalData] = useState<LegalData | null>(null);
  const [isCompanyDataComplete, setIsCompanyDataComplete] = useState(false);
  const [isPontoOpen, setIsPontoOpen] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCompletedTodayModalOpen, setIsCompletedTodayModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [processSearchTerm, setProcessSearchTerm] = useState("");

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

        if (fetchedCompanyId) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', fetchedCompanyId)
            .single();

          if (companyData) {
            setCompanyName(companyData.name || 'Empresa');
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

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
      case "Concluído":
        return "bg-success/10 text-success border-success/20";
      case "Em Análise":
      case "Em andamento":
        return "bg-info/10 text-info border-info/20";
      case "Pendente":
      case "Documentos Pendentes":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const normalizeSearch = (text: string) => text.replace(/[.\-/]/g, '').toLowerCase();

  const filteredProcesses = recentProcesses.filter((process) => {
    if (!processSearchTerm) return true;
    const searchLower = normalizeSearch(processSearchTerm);
    return (
      normalizeSearch(process.project_name || '').includes(searchLower) ||
      normalizeSearch(process.client_name || '').includes(searchLower) ||
      normalizeSearch(process.cpf_cnpj || '').includes(searchLower)
    );
  });

  // Navigation items for sidebar
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/empresa", active: true },
    { icon: FolderOpen, label: "Processos", href: "/gerenciar-processos" },
    { icon: Users, label: "Clientes", href: "/gestao-clientes-qualificacao" },
    { icon: PenTool, label: "Assinaturas", href: "/gerenciar-processos?tab=assinaturas" },
    { icon: FileText, label: "Modelos", href: "/modelos-documentos" },
    { icon: TrendingUp, label: "Relatórios", href: "/relatorios" },
  ];

  const secondaryNavItems = [
    { icon: Brain, label: "Análise IA", href: "/analise-ia" },
    { icon: List, label: "Tipos de Docs", href: "/cadastro-tipos-documentos" },
    { icon: Users, label: "Colaboradores", href: "/gestao-colaboradores" },
    { icon: Clock, label: "Rel. Ponto", href: "/relatorios-ponto" },
    ...(hasRole('company_admin') ? [{ icon: Shield, label: "Permissões", href: "/gestao-permissoes" }] : []),
  ];

  // KPI data
  const kpis = [
    { 
      label: "Clientes", 
      value: dashboardStats.totalClients, 
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/gestao-clientes"
    },
    { 
      label: "Processos Ativos", 
      value: dashboardStats.totalProcesses, 
      icon: FileText,
      color: "text-info",
      bgColor: "bg-info/10",
      href: "/gerenciar-processos"
    },
    { 
      label: "Pendentes", 
      value: dashboardStats.pendingProcesses, 
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
      href: "/gerenciar-processos?status=pendente"
    },
    { 
      label: "Concluídos Hoje", 
      value: dashboardStats.completedToday, 
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
      onClick: () => setIsCompletedTodayModalOpen(true)
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar-background border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <Link to="/empresa" className="flex items-center gap-3">
            <img src={logo} alt="Fuzen" className="h-8 w-auto" />
            <span className="text-sidebar-foreground font-semibold text-lg tracking-tight">Fuzen</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <p className="px-3 text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-2">Mais</p>
            {secondaryNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-sidebar-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{companyName}</p>
              <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-72 bg-sidebar-background border-r border-sidebar-border animate-slide-in-right">
            <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border">
              <Link to="/empresa" className="flex items-center gap-3">
                <img src={logo} alt="Fuzen" className="h-8 w-auto" />
                <span className="text-sidebar-foreground font-semibold text-lg">Fuzen</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.active 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-sidebar-border">
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Visão geral da sua operação</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex items-center gap-2 text-muted-foreground"
              onClick={() => setIsSearchModalOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Buscar...</span>
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>

            {/* Primary CTA */}
            <CreateProcessWithInvite />

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {dashboardStats.pendingProcesses > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-warning rounded-full" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 p-0 max-h-[500px] overflow-y-auto">
                <CompanyNotifications />
              </PopoverContent>
            </Popover>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Painel Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => setIsEditProfileModalOpen(true)}>
                  <UserCircle className="h-4 w-4 mr-2" />
                  Editar Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/meus-dados-pessoais')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Meus Dados (LGPD)
                </DropdownMenuItem>
                {companyLegalData && (
                  <DropdownMenuItem asChild>
                    <CopyLegalQualificationButton 
                      data={companyLegalData}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start font-normal"
                    />
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <ReportProblemDialog 
                  userType="empresa" 
                  trigger={
                    <Button variant="ghost" size="sm" className="w-full justify-start font-normal h-auto py-1.5 px-2">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Relatar Problema
                    </Button>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">
          {/* Alerts */}
          <div className="space-y-3">
            <ExpiringDocumentsAlert />
            <CompanyNotifications compact />
            {companyId && !isCompanyDataComplete && (
              <CompanyLegalDataCard companyId={companyId} />
            )}
          </div>

          {/* First Visit Guide */}
          <FirstVisitGuide
            pageKey="empresa-dashboard"
            title="Bem-vindo ao seu painel! Veja o que você pode fazer:"
            items={[
              { icon: <FolderOpen className="h-4 w-4" />, title: "Processos", description: "Crie e gerencie processos jurídicos com seus clientes." },
              { icon: <Users className="h-4 w-4" />, title: "Clientes", description: "Cadastre clientes e acompanhe documentações." },
              { icon: <PenTool className="h-4 w-4" />, title: "Assinaturas", description: "Assine documentos digitalmente com validade jurídica." },
              { icon: <FileText className="h-4 w-4" />, title: "Modelos", description: "Crie templates de documentos reutilizáveis." },
              { icon: <TrendingUp className="h-4 w-4" />, title: "Relatórios", description: "Acompanhe métricas e progresso dos processos." },
              { icon: <Brain className="h-4 w-4" />, title: "IA", description: "Analise documentos automaticamente com inteligência artificial." },
            ]}
          />

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <Card 
                key={kpi.label}
                className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 group"
                onClick={kpi.onClick || (() => kpi.href && navigate(kpi.href))}
              >
                <CardContent className="p-4 lg:p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                      <p className={`text-2xl lg:text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-xl ${kpi.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Processes - 2 columns */}
            <div className="xl:col-span-2 space-y-6">
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base font-semibold">Processos em Andamento</CardTitle>
                      <Badge variant="secondary" className="font-normal">{filteredProcesses.length}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar processo..."
                          value={processSearchTerm}
                          onChange={(e) => setProcessSearchTerm(e.target.value)}
                          className="pl-9 h-9 text-sm"
                        />
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/gerenciar-processos" className="flex items-center gap-1">
                          Ver todos
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {loading ? (
                      Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="p-4 rounded-xl bg-muted/30 animate-pulse">
                          <div className="h-4 bg-muted rounded w-48 mb-3"></div>
                          <div className="h-2 bg-muted rounded w-full"></div>
                        </div>
                      ))
                    ) : filteredProcesses.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Nenhum processo encontrado</p>
                        <Button variant="link" size="sm" className="mt-2" asChild>
                          <Link to="/gerenciar-processos">Criar novo processo</Link>
                        </Button>
                      </div>
                    ) : (
                      filteredProcesses.map((process) => (
                        <div
                          key={process.id}
                          className="group p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all cursor-pointer"
                          onClick={() => navigate(`/gerenciar-processos?id=${process.id}`)}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium text-sm text-foreground truncate">
                                  {process.project_name || 'Sem nome'}
                                </h3>
                                <Badge variant="outline" className={`text-xs ${getStatusColor(process.status)}`}>
                                  {process.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{process.client_name}</p>
                            </div>
                            <div className="text-right shrink-0">
                              {formatDueDate(process.due_date) && (
                                <p className="text-xs text-muted-foreground">{formatDueDate(process.due_date)}</p>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-auto" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="font-medium text-foreground">{process.progress}%</span>
                            </div>
                            <Progress value={process.progress} className="h-1.5" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAllActions(!showAllActions)}
                      className="text-xs"
                    >
                      {showAllActions ? 'Menos' : 'Mais'}
                      <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAllActions ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <CreateClientDialog onClientCreated={refreshData} variant="quickAction" />
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2 hover:bg-muted/50"
                      onClick={() => navigate('/gestao-clientes-qualificacao')}
                    >
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs">Gestão Clientes</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2 hover:bg-muted/50"
                      onClick={() => navigate('/gerenciar-processos?tab=assinaturas')}
                    >
                      <PenTool className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs">Assinaturas</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2 hover:bg-muted/50"
                      onClick={() => setIsSearchModalOpen(true)}
                    >
                      <Search className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs">Buscar Docs</span>
                    </Button>
                  </div>

                  {showAllActions && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border/50">
                      <PdfConverter />
                      <Button 
                        variant="ghost" 
                        className="h-16 flex-col gap-1.5 hover:bg-muted/50"
                        onClick={() => navigate('/gerenciar-processos')}
                      >
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Processos</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="h-16 flex-col gap-1.5 hover:bg-muted/50"
                        onClick={() => navigate('/modelos-documentos')}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Modelos</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="h-16 flex-col gap-1.5 hover:bg-muted/50"
                        onClick={() => navigate('/analise-ia')}
                      >
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Análise IA</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar content */}
            <div className="space-y-6">
              {/* Recent Clients */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Clientes Recentes</CardTitle>
                    <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                      <Link to="/gestao-clientes">
                        Ver todos
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30 animate-pulse">
                          <div className="h-3 bg-muted rounded w-28 mb-2"></div>
                          <div className="h-2 bg-muted rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentClients.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-10 w-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Nenhum cliente ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentClients.slice(0, 4).map((client) => (
                        <div
                          key={client.id}
                          className="group p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between"
                          onClick={() => navigate(`/cliente/${encodeURIComponent(client.client_email)}`)}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{client.client_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusColor(client.status)}`}>
                                {client.status}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{formatLastUpdate(client.last_update)}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ponto Clock */}
              <Collapsible open={isPontoOpen} onOpenChange={setIsPontoOpen}>
                <Card className="border-border/50">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm font-semibold">Controle de Ponto</CardTitle>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isPontoOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <PontoClock compact />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <DocumentSearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />
      <CompletedTodayModal 
        isOpen={isCompletedTodayModalOpen} 
        onClose={() => setIsCompletedTodayModalOpen(false)} 
      />
      <EditCompanyProfileModal
        open={isEditProfileModalOpen}
        onOpenChange={setIsEditProfileModalOpen}
      />
    </div>
  );
};

export default EmpresaDashboard;
