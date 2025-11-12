import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  FileText, 
  Send,
  ArrowLeft,
  Search,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CreateClientDialog from '@/components/CreateClientDialog';

interface Client {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  cnpj?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zipcode?: string;
  admin_full_name?: string;
  admin_cpf?: string;
  qualification_method: 'company_fills' | 'client_fills';
  email_sent: boolean;
  email_sent_at?: string;
  registration_status: 'pending' | 'awaiting_client' | 'completed' | 'qualified';
  internal_notes?: string;
  created_at: string;
}

const GestaoClientesQualificacao = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchClients = async () => {
    if (!company?.id) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients((data || []) as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [company?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'qualified':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'awaiting_client':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'awaiting_client':
        return 'Aguardando Cliente';
      case 'completed':
        return 'Preenchido';
      case 'qualified':
        return 'Qualificado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'qualified':
        return <CheckCircle className="h-4 w-4" />;
      case 'awaiting_client':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleSendEmail = async (client: Client) => {
    if (!company?.id || !user?.id) return;

    setSendingEmail(true);
    try {
      // Gerar token único para o convite
      const inviteToken = crypto.randomUUID().replace(/-/g, '');
      
      // Criar registro de convite
      const { error: inviteError } = await supabase
        .from('client_invites')
        .insert({
          company_id: company.id,
          email: client.email,
          token: inviteToken,
          invited_by: user.id,
          process_id: null,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        });

      if (inviteError) {
        console.error('Erro ao criar convite:', inviteError);
        toast.error('Erro ao gerar link de convite');
        setSendingEmail(false);
        return;
      }

      // Enviar email com o token
      const { error: emailError } = await supabase.functions.invoke("send-unified-email", {
        body: {
          email: client.email,
          full_name: client.company_name,
          companyId: company.id,
          inviteLink: `${window.location.origin}/cadastro-via-convite?token=${inviteToken}`,
          inviterName: user?.user_metadata?.full_name || user?.email || company.name,
          role: 'client',
          isCollaborator: false,
        },
      });

      if (emailError) throw emailError;

      // Atualizar registro
      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          email_sent: true, 
          email_sent_at: new Date().toISOString(),
          registration_status: 'awaiting_client'
        })
        .eq('id', client.id);

      if (updateError) throw updateError;

      toast.success('E-mail enviado com sucesso!');
      fetchClients();
      setSelectedClient(null);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Erro ao enviar e-mail');
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/empresa')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Qualificação e cadastro de clientes</p>
          </div>
        </div>
        <CreateClientDialog onClientCreated={fetchClients} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Cliente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.registration_status === 'awaiting_client').length}
            </div>
            <p className="text-xs text-muted-foreground">Precisam preencher dados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.registration_status === 'completed' || c.registration_status === 'qualified').length}
            </div>
            <p className="text-xs text-muted-foreground">Dados completos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Não Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => !c.email_sent && c.qualification_method === 'client_fills').length}
            </div>
            <p className="text-xs text-muted-foreground">Pendentes de convite</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de Clientes
          </CardTitle>
          <CardDescription>
            Gerencie seus clientes e envie convites de cadastro
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum cliente encontrado</p>
              <p className="text-sm">Clique em "Novo Cliente" para cadastrar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.company_name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.qualification_method === 'company_fills' 
                          ? 'Empresa' 
                          : 'Cliente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(client.registration_status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(client.registration_status)}
                          {getStatusLabel(client.registration_status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedClient(client)}
                      >
                        Ver Detalhes
                      </Button>
                      {!client.email_sent && client.qualification_method === 'client_fills' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSendEmail(client)}
                          disabled={sendingEmail}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Enviar E-mail
                        </Button>
                      )}
                      {client.email_sent && (
                        <Badge variant="secondary" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          E-mail Enviado
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Client Details Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Detalhes do Cliente
            </DialogTitle>
            <DialogDescription>
              Informações completas do cliente
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6">
              {/* Dados Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados Básicos
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nome da Empresa</Label>
                    <p className="font-medium">{selectedClient.company_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">CNPJ</Label>
                    <p className="font-medium">{selectedClient.cnpj || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">E-mail</Label>
                    <p className="font-medium">{selectedClient.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Telefone</Label>
                    <p className="font-medium">{selectedClient.phone}</p>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              {selectedClient.address_street && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Endereço da Sede
                    </h3>
                    <p className="text-sm">
                      {selectedClient.address_street}, {selectedClient.address_number}
                      {selectedClient.address_complement && ` - ${selectedClient.address_complement}`}
                      <br />
                      {selectedClient.address_neighborhood} - {selectedClient.address_city}/{selectedClient.address_state}
                      <br />
                      CEP: {selectedClient.address_zipcode}
                    </p>
                  </div>
                </>
              )}

              {/* Sócio Administrador / Representante Legal */}
              {(selectedClient.admin_full_name || selectedClient.admin_cpf) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Sócio Administrador / Representante Legal
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Nome Completo</Label>
                        <p className="font-medium">{selectedClient.admin_full_name || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">CPF</Label>
                        <p className="font-medium">{selectedClient.admin_cpf || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Status e Observações */}
              <Separator />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedClient.registration_status)}>
                        {getStatusLabel(selectedClient.registration_status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Método de Qualificação</Label>
                    <p className="font-medium mt-1">
                      {selectedClient.qualification_method === 'company_fills' 
                        ? 'Empresa preenche' 
                        : 'Cliente preenche'}
                    </p>
                  </div>
                </div>

                {selectedClient.internal_notes && (
                  <div>
                    <Label className="text-muted-foreground">Observações Internas</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                      {selectedClient.internal_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Botão de Envio de Email */}
              {!selectedClient.email_sent && selectedClient.qualification_method === 'client_fills' && (
                <>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSendEmail(selectedClient)}
                      disabled={sendingEmail}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendingEmail ? 'Enviando...' : 'Enviar E-mail de Cadastro'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestaoClientesQualificacao;
