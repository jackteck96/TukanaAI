import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Send, UserPlus, Copy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface InviteFormData {
  email: string;
  role: 'staff';
  full_name: string;
  access_type: 'full' | 'limited';
  allowed_process_ids: string[];
}

interface Process {
  id: string;
  client_name: string;
  process_type: string;
  status: string;
}

interface UserInviteSystemProps {
  onInviteSent?: () => void;
}

export default function UserInviteSystem({ onInviteSent }: UserInviteSystemProps) {
  const { user } = useAuth();
  const { company } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [inviteData, setInviteData] = useState<InviteFormData>({
    email: '',
    role: 'staff',
    full_name: '',
    access_type: 'limited',
    allowed_process_ids: []
  });

  useEffect(() => {
    if (isOpen) {
      loadProcesses();
    }
  }, [isOpen]);

  const loadProcesses = async () => {
    if (!company?.id) return;
    
    setLoadingProcesses(true);
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('id, client_name, process_type, status')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcesses(data || []);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
      toast.error('Erro ao carregar processos');
    } finally {
      setLoadingProcesses(false);
    }
  };

  const generateInviteLink = async () => {
    try {
      // Gerar um token único para o convite
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invite_token');

      if (tokenError) throw tokenError;

      // Obter informações da empresa do usuário atual
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Criar convite na tabela
      const { error: inviteError } = await supabase
        .from('user_invites')
        .insert({
          token: tokenData,
          email: inviteData.email,
          full_name: inviteData.full_name,
          role: inviteData.role,
          company_id: userProfile.company_id,
          invited_by: user?.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
          status: 'pending',
          access_type: inviteData.access_type,
          allowed_process_ids: inviteData.access_type === 'limited' ? inviteData.allowed_process_ids : []
        });

      if (inviteError) throw inviteError;

      return tokenData;
    } catch (error) {
      console.error('Erro ao gerar convite:', error);
      throw error;
    }
  };

  const sendInviteEmail = async (token: string) => {
    try {
      if (!user || !company?.id) {
        throw new Error('Usuário ou empresa não identificados');
      }

      const inviteLink = `${window.location.origin}/cadastro-via-convite?token=${token}`;
      
      console.log('[UserInviteSystem] Sending unified email...');
      console.log('[UserInviteSystem] Email:', inviteData.email);
      console.log('[UserInviteSystem] Company ID:', company.id);
      console.log('[UserInviteSystem] Invite Link:', inviteLink);
      
      // Usar o edge function unificado para colaborador
      const { data: emailResponse, error } = await supabase.functions.invoke('send-unified-email', {
        body: {
          email: inviteData.email,
          full_name: inviteData.full_name,
          companyId: company.id,
          inviteLink: inviteLink,
          inviterName: user?.user_metadata?.full_name || user?.email || company.name,
          role: inviteData.role,
          isCollaborator: true
        }
      });

      console.log('[UserInviteSystem] Email response:', emailResponse);
      console.log('[UserInviteSystem] Email error:', error);

      if (error) {
        console.error('[UserInviteSystem] Edge function error:', error);
        throw error;
      }

      if (emailResponse && !emailResponse.success) {
        console.error('[UserInviteSystem] Email send failed:', emailResponse);
        throw new Error(emailResponse.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('[UserInviteSystem] Erro ao enviar email:', error);
      throw error;
    }
  };

  const handleSendInvite = async () => {
    if (!inviteData.email || !inviteData.full_name) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSending(true);

    try {
      // Verificar se o email já possui uma conta
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteData.email)
        .single();

      if (existingUser) {
        toast.error('Este email já possui uma conta no sistema');
        return;
      }

      // Gerar token e link de convite
      const token = await generateInviteLink();
      const inviteLink = `${window.location.origin}/cadastro-via-convite?token=${token}`;
      
      // Tentar enviar email de convite
      try {
        await sendInviteEmail(token);
        // Mesmo com sucesso, mostrar o modal com link
        setGeneratedInviteLink(inviteLink);
        setShowInviteLink(true);
        toast.success('Convite enviado por email! Link disponível para compartilhar.');
        onInviteSent?.();
      } catch (emailError) {
        // Se falhar no envio do email, ainda mostrar tela com link
        console.error('Erro ao enviar email:', emailError);
        setGeneratedInviteLink(inviteLink);
        setShowInviteLink(true);
        toast.warning('Convite criado! Email não pôde ser enviado, mas o link está disponível.');
        onInviteSent?.();
      }
    } catch (error: any) {
      console.error('Erro ao criar convite:', error);
      toast.error(error.message || 'Erro ao criar convite');
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      const token = await generateInviteLink();
      const inviteLink = `${window.location.origin}/cadastro-via-convite?token=${token}`;
      
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Link de convite copiado para a área de transferência!');
      setIsOpen(false);
      setInviteData({ email: '', role: 'staff', full_name: '', access_type: 'limited', allowed_process_ids: [] });
      onInviteSent?.();
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Erro ao gerar link de convite');
    }
  };

  const copyGeneratedLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedInviteLink);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar link');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'staff':
        return 'Colaborador da Empresa';
      default:
        return role;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Colaborador
          </Button>
        </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convidar Novo Colaborador
          </DialogTitle>
          <DialogDescription>
            Envie um convite para adicionar um novo colaborador à sua empresa.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              placeholder="Nome do colaborador"
              value={inviteData.full_name}
              onChange={(e) => setInviteData({ ...inviteData, full_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="colaborador@exemplo.com"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <div className="p-3 bg-muted rounded-lg">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Colaborador da Empresa
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Terá acesso aos processos e recursos da empresa
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Tipo de Acesso</Label>
            <RadioGroup 
              value={inviteData.access_type} 
              onValueChange={(value: 'full' | 'limited') => {
                setInviteData({ 
                  ...inviteData, 
                  access_type: value,
                  allowed_process_ids: value === 'full' ? [] : inviteData.allowed_process_ids
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

          {inviteData.access_type === 'limited' && (
            <div className="space-y-4">
              <Label>Processos Autorizados ({inviteData.allowed_process_ids.length} selecionados)</Label>
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
                            checked={inviteData.allowed_process_ids.includes(process.id)}
                            onCheckedChange={(checked) => {
                              setInviteData(prev => ({
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
              {inviteData.allowed_process_ids.length === 0 && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Nenhum processo selecionado. O colaborador não terá acesso a processos até que você configure as permissões.
                </div>
              )}
            </div>
          )}

          <div className="pt-4 space-y-3">
            <Button 
              onClick={handleSendInvite}
              disabled={sending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Enviando...' : 'Enviar Convite por Email'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button 
              onClick={copyInviteLink}
              variant="outline"
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link de Convite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal para mostrar link de convite quando email falhar */}
    <Dialog open={showInviteLink} onOpenChange={setShowInviteLink}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-600">
            <Mail className="h-5 w-5 mr-2" />
            Convite Criado com Sucesso!
          </DialogTitle>
          <DialogDescription>
            O convite foi enviado por email. Use o link abaixo para compartilhar manualmente se necessário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300">
                  Email enviado
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  O convite foi enviado para <strong>{inviteData.email}</strong>. 
                  Você também pode compartilhar o link abaixo diretamente com <strong>{inviteData.full_name}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="generated-invite-link">Link de Convite</Label>
            <div className="flex space-x-2">
              <Input
                id="generated-invite-link"
                value={generatedInviteLink}
                readOnly
                className="flex-1 font-mono text-sm bg-muted"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyGeneratedLink}
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
              <li>Envie por WhatsApp, email ou outro meio para {inviteData.full_name}</li>
              <li>O colaborador usará este link para criar sua conta e ficar vinculado à empresa</li>
            </ol>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={copyGeneratedLink}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
            <Button
              onClick={() => {
                setShowInviteLink(false);
                setIsOpen(false);
                setInviteData({ email: '', role: 'staff', full_name: '', access_type: 'limited', allowed_process_ids: [] });
                onInviteSent?.();
              }}
            >
              Concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}