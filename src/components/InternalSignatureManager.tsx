import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PenTool, Mail, Smartphone, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InternalSignatureManagerProps {
  documentId: string;
  processId: string;
  documentName: string;
}

interface SignatureData {
  signerName: string;
  signerEmail: string;
  authMethod: 'email' | 'sms';
  authContact: string;
}

const InternalSignatureManager: React.FC<InternalSignatureManagerProps> = ({
  documentId,
  processId,
  documentName
}) => {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureData>({
    signerName: '',
    signerEmail: '',
    authMethod: 'email',
    authContact: ''
  });
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState<string>('');

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOTP = async () => {
    if (!signatureData.signerName || !signatureData.signerEmail || !signatureData.authContact) {
      toast.error('Preencha todos os campos obrigatórios');
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

      // Enviar email se método for email
      if (signatureData.authMethod === 'email') {
        const { error: emailError } = await supabase.functions.invoke('send-otp-email', {
          body: {
            email: signatureData.authContact,
            code: code,
            signerName: signatureData.signerName,
            documentName: documentName
          }
        });

        if (emailError) throw emailError;
        toast.success('Código enviado por email!');
      } else {
        // Para SMS, apenas mostrar o código (implementação simplificada)
        toast.success(`Código OTP: ${code} (implementação de SMS pendente)`);
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
    if (!otpCode) {
      toast.error('Digite o código de verificação');
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Verificar OTP
      const { data: otpData, error: otpError } = await supabase
        .from('otp_verifications')
        .select()
        .eq('id', verificationId)
        .eq('verification_code', otpCode)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (otpError || !otpData) {
        toast.error('Código inválido ou expirado');
        return;
      }

      // Marcar OTP como verificado
      await supabase
        .from('otp_verifications')
        .update({ is_verified: true })
        .eq('id', verificationId);

      // Buscar company_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company ID não encontrado');

      // Gerar hashes para assinatura
      const signatureTimestamp = new Date();
      const { data: signatureHash } = await supabase.rpc('generate_signature_hash', {
        document_uuid: documentId,
        signer_uuid: user.user.id,
        timestamp_val: signatureTimestamp.toISOString()
      });

      const { data: documentHash } = await supabase.rpc('generate_document_hash', {
        document_uuid: documentId,
        file_path_val: `documents/${documentId}`
      });

      // Criar registro de assinatura interna
      const { error: signatureError } = await supabase
        .from('internal_signatures')
        .insert({
          document_id: documentId,
          process_id: processId,
          company_id: profile.company_id,
          signer_id: user.user.id,
          signer_name: signatureData.signerName,
          signer_email: signatureData.signerEmail,
          authentication_method: signatureData.authMethod,
          authentication_contact: signatureData.authContact,
          signature_hash: signatureHash,
          document_hash: documentHash,
          signature_order: 1,
          signature_metadata: {
            timestamp: signatureTimestamp.toISOString(),
            method: 'internal_otp',
            verification_id: verificationId,
            ip_address: 'unknown'
          }
        });

      if (signatureError) throw signatureError;

      setStep('success');
      toast.success('Documento assinado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao verificar e assinar:', error);
      toast.error('Erro ao assinar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSignature = () => {
    setStep('form');
    setSignatureData({
      signerName: '',
      signerEmail: '',
      authMethod: 'email',
      authContact: ''
    });
    setOtpCode('');
    setVerificationId('');
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
              O documento "{documentName}" foi assinado com sucesso usando autenticação por {signatureData.authMethod === 'email' ? 'email' : 'SMS'}.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label>Detalhes da Assinatura:</Label>
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <p><strong>Signatário:</strong> {signatureData.signerName}</p>
              <p><strong>Email:</strong> {signatureData.signerEmail}</p>
              <p><strong>Método:</strong> {signatureData.authMethod === 'email' ? 'Email' : 'SMS'}</p>
              <p><strong>Data:</strong> {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <Button onClick={handleNewSignature} variant="outline" className="w-full">
            Nova Assinatura
          </Button>
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
              onClick={() => setStep('form')}
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
            Assine digitalmente usando verificação por email ou SMS. 
            Esta modalidade utiliza autenticação de dois fatores para garantir a segurança.
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
            <Label>Método de Autenticação</Label>
            
            <Select 
              value={signatureData.authMethod} 
              onValueChange={(value: 'email' | 'sms') => 
                setSignatureData(prev => ({ ...prev, authMethod: value, authContact: '' }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <span>SMS</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label htmlFor="authContact">
                {signatureData.authMethod === 'email' ? 'Email para verificação *' : 'Telefone para SMS *'}
              </Label>
              <Input
                id="authContact"
                type={signatureData.authMethod === 'email' ? 'email' : 'tel'}
                placeholder={signatureData.authMethod === 'email' ? 'email@exemplo.com' : '(11) 99999-9999'}
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