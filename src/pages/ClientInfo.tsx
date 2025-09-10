import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  FileText, 
  User,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  MapPin,
  Building
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ClientProcess {
  id: string;
  project_name: string;
  process_type: string;
  status: string;
  priority: string;
  progress: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  documents_count: number;
}

interface ClientInfo {
  client_name: string;
  client_email: string;
  cpf_cnpj: string;
  processes: ClientProcess[];
}

const ClientInfo = () => {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (email) {
      fetchClientData(decodeURIComponent(email));
    }
  }, [email]);

  const fetchClientData = async (clientEmail: string) => {
    try {
      setLoading(true);
      
      // Fetch all processes for this client
      const { data: processesData, error } = await supabase
        .from('processes')
        .select(`
          *,
          documents (
            id
          )
        `)
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (processesData && processesData.length > 0) {
        const clientInfo: ClientInfo = {
          client_name: processesData[0].client_name,
          client_email: processesData[0].client_email,
          cpf_cnpj: processesData[0].cpf_cnpj,
          processes: processesData.map(process => ({
            id: process.id,
            project_name: process.project_name,
            process_type: process.process_type,
            status: process.status,
            priority: process.priority,
            progress: process.progress,
            due_date: process.due_date,
            created_at: process.created_at,
            updated_at: process.updated_at,
            documents_count: process.documents?.length || 0
          }))
        };
        
        setClientData(clientInfo);
      } else {
        toast({
          title: "Cliente não encontrado",
          description: "Não foi possível encontrar informações deste cliente",
          variant: "destructive",
        });
        navigate('/empresa');
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar informações do cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Em andamento":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Pendente":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "alta":
        return "border-l-red-500";
      case "média":
        return "border-l-yellow-500";
      case "baixa":
        return "border-l-green-500";
      default:
        return "border-l-muted";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando informações do cliente...</p>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cliente não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/empresa')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {clientData.client_name}
                </h1>
                <p className="text-muted-foreground">
                  Informações do cliente e processos
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Client Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Nome Completo</span>
                </div>
                <p className="text-sm">{clientData.client_name}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Email</span>
                </div>
                <p className="text-sm">{clientData.client_email}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">CPF/CNPJ</span>
                </div>
                <p className="text-sm">{clientData.cpf_cnpj || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Process Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumo dos Processos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{clientData.processes.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Processos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {clientData.processes.filter(p => p.status === 'Em andamento').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {clientData.processes.filter(p => p.status === 'Concluído').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processes List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Processos do Cliente ({clientData.processes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientData.processes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum processo encontrado</p>
                </div>
              ) : (
                clientData.processes.map((process) => (
                  <Card 
                    key={process.id} 
                    className={`border-l-4 ${getPriorityColor(process.priority)} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => navigate(`/gerenciar-processos?id=${process.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {process.project_name || process.process_type}
                            </h3>
                            <Badge className={getStatusColor(process.status)}>
                              {process.status}
                            </Badge>
                            <Badge variant={process.priority === 'Alta' ? 'destructive' : 
                                        process.priority === 'Média' ? 'default' : 'secondary'}>
                              {process.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Tipo: {process.process_type}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Criado em</span>
                          </div>
                          <p className="text-sm">{formatDate(process.created_at)}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Prazo</span>
                          </div>
                          <p className="text-sm">{formatDate(process.due_date)}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Documentos</span>
                          </div>
                          <p className="text-sm">{process.documents_count} anexado(s)</p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progresso</span>
                          <span className="text-sm text-muted-foreground">{process.progress}%</span>
                        </div>
                        <Progress value={process.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientInfo;