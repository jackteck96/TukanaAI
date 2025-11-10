import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Process {
  id: string;
  client_name: string;
  process_type: string;
  status: string;
}

interface ClientCollaboratorInviteProps {
  clientEmail: string;
  onInviteSent?: () => void;
}

const ClientCollaboratorInvite = ({ clientEmail, onInviteSent }: ClientCollaboratorInviteProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    access_type: 'limited' as 'full' | 'limited',
    allowed_process_ids: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      loadProcesses();
    }
  }, [isOpen]);

  const loadProcesses = async () => {
    setLoadingProcesses(true);
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('id, client_name, process_type, status')
        .eq('client_email', clientEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcesses(data || []);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar processos',
        variant: 'destructive'
      });
    } finally {
      setLoadingProcesses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);

    try {
      // Gerar token único
      const token = crypto.randomUUID().replace(/-/g, '');
      
      // Criar convite para colaborador de cliente
      const { error: inviteError } = await supabase
        .from('user_invites')
        .insert({
          token,
          email: formData.email,
          full_name: formData.full_name,
          role: 'staff',
          client_email: clientEmail,
          invited_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          access_type: formData.access_type,
          allowed_process_ids: formData.access_type === 'limited' ? formData.allowed_process_ids : []
        });

      if (inviteError) throw inviteError;

      // Enviar email de convite
      const inviteLink = `${window.location.origin}/cadastro-via-convite?token=${token}`;
      
      try {
        // Buscar o email do cliente atual para incluir no email
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        await supabase.functions.invoke('send-unified-email', {
          body: {
            email: formData.email,
            full_name: formData.full_name,
            inviteLink: inviteLink,
            inviterName: profileData?.full_name || user.email || 'Cliente',
            role: 'client_collaborator',
            isCollaborator: true
          }
        });
        
        toast({
          title: "Convite enviado",
          description: "O colaborador receberá um email com o link de convite.",
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        toast({
          title: "Convite criado",
          description: "Não foi possível enviar o email, mas você pode compartilhar o link: " + inviteLink,
          variant: "default"
        });
      }

      setIsOpen(false);
      setFormData({ email: '', full_name: '', access_type: 'limited', allowed_process_ids: [] });
      onInviteSent?.();
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Convidar Colaborador do Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-4">
            <Label>Tipo de Acesso</Label>
            <RadioGroup 
              value={formData.access_type} 
              onValueChange={(value: 'full' | 'limited') => {
                setFormData({ 
                  ...formData, 
                  access_type: value,
                  allowed_process_ids: value === 'full' ? [] : formData.allowed_process_ids
                });
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="font-normal cursor-pointer">
                  🔓 Acesso total (vê todos os processos)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="limited" id="limited" />
                <Label htmlFor="limited" className="font-normal cursor-pointer">
                  🔒 Acesso limitado (selecionar processos)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.access_type === 'limited' && (
            <div className="space-y-4">
              <Label>Processos Autorizados ({formData.allowed_process_ids.length} selecionados)</Label>
              {loadingProcesses ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  {processes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum processo ativo encontrado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {processes.map(process => (
                        <div key={process.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={`process-${process.id}`}
                            checked={formData.allowed_process_ids.includes(process.id)}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                allowed_process_ids: checked
                                  ? [...prev.allowed_process_ids, process.id]
                                  : prev.allowed_process_ids.filter(id => id !== process.id)
                              }));
                            }}
                          />
                          <Label
                            htmlFor={`process-${process.id}`}
                            className="font-normal cursor-pointer flex-1"
                          >
                            <div>
                              <div className="font-medium">{process.client_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {process.process_type} - {process.status}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
              {formData.allowed_process_ids.length === 0 && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Nenhum processo selecionado. O colaborador não terá acesso a processos até que você configure as permissões.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientCollaboratorInvite;
