import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import PontoClock from "@/components/PontoClock";
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Plus,
  Search,
  MoreHorizontal,
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
  Settings,
  ArrowRight,
  Sparkles
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
import { ReportProblemDialog } from "@/components/ReportProblemDialog";

const EmpresaDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hasRole } = useUserRole();
  const { stats: dashboardStats, recentClients, recentProcesses, loading, refreshData } = useDashboardData();
  const [isAdmin, setIsAdmin] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyLegalData, setCompanyLegalData] = useState<LegalData | null>(null);
  const [isCompanyDataComplete, setIsCompanyDataComplete] = useState(false);
  const [isPontoOpen, setIsPontoOpen] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  
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
    if (!dateString) return 'Sem prazo';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
      case "Concluído":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Em Análise":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Pendente":
      case "Documentos Pendentes":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
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

  // Primary quick actions (always visible)
  const primaryActions = [
    { icon: UserPlus, label: "Novo Cliente", component: <CreateClientDialog onClientCreated={refreshData} variant="quickAction" /> },
    { icon: Users, label: "Gestão Clientes", href: "/gestao-clientes-qualificacao" },
    { icon: PenTool, label: "Assinaturas", href: "/gerenciar-processos?tab=assinaturas" },
    { icon: Search, label: "Buscar Docs", onClick: () => setIsSearchModalOpen(true) },
    { icon: FileText, label: "Processos", href: "/gerenciar-processos" },
  ];

  // Secondary quick actions (hidden by default)
  const secondaryActions = [
    { icon: TrendingUp, label: "Relatórios", href: "/relatorios" },
    { icon: Clock, label: "Rel. Ponto", href: "/relatorios-ponto" },
    { icon: Users, label: "Colaboradores", href: "/gestao-colaboradores" },
    { icon: FileText, label: "Modelos", href: "/modelos-documentos" },
    { icon: Brain, label: "Análise IA", href: "/analise-ia" },
    { icon: List, label: "Tipos Docs", href: "/cadastro-tipos-documentos" },
    ...(hasRole('company_admin') ? [{ icon: Shield, label: "Permissões", href: "/gestao-permissoes" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Primary CTA */}
              <CreateProcessWithInvite />

              {/* Secondary Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
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
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Alerts Section - Compact */}
        <div className="space-y-3">
          <ExpiringDocumentsAlert />
          <CompanyNotifications compact />
          {companyId && !isCompanyDataComplete && (
            <CompanyLegalDataCard companyId={companyId} />
          )}
        </div>

        {/* KPIs Row - Compact and Clean */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
            onClick={() => navigate('/gestao-clientes')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clientes</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.totalClients}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
            onClick={() => navigate('/gerenciar-processos')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ativos</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.totalProcesses}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
            onClick={() => navigate('/gerenciar-processos?status=pendente')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{dashboardStats.pendingProcesses}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
            onClick={() => setIsCompletedTodayModalOpen(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Concluídos</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{dashboardStats.completedToday}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Processes - Main Focus (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">Processos em Andamento</CardTitle>
                    <Badge variant="secondary" className="text-xs">{filteredProcesses.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="text-xs">
                    <Link to="/gerenciar-processos" className="flex items-center gap-1">
                      Ver todos <ChevronRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
                {/* Search */}
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar processo, cliente ou CNPJ..."
                    value={processSearchTerm}
                    onChange={(e) => setProcessSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm bg-muted/30 border-border/50"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {loading ? (
                    Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/30 animate-pulse">
                        <div className="h-4 bg-muted rounded w-40 mb-2"></div>
                        <div className="h-2 bg-muted rounded w-full"></div>
                      </div>
                    ))
                  ) : filteredProcesses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum processo encontrado</p>
                    </div>
                  ) : (
                    filteredProcesses.map((process) => (
                      <div
                        key={process.id}
                        className="group p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-border/50"
                        onClick={() => navigate(`/gerenciar-processos?id=${process.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm text-foreground truncate">
                                {process.project_name || 'Sem nome'}
                              </h3>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusColor(process.status)}`}>
                                {process.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {process.client_name}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-muted-foreground">{formatDueDate(process.due_date)}</p>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Progresso</span>
                            <span>{process.progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${process.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions - Compact */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAllActions(!showAllActions)}
                    className="text-xs"
                  >
                    {showAllActions ? 'Ver menos' : 'Ver todas'}
                    <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAllActions ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-2">
                  {/* Primary Actions */}
                  {primaryActions.map((action, i) => (
                    action.component ? (
                      <div key={i}>{action.component}</div>
                    ) : action.onClick ? (
                      <Button 
                        key={i}
                        variant="outline" 
                        className="h-16 flex-col gap-1 text-xs border-border/50 hover:bg-muted/50"
                        onClick={action.onClick}
                      >
                        <action.icon className="h-4 w-4" />
                        <span className="text-[10px]">{action.label}</span>
                      </Button>
                    ) : (
                      <Link key={i} to={action.href!}>
                        <Button variant="outline" className="h-16 flex-col gap-1 w-full text-xs border-border/50 hover:bg-muted/50">
                          <action.icon className="h-4 w-4" />
                          <span className="text-[10px]">{action.label}</span>
                        </Button>
                      </Link>
                    )
                  ))}
                </div>

                {/* Secondary Actions - Collapsible */}
                {showAllActions && (
                  <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-border/50">
                    <PdfConverter />
                    {secondaryActions.map((action, i) => (
                      <Link key={i} to={action.href}>
                        <Button variant="ghost" className="h-16 flex-col gap-1 w-full text-xs hover:bg-muted/50">
                          <action.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{action.label}</span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Secondary Content */}
          <div className="space-y-4">
            {/* Recent Clients - Compact */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Clientes Recentes</CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
                    <Link to="/gestao-clientes">
                      Ver todos <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-2 rounded bg-muted/30 animate-pulse">
                        <div className="h-3 bg-muted rounded w-24 mb-1"></div>
                        <div className="h-2 bg-muted rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : recentClients.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Nenhum cliente ainda</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentClients.slice(0, 3).map((client) => (
                      <div
                        key={client.id}
                        className="group p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between"
                        onClick={() => navigate(`/cliente/${encodeURIComponent(client.client_email)}`)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{client.client_name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getStatusColor(client.status)}`}>
                              {client.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{formatLastUpdate(client.last_update)}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ponto Clock - Collapsible */}
            <Collapsible open={isPontoOpen} onOpenChange={setIsPontoOpen}>
              <Card className="border-border/50">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
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
