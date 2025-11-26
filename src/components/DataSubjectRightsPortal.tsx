import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Trash2, 
  Edit, 
  FileText, 
  XCircle, 
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface DataSubjectRequest {
  id: string;
  request_type: string;
  status: string;
  request_details: any;
  requested_at: string;
  completed_at: string | null;
  rejection_reason: string | null;
}

export const DataSubjectRightsPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [details, setDetails] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Carregar solicitações existentes
  const loadRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("data_subject_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar solicitações:", error);
    }
  };

  // Criar nova solicitação
  const createRequest = async (requestType: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("data_subject_requests")
        .insert({
          user_id: user.id,
          request_type: requestType,
          status: "pending",
          request_details: { details, user_agent: navigator.userAgent }
        });

      if (error) throw error;

      toast({
        title: "Solicitação criada com sucesso",
        description: "Sua solicitação será processada em até 15 dias conforme LGPD Art. 18 § 3º.",
      });

      setDialogOpen(false);
      setDetails("");
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Erro ao criar solicitação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Exportar dados (portabilidade)
  const exportData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar todos os dados do usuário
      const [profileData, processesData, documentsData, consentsData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("processes").select("*").eq("client_email", user.email),
        supabase.from("documents").select("*").eq("uploaded_by", user.email || user.id),
        supabase.from("user_consents").select("*").eq("user_id", user.id)
      ]);

      const exportData = {
        generated_at: new Date().toISOString(),
        profile: profileData.data,
        processes: processesData.data,
        documents: documentsData.data,
        consents: consentsData.data,
        format_version: "1.0"
      };

      // Criar arquivo para download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fuzen-meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Registrar a solicitação
      await createRequest("portability");

      toast({
        title: "Dados exportados com sucesso",
        description: "Seus dados foram baixados em formato JSON.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestTypes = [
    {
      type: "access",
      title: "Confirmação e Acesso aos Dados",
      description: "Solicitar confirmação da existência e acesso aos seus dados pessoais",
      icon: FileText,
      action: () => { setSelectedType("access"); setDialogOpen(true); }
    },
    {
      type: "correction",
      title: "Correção de Dados",
      description: "Solicitar correção de dados incompletos, inexatos ou desatualizados",
      icon: Edit,
      action: () => { setSelectedType("correction"); setDialogOpen(true); }
    },
    {
      type: "portability",
      title: "Portabilidade de Dados",
      description: "Baixar seus dados em formato estruturado (JSON)",
      icon: Download,
      action: exportData
    },
    {
      type: "deletion",
      title: "Exclusão de Conta e Dados",
      description: "Solicitar exclusão definitiva de seus dados (direito ao esquecimento)",
      icon: Trash2,
      action: () => { setSelectedType("deletion"); setDialogOpen(true); }
    },
    {
      type: "revoke_consent",
      title: "Revogar Consentimento",
      description: "Retirar consentimento para tratamentos específicos",
      icon: XCircle,
      action: () => { setSelectedType("revoke_consent"); setDialogOpen(true); }
    },
    {
      type: "anonymization",
      title: "Anonimização de Dados",
      description: "Solicitar anonimização de dados desnecessários",
      icon: Shield,
      action: () => { setSelectedType("anonymization"); setDialogOpen(true); }
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Concluída";
      case "in_progress": return "Em Andamento";
      case "rejected": return "Rejeitada";
      default: return "Pendente";
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      access: "Acesso aos Dados",
      correction: "Correção",
      portability: "Portabilidade",
      deletion: "Exclusão",
      revoke_consent: "Revogação de Consentimento",
      anonymization: "Anonimização"
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Seus Direitos sob a LGPD</AlertTitle>
        <AlertDescription>
          De acordo com a Lei Geral de Proteção de Dados (Art. 18), você tem direito ao acesso, 
          correção, portabilidade e exclusão de seus dados pessoais. As solicitações serão 
          atendidas em até 15 dias.
        </AlertDescription>
      </Alert>

      {/* Grid de Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requestTypes.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.type} className="hover:border-primary transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={item.action} 
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  Solicitar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Histórico de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Solicitações</CardTitle>
          <CardDescription>
            Acompanhe o status de suas solicitações anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadRequests} variant="outline" className="mb-4">
            Atualizar Lista
          </Button>
          
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Você ainda não fez nenhuma solicitação
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="font-medium">{getTypeText(request.request_type)}</span>
                    </div>
                    <Badge variant={request.status === "completed" ? "default" : "secondary"}>
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Solicitado em: {new Date(request.requested_at).toLocaleDateString('pt-BR')}
                  </div>
                  {request.completed_at && (
                    <div className="text-sm text-muted-foreground">
                      Concluído em: {new Date(request.completed_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {request.rejection_reason && (
                    <div className="text-sm text-red-500">
                      Motivo: {request.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Solicitação</DialogTitle>
            <DialogDescription>
              Descreva os detalhes da sua solicitação (opcional)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Adicione informações adicionais se necessário..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => createRequest(selectedType)} 
              disabled={loading}
            >
              Confirmar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
