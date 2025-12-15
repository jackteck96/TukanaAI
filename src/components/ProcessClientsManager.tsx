import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Star } from 'lucide-react';
import { ClientAutocomplete } from './ClientAutocomplete';

export interface ProcessClient {
  id?: string;
  client_name: string;
  client_email: string;
  cpf_cnpj?: string;
  is_primary: boolean;
}

interface ProcessClientsManagerProps {
  clients: ProcessClient[];
  onChange: (clients: ProcessClient[]) => void;
  companyId?: string;
}

export const ProcessClientsManager = ({ 
  clients, 
  onChange,
  companyId 
}: ProcessClientsManagerProps) => {
  const [newClient, setNewClient] = useState<ProcessClient>({
    client_name: '',
    client_email: '',
    cpf_cnpj: '',
    is_primary: false
  });
  const [showAddMore, setShowAddMore] = useState(false);

  const handleAddClient = () => {
    if (!newClient.client_name || !newClient.client_email) {
      return;
    }

    const updatedClients = [...clients, { ...newClient }];
    
    // Se for o primeiro cliente, marcar como primário
    if (updatedClients.length === 1) {
      updatedClients[0].is_primary = true;
    }

    onChange(updatedClients);
    
    // Resetar form
    setNewClient({
      client_name: '',
      client_email: '',
      cpf_cnpj: '',
      is_primary: false
    });
  };

  const handleRemoveClient = (index: number) => {
    const updatedClients = clients.filter((_, i) => i !== index);
    
    // Se remover o cliente primário e ainda houver outros, marcar o primeiro como primário
    if (clients[index].is_primary && updatedClients.length > 0) {
      updatedClients[0].is_primary = true;
    }
    
    onChange(updatedClients);
  };

  const handleSetPrimary = (index: number) => {
    const updatedClients = clients.map((client, i) => ({
      ...client,
      is_primary: i === index
    }));
    onChange(updatedClients);
  };

  const handleSelectExistingClient = (client: { client_name: string; client_email: string; cpf_cnpj: string }) => {
    setNewClient({
      client_name: client.client_name,
      client_email: client.client_email,
      cpf_cnpj: client.cpf_cnpj || '',
      is_primary: false
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Cliente(s) do Processo *</Label>
        {clients.length > 0 && (
          <Badge variant="secondary">
            {clients.length} cliente{clients.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Lista de clientes adicionados */}
      {clients.length > 0 && (
        <div className="space-y-2">
          {clients.map((client, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{client.client_name}</p>
                    {client.is_primary && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Principal
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{client.client_email}</p>
                  {client.cpf_cnpj && (
                    <p className="text-xs text-muted-foreground mt-1">{client.cpf_cnpj}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!client.is_primary && clients.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(index)}
                      title="Marcar como principal"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveClient(index)}
                    className="text-destructive hover:text-destructive"
                    title="Remover cliente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário para o primeiro cliente ou adicionar mais */}
      {clients.length === 0 ? (
        // Formulário simplificado para o primeiro cliente
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label htmlFor="client_name" className="text-xs">
              Nome do Cliente *
            </Label>
            {companyId ? (
              <ClientAutocomplete
                companyId={companyId}
                value={newClient.client_name}
                onChange={(value) => setNewClient({ ...newClient, client_name: value })}
                onClientSelect={handleSelectExistingClient}
              />
            ) : (
              <Input
                id="client_name"
                value={newClient.client_name}
                onChange={(e) => setNewClient({ ...newClient, client_name: e.target.value })}
                placeholder="Nome do cliente"
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Digite para buscar cliente existente ou inserir um novo
            </p>
          </div>

          <div>
            <Label htmlFor="client_email" className="text-xs">
              Email *
            </Label>
            <Input
              id="client_email"
              type="email"
              value={newClient.client_email}
              onChange={(e) => setNewClient({ ...newClient, client_email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="cpf_cnpj" className="text-xs">
              CPF/CNPJ (opcional)
            </Label>
            <Input
              id="cpf_cnpj"
              value={newClient.cpf_cnpj}
              onChange={(e) => setNewClient({ ...newClient, cpf_cnpj: e.target.value })}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>

          <Button
            type="button"
            onClick={handleAddClient}
            disabled={!newClient.client_name || !newClient.client_email}
            className="w-full"
          >
            Confirmar Cliente
          </Button>
        </div>
      ) : (
        // Botão para adicionar mais clientes (colapsado por padrão)
        <div className="space-y-3">
          {!showAddMore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddMore(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar outro cliente
            </Button>
          ) : (
            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Adicionar Outro Cliente</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddMore(false);
                      setNewClient({
                        client_name: '',
                        client_email: '',
                        cpf_cnpj: '',
                        is_primary: false
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="client_name_add" className="text-xs">
                    Nome do Cliente *
                  </Label>
                  {companyId ? (
                    <ClientAutocomplete
                      companyId={companyId}
                      value={newClient.client_name}
                      onChange={(value) => setNewClient({ ...newClient, client_name: value })}
                      onClientSelect={handleSelectExistingClient}
                    />
                  ) : (
                    <Input
                      id="client_name_add"
                      value={newClient.client_name}
                      onChange={(e) => setNewClient({ ...newClient, client_name: e.target.value })}
                      placeholder="Nome do cliente"
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="client_email_add" className="text-xs">
                    Email *
                  </Label>
                  <Input
                    id="client_email_add"
                    type="email"
                    value={newClient.client_email}
                    onChange={(e) => setNewClient({ ...newClient, client_email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="cpf_cnpj_add" className="text-xs">
                    CPF/CNPJ (opcional)
                  </Label>
                  <Input
                    id="cpf_cnpj_add"
                    value={newClient.cpf_cnpj}
                    onChange={(e) => setNewClient({ ...newClient, cpf_cnpj: e.target.value })}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    handleAddClient();
                    setShowAddMore(false);
                  }}
                  disabled={!newClient.client_name || !newClient.client_email}
                  className="w-full"
                  variant="secondary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
