import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Send,
  Download,
  Eye,
  MessageSquare,
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import AIProcessAnalyzer from "@/components/AIProcessAnalyzer";
import CreateProcessWithInvite from "@/components/CreateProcessWithInvite";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const GerenciarProcessos = () => {
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageForm, setMessageForm] = useState({
    message: "",
    requestDocs: [] as string[]
  });
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const { data: processesData, error } = await supabase
        .from('processes')
        .select(`
          *,
          documents (
            id,
            file_name,
            document_type,
            status,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match the expected format
      const transformedProcesses = processesData?.map(process => {
        const receivedDocuments = process.documents?.filter(doc => doc.status === 'Aprovado') || [];
        const pendingDocuments = process.documents?.filter(doc => doc.status === 'Pendente') || [];
        
        return {
          id: process.id,
          client: process.client_name,
          processType: process.process_type,
          description: process.description,
          dueDate: process.due_date ? new Date(process.due_date).toLocaleDateString('pt-BR') : 'Sem prazo',
          priority: process.priority?.toLowerCase() || 'medium',
          status: process.status,
          progress: process.progress || 0,
          receivedDocuments: receivedDocuments.map(doc => ({
            name: doc.document_type,
            status: "recebido",
            dateReceived: new Date(doc.created_at).toLocaleDateString('pt-BR'),
            url: "#"
          })),
          pendingDocuments: pendingDocuments.map(doc => doc.document_type),
          lastContact: new Date(process.updated_at).toLocaleDateString('pt-BR')
        };
      }) || [];

      setProcesses(transformedProcesses);
    } catch (error) {
      console.error('Error fetching processes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar processos",
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
      case "Em Análise":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Aguardando Documentos":
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

  const handleSendMessage = (processId: number) => {
    setSelectedProcess(processes.find(p => p.id === processId));
    setIsMessageModalOpen(true);
  };

  const handleRequestDocuments = (processId: number) => {
    setSelectedProcess(processes.find(p => p.id === processId));
    setIsDocumentModalOpen(true);
  };

  const submitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Enviando mensagem:", messageForm);
    setIsMessageModalOpen(false);
    setMessageForm({ message: "", requestDocs: [] });
  };

  const submitDocumentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Solicitando documentos:", messageForm);
    setIsDocumentModalOpen(false);
    setMessageForm({ message: "", requestDocs: [] });
    setSearchTerm("");
  };

  // Simulação dos tipos de documentos cadastrados pelo administrador
  const availableDocuments = [
    "RG - Registro Geral",
    "CPF - Cadastro de Pessoa Física", 
    "Comprovante de Residência",
    "CNPJ - Cadastro Nacional da Pessoa Jurídica",
    "Carteira de Trabalho",
    "Contrato Social", 
    "Inscrição Estadual", 
    "Alvará de Funcionamento",
    "Declaração de Imposto de Renda", 
    "Comprovante de Renda", 
    "Certidão de Nascimento",
    "Certidão de Casamento", 
    "Procuração", 
    "Contrato de Prestação de Serviços"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/empresa">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gerenciar Processos</h1>
                <p className="text-muted-foreground">Acompanhe o status dos documentos e comunique-se com os clientes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Create Process Button */}
        <CreateProcessWithInvite onProcessCreated={fetchProcesses} />
        
        {/* Processes List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando processos...</p>
            </div>
          ) : processes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum processo encontrado. Crie seu primeiro processo acima.</p>
            </div>
          ) : (
            processes.map((process) => (
            <Card key={process.id} className={`border-l-4 ${getPriorityColor(process.priority)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg">{process.processType}</CardTitle>
                      <Badge className={getStatusColor(process.status)}>
                        {process.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      Cliente: {process.client} • Prazo: {process.dueDate}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSendMessage(process.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Mensagem
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRequestDocuments(process.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Solicitar Docs
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* IA Analysis */}
                  <AIProcessAnalyzer 
                    process={process} 
                    availableDocuments={availableDocuments}
                  />

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progresso do Processo</span>
                      <span className="text-sm text-muted-foreground">{process.progress}%</span>
                    </div>
                    <Progress value={process.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Documentos Recebidos */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Documentos Recebidos ({process.receivedDocuments.length})
                      </h3>
                      <div className="space-y-2">
                        {process.receivedDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              <div>
                                <p className="text-sm font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Recebido em {doc.dateReceived}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Documentos Pendentes */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-orange-500" />
                        Documentos Pendentes ({process.pendingDocuments.length})
                      </h3>
                      <div className="space-y-2">
                        {process.pendingDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <div>
                                <p className="text-sm font-medium">{doc}</p>
                                <p className="text-xs text-muted-foreground">
                                  Último contato: {process.lastContact}
                                </p>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendMessage(process.id)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Cobrar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </div>

      {/* Message Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem para {selectedProcess?.client}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitMessage} className="space-y-4">
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                placeholder="Digite sua mensagem para o cliente..."
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsMessageModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document Request Modal */}
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Documentos Adicionais</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitDocumentRequest} className="space-y-4">
            <div>
              <Label>Documentos Adicionais</Label>
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-8"
                  />
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                  {availableDocuments
                    .filter(doc => doc.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((doc) => (
                    <div key={doc} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`req-${doc}`}
                        checked={messageForm.requestDocs.includes(doc)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMessageForm({
                              ...messageForm,
                              requestDocs: [...messageForm.requestDocs, doc]
                            });
                          } else {
                            setMessageForm({
                              ...messageForm,
                              requestDocs: messageForm.requestDocs.filter(d => d !== doc)
                            });
                          }
                        }}
                        className="rounded border-border"
                      />
                      <Label htmlFor={`req-${doc}`} className="text-sm">{doc}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {messageForm.requestDocs.length} documento(s) selecionado(s)
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="requestMessage">Mensagem (opcional)</Label>
              <Textarea
                id="requestMessage"
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                placeholder="Mensagem adicional para o cliente..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDocumentModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                Solicitar Documentos
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarProcessos;