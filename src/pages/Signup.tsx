import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Mail, Lock, User, MapPin, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

type PersonType = 'pj' | 'pf';

const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [personType, setPersonType] = useState<PersonType>('pj');
  const [formData, setFormData] = useState({
    // Pessoa Jurídica fields
    companyName: '',
    cnpj: '',
    // Pessoa Física fields
    cpf: '',
    // Common address fields
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    // User fields
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Legal representative (only for PJ)
    hasLegalRepresentative: false,
    legalRepresentativeName: '',
    legalRepresentativeQualification: '',
    acceptedTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (personType === 'pj') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = t('signup.errors.companyNameRequired');
      }

      // CNPJ é opcional, mas se preenchido, deve ter formato válido
      if (formData.cnpj.trim()) {
        const cleanDoc = formData.cnpj.replace(/\D/g, '');
        if (cleanDoc.length !== 14) {
          newErrors.cnpj = t('signup.errors.cnpjDigits');
        }
      }

      if (formData.hasLegalRepresentative) {
        if (!formData.legalRepresentativeName.trim()) {
          newErrors.legalRepresentativeName = t('signup.errors.legalRepNameRequired');
        }
        if (!formData.legalRepresentativeQualification.trim()) {
          newErrors.legalRepresentativeQualification = t('signup.errors.legalRepQualificationRequired');
        }
      }
    } else {
      // Pessoa Física - nome completo é obrigatório (será usado como "nome da empresa")
      if (!formData.fullName.trim()) {
        newErrors.fullName = t('signup.errors.fullNameRequired');
      }

      // CPF é opcional, mas se preenchido, deve ter formato válido
      if (formData.cpf.trim()) {
        const cleanDoc = formData.cpf.replace(/\D/g, '');
        if (cleanDoc.length !== 11) {
          newErrors.cpf = t('signup.errors.cpfDigits');
        }
      }
    }

    if (!formData.street.trim()) {
      newErrors.street = t('signup.errors.streetRequired');
    }

    if (!formData.number.trim()) {
      newErrors.number = t('signup.errors.numberRequired');
    }

    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = t('signup.errors.neighborhoodRequired');
    }

    if (!formData.city.trim()) {
      newErrors.city = t('signup.errors.cityRequired');
    }

    if (!formData.state.trim()) {
      newErrors.state = t('signup.errors.stateRequired');
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = t('signup.errors.zipCodeRequired');
    } else if (!/^\d{5}-?\d{3}$/.test(formData.zipCode)) {
      newErrors.zipCode = t('signup.errors.zipCodeFormat');
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('signup.errors.fullNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('signup.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('signup.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('signup.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('signup.errors.passwordMinLength');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('signup.errors.passwordMismatch');
    }

    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = t('signup.errors.acceptTermsRequired');
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
        // Get active terms
        const { data: activeTerms } = await supabase
          .from('terms_of_service')
          .select('id')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Determine company name based on person type
        const entityName = personType === 'pj' ? formData.companyName : formData.fullName;
        const companySlug = generateSlug(entityName);
        
        // Create company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: entityName,
            slug: companySlug,
            cnpj: personType === 'pj' ? (formData.cnpj || null) : (formData.cpf || null),
            address: `${formData.street}, ${formData.number}${formData.complement ? `, ${formData.complement}` : ''} - ${formData.neighborhood}, ${formData.city}/${formData.state} - CEP: ${formData.zipCode}`,
            legal_representative_name: personType === 'pj' && formData.hasLegalRepresentative ? formData.legalRepresentativeName : null,
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

        // Record terms acceptance
        if (activeTerms) {
          await supabase
            .from('terms_acceptances')
            .insert({
              user_id: authData.user.id,
              terms_id: activeTerms.id,
              ip_address: null,
              user_agent: navigator.userAgent
            });
        }

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
          title: t('signup.toast.successTitle'),
          description: t('signup.toast.successDescription'),
        });

        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        variant: 'destructive',
        title: t('signup.toast.errorTitle'),
        description: error.message || t('signup.toast.errorDescriptionDefault'),
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
            <h1 className="text-2xl font-bold text-foreground">{t('signup.brand')}</h1>
            <p className="text-sm text-muted-foreground">{t('signup.brandTagline')}</p>
          </div>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">{t('signup.cardTitle')}</CardTitle>
            <CardDescription>
              {t('signup.cardDescriptionPre')} <strong>{t('signup.cardDescriptionStrong')}</strong> {t('signup.cardDescriptionPost')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Tipo de Pessoa */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('signup.registrationType')}</Label>
                <RadioGroup
                  value={personType}
                  onValueChange={(value) => setPersonType(value as PersonType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pj" id="pj" />
                    <Label htmlFor="pj" className="cursor-pointer">{t('signup.legalEntity')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pf" id="pf" />
                    <Label htmlFor="pf" className="cursor-pointer">{t('signup.individual')}</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Campos específicos para Pessoa Jurídica */}
              {personType === 'pj' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">
                      {t('signup.companyNameLabel')}
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="companyName"
                        name="companyName"
                        type="text"
                        placeholder={t('signup.companyNamePlaceholder')}
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
                      {t('signup.cnpjLabel')}
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="cnpj"
                        name="cnpj"
                        type="text"
                        placeholder={t('signup.cnpjPlaceholder')}
                        value={formData.cnpj}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                    {errors.cnpj && (
                      <p className="text-sm text-destructive">{errors.cnpj}</p>
                    )}
                  </div>
                </>
              )}

              {/* Campos específicos para Pessoa Física */}
              {personType === 'pf' && (
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm font-medium">
                    {t('signup.cpfLabel')}
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="cpf"
                      name="cpf"
                      type="text"
                      placeholder={t('signup.cpfPlaceholder')}
                      value={formData.cpf}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                  {errors.cpf && (
                    <p className="text-sm text-destructive">{errors.cpf}</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <User className="h-4 w-4" />
                    <span className="font-semibold text-sm">{t('signup.adminNoticeTitle')}</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {personType === 'pj'
                      ? t('signup.adminNoticePj')
                      : t('signup.adminNoticePf')}
                  </p>
                </div>

                <h3 className="text-sm font-medium text-foreground">
                  {personType === 'pj' ? t('signup.headquartersAddress') : t('signup.address')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-sm font-medium">
                      {t('signup.streetLabel')}
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="street"
                        name="street"
                        type="text"
                        placeholder={t('signup.streetPlaceholder')}
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
                      {t('signup.numberLabel')}
                    </Label>
                    <Input
                      id="number"
                      name="number"
                      type="text"
                      placeholder={t('signup.numberPlaceholder')}
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
                      {t('signup.complementLabel')}
                    </Label>
                    <Input
                      id="complement"
                      name="complement"
                      type="text"
                      placeholder={personType === 'pj' ? t('signup.complementPlaceholderPj') : t('signup.complementPlaceholderPf')}
                      value={formData.complement}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood" className="text-sm font-medium">
                      {t('signup.neighborhoodLabel')}
                    </Label>
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      type="text"
                      placeholder={t('signup.neighborhoodPlaceholder')}
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
                      {t('signup.cityLabel')}
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder={t('signup.cityPlaceholder')}
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
                      {t('signup.stateLabel')}
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      placeholder={t('signup.statePlaceholder')}
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
                      {t('signup.zipCodeLabel')}
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      placeholder={t('signup.zipCodePlaceholder')}
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

              {/* Representante Legal - apenas para PJ */}
              {personType === 'pj' && (
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
                      {t('signup.hasLegalRepresentative')}
                    </Label>
                  </div>

                  {formData.hasLegalRepresentative && (
                    <div className="space-y-4 pl-6 border-l-2 border-border">
                      <div className="space-y-2">
                        <Label htmlFor="legalRepresentativeName" className="text-sm font-medium">
                          {t('signup.legalRepNameLabel')}
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            id="legalRepresentativeName"
                            name="legalRepresentativeName"
                            type="text"
                            placeholder={t('signup.legalRepNamePlaceholder')}
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
                          {t('signup.legalRepQualificationLabel')}
                        </Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            id="legalRepresentativeQualification"
                            name="legalRepresentativeQualification"
                            type="text"
                            placeholder={t('signup.legalRepQualificationPlaceholder')}
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
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  {personType === 'pj' ? t('signup.fullNameLabelPj') : t('signup.fullNameLabelPf')}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder={t('signup.fullNamePlaceholder')}
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
                  {t('signup.emailLabel')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('signup.emailPlaceholder')}
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
                  {t('signup.passwordLabel')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t('signup.passwordPlaceholder')}
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
                  {t('signup.confirmPasswordLabel')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder={t('signup.confirmPasswordPlaceholder')}
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

              <div className="space-y-3 pt-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptedTerms"
                    checked={formData.acceptedTerms}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, acceptedTerms: !!checked }))
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="acceptedTerms" className="text-sm font-medium cursor-pointer">
                      {t('signup.acceptTermsPre')}{' '}
                      <Link
                        to="/termos-de-uso"
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        {t('signup.termsOfUse')}
                      </Link>
                      {' '}{t('signup.acceptTermsPost')}
                    </Label>
                    {errors.acceptedTerms && (
                      <p className="text-sm text-destructive">{errors.acceptedTerms}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('signup.creatingAccountButton') : t('signup.createAccountButton')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('signup.alreadyHaveAccount')}{' '}
                <Link to="/auth" className="text-primary hover:underline">
                  {t('signup.loginLink')}
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
