import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, PenTool, Plus, Calendar, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { StandaloneSignedDocuments } from "@/components/StandaloneSignedDocuments";
import { PendingSignatureDocuments } from "@/components/PendingSignatureDocuments";
import { StandaloneDocumentUpload } from "@/components/StandaloneDocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isStandaloneUploadOpen, setIsStandaloneUploadOpen] = useState(false);
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se há fluxo de assinatura ativo no sessionStorage
  // Se houver, não redirecionar para qualificação
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenProfile = params.get('openProfile') === 'true';
    
    if (shouldOpenProfile) {
      // Verificar se há fluxo de assinatura ativo
      const hasActiveSignature = Object.keys(sessionStorage).some(key => 
        key.startsWith('signature_flow_')
      );
      
      if (hasActiveSignature) {
        console.log('[ClientDashboard] Fluxo de assinatura ativo detectado, removendo openProfile da URL');
        // Remover o parâmetro openProfile da URL sem redirecionar
        params.delete('openProfile');
        const newSearch = params.toString();
        const newUrl = `${location.pathname}${newSearch ? '?' + newSearch : ''}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [location]);

  useEffect(() => {
    loadProcesses();
  }, [user]);

  const loadProcesses = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          id, 
          project_name, 
          process_type,
          description, 
          status, 
          progress, 
          due_date,
          priority,
          companies (
            name,
            logo_url
          )
        `)
        .eq('client_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcesses(data || []);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/cliente')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <PenTool className="h-6 w-6" />
                  Assinaturas
                </h1>
                <p className="text-muted-foreground">
                  Gerencie seus documentos para assinatura
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsStandaloneUploadOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Documento para Assinatura
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Documentos Pendentes de Assinatura */}
        <PendingSignatureDocuments />

        {/* Documentos Assinados */}
        <StandaloneSignedDocuments />

        {/* Processos Ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Meus Processos ({processes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando processos...
              </div>
            ) : processes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum processo encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {processes.map((process) => (
                  <Card 
                    key={process.id} 
                    className={`border-l-4 ${getPriorityColor(process.priority)} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => navigate(`/cliente?id=${process.id}`)}
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
                          </div>
                          {process.companies && (
                            <p className="text-sm text-muted-foreground">
                              Empresa: {process.companies.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {process.description}
                      </p>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {process.due_date && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(process.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Progress value={process.progress || 0} className="h-2 flex-1" />
                        <span className="text-xs font-medium">{process.progress || 0}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Documentos Pendentes:</strong> Documentos que aguardam sua assinatura</p>
            <p>• <strong>Documentos Assinados:</strong> Documentos já assinados por você e pela empresa</p>
            <p>• <strong>Meus Processos:</strong> Todos os processos em que você está envolvido</p>
            <p>• <strong>+ Documento para Assinatura:</strong> Inicie o envio de um documento para assinatura</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Upload de Documento Standalone */}
      <StandaloneDocumentUpload
        open={isStandaloneUploadOpen}
        onOpenChange={setIsStandaloneUploadOpen}
        onSuccess={() => {
          setIsStandaloneUploadOpen(false);
          // Recarregar listas após sucesso
          loadProcesses();
        }}
      />
    </div>
  );
};

export default ClientDashboard;