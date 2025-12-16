import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, 
  Search,
  Mail,
  Calendar,
  FileText,
  ArrowLeft,
  Eye,
  Trash2,
  Settings2,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CreateClientDialog from '@/components/CreateClientDialog';
import CustomFieldTemplatesManager from '@/components/CustomFieldTemplatesManager';

interface Client {
  id: string;
  client_name: string;
  client_email: string;
  cpf_cnpj: string;
  process_count: number;
  last_update: string;
  registration_status: string;
  email_sent: boolean;
}

const GestaoClientes = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomFields, setShowCustomFields] = useState(false);

  const fetchClients = async () => {
    if (!user || !company) return;

    try {
      // Buscar todos os clientes cadastrados pela empresa
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, company_name, email, phone, cnpj, created_at, registration_status, email_sent')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Buscar contagem de processos por cliente
      const { data: processes, error: processesError } = await supabase
        .from('processes')
        .select('client_email, updated_at')
        .eq('company_id', company.id);

      if (processesError) throw processesError;

      // Mapear processos por email
      const processCountMap = new Map<string, { count: number; lastUpdate: string }>();
      processes?.forEach(process => {
        const email = process.client_email;
        if (!processCountMap.has(email)) {
          processCountMap.set(email, { count: 1, lastUpdate: process.updated_at });
        } else {
          const data = processCountMap.get(email)!;
          data.count += 1;
          if (new Date(process.updated_at) > new Date(data.lastUpdate)) {
            data.lastUpdate = process.updated_at;
          }
        }
      });

      // Combinar dados de clientes com contagem de processos
      const clientsList = clientsData?.map(client => {
        const processData = processCountMap.get(client.email);
        return {
          id: client.id,
          client_name: client.company_name,
          client_email: client.email,
          cpf_cnpj: client.cnpj || 'Não informado',
          process_count: processData?.count || 0,
          last_update: processData?.lastUpdate || client.created_at,
          registration_status: client.registration_status,
          email_sent: client.email_sent
        };
      }) || [];

      setClients(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user, company]);

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.client_name?.toLowerCase().includes(searchLower) ||
      client.client_email.toLowerCase().includes(searchLower) ||
      client.cpf_cnpj.toLowerCase().includes(searchLower)
    );
  });

  const handleViewClient = (clientId: string) => {
    navigate(`/gestao-clientes-qualificacao?clientId=${clientId}`);
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${clientName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast.success('Cliente excluído com sucesso');
      fetchClients();
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  if (!company) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-32 bg-muted rounded"></div>
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
            <p className="text-muted-foreground">Visualize todos os clientes vinculados à sua empresa</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CreateClientDialog onClientCreated={fetchClients} />
          <Button variant="outline" onClick={fetchClients} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Configurações de Campos Personalizados */}
      <Collapsible open={showCustomFields} onOpenChange={setShowCustomFields}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Configurar Campos Personalizados
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showCustomFields ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <CustomFieldTemplatesManager />
        </CollapsibleContent>
      </Collapsible>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes únicos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((sum, client) => sum + client.process_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Processos em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Processos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.length > 0 
                ? (clients.reduce((sum, client) => sum + client.process_count, 0) / clients.length).toFixed(1)
                : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Por cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou CPF/CNPJ..."
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
            <Users className="h-5 w-5" />
            Lista de Clientes
          </CardTitle>
          <CardDescription>
            Clientes com processos vinculados à sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum cliente encontrado</p>
              {searchTerm && (
                <p className="text-sm">Tente buscar com outros termos</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead className="text-center">Processos</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow 
                    key={client.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => handleViewClient(client.id)}
                  >
                    <TableCell className="font-medium">
                      {client.client_name}
                      {!client.email_sent && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Email não enviado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {client.client_email}
                      </div>
                    </TableCell>
                    <TableCell>{client.cpf_cnpj}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {client.process_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(client.last_update).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewClient(client.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client.id, client.client_name);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GestaoClientes;
