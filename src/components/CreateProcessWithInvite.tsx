import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Mail, Plus, Copy, CheckCircle } from "lucide-react";

interface CreateProcessForm {
  projectName: string;
  clientName: string;
  clientEmail: string;
  cpfCnpj: string;
  description: string;
  priority: string;
  dueDate: string;
}

interface CreateProcessWithInviteProps {
  onProcessCreated?: () => void;
}

const CreateProcessWithInvite = ({ onProcessCreated }: CreateProcessWithInviteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [clientName, setClientName] = useState("");
  const [availableDocuments, setAvailableDocuments] = useState<string[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();

  const [formData, setFormData] = useState<CreateProcessForm>({
    projectName: "",
    clientName: "",
    clientEmail: "",
    cpfCnpj: "",
    description: "",
    priority: "Média",
    dueDate: "",
  });

  // Carregar tipos de documentos da empresa e globais
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      if (!company?.id) return;
      
      setLoadingDocuments(true);
      try {
        // Buscar tipos de documentos da empresa
        const { data: companyTypes, error: companyError } = await supabase
          .from('document_types')
          .select('name')
          .eq('company_id', company.id)
          .order('name');

        // Buscar tipos globais
        const { data: globalTypes, error: globalError } = await supabase
          .from('global_document_types')
          .select('name')
          .order('name');

        if (companyError) {
          console.error('Erro ao buscar tipos da empresa:', companyError);
        }

        if (globalError) {
          console.error('Erro ao buscar tipos globais:', globalError);
        }

        // Combinar e remover duplicatas
        const companyTypeNames = companyTypes?.map(t => t.name) || [];
        const globalTypeNames = globalTypes?.map(t => t.name) || [];
        const allTypes = [...new Set([...companyTypeNames, ...globalTypeNames])];

        // Fallback para lista padrão se não houver tipos cadastrados
        if (allTypes.length === 0) {
          setAvailableDocuments([
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
          ]);
        } else {
          setAvailableDocuments(allTypes.sort());
        }
      } catch (error) {
        console.error('Erro ao carregar tipos de documentos:', error);
        // Usar lista padrão em caso de erro
        setAvailableDocuments([
          "RG - Registro Geral",
          "CPF - Cadastro de Pessoa Física", 
          "Comprovante de Residência"
        ]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocumentTypes();
  }, [company?.id]);

  const resetForm = () => {
    setFormData({
      projectName: "",
      clientName: "",
      clientEmail: "",
      cpfCnpj: "",
      description: "",
      priority: "Média",
      dueDate: "",
    });
    setRequiredDocuments([]);
    setSearchTerm("");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copiado!",
        description: "O link de convite foi copiado para a área de transferência.",
      });
    } catch (error) {
      console.error("Erro ao copiar:", error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link automaticamente. Copie manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !company?.id) {
      toast({
        title: "Erro",
        description: "Usuário ou empresa não identificados.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Creating process with company_id:', company?.id); // Debug log
      
      // 1. Criar o processo
      const { data: processData, error: processError } = await supabase
        .from("processes")
        .insert({
          project_name: formData.projectName || `Processo - ${formData.clientName}`,
          client_name: formData.clientName,
          client_email: formData.clientEmail,
          cpf_cnpj: formData.cpfCnpj,
          process_type: requiredDocuments.length > 0 ? `Documentação: ${requiredDocuments.slice(0,2).join(", ")}` : "Processo Documental",
          description: formData.description,
          priority: formData.priority,
          due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          company_id: company?.id,
          created_by: user.id,
          assigned_user_id: user.id,
        })
        .select()
        .single();
      
      console.log('Process created:', processData); // Debug log

      if (processError) {
        throw processError;
      }

      // 2. Gerar token de convite
      const { data: tokenData, error: tokenError } = await supabase
        .rpc("generate_invite_token");

      if (tokenError) {
        throw tokenError;
      }

      // 3. Criar convite
      const { error: inviteError } = await supabase
        .from("client_invites")
        .insert({
          email: formData.clientEmail,
          token: tokenData,
          company_id: company.id,
          process_id: processData.id,
          invited_by: user.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (inviteError) {
        throw inviteError;
      }

      // 4. Enviar email unificado (convite + boas-vindas)
      const generatedInviteLink = `${window.location.origin}/cadastro-via-convite?token=${tokenData}`;
      console.log('Sending unified invite email to:', formData.clientEmail, 'with link:', generatedInviteLink);
      
      try {
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke("send-unified-email", {
          body: {
            email: formData.clientEmail,
            full_name: formData.clientName,
            processId: processData.id,
            processName: formData.projectName || `Processo - ${formData.clientName}`,
            companyId: company.id,
            inviteLink: generatedInviteLink,
            inviterName: user?.user_metadata?.full_name || user?.email || company.name,
            role: 'client',
            isCollaborator: false
          },
        });

        if (emailError) {
          console.error("Erro ao enviar email:", emailError);
          throw emailError;
        }

        console.log('Email enviado com sucesso:', emailResponse);
      } catch (emailError) {
        console.error("Falha no envio do email:", emailError);
        // Continuar mesmo se o email falhar
      }

      // Sempre mostrar modal com link
      setInviteLink(generatedInviteLink);
      setClientName(formData.clientName);
      setShowInviteLink(true);

      toast({
        title: "Processo criado com sucesso!",
        description: `Processo criado. Email enviado para ${formData.clientEmail}. Link disponível para compartilhar.`,
      });

      // Refresh data if callback provided
      if (onProcessCreated) {
        onProcessCreated();
      }
      
      resetForm();
      // NÃO fechar o dialog aqui - ele será fechado quando o usuário fechar o modal do link
    } catch (error: any) {
      console.error("Erro ao criar processo:", error);
      toast({
        title: "Erro ao criar processo",
        description: error.message || "Erro interno do servidor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6">
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Processo
          </Button>
        </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Criar Processo e Convidar Cliente
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="projectName">Nome do Projeto/Processo</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={(e) =>
                setFormData({ ...formData, projectName: e.target.value })
              }
              placeholder="Ex: Processo de documentação para Maria Silva"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Email do Cliente</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) =>
                  setFormData({ ...formData, clientEmail: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
            <Input
              id="cpfCnpj"
              value={formData.cpfCnpj}
              onChange={(e) =>
                setFormData({ ...formData, cpfCnpj: e.target.value })
              }
              placeholder="Digite o CPF ou CNPJ do cliente"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva o processo..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Document Types Selection */}
          <div>
            <Label>Documentos Necessários</Label>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-8"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Carregando tipos de documentos...</span>
                  </div>
                ) : availableDocuments.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Nenhum tipo de documento encontrado.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cadastre tipos de documentos em <strong>Configurações → Tipos de Documentos</strong>
                    </p>
                  </div>
                ) : (
                  availableDocuments
                    .filter(doc => doc.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((doc) => (
                    <div key={doc} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`doc-${doc}`}
                        checked={requiredDocuments.includes(doc)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRequiredDocuments([...requiredDocuments, doc]);
                          } else {
                            setRequiredDocuments(requiredDocuments.filter(d => d !== doc));
                          }
                        }}
                        className="rounded border-border"
                      />
                      <Label htmlFor={`doc-${doc}`} className="text-sm cursor-pointer flex-1">
                        {doc}
                      </Label>
                    </div>
                  )))
                }
              </div>
              {requiredDocuments.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {requiredDocuments.length} documento(s) selecionado(s): {requiredDocuments.join(", ")}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-300">
                  Convite por Email
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Após criar o processo, um email de convite será automaticamente 
                  enviado para {formData.clientEmail || "o cliente"} com as instruções 
                  para criar sua conta e acessar o processo.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Processo e Enviar Convite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Modal para mostrar link de convite */}
    <Dialog open={showInviteLink} onOpenChange={setShowInviteLink}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            Processo Criado e Convite Enviado!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300">
                  Convite enviado por email
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  O email de boas-vindas foi enviado para <strong>{clientName}</strong>. Você também pode compartilhar o link abaixo diretamente:
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-link">Link de Convite para {clientName}</Label>
            <div className="flex space-x-2">
              <Input
                id="invite-link"
                value={inviteLink}
                readOnly
                className="flex-1 font-mono text-sm bg-muted"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(inviteLink)}
                className="px-3"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
              Como usar este link:
            </h4>
            <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
              <li>Copie o link acima (clique no botão de copiar)</li>
              <li>Envie por WhatsApp, email ou outro meio para {clientName}</li>
              <li>O cliente usará este link para criar sua conta e acessar o processo</li>
            </ol>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => copyToClipboard(inviteLink)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
            <Button onClick={() => {
              setShowInviteLink(false);
              setIsOpen(false);
            }}>
              Concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CreateProcessWithInvite;