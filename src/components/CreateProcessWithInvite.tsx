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

      // 4. Enviar email de convite (cadastro na plataforma)
      const inviteLink = `${window.location.origin}/cadastro-via-convite?token=${tokenData}`;
      console.log('Sending invite email to:', formData.clientEmail, 'with link:', inviteLink);
      
      const { data: inviteResponse, error: inviteEmailError } = await supabase.functions.invoke("invite-collaborator", {
        body: {
          email: formData.clientEmail,
          full_name: formData.clientName,
          inviterName: user?.user_metadata?.full_name || user?.email || company.name,
          inviteLink,
        },
      });

      console.log('Invite email response:', inviteResponse, 'error:', inviteEmailError);

      // 5. Enviar email de boas-vindas (acesso ao processo) 
      console.log('Sending welcome email to:', formData.clientEmail, 'for process:', processData.id);
      
      const { data: welcomeResponse, error: welcomeEmailError } = await supabase.functions.invoke("send-welcome-email", {
        body: {
          processId: processData.id,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          processName: formData.projectName || `Processo - ${formData.clientName}`,
          companyId: company.id,
        },
      });

      console.log('Welcome email response:', welcomeResponse, 'error:', welcomeEmailError);

      // Tratar erros de email
      if (inviteEmailError || welcomeEmailError) {
        console.error("Erro ao enviar emails:", { inviteEmailError, welcomeEmailError });
        
        // Mostrar modal com link de convite
        const generatedInviteLink = `${window.location.origin}/cadastro-via-convite?token=${tokenData}`;
        setInviteLink(generatedInviteLink);
        setClientName(formData.clientName);
        setShowInviteLink(true);

        toast({
          title: "Processo criado com sucesso!",
          description: "O email não pôde ser enviado, mas o link de convite está disponível para compartilhar.",
        });
      } else {
        toast({
          title: "Processo criado com sucesso!",
          description: `Processo criado com ${requiredDocuments.length} documento(s) necessário(s). Emails de convite e boas-vindas enviados para ${formData.clientEmail}.`,
        });
      }

      // Refresh data if callback provided
      if (onProcessCreated) {
        onProcessCreated();
      }
      
      resetForm();
      setIsOpen(false);
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
                {availableDocuments
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
                ))}
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
            Processo Criado com Sucesso!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Mail className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                  Email não enviado
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Houve um problema com o envio automático do email. Use o link abaixo para convidar <strong>{clientName}</strong> manualmente.
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
            <Button onClick={() => setShowInviteLink(false)}>
              Entendi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CreateProcessWithInvite;