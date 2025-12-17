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
import { ProcessClientsManager, ProcessClient } from "./ProcessClientsManager";
import DocumentSelector from "./DocumentSelector";

interface CreateProcessForm {
  projectName: string;
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
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [clientName, setClientName] = useState("");
  const [processClients, setProcessClients] = useState<ProcessClient[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();

  const [formData, setFormData] = useState<CreateProcessForm>({
    projectName: "",
    description: "",
    priority: "Média",
    dueDate: "",
  });

  const resetForm = () => {
    setFormData({
      projectName: "",
      description: "",
      priority: "Média",
      dueDate: "",
    });
    setProcessClients([]);
    setRequiredDocuments([]);
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

    if (processClients.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um cliente ao processo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Creating process with company_id:', company?.id);
      
      // Pegar cliente primário
      const primaryClient = processClients.find(c => c.is_primary) || processClients[0];
      
      // 1. Criar o processo (ainda usa campos legados para compatibilidade)
      const { data: processData, error: processError} = await supabase
        .from("processes")
        .insert({
          project_name: formData.projectName,
          client_name: primaryClient.client_name,
          client_email: primaryClient.client_email,
          cpf_cnpj: primaryClient.cpf_cnpj || null,
          process_type: requiredDocuments.length > 0 ? `Documentação: ${requiredDocuments.join(", ")}` : "Processo Documental",
          description: formData.description,
          priority: formData.priority,
          due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          company_id: company?.id,
          created_by: user.id,
          assigned_user_id: user.id,
        })
        .select()
        .single();
      
      console.log('Process created:', processData);

      if (processError) {
        throw processError;
      }

      // 2. Inserir todos os clientes na tabela process_clients
      const clientsToInsert = processClients.map(client => ({
        process_id: processData.id,
        client_name: client.client_name,
        client_email: client.client_email,
        cpf_cnpj: client.cpf_cnpj || null,
        is_primary: client.is_primary
      }));

      const { error: clientsError } = await supabase
        .from('process_clients')
        .insert(clientsToInsert);

      if (clientsError) {
        console.error('Error inserting process clients:', clientsError);
        throw clientsError;
      }

      // 2.5 Salvar campos personalizados de cada cliente
      for (const client of processClients) {
        if (client.customFields && client.customFields.length > 0) {
          // Verificar se o cliente já existe na tabela clients
          let { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('email', client.client_email)
            .eq('company_id', company.id)
            .maybeSingle();

          let clientId: string;
          
          if (existingClient) {
            clientId = existingClient.id;
          } else {
            // Criar cliente se não existir
            const { data: newClient, error: newClientError } = await supabase
              .from('clients')
              .insert({
                company_id: company.id,
                company_name: client.client_name,
                email: client.client_email,
                phone: '',
                cnpj: client.cpf_cnpj || null,
                created_by: user.id,
                registration_status: 'pending'
              })
              .select('id')
              .single();

            if (newClientError) {
              console.error('Error creating client:', newClientError);
              continue;
            }
            clientId = newClient.id;
          }

          // Salvar campos personalizados
          const customFieldsToInsert = client.customFields.map(field => ({
            client_id: clientId,
            company_id: company.id,
            field_name: field.field_name,
            field_type: field.field_type,
            field_value: field.field_value,
            is_required: field.is_required,
            template_id: field.template_id || null
          }));

          const { error: fieldsError } = await supabase
            .from('client_custom_field_values')
            .insert(customFieldsToInsert);

          if (fieldsError) {
            console.error('Error saving custom fields:', fieldsError);
          }
        }
      }

      // 3. Enviar convites para todos os clientes
      for (const client of processClients) {
        try {
          // Gerar token de convite
          const { data: tokenData, error: tokenError } = await supabase
            .rpc("generate_invite_token");

          if (tokenError) {
            console.error('Token generation error for', client.client_email, tokenError);
            continue;
          }

          // Criar convite
          const { error: inviteError } = await supabase
            .from("client_invites")
            .insert({
              email: client.client_email,
              token: tokenData,
              company_id: company.id,
              process_id: processData.id,
              invited_by: user.id,
              status: 'pending',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            });

          if (inviteError) {
            console.error('Invite creation error for', client.client_email, inviteError);
            continue;
          }

          // Verificar se cliente já existe
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', client.client_email)
            .maybeSingle();

          const isExistingClient = !!existingUser;
          const accessLink = isExistingClient
            ? `${window.location.origin}/cliente?id=${processData.id}`
            : `${window.location.origin}/cadastro-via-convite?token=${tokenData}`;

          // Enviar email
          const emailBody = isExistingClient ? {
            email: client.client_email,
            full_name: client.client_name,
            processId: processData.id,
            processName: formData.projectName || `Processo - ${client.client_name}`,
            companyId: company.id,
            directAccessLink: accessLink,
            inviterName: user?.user_metadata?.full_name || user?.email || company.name,
            isExistingClient: true
          } : {
            email: client.client_email,
            full_name: client.client_name,
            processId: processData.id,
            processName: formData.projectName || `Processo - ${client.client_name}`,
            companyId: company.id,
            inviteLink: accessLink,
            inviterName: user?.user_metadata?.full_name || user?.email || company.name,
            role: 'client',
            isCollaborator: false
          };

          await supabase.functions.invoke("send-unified-email", {
            body: emailBody
          });
        } catch (emailError) {
          console.error(`Erro ao enviar email para ${client.client_email}:`, emailError);
        }
      }

      // Mostrar link do cliente primário
      const primaryAccessLink = `${window.location.origin}/cliente?id=${processData.id}`;
      setInviteLink(primaryAccessLink);
      setClientName(primaryClient.client_name);
      setShowInviteLink(true);

      toast({
        title: "Processo criado com sucesso!",
        description: `Processo criado com ${processClients.length} cliente(s). Convites enviados por email.`,
      });

      if (onProcessCreated) {
        onProcessCreated();
      }
      
      resetForm();
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
          <Button size="sm">
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
            <Label htmlFor="projectName">Nome do Processo *</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={(e) =>
                setFormData({ ...formData, projectName: e.target.value })
              }
              placeholder="Ex: Abertura de Empresa, Regularização Fiscal..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Digite o nome que identifica este processo/projeto
            </p>
          </div>

          <ProcessClientsManager
            clients={processClients}
            onChange={setProcessClients}
            companyId={company?.id}
          />

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
          <DocumentSelector
            selectedDocuments={requiredDocuments}
            onSelectionChange={setRequiredDocuments}
          />

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