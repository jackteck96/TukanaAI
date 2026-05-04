import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, User, Mail, Lock, Phone, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CadastroCliente = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Nome da empresa é obrigatório';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (!acceptedTerms) {
      newErrors.acceptedTerms = 'Você deve aceitar os Termos de Uso';
    }

    if (!acceptedPrivacy) {
      newErrors.acceptedPrivacy = 'Você deve aceitar a Política de Privacidade (LGPD)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            company_name: formData.companyName,
            user_type: 'client'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update user profile with client role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: 'client',
            full_name: formData.fullName,
            phone: formData.phone,
            company_name: formData.companyName,
          } as any)
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // Enviar email unificado de boas-vindas
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke("send-unified-email", {
            body: {
              email: formData.email,
              full_name: formData.fullName,
              companyId: authData.user.id,
              inviteLink: `${window.location.origin}/login`,
              inviterName: "Equipe Fuzen",
              role: 'client',
              isCollaborator: false
            },
          });
          
          if (emailError) {
            console.error('Erro ao enviar email de boas-vindas:', emailError);
          } else {
            console.log('Email de boas-vindas enviado com sucesso:', emailData);
          }
        } catch (emailError) {
          console.error('Exceção ao enviar email de boas-vindas:', emailError);
        }

        toast({
          title: 'Conta criada com sucesso!',
          description: 'Verifique seu e-mail para confirmar sua conta e receber as boas-vindas.',
        });

        navigate('/cliente');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: error.message || 'Erro inesperado. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar para home
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Cadastro de Cliente</h1>
            <p className="text-lg text-muted-foreground">Crie sua conta para acessar a plataforma Fuzen</p>
          </div>
        </div>

        <Card className="shadow-elegant border-border/50">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold">Cadastro de Cliente</CardTitle>
            <CardDescription className="text-base">
              Você será registrado como <strong>cliente</strong> e poderá acompanhar seus processos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <User className="h-4 w-4" />
                  <span className="font-semibold text-sm">Cadastro de Cliente</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Você terá acesso para acompanhar seus processos e documentos. Para funcionalidades administrativas, entre em contato com sua empresa.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Telefone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">
                  Empresa
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Nome da sua empresa"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acceptedTerms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => {
                        setAcceptedTerms(checked as boolean);
                        if (errors.acceptedTerms) {
                          setErrors(prev => ({ ...prev, acceptedTerms: '' }));
                        }
                      }}
                      className="mt-1"
                    />
                    <Label
                      htmlFor="acceptedTerms"
                      className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      Li e aceito os{' '}
                      <a
                        href="#"
                        className="text-primary hover:underline font-medium"
                        onClick={(e) => e.preventDefault()}
                      >
                        Termos de Uso
                      </a>
                    </Label>
                  </div>
                  {errors.acceptedTerms && (
                    <p className="text-sm text-destructive ml-7">{errors.acceptedTerms}</p>
                  )}

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acceptedPrivacy"
                      checked={acceptedPrivacy}
                      onCheckedChange={(checked) => {
                        setAcceptedPrivacy(checked as boolean);
                        if (errors.acceptedPrivacy) {
                          setErrors(prev => ({ ...prev, acceptedPrivacy: '' }));
                        }
                      }}
                      className="mt-1"
                    />
                    <Label
                      htmlFor="acceptedPrivacy"
                      className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      Li e aceito a{' '}
                      <a
                        href="#"
                        className="text-primary hover:underline font-medium"
                        onClick={(e) => e.preventDefault()}
                      >
                        Política de Privacidade (LGPD)
                      </a>
                    </Label>
                  </div>
                  {errors.acceptedPrivacy && (
                    <p className="text-sm text-destructive ml-7">{errors.acceptedPrivacy}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="hero"
                disabled={loading}
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Fazer login
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                É uma empresa?{' '}
                <Link
                  to="/signup"
                  className="text-primary hover:underline font-medium"
                >
                  Cadastre sua empresa
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CadastroCliente;