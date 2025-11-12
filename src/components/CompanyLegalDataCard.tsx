import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CopyLegalQualificationButton } from './CopyLegalQualificationButton';
import { LegalData } from '@/utils/legalQualification';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CompanyData {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
  legal_representative_name?: string;
  legal_representative_cpf?: string;
  phone?: string;
  email?: string;
}

interface CompanyLegalDataCardProps {
  companyId: string;
}

export function CompanyLegalDataCard({ companyId }: CompanyLegalDataCardProps) {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyData>>({});

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      setCompanyData(data);
      setFormData(data);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          cnpj: formData.cnpj,
          address: formData.address,
          legal_representative_name: formData.legal_representative_name,
          legal_representative_cpf: formData.legal_representative_cpf,
          phone: formData.phone,
          email: formData.email
        })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Dados da empresa atualizados com sucesso!');
      setEditModalOpen(false);
      loadCompanyData();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar dados da empresa');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!companyData) {
    return null;
  }

  const hasCompleteData = companyData.cnpj && companyData.address && 
                          companyData.legal_representative_name && 
                          companyData.legal_representative_cpf;

  const legalData: LegalData = {
    person_type: 'pj',
    company_name: companyData.name,
    cnpj: companyData.cnpj,
    address: companyData.address,
    legal_representative_name: companyData.legal_representative_name,
    legal_representative_cpf: companyData.legal_representative_cpf,
    email: companyData.email,
    phone: companyData.phone
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
            <div className="flex gap-2">
              {hasCompleteData && (
                <CopyLegalQualificationButton 
                  data={legalData}
                  size="sm"
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nome</p>
            <p className="text-sm">{companyData.name}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
            <p className="text-sm">{companyData.cnpj || 'Não informado'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Endereço</p>
            <p className="text-sm">{companyData.address || 'Não informado'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Representante Legal</p>
            <p className="text-sm">{companyData.legal_representative_name || 'Não informado'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">CPF do Representante Legal</p>
            <p className="text-sm">{companyData.legal_representative_cpf || 'Não informado'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">E-mail</p>
            <p className="text-sm">{companyData.email || 'Não informado'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Telefone</p>
            <p className="text-sm">{companyData.phone || 'Não informado'}</p>
          </div>

          {!hasCompleteData && (
            <div className="pt-2 text-xs text-muted-foreground border-t">
              <p>💡 Complete todos os dados da empresa para habilitar a cópia da qualificação jurídica.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Dados da Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj || ''}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço Completo</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_rep_name">Nome do Representante Legal</Label>
              <Input
                id="legal_rep_name"
                value={formData.legal_representative_name || ''}
                onChange={(e) => setFormData({ ...formData, legal_representative_name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_rep_cpf">CPF do Representante Legal</Label>
              <Input
                id="legal_rep_cpf"
                value={formData.legal_representative_cpf || ''}
                onChange={(e) => setFormData({ ...formData, legal_representative_cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
