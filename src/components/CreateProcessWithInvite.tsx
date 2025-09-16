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
import { Mail, Plus } from "lucide-react";

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
      const { data: inviteEmailData, error: inviteEmailError } = await supabase.functions.invoke("send-invite-email", {
        body: {
          email: formData.clientEmail,
          processId: processData.id,
          clientName: formData.clientName,
          companyName: company.name,
          inviteToken: tokenData,
          inviteLink,
        },
      });
      if (!inviteEmailError && (inviteEmailData as any)?.emailed === false && (inviteEmailData as any)?.inviteUrl) {
        await navigator.clipboard.writeText((inviteEmailData as any).inviteUrl);
        toast({ title: 'Link de convite copiado', description: 'O provedor bloqueou o envio do email. O link foi copiado para você compartilhar.' });
      }

      // 5. Enviar email de boas-vindas (acesso ao processo)
      const { error: welcomeEmailError } = await supabase.functions.invoke("send-welcome-email", {
        body: {
          processId: processData.id,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          processName: formData.projectName || `Processo - ${formData.clientName}`,
          companyId: company.id,
        },
      });

      // Tratar erros de email
      if (inviteEmailError || welcomeEmailError) {
        console.error("Erro ao enviar emails:", { inviteEmailError, welcomeEmailError });
        
        let emailErrorMessage = "Processo criado com sucesso, mas houve problemas no envio de email";
        if (inviteEmailError && welcomeEmailError) {
          emailErrorMessage += " (convite e boas-vindas)";
        } else if (inviteEmailError) {
          emailErrorMessage += " (convite de cadastro)";
        } else if (welcomeEmailError) {
          emailErrorMessage += " (boas-vindas)";
        }
        emailErrorMessage += ". Você pode reenviar os emails posteriormente.";

        // Ajuda: Resend em modo de teste
        const errStr = `${inviteEmailError || ''} ${welcomeEmailError || ''}`;
        if (errStr.includes('You can only send testing emails')) {
          emailErrorMessage += " Dica: verifique seu domínio no Resend (resend.com/domains) ou use o botão 'Copiar link' para compartilhar o convite.";
        }
        
        toast({
          title: "Processo criado",
          description: emailErrorMessage,
          variant: "default",
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
  );
};

export default CreateProcessWithInvite;