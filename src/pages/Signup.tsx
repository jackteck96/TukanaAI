import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Mail, Lock, User, MapPin, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    hasLegalRepresentative: false,
    legalRepresentativeName: '',
    legalRepresentativeQualification: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Nome da empresa é obrigatório';
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }

    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Estado é obrigatório';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else if (!/^\d{5}-?\d{3}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'CEP deve estar no formato XXXXX-XXX';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (formData.hasLegalRepresentative) {
      if (!formData.legalRepresentativeName.trim()) {
        newErrors.legalRepresentativeName = 'Nome do representante legal é obrigatório';
      }
      if (!formData.legalRepresentativeQualification.trim()) {
        newErrors.legalRepresentativeQualification = 'Qualificação do representante legal é obrigatória';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
            full_name: formData.fullName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create company
        const companySlug = generateSlug(formData.companyName);
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.companyName,
            slug: companySlug
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // Update user profile with company_id and admin role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            company_id: companyData.id,
            role: 'admin',
            full_name: formData.fullName
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // Create trial subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            company_id: companyData.id,
            plan: 'starter',
            status: 'trial',
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (subscriptionError) throw subscriptionError;

        // Initialize usage metrics
        await supabase.rpc('update_usage_metrics', {
          company_uuid: companyData.id
        });

        toast({
          title: 'Conta criada com sucesso!',
          description: 'Verifique seu e-mail para confirmar sua conta.',
        });

        navigate('/onboarding');
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
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fuzen</h1>
            <p className="text-sm text-muted-foreground">Crie sua conta empresarial</p>
          </div>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">Cadastro do Responsável</CardTitle>
            <CardDescription>
              Você será registrado como <strong>administrador</strong> da empresa e terá acesso completo ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">
                  Nome da Empresa
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Sua Empresa LTDA"
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
                <Label htmlFor="cnpj" className="text-sm font-medium">
                  CNPJ
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="cnpj"
                    name="cnpj"
                    type="text"
                    placeholder="XX.XXX.XXX/XXXX-XX"
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.cnpj && (
                  <p className="text-sm text-destructive">{errors.cnpj}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <User className="h-4 w-4" />
                    <span className="font-semibold text-sm">Você será o Administrador</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Como responsável pela empresa, você terá acesso total ao sistema, incluindo relatórios, gerenciamento de usuários e todas as funcionalidades administrativas.
                  </p>
                </div>
                <h3 className="text-sm font-medium text-foreground">Endereço da Sede</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-sm font-medium">
                      Rua
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="street"
                        name="street"
                        type="text"
                        placeholder="Nome da rua"
                        value={formData.street}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.street && (
                      <p className="text-sm text-destructive">{errors.street}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number" className="text-sm font-medium">
                      Número
                    </Label>
                    <Input
                      id="number"
                      name="number"
                      type="text"
                      placeholder="123"
                      value={formData.number}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.number && (
                      <p className="text-sm text-destructive">{errors.number}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complement" className="text-sm font-medium">
                      Complemento (opcional)
                    </Label>
                    <Input
                      id="complement"
                      name="complement"
                      type="text"
                      placeholder="Sala 201"
                      value={formData.complement}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood" className="text-sm font-medium">
                      Bairro
                    </Label>
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      type="text"
                      placeholder="Centro"
                      value={formData.neighborhood}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.neighborhood && (
                      <p className="text-sm text-destructive">{errors.neighborhood}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      Cidade
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">
                      Estado
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      placeholder="SP"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.state && (
                      <p className="text-sm text-destructive">{errors.state}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-sm font-medium">
                      CEP
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      placeholder="01234-567"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.zipCode && (
                      <p className="text-sm text-destructive">{errors.zipCode}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasLegalRepresentative"
                    checked={formData.hasLegalRepresentative}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        hasLegalRepresentative: !!checked,
                        legalRepresentativeName: checked ? prev.legalRepresentativeName : '',
                        legalRepresentativeQualification: checked ? prev.legalRepresentativeQualification : ''
                      }))
                    }
                  />
                  <Label htmlFor="hasLegalRepresentative" className="text-sm font-medium">
                    Possui representante legal diferente do cadastrante
                  </Label>
                </div>

                {formData.hasLegalRepresentative && (
                  <div className="space-y-4 pl-6 border-l-2 border-border">
                    <div className="space-y-2">
                      <Label htmlFor="legalRepresentativeName" className="text-sm font-medium">
                        Nome do Representante Legal
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="legalRepresentativeName"
                          name="legalRepresentativeName"
                          type="text"
                          placeholder="Nome completo do representante legal"
                          value={formData.legalRepresentativeName}
                          onChange={handleInputChange}
                          className="pl-10"
                        />
                      </div>
                      {errors.legalRepresentativeName && (
                        <p className="text-sm text-destructive">{errors.legalRepresentativeName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="legalRepresentativeQualification" className="text-sm font-medium">
                        Qualificação do Representante Legal
                      </Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="legalRepresentativeQualification"
                          name="legalRepresentativeQualification"
                          type="text"
                          placeholder="Ex: Sócio-administrador, Procurador, etc."
                          value={formData.legalRepresentativeQualification}
                          onChange={handleInputChange}
                          className="pl-10"
                        />
                      </div>
                      {errors.legalRepresentativeQualification && (
                        <p className="text-sm text-destructive">{errors.legalRepresentativeQualification}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Nome Completo do Cadastrante
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
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Sua senha"
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/auth" className="text-primary hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;