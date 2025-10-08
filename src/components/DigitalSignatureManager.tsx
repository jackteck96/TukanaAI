import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  UserPlus,
  ArrowRight,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DigitalSignatureProps {
  documentId: string;
  processId: string;
  documentName: string;
  onSignatureUpdate?: () => void;
}

interface SignatureFlow {
  id: string;
  flow_type: 'sequential' | 'parallel';
  current_step: number;
  total_steps: number;
  flow_status: 'active' | 'completed' | 'cancelled';
}

interface SignatureRequirement {
  id: string;
  signer_email: string;
  signer_name: string;
  signature_order: number;
  is_required: boolean;
}

interface DigitalSignature {
  id: string;
  signer_cpf: string;
  signer_name: string;
  signer_email: string;
  signature_timestamp: string;
  signature_status: 'pending' | 'signed' | 'rejected' | 'expired';
  signature_order: number;
  certificate_issuer: string;
  signature_metadata: any;
}

const DigitalSignatureManager: React.FC<DigitalSignatureProps> = ({
  documentId,
  processId,
  documentName,
  onSignatureUpdate
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [signatureFlow, setSignatureFlow] = useState<SignatureFlow | null>(null);
  const [requirements, setRequirements] = useState<SignatureRequirement[]>([]);
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [newSigner, setNewSigner] = useState({ email: '', name: '', order: 1 });
  const [flowType, setFlowType] = useState<'sequential' | 'parallel'>('sequential');

  useEffect(() => {
    loadSignatureData();
  }, [documentId]);

  const loadSignatureData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar fluxo de assinatura
      const { data: flowData } = await supabase
        .from('signature_flows')
        .select('*')
        .eq('document_id', documentId)
        .eq('flow_status', 'active')
        .single();

      if (flowData) {
        setSignatureFlow(flowData as SignatureFlow);
        
        // Carregar requerimentos
        const { data: reqData } = await supabase
          .from('signature_requirements')
          .select('*')
          .eq('signature_flow_id', flowData.id)
          .order('signature_order');
        
        setRequirements(reqData || []);
      }

      // Carregar assinaturas existentes
      const { data: sigData } = await supabase
        .from('digital_signatures')
        .select('*')
        .eq('document_id', documentId)
        .order('signature_order');

      setSignatures((sigData || []) as DigitalSignature[]);
    } catch (error) {
      console.error('Erro ao carregar dados de assinatura:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de assinatura",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSignatureFlow = async () => {
    try {
      if (requirements.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um signatário",
          variant: "destructive"
        });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user?.id)
        .single();

      // Criar fluxo
      const { data: flowData, error: flowError } = await supabase
        .from('signature_flows')
        .insert({
          document_id: documentId,
          process_id: processId,
          company_id: profileData?.company_id,
          flow_type: flowType,
          total_steps: requirements.length,
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (flowError) throw flowError;

      // Criar requerimentos
      const requirementsData = requirements.map(req => ({
        ...req,
        signature_flow_id: flowData.id
      }));

      const { error: reqError } = await supabase
        .from('signature_requirements')
        .insert(requirementsData);

      if (reqError) throw reqError;

      toast({
        title: "Sucesso",
        description: "Fluxo de assinatura criado com sucesso",
      });

      setIsFlowModalOpen(false);
      loadSignatureData();
      onSignatureUpdate?.();
    } catch (error) {
      console.error('Erro ao criar fluxo:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar fluxo de assinatura",
        variant: "destructive"
      });
    }
  };

  const addSigner = () => {
    if (!newSigner.email || !newSigner.name) {
      toast({
        title: "Erro",
        description: "Preencha email e nome do signatário",
        variant: "destructive"
      });
      return;
    }

    const newReq: SignatureRequirement = {
      id: Date.now().toString(),
      signer_email: newSigner.email,
      signer_name: newSigner.name,
      signature_order: newSigner.order,
      is_required: true
    };

    setRequirements([...requirements, newReq]);
    setNewSigner({ email: '', name: '', order: requirements.length + 2 });
  };

  const removeSigner = (index: number) => {
    const newReqs = requirements.filter((_, i) => i !== index);
    setRequirements(newReqs);
  };

  const handleGovBrAuth = () => {
    // Verificar se as credenciais gov.br estão configuradas
    toast({
      title: 'Redirecionando',
      description: 'Redirecionando para autenticação gov.br...'
    });
    
    const redirectUrl = encodeURIComponent(`${window.location.origin}/assinatura-callback`);
    const govBrUrl = `https://sso.acesso.gov.br/oauth/authorize?response_type=code&client_id=${import.meta.env.VITE_GOV_BR_CLIENT_ID || 'CONFIGURAR_CLIENTE_ID'}&redirect_uri=${redirectUrl}&scope=openid+profile+email+govbr_company`;
    
    if (!import.meta.env.VITE_GOV_BR_CLIENT_ID) {
      toast({
        title: 'Erro de configuração',
        description: 'Credenciais gov.br não configuradas! Configure GOV_BR_CLIENT_ID',
        variant: 'destructive'
      });
      console.error('GOV_BR_CLIENT_ID não encontrado nas variáveis de ambiente');
      return;
    }
    
    window.location.href = govBrUrl;
  };

  const canSign = (requirement: SignatureRequirement) => {
    if (!signatureFlow) return false;
    
    const signedCount = signatures.filter(s => s.signature_status === 'signed').length;
    
    if (signatureFlow.flow_type === 'sequential') {
      return requirement.signature_order === signedCount + 1;
    }
    
    // Para fluxo paralelo, verificar se já não assinou
    return !signatures.some(s => s.signer_email === requirement.signer_email && s.signature_status === 'signed');
  };

  const getSignatureStatus = (requirement: SignatureRequirement) => {
    const signature = signatures.find(s => s.signer_email === requirement.signer_email);
    return signature?.signature_status || 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Carregando dados de assinatura...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>Assinatura Digital</span>
                  <Badge variant="outline" className="text-xs">
                    ICP-Brasil
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {documentName}
                </p>
              </div>
            </div>
            
            {!signatureFlow && (
              <Button onClick={() => setIsFlowModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Configurar Assinaturas
              </Button>
            )}
          </div>
        </CardHeader>

        {signatureFlow && (
          <CardContent className="space-y-4">
            {/* Status do Fluxo */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">
                    Fluxo {signatureFlow.flow_type === 'sequential' ? 'Sequencial' : 'Paralelo'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {signatures.filter(s => s.signature_status === 'signed').length} de {signatureFlow.total_steps} assinaturas
                  </p>
                </div>
              </div>
              
              <Badge className={getStatusColor(signatureFlow.flow_status)}>
                {signatureFlow.flow_status === 'active' ? 'Ativo' : 
                 signatureFlow.flow_status === 'completed' ? 'Concluído' : 'Cancelado'}
              </Badge>
            </div>

            {/* Lista de Signatários */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Signatários
              </h4>
              
              {requirements.map((req, index) => {
                const status = getSignatureStatus(req);
                const signature = signatures.find(s => s.signer_email === req.signer_email);
                
                return (
                  <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                        {req.signature_order}
                      </div>
                      <div>
                        <p className="font-medium">{req.signer_name}</p>
                        <p className="text-sm text-muted-foreground">{req.signer_email}</p>
                        {signature && status === 'signed' && (
                          <p className="text-xs text-green-600 mt-1">
                            Assinado em {new Date(signature.signature_timestamp).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status)}
                      <Badge className={getStatusColor(status)}>
                        {status === 'signed' ? 'Assinado' : 
                         status === 'pending' ? 'Pendente' : 
                         status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </Badge>
                      
                      {status === 'pending' && canSign(req) && (
                        <Button
                          size="sm"
                          onClick={handleGovBrAuth}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Assinar com gov.br
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selo de Validade Jurídica */}
            {signatures.some(s => s.signature_status === 'signed') && (
              <Alert className="border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Documento assinado digitalmente com validade jurídica – gov.br</strong>
                  <br />
                  Certificado digital ICP-Brasil validado pelo sistema gov.br
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modal de Configuração */}
      <Dialog open={isFlowModalOpen} onOpenChange={setIsFlowModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Fluxo de Assinaturas</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Tipo de Fluxo */}
            <div>
              <Label className="text-base font-medium">Tipo de Fluxo</Label>
              <Select value={flowType} onValueChange={(value: 'sequential' | 'parallel') => setFlowType(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">
                    <div className="flex items-center space-x-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Sequencial - Ordem obrigatória</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="parallel">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Paralelo - Qualquer ordem</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Adicionar Signatário */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Adicionar Signatário</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={newSigner.name}
                      onChange={(e) => setNewSigner({...newSigner, name: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newSigner.email}
                      onChange={(e) => setNewSigner({...newSigner, email: e.target.value})}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <Button onClick={addSigner} className="h-10">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Signatários */}
            {requirements.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Signatários ({requirements.length})</Label>
                {requirements.map((req, index) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                        {req.signature_order}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{req.signer_name}</p>
                        <p className="text-xs text-muted-foreground">{req.signer_email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSigner(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsFlowModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createSignatureFlow} disabled={requirements.length === 0}>
                Criar Fluxo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalSignatureManager;