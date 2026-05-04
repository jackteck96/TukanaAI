import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Schema de validação para senha
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(6, 'A nova senha deve ter no mínimo 6 caracteres')
    .max(100, 'A senha deve ter no máximo 100 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

export default function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  const [cpfCnpj, setCpfCnpj] = useState('');
  
  // Dados legais do cliente
  const [legalData, setLegalData] = useState({
    person_type: 'pf' as 'pf' | 'pj',
    cpf: '',
    rg: '',
    nationality: '',
    marital_status: '',
    profession: '',
    cnpj: '',
    company_name: '',
    legal_representative_name: '',
    legal_representative_cpf: ''
  });
  
  // Estados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadProfile();
    }
  }, [user, open]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, address')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return;
      }
      
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      }

      // Carregar dados legais do cliente
      const { data: legalDataResult } = await supabase
        .from('client_legal_data')
        .select('*')
        .eq('client_email', user?.email)
        .maybeSingle();

      if (legalDataResult) {
        setLegalData({
          person_type: (legalDataResult.person_type === 'pj' ? 'pj' : 'pf') as 'pf' | 'pj',
          cpf: legalDataResult.cpf || '',
          rg: legalDataResult.rg || '',
          nationality: legalDataResult.nationality || '',
          marital_status: legalDataResult.marital_status || '',
          profession: legalDataResult.profession || '',
          cnpj: legalDataResult.cnpj || '',
          company_name: legalDataResult.company_name || '',
          legal_representative_name: legalDataResult.legal_representative_name || '',
          legal_representative_cpf: legalDataResult.legal_representative_cpf || ''
        });
      }

      // Tentar carregar cpf_cnpj separadamente (pode não existir)
      try {
        const { data: cpfData } = await supabase
          .from('processes')
          .select('cpf_cnpj')
          .eq('client_email', user?.email)
          .limit(1)
          .maybeSingle();
        if (cpfData && cpfData.cpf_cnpj) {
          setCpfCnpj(cpfData.cpf_cnpj);
        }
      } catch (e) {
        // Ignorar se não conseguir carregar
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualizar perfil básico
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Buscar company_id do primeiro processo do cliente
      const { data: processData } = await supabase
        .from('processes')
        .select('company_id')
        .eq('client_email', user?.email)
        .limit(1)
        .maybeSingle();

      const companyId = processData?.company_id;

      // Atualizar ou inserir dados legais
      const legalDataPayload = {
        client_email: user?.email,
        client_name: formData.full_name,
        person_type: legalData.person_type,
        phone: formData.phone,
        email: user?.email,
        address: formData.address,
        company_id: companyId,
        ...(legalData.person_type === 'pf' ? {
          cpf: legalData.cpf || null,
          rg: legalData.rg || null,
          nationality: legalData.nationality || null,
          marital_status: legalData.marital_status || null,
          profession: legalData.profession || null,
        } : {
          cnpj: legalData.cnpj || null,
          company_name: legalData.company_name || null,
          legal_representative_name: legalData.legal_representative_name || null,
          legal_representative_cpf: legalData.legal_representative_cpf || null,
        })
      };

      const { error: legalError } = await supabase
        .from('client_legal_data')
        .upsert(legalDataPayload as any, {
          onConflict: 'client_email'
        });

      if (legalError) throw legalError;

      toast.success('Perfil atualizado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);

    try {
      // Validar dados
      const validationResult = passwordSchema.safeParse(passwordData);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        return;
      }

      // Verificar senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword
      });

      if (signInError) {
        toast.error('Senha atual incorreta');
        return;
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      toast.success('Senha alterada com sucesso!');
      
      // Limpar campos de senha
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seção de Dados Pessoais */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-sm">Dados Pessoais</h3>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Digite seu endereço completo"
              />
            </div>

            <Separator className="my-4" />

            {/* Seção de Dados de Qualificação Jurídica */}
            <h3 className="font-semibold text-sm">Dados de Qualificação Jurídica</h3>
            
            <div className="space-y-2">
              <Label>Tipo de Pessoa</Label>
              <RadioGroup 
                value={legalData.person_type} 
                onValueChange={(value) => setLegalData({ ...legalData, person_type: value as 'pf' | 'pj' })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pf" id="pf" />
                  <Label htmlFor="pf" className="font-normal cursor-pointer">Pessoa Física</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pj" id="pj" />
                  <Label htmlFor="pj" className="font-normal cursor-pointer">Pessoa Jurídica</Label>
                </div>
              </RadioGroup>
            </div>

            {legalData.person_type === 'pf' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={legalData.cpf}
                    onChange={(e) => setLegalData({ ...legalData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={legalData.rg}
                    onChange={(e) => setLegalData({ ...legalData, rg: e.target.value })}
                    placeholder="00.000.000-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nacionalidade</Label>
                  <Input
                    id="nationality"
                    value={legalData.nationality}
                    onChange={(e) => setLegalData({ ...legalData, nationality: e.target.value })}
                    placeholder="Brasileira"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marital_status">Estado Civil</Label>
                  <Input
                    id="marital_status"
                    value={legalData.marital_status}
                    onChange={(e) => setLegalData({ ...legalData, marital_status: e.target.value })}
                    placeholder="Solteiro(a), Casado(a), etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">Profissão</Label>
                  <Input
                    id="profession"
                    value={legalData.profession}
                    onChange={(e) => setLegalData({ ...legalData, profession: e.target.value })}
                    placeholder="Sua profissão"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Razão Social</Label>
                  <Input
                    id="company_name"
                    value={legalData.company_name}
                    onChange={(e) => setLegalData({ ...legalData, company_name: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={legalData.cnpj}
                    onChange={(e) => setLegalData({ ...legalData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_representative_name">Nome do Representante Legal</Label>
                  <Input
                    id="legal_representative_name"
                    value={legalData.legal_representative_name}
                    onChange={(e) => setLegalData({ ...legalData, legal_representative_name: e.target.value })}
                    placeholder="Nome completo do representante"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_representative_cpf">CPF do Representante Legal</Label>
                  <Input
                    id="legal_representative_cpf"
                    value={legalData.legal_representative_cpf}
                    onChange={(e) => setLegalData({ ...legalData, legal_representative_cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
              </>
            )}

            {cpfCnpj && (
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ (do processo)</Label>
                <Input
                  id="cpf_cnpj"
                  value={cpfCnpj}
                  disabled
                  className="bg-muted cursor-not-allowed"
                  title="CPF/CNPJ não pode ser alterado"
                />
                <p className="text-xs text-muted-foreground">
                  O CPF/CNPJ não pode ser alterado após o cadastro
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Dados
              </Button>
            </div>
          </form>

          <Separator />

          {/* Seção de Alteração de Senha */}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <h3 className="font-semibold text-sm">Alterar Senha</h3>
            
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Digite sua senha atual"
                  maxLength={100}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  maxLength={100}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Digite a nova senha novamente"
                  maxLength={100}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="submit" 
                disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha
              </Button>
            </div>
          </form>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || changingPassword}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
