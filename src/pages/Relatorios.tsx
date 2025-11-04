import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, TrendingUp, Users, Clock, Search, Download, Filter, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import DocumentReport from "@/components/DocumentReport";

interface Process {
  id: string;
  client_name: string;
  client_email: string;
  process_type: string;
  status: string;
  priority: string;
  description?: string;
  due_date?: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

interface Report {
  id: string;
  process_id: string;
  total_documents: number;
  pending_documents: number;
  approved_documents: number;
  generated_at: string;
  report_data: any;
}

const Relatorios = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar processos
      const { data: processData, error: processError } = await supabase
        .from('processes')
        .select('*')
        .order('created_at', { ascending: false });

      if (processError) throw processError;

      // Carregar relatórios
      const { data: reportData, error: reportError } = await supabase
        .from('document_reports')
        .select('*')
        .order('generated_at', { ascending: false });

      if (reportError) throw reportError;

      setProcesses(processData || []);
      setReports(reportData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (processId: string) => {
    try {
      console.log('Gerando relatório para processo:', processId);
      
      const { data, error } = await supabase.rpc('generate_document_report', {
        process_uuid: processId
      });

      if (error) {
        console.error('Erro na RPC generate_document_report:', error);
        throw error;
      }

      console.log('Relatório gerado com ID:', data);

      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso!",
      });

      // Pequeno delay antes de recarregar
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      toast({
        title: "Erro",
        description: `Não foi possível gerar o relatório: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.process_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || process.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-500';
      case 'Em andamento': return 'bg-blue-500';
      case 'Pendente': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-800';
      case 'Média': return 'bg-yellow-100 text-yellow-800';
      case 'Baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando relatórios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/empresa')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie relatórios de documentos por processo
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="processes">Por Processo</TabsTrigger>
            <TabsTrigger value="detailed">Relatório Detalhado</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{processes.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Relatórios Gerados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reports.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {processes.filter(p => p.status === 'Em andamento').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(processes.map(p => p.client_email)).size}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="processes" className="space-y-6">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente ou tipo de processo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de processos */}
            <div className="grid gap-4">
              {filteredProcesses.map((process) => {
                const processReports = reports.filter(r => r.process_id === process.id);
                const latestReport = processReports[0];

                return (
                  <Card key={process.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{process.client_name}</CardTitle>
                          <CardDescription>{process.process_type}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(process.priority)}>
                            {process.priority}
                          </Badge>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(process.status)}`} />
                          <span className="text-sm text-muted-foreground">{process.status}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Progresso: {process.progress}%
                          </p>
                          {latestReport && (
                            <p className="text-sm text-muted-foreground">
                              Último relatório: {format(new Date(latestReport.generated_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={() => generateReport(process.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Gerar Relatório
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatório Detalhado por Processo</CardTitle>
                <CardDescription>
                  Selecione um processo para visualizar o relatório detalhado de documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um processo" />
                    </SelectTrigger>
                    <SelectContent>
                      {processes.map((process) => (
                        <SelectItem key={process.id} value={process.id}>
                          {process.client_name} - {process.process_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProcess && (
                  <DocumentReport 
                    processId={selectedProcess} 
                    refreshKey={0}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Relatorios;