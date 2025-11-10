import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PenTool, Mail, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SignaturePlacement from './SignaturePlacement';

// Utils: SHA-256 in browser (fallback if Edge Function is unavailable)
function toHex(buffer: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x: number) => ('00' + x.toString(16)).slice(-2))
    .join('');
}
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
}

interface InternalSignatureManagerProps {
  documentId: string;
  processId: string;
  documentName: string;
  onSigned?: () => void;
}

interface SignatureData {
  signerName: string;
  signerEmail: string;
  authMethod: 'email';
  authContact: string;
}

const InternalSignatureManager: React.FC<InternalSignatureManagerProps> = ({
  documentId,
  processId,
  documentName,
  onSigned
}) => {
  const [step, setStep] = useState<'placement' | 'form' | 'otp' | 'success'>('placement');
  const [loading, setLoading] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureData>({
    signerName: '',
    signerEmail: '',
    authMethod: 'email',
    authContact: ''
  });
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState<string>('');
  const [placement, setPlacement] = useState<{ x: number; y: number } | null>(null);

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOTP = async () => {
    if (!signatureData.signerName || !signatureData.signerEmail || !signatureData.authContact) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signatureData.signerEmail) || !emailRegex.test(signatureData.authContact)) {
      toast.error('Informe emails válidos');
      return;
    }

    setLoading(true);
    try {
      const code = generateOTP();
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Salvar código OTP no banco
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutos

      const { data: otpData, error: otpError } = await supabase
        .from('otp_verifications')
        .insert({
          user_id: user.user.id,
          document_id: documentId,
          verification_code: code,
          contact: signatureData.authContact,
          verification_method: signatureData.authMethod,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (otpError) throw otpError;

      setVerificationId(otpData.id);

      if (signatureData.authMethod === 'email') {
        const { error: emailError } = await supabase.functions.invoke('send-otp-email', {
          body: {
            email: signatureData.authContact,
            code: code,
            signerName: signatureData.signerName,
            documentName: documentName
          }
        });

        if (emailError) {
          console.error('Erro ao enviar email de OTP:', emailError);
          toast.error('Falha ao enviar o email de verificação');
          return;
        }

        toast.success('Código enviado por email!');
      }

      setStep('otp');
    } catch (error: any) {
      console.error('Erro ao gerar OTP:', error);
      toast.error('Erro ao enviar código de verificação');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSign = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    // Fallback que roda 100% no cliente se a Edge Function não estiver disponível
    const clientSideSign = async (userId: string): Promise<string | null> => {
      try {
        // 1) Validar OTP no servidor (via RLS, somente do próprio usuário)
        const { data: otpRow, error: otpErr } = await supabase
          .from('otp_verifications')
          .select('*')
          .eq('id', verificationId)
          .single();
        if (otpErr || !otpRow) {
          console.error('[clientSideSign] OTP fetch error', otpErr);
          toast.error('Código inválido ou expirado');
          return null;
        }
        if (new Date(otpRow.expires_at).getTime() <= Date.now()) {
          toast.error('Código expirado');
          return null;
        }
        if (String(otpRow.verification_code).trim() !== String(otpCode).trim()) {
          toast.error('Código incorreto');
          return null;
        }
        // Marcar como verificado
        const { error: updErr } = await supabase
          .from('otp_verifications')
          .update({ is_verified: true })
          .eq('id', verificationId);
        if (updErr) {
          console.error('[clientSideSign] mark verified error', updErr);
        }

        // 2) Buscar dados necessários
        const { data: proc, error: pErr } = await supabase
          .from('processes')
          .select('company_id, client_email')
          .eq('id', processId)
          .single();
        if (pErr || !proc?.company_id) {
          console.error('[clientSideSign] process fetch error', pErr);
          toast.error('Processo não encontrado');
          return null;
        }
        const { data: doc, error: dErr } = await supabase
          .from('documents')
          .select('file_path')
          .eq('id', documentId)
          .single();
        if (dErr) {
          console.warn('[clientSideSign] document fetch warning', dErr);
        }

        // 3) Gerar hashes no cliente
        const signatureTimestamp = new Date();
        const signatureHash = await sha256Hex(`${documentId}|${userId}|${signatureTimestamp.toISOString()}`);
        const documentHash = await sha256Hex(`${documentId}|${doc?.file_path || ''}`);

        // Obter localização aproximada via IP (geolocalização)
        let location = 'Não especificado';
        try {
          const geoResponse = await fetch('https://ipapi.co/json/');
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            location = `${geoData.city || ''}, ${geoData.region || ''} - ${geoData.country_name || ''}`.trim();
          }
        } catch (e) {
          console.warn('Não foi possível obter localização:', e);
        }

        const signatureMetadata: any = {
          timestamp: signatureTimestamp.toISOString(),
          method: 'internal_otp',
          verification_id: verificationId,
          browser: navigator.userAgent,
          device: 'unknown',
          location: location,
          signature_position: placement ? { x_percent: placement.x, y_percent: placement.y, page: 1 } : null,
        };

        // 4) Inserir assinatura (RLS garante acesso)
        const { data: sigRow, error: insertErr } = await supabase
          .from('internal_signatures')
          .insert({
            document_id: documentId,
            process_id: processId,
            company_id: proc.company_id,
            signer_id: userId,
            signer_name: signatureData.signerName,
            signer_email: signatureData.signerEmail,
            authentication_method: 'email',
            authentication_contact: signatureData.authContact,
            signature_hash: signatureHash,
            document_hash: documentHash,
            signature_order: 1,
            signature_metadata: signatureMetadata,
          })
          .select()
          .single();

        if (insertErr || !sigRow) {
          console.error('[clientSideSign] insert signature error', insertErr);
          toast.error('Falha ao criar assinatura');
          return null;
        }
        return sigRow.id as string;
      } catch (e) {
        console.error('[clientSideSign] unexpected', e);
        toast.error('Erro ao assinar (fallback)');
        return null;
      }
    };

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const userAgent = navigator.userAgent;
      console.log('[InternalSignatureManager] invoking complete-internal-signature', {
        verificationId,
        documentId,
        processId,
        signerEmail: signatureData.signerEmail,
      });

      // Delegar para Edge Function com validação no servidor e inserção segura
      const { data, error } = await supabase.functions.invoke('complete-internal-signature', {
        body: {
          verificationId,
          otpCode,
          documentId,
          processId,
          signerName: signatureData.signerName,
          signerEmail: signatureData.signerEmail,
          authContact: signatureData.authContact,
          placement: placement ? { x_percent: placement.x, y_percent: placement.y, page: 1 } : null,
          userAgent,
        }
      });

      let signatureId: string | null = null;
      if (error || !data?.ok) {
        const serverErrMsg = (data as any)?.error || (error as any)?.message || 'Falha desconhecida';
        console.warn('[InternalSignatureManager] Edge Function falhou, usando fallback no cliente', { error, data, serverErrMsg });
        toast.warning(`Falha no servidor ao assinar: ${serverErrMsg}`);
        signatureId = await clientSideSign(user.user.id);
        if (!signatureId) return;
      } else {
        signatureId = (data as any).signatureId as string;
      }

      // Gerar termo de autenticidade
      console.log('Gerando termo de autenticidade para signatureId:', signatureId);
      try {
        const { data: termData, error: termError } = await supabase.functions.invoke('generate-authenticity-term', {
          body: { signatureId }
        });
        if (termError) {
          console.error('Erro ao gerar termo de autenticidade:', termError);
          toast.warning('Assinatura concluída, mas houve erro ao gerar termo de autenticidade');
        } else {
          console.log('Termo gerado com sucesso:', termData);
          toast.success('Documento assinado e termo de autenticidade gerado!');
        }
      } catch (termError) {
        console.error('Erro ao gerar termo:', termError);
        toast.warning('Assinatura concluída, mas houve erro ao gerar termo de autenticidade');
      }

      setStep('success');

      // Determinar tipo de signatário (cliente ou empresa)
      const { data: processData } = await supabase
        .from('processes')
        .select('client_email')
        .eq('id', processId)
        .single();

      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.user.id)
        .single();

      const isClient = profileData?.email === processData?.client_email;

      // Invocar edge function para completar fluxo de assinatura dupla
      await supabase.functions.invoke('complete-dual-signature', {
        body: {
          documentId,
          processId,
          signerType: isClient ? 'client' : 'company',
          signatureId
        }
      });

      // Chamar callback para recarregar dados no componente pai
      if (onSigned) {
        onSigned();
      }
    } catch (error: any) {
      console.error('Erro ao verificar e assinar:', error);
      const errMsg = (error as any)?.message || (typeof error === 'string' ? error : 'Erro ao assinar documento');
      toast.error(`Erro ao assinar: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSignature = () => {
    setStep('placement');
    setSignatureData({
      signerName: '',
      signerEmail: '',
      authMethod: 'email',
      authContact: ''
    });
    setOtpCode('');
    setVerificationId('');
    setPlacement(null);
  };

  const notifyCompanyAndClient = async () => {
    try {
      // Buscar informações do processo
      const { data: process } = await supabase
        .from('processes')
        .select('client_email, company_id, companies(name)')
        .eq('id', processId)
        .single();

      if (!process) return;

      // Verificar se todas as assinaturas foram concluídas
      const { data: allSignatures } = await supabase
        .from('internal_signatures')
        .select('id')
        .eq('document_id', documentId);

      // Notificar empresa
      await supabase.functions.invoke('send-unified-email', {
        body: {
          to: process.client_email,
          subject: `Nova assinatura no documento ${documentName}`,
          template: 'signature_completed',
          data: {
            documentName: documentName,
            signerName: signatureData.signerName,
            totalSignatures: allSignatures?.length || 1
          }
        }
      });

      toast.success('Notificações enviadas');
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
    }
  };

  if (step === 'success') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Assinatura Concluída</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              O documento "{documentName}" foi assinado com sucesso usando verificação por email.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label>Detalhes da Assinatura:</Label>
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <p><strong>Signatário:</strong> {signatureData.signerName}</p>
              <p><strong>Email:</strong> {signatureData.signerEmail}</p>
              <p><strong>Método:</strong> Email</p>
              <p><strong>Data:</strong> {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleNewSignature} variant="outline">
              Nova Assinatura
            </Button>
            {/* Botão de download ficará visível porque o viewer conta assinaturas */}
            <a href="#baixar-documento-assinado" className="inline-flex">
              <Button type="button" className="w-full">Baixar Documento</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'placement') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PenTool className="h-5 w-5" />
            <span>Posicionar Assinatura</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignaturePlacement
            documentId={documentId}
            value={placement}
            onChange={setPlacement}
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setStep('form')}
              className="flex-1"
            >
              Continuar
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setPlacement(null);
                setStep('form');
              }}
            >
              Pular (usar posição padrão)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'otp') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Verificação de Código</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Um código de verificação foi enviado para {signatureData.authContact}. 
              Digite o código para confirmar sua assinatura.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="otp">Código de Verificação</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Digite o código de 6 dígitos"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleVerifyAndSign}
              disabled={loading || otpCode.length !== 6}
              className="flex-1"
            >
              {loading ? 'Verificando...' : 'Verificar e Assinar'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setStep('placement')}
              disabled={loading}
            >
              Voltar
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Código expira em 10 minutos</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PenTool className="h-5 w-5" />
          <span>Assinatura Digital Interna</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Assine digitalmente usando verificação por email.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signerName">Nome do Signatário *</Label>
            <Input
              id="signerName"
              placeholder="Digite o nome completo"
              value={signatureData.signerName}
              onChange={(e) => setSignatureData(prev => ({ ...prev, signerName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signerEmail">Email do Signatário *</Label>
            <Input
              id="signerEmail"
              type="email"
              placeholder="email@exemplo.com"
              value={signatureData.signerEmail}
              onChange={(e) => setSignatureData(prev => ({ ...prev, signerEmail: e.target.value }))}
            />
          </div>

          <Separator />

        <div className="space-y-4">
          <Label>Email para verificação</Label>
          <div className="space-y-2">
            <Label htmlFor="authContact">Email para verificação *</Label>
            <Input
              id="authContact"
              type="email"
              placeholder="email@exemplo.com"
              value={signatureData.authContact}
              onChange={(e) => setSignatureData(prev => ({ ...prev, authContact: e.target.value }))}
            />
          </div>
        </div>
        </div>

        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Documento: {documentName}
          </Badge>
        </div>

        <Button 
          onClick={handleSendOTP}
          disabled={loading || !signatureData.signerName || !signatureData.signerEmail || !signatureData.authContact}
          className="w-full"
        >
          {loading ? 'Enviando código...' : 'Enviar Código de Verificação'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default InternalSignatureManager;