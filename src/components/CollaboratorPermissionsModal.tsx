import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Process {
  id: string;
  client_name: string;
  process_type: string;
  status: string;
}

interface CollaboratorPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator: {
    id: string;
    full_name: string;
    email: string;
  };
  companyId?: string;
  clientEmail?: string;
  onSuccess: () => void;
}

export const CollaboratorPermissionsModal = ({
  open,
  onOpenChange,
  collaborator,
  companyId,
  clientEmail,
  onSuccess
}: CollaboratorPermissionsModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [accessType, setAccessType] = useState<'full' | 'limited'>('limited');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcesses, setSelectedProcesses] = useState<Set<string>>(new Set());
  const [permissionId, setPermissionId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, collaborator.id]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Carregar processos
      let processesQuery = supabase
        .from('processes')
        .select('id, client_name, process_type, status')
        .order('created_at', { ascending: false });

      if (companyId) {
        processesQuery = processesQuery.eq('company_id', companyId);
      } else if (clientEmail) {
        processesQuery = processesQuery.eq('client_email', clientEmail);
      }

      const { data: processesData, error: processesError } = await processesQuery;

      if (processesError) throw processesError;
      setProcesses(processesData || []);

      // Carregar permissão existente
      let permissionQuery = supabase
        .from('collaborator_permissions')
        .select(`
          id,
          access_type,
          collaborator_process_access(process_id)
        `)
        .eq('user_id', collaborator.id);

      if (companyId) {
        permissionQuery = permissionQuery.eq('company_id', companyId);
      } else if (clientEmail) {
        permissionQuery = permissionQuery.eq('client_email', clientEmail);
      }

      const { data: permissionData, error: permissionError } = await permissionQuery.maybeSingle();

      if (permissionError) throw permissionError;

      if (permissionData) {
        setPermissionId(permissionData.id);
        setAccessType(permissionData.access_type as 'full' | 'limited');
        
        const allowedProcesses = new Set(
          permissionData.collaborator_process_access?.map((a: any) => a.process_id) || []
        );
        setSelectedProcesses(allowedProcesses);
      } else {
        // Novo colaborador - começar sem permissões
        setPermissionId(null);
        setAccessType('limited');
        setSelectedProcesses(new Set());
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados de permissões',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleAccessTypeChange = (newType: 'full' | 'limited') => {
    if (newType === 'full') {
      // Mudar de limitado para total - não precisa manter nada
      setSelectedProcesses(new Set());
    } else if (newType === 'limited' && accessType === 'full') {
      // Mudar de total para limitado - marcar todos os processos existentes
      const allProcessIds = new Set(processes.map(p => p.id));
      setSelectedProcesses(allProcessIds);
    }
    setAccessType(newType);
  };

  const handleProcessToggle = (processId: string) => {
    const newSelected = new Set(selectedProcesses);
    if (newSelected.has(processId)) {
      newSelected.delete(processId);
    } else {
      newSelected.add(processId);
    }
    setSelectedProcesses(newSelected);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Criar ou atualizar permissão principal
      const permissionData: any = {
        user_id: collaborator.id,
        access_type: accessType,
      };

      if (companyId) {
        permissionData.company_id = companyId;
      } else if (clientEmail) {
        permissionData.client_email = clientEmail;
      }

      let currentPermissionId = permissionId;

      if (permissionId) {
        // Atualizar permissão existente
        const { error: updateError } = await supabase
          .from('collaborator_permissions')
          .update({ access_type: accessType, updated_at: new Date().toISOString() })
          .eq('id', permissionId);

        if (updateError) throw updateError;
      } else {
        // Criar nova permissão
        const { data: newPermission, error: insertError } = await supabase
          .from('collaborator_permissions')
          .insert(permissionData)
          .select('id')
          .single();

        if (insertError) throw insertError;
        currentPermissionId = newPermission.id;
      }

      // 2. Gerenciar acessos de processos (apenas se for acesso limitado)
      if (accessType === 'limited' && currentPermissionId) {
        // Remover todos os acessos existentes
        await supabase
          .from('collaborator_process_access')
          .delete()
          .eq('permission_id', currentPermissionId);

        // Adicionar os novos acessos selecionados
        if (selectedProcesses.size > 0) {
          const accessRecords = Array.from(selectedProcesses).map(processId => ({
            permission_id: currentPermissionId,
            process_id: processId
          }));

          const { error: accessError } = await supabase
            .from('collaborator_process_access')
            .insert(accessRecords);

          if (accessError) throw accessError;
        }
      } else if (accessType === 'full' && currentPermissionId) {
        // Remover todos os acessos específicos se for acesso total
        await supabase
          .from('collaborator_process_access')
          .delete()
          .eq('permission_id', currentPermissionId);
      }

      toast({
        title: 'Sucesso',
        description: 'Permissões atualizadas com sucesso',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar permissões',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões - {collaborator.full_name}</DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Tipo de Acesso</Label>
              <RadioGroup value={accessType} onValueChange={handleAccessTypeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="font-normal cursor-pointer">
                    🔓 Acesso total à conta (vê todos os processos)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="limited" id="limited" />
                  <Label htmlFor="limited" className="font-normal cursor-pointer">
                    🔒 Acesso limitado (selecione processos específicos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {accessType === 'limited' && (
              <div className="space-y-4">
                <Label>Processos Autorizados ({selectedProcesses.size} de {processes.length})</Label>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  {processes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum processo encontrado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {processes.map(process => (
                        <div key={process.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={process.id}
                            checked={selectedProcesses.has(process.id)}
                            onCheckedChange={() => handleProcessToggle(process.id)}
                          />
                          <Label
                            htmlFor={process.id}
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
              </div>
            )}

            {accessType === 'limited' && selectedProcesses.size === 0 && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Este colaborador não terá acesso a nenhum processo até que você selecione ao menos um.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || loadingData}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
