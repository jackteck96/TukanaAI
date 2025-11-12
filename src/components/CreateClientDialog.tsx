import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Building2, Mail, Phone, MapPin, User, FileText } from "lucide-react";

interface CreateClientDialogProps {
  onClientCreated?: () => void;
}

const CreateClientDialog = ({ onClientCreated }: CreateClientDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { company } = useCompany();
  const { user } = useAuth();
  const uid = useId();

  // Checkboxes
  const [qualificationMethod, setQualificationMethod] = useState<'company_fills' | 'client_fills'>('company_fills');
  const [sendEmailNow, setSendEmailNow] = useState(false);

  // Dados básicos (obrigatórios inicialmente)
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Dados completos (opcionais no início, obrigatórios quando empresa preenche)
  const [cnpj, setCnpj] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZipcode, setAddressZipcode] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [adminCpf, setAdminCpf] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const resetForm = () => {
    setQualificationMethod('company_fills');
    setSendEmailNow(false);
    setCompanyName("");
    setEmail("");
    setPhone("");
    setCnpj("");
    setAddressStreet("");
    setAddressNumber("");
    setAddressComplement("");
    setAddressNeighborhood("");
    setAddressCity("");
    setAddressState("");
    setAddressZipcode("");
    setAdminFullName("");
    setAdminCpf("");
    setInternalNotes("");
  };

  const validateBasicFields = () => {
    if (!companyName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome da empresa é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast({
        title: "Campo obrigatório",
        description: "E-mail válido é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    if (!phone.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Telefone é obrigatório",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateFullFields = () => {
    if (qualificationMethod === 'company_fills') {
      const missingFields = [];
      if (!cnpj.trim()) missingFields.push("CNPJ");
      if (!addressStreet.trim()) missingFields.push("Endereço");
      if (!addressNumber.trim()) missingFields.push("Número");
      if (!addressNeighborhood.trim()) missingFields.push("Bairro");
      if (!addressCity.trim()) missingFields.push("Cidade");
      if (!addressState.trim()) missingFields.push("Estado");
      if (!addressZipcode.trim()) missingFields.push("CEP");
      if (!adminFullName.trim()) missingFields.push("Nome do sócio");
      if (!adminCpf.trim()) missingFields.push("CPF do sócio");

      if (missingFields.length > 0) {
        toast({
          title: "Campos obrigatórios faltando",
          description: `Preencha: ${missingFields.join(", ")}`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company?.id || !user?.id) {
      toast({
        title: "Erro",
        description: "Empresa ou usuário não identificados",
        variant: "destructive",
      });
      return;
    }

    if (!validateBasicFields()) return;
    if (!validateFullFields()) return;

    setLoading(true);

    try {
      // Verificar se cliente já existe (por email ou CNPJ)
      const { data: existingClients, error: checkError } = await supabase
        .from("clients")
        .select("id, email, cnpj")
        .eq("company_id", company.id)
        .or(`email.eq.${email}${cnpj ? `,cnpj.eq.${cnpj}` : ''}`);

      if (checkError) {
        console.error("Erro ao verificar cliente existente:", checkError);
      }

      if (existingClients && existingClients.length > 0) {
        const duplicate = existingClients[0];
        const reason = duplicate.email === email ? "e-mail" : "CNPJ";
        toast({
          title: "Cliente já cadastrado",
          description: `Já existe um cliente cadastrado com este ${reason}.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const registrationStatus =
        qualificationMethod === 'client_fills'
          ? 'awaiting_client'
          : cnpj && adminFullName && adminCpf
          ? 'completed'
          : 'pending';

      const clientData = {
        company_id: company.id,
        company_name: companyName,
        email,
        phone,
        cnpj: cnpj || null,
        address_street: addressStreet || null,
        address_number: addressNumber || null,
        address_complement: addressComplement || null,
        address_neighborhood: addressNeighborhood || null,
        address_city: addressCity || null,
        address_state: addressState || null,
        address_zipcode: addressZipcode || null,
        admin_full_name: adminFullName || null,
        admin_cpf: adminCpf || null,
        qualification_method: qualificationMethod,
        email_preference: sendEmailNow ? 'send_now' : 'register_only',
        email_sent: false,
        registration_status: registrationStatus,
        internal_notes: internalNotes || null,
        created_by: user.id,
      };

      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert(clientData)
        .select()
        .single();

      if (clientError) throw clientError;

      // Se deve enviar email agora, criar convite com token
      if (sendEmailNow && newClient && qualificationMethod === 'client_fills') {
        // Gerar token único para o convite
        const inviteToken = crypto.randomUUID().replace(/-/g, '');
        
        // Criar registro de convite
        const { error: inviteError } = await supabase
          .from('client_invites')
          .insert({
            company_id: company.id,
            email: email,
            token: inviteToken,
            invited_by: user.id,
            process_id: null,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
          });

        if (inviteError) {
          console.error('Erro ao criar convite:', inviteError);
          toast({
            title: "Cliente criado, mas erro no convite",
            description: "Não foi possível gerar o link de convite.",
            variant: "destructive",
          });
        } else {
          // Enviar email com o token
          try {
            const emailBody = {
              email: email,
              full_name: companyName,
              companyId: company.id,
              inviteLink: `${window.location.origin}/cadastro-via-convite?token=${inviteToken}`,
              inviterName: user?.user_metadata?.full_name || user?.email || company.name,
              role: 'client',
              isCollaborator: false,
            };

            const { error: emailError } = await supabase.functions.invoke("send-unified-email", {
              body: emailBody,
            });

            if (emailError) {
              console.error("Erro ao enviar email:", emailError);
              toast({
                title: "Cliente criado, mas erro no email",
                description: "Cliente cadastrado, mas não foi possível enviar o email. Você pode reenviá-lo depois.",
                variant: "destructive",
              });
            } else {
              // Atualizar registro marcando que email foi enviado
              await supabase
                .from("clients")
                .update({ email_sent: true, email_sent_at: new Date().toISOString() })
                .eq("id", newClient.id);

              toast({
                title: "Cliente criado com sucesso!",
                description: "Email de cadastro enviado para o cliente.",
              });
            }
          } catch (emailError) {
            console.error("Exceção ao enviar email:", emailError);
          }
        }
      } else if (sendEmailNow && newClient && qualificationMethod === 'company_fills') {
        // Para empresa preenche, apenas enviar confirmação (sem convite)
        try {
          const emailBody = {
            email: email,
            full_name: companyName,
            companyId: company.id,
            confirmationLink: `${window.location.origin}/cliente`,
            inviterName: user?.user_metadata?.full_name || user?.email || company.name,
            role: 'client',
            isCollaborator: false,
            isConfirmation: true,
          };

          const { error: emailError } = await supabase.functions.invoke("send-unified-email", {
            body: emailBody,
          });

          if (emailError) {
            console.error("Erro ao enviar email:", emailError);
            toast({
              title: "Cliente criado, mas erro no email",
              description: "Cliente cadastrado, mas não foi possível enviar o email.",
              variant: "destructive",
            });
          } else {
            await supabase
              .from("clients")
              .update({ email_sent: true, email_sent_at: new Date().toISOString() })
              .eq("id", newClient.id);

            toast({
              title: "Cliente criado com sucesso!",
              description: "Email de confirmação enviado para o cliente.",
            });
          }
        } catch (emailError) {
          console.error("Exceção ao enviar email:", emailError);
        }
      } else {
        toast({
          title: "Cliente criado com sucesso!",
          description: qualificationMethod === 'company_fills'
            ? "Cliente qualificado pela empresa."
            : "Cliente cadastrado. Você pode enviar o email posteriormente.",
        });
      }

      resetForm();
      setIsOpen(false);
      if (onClientCreated) onClientCreated();
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error);
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Cadastrar Novo Cliente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Checkboxes de Qualificação */}
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  1️⃣ Método de Qualificação do Cliente
                </Label>
                <RadioGroup
                  name="qualification"
                  value={qualificationMethod}
                  onValueChange={(v) => { console.log('[CreateClientDialog] onValueChange qualificationMethod', v); setQualificationMethod(v as 'company_fills' | 'client_fills') }}
                  className="space-y-3"
                >
                  <div 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      qualificationMethod === 'company_fills' ? 'bg-primary/10 border-primary' : 'hover:bg-accent/50'
                    }`}
                  >
                    <RadioGroupItem id={`${uid}-company-fills`} value="company_fills" />
                    <Label htmlFor={`${uid}-company-fills`} className="cursor-pointer flex-1">
                      <span className="font-medium">A empresa vai qualificar o cliente</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        A empresa preenche todos os dados do cliente
                      </p>
                    </Label>
                  </div>

                  <div 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      qualificationMethod === 'client_fills' ? 'bg-primary/10 border-primary' : 'hover:bg-accent/50'
                    }`}
                  >
                    <RadioGroupItem id={`${uid}-client-fills`} value="client_fills" />
                    <Label htmlFor={`${uid}-client-fills`} className="cursor-pointer flex-1">
                      <span className="font-medium">O cliente deve preencher seus próprios dados</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cliente será convidado a se cadastrar via email
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  2️⃣ Envio de E-mail Automático
                </Label>
                <RadioGroup
                  name="emailPreference"
                  value={sendEmailNow ? 'send_now' : 'register_only'}
                  onValueChange={(v) => { console.log('[CreateClientDialog] onValueChange sendEmailNow', v); setSendEmailNow(v === 'send_now') }}
                  className="space-y-3"
                >
                  <div 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      sendEmailNow ? 'bg-primary/10 border-primary' : 'hover:bg-accent/50'
                    }`}
                  >
                    <RadioGroupItem id={`${uid}-send-now`} value="send_now" />
                    <Label htmlFor={`${uid}-send-now`} className="cursor-pointer flex-1">
                      <span className="font-medium">Enviar e-mail automático agora</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cliente receberá {qualificationMethod === 'company_fills' ? 'confirmação de cadastro' : 'convite para cadastro'} imediatamente
                      </p>
                    </Label>
                  </div>

                  <div 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      !sendEmailNow ? 'bg-primary/10 border-primary' : 'hover:bg-accent/50'
                    }`}
                  >
                     <RadioGroupItem id={`${uid}-send-later`} value="register_only" />
                     <Label htmlFor={`${uid}-send-later`} className="cursor-pointer flex-1">
                      <span className="font-medium">Apenas cadastrar (sem enviar e-mail agora)</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Você poderá enviar o e-mail manualmente depois
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Dados Básicos Obrigatórios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados Básicos (Obrigatórios)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="companyName">
                  Nome da Empresa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Empresa XYZ Ltda"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">
                  E-mail de Contato <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">
                  Telefone de Contato <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dados Completos (aparecem quando empresa vai qualificar) */}
          {qualificationMethod === 'company_fills' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Dados Completos do Cliente
                </h3>

                <div>
                  <Label htmlFor="cnpj">
                    CNPJ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    required={qualificationMethod === 'company_fills'}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço da Sede
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="addressStreet">
                        Rua/Avenida <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="addressStreet"
                        value={addressStreet}
                        onChange={(e) => setAddressStreet(e.target.value)}
                        placeholder="Ex: Avenida Paulista"
                        required={qualificationMethod === 'company_fills'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressNumber">
                        Número <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="addressNumber"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        placeholder="123"
                        required={qualificationMethod === 'company_fills'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addressComplement">Complemento</Label>
                      <Input
                        id="addressComplement"
                        value={addressComplement}
                        onChange={(e) => setAddressComplement(e.target.value)}
                        placeholder="Sala, andar..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressNeighborhood">
                        Bairro <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="addressNeighborhood"
                        value={addressNeighborhood}
                        onChange={(e) => setAddressNeighborhood(e.target.value)}
                        placeholder="Ex: Bela Vista"
                        required={qualificationMethod === 'company_fills'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="addressCity">
                        Cidade <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="addressCity"
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        placeholder="Ex: São Paulo"
                        required={qualificationMethod === 'company_fills'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressState">
                        Estado <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="addressState"
                        value={addressState}
                        onChange={(e) => setAddressState(e.target.value)}
                        placeholder="SP"
                        maxLength={2}
                        required={qualificationMethod === 'company_fills'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="addressZipcode">
                        CEP <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="addressZipcode"
                        value={addressZipcode}
                        onChange={(e) => setAddressZipcode(e.target.value)}
                        placeholder="00000-000"
                        required={qualificationMethod === 'company_fills'}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados do Sócio Administrador
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminFullName">
                        Nome Completo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="adminFullName"
                        value={adminFullName}
                        onChange={(e) => setAdminFullName(e.target.value)}
                        placeholder="Nome do sócio administrador"
                        required={qualificationMethod === 'company_fills'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminCpf">
                        CPF <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="adminCpf"
                        value={adminCpf}
                        onChange={(e) => setAdminCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        required={qualificationMethod === 'company_fills'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Observações Internas */}
          <div>
            <Label htmlFor="internalNotes">Observações Internas (opcional)</Label>
            <Textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notas ou observações sobre este cliente (visível apenas para a empresa)"
              rows={3}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientDialog;
