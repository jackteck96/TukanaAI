import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Mail, Lock, User, Building2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LOGO_URL as logo } from '@/lib/assets';

const Auth = () => {
  const { t } = useTranslation();
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [searchParams] = useSearchParams();
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const authError = searchParams.get('auth_error') || sessionStorage.getItem('last_auth_error');
  const errorMessage = authError === 'otp_expired'
    ? t('auth.errors.otpExpired')
    : authError
    ? t('auth.errors.generic')
    : null;

  useEffect(() => {
    try { sessionStorage.removeItem('last_auth_error'); } catch {}
  }, []);

  // Detect password recovery from email link
  useEffect(() => {
    const checkRecoveryMode = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        setShowResetPassword(true);
      }
    };
    
    checkRecoveryMode();
  }, []);

  // Prefill email from invite + tab/plan from query
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    if (prefill) {
      setLoginForm((prev) => ({ ...prev, email: prefill }));
    }
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'login') {
      setActiveTab(tab);
    }
    const plan = searchParams.get('plan');
    if (plan) {
      sessionStorage.setItem('pending_checkout_plan', plan);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (user) {
        // Retomar checkout pendente se houver
        const pendingPlan = sessionStorage.getItem("pending_checkout_plan");
        if (pendingPlan) {
          sessionStorage.removeItem("pending_checkout_plan");
          try {
            const { data, error } = await supabase.functions.invoke("create-checkout", {
              body: { plan_slug: pendingPlan },
            });
            if (error) throw error;
            if (data?.url) {
              window.location.href = data.url;
              return;
            }
          } catch (e) {
            console.error("Erro ao retomar checkout:", e);
          }
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const redirectPath = profile?.role === 'client' ? '/cliente' : '/empresa';
        navigate(redirectPath, { replace: true });
      }
    };
    
    checkUserAndRedirect();
  }, [user, navigate]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateEmail(loginForm.email)) {
      newErrors.email = t('auth.errors.invalidEmailField');
    }

    if (!validatePassword(loginForm.password)) {
      newErrors.password = t('auth.errors.passwordTooShort');
    }

    setErrors(newErrors);
    setLoginError(null);
    if (Object.keys(newErrors).length > 0) return;

    const { error } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      const message = error.message?.toLowerCase() || '';
      if (message.includes('invalid login credentials')) {
        setLoginError(t('auth.errors.invalidCredentials'));
      } else if (message.includes('email not confirmed')) {
        setLoginError(t('auth.errors.emailNotConfirmed'));
      } else {
        setLoginError(t('auth.errors.loginFailed'));
      }
      return;
    }

    // Check user role to redirect appropriately
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'client') {
        navigate('/cliente');
      } else {
        navigate('/empresa');
      }
    }
  };

  const handleResendConfirmation = async () => {
    const email = loginForm.email.trim();
    if (!validateEmail(email)) {
      setLoginError(t('auth.errors.invalidEmailResend'));
      return;
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) {
      setLoginError(t('auth.errors.resendFailed'));
    } else {
      setLoginError(t('auth.success.resendConfirmation'));
    }
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(resetEmail)) {
      toast.error(t('auth.errors.invalidEmail'));
      return;
    }

    setIsResettingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(t('auth.errors.resetFailed'));
    } else {
      toast.success(t('auth.success.resetSent'));
      setShowForgotPassword(false);
      setResetEmail('');
    }
    setIsResettingPassword(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(newPassword)) {
      toast.error(t('auth.errors.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error(t('auth.errors.passwordMismatch'));
      return;
    }

    setIsUpdatingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(t('auth.errors.updatePasswordFailed'));
    } else {
      toast.success(t('auth.success.passwordUpdated'));
      setShowResetPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      // Limpar o hash da URL
      window.location.hash = '';
    }

    setIsUpdatingPassword(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateEmail(signupForm.email)) {
      newErrors.email = t('auth.errors.invalidEmailField');
    }

    if (!validatePassword(signupForm.password)) {
      newErrors.password = t('auth.errors.passwordTooShort');
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordMismatch');
    }

    if (!signupForm.fullName.trim()) {
      newErrors.fullName = t('auth.errors.fullNameRequired');
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);
    
    if (!error) {
      setActiveTab('login');
      setSignupForm({ email: '', password: '', confirmPassword: '', fullName: '' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auth.backToHome')}
          </Link>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Tukana AI Logo" className="h-8 w-auto" />
          </div>
        </div>

        {/* Mensagens de erro de autenticação */}
        {errorMessage && (
          <div className="max-w-md mx-auto mb-4">
            <Alert variant="destructive">
              <AlertTitle>{t('auth.notAuthenticatedTitle')}</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}
        {loginError && (
          <div className="max-w-md mx-auto mb-4">
            <Alert variant="destructive">
              <AlertTitle>{t('auth.loginErrorTitle')}</AlertTitle>
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          </div>
        )}
        {loginError && /confirm/i.test(loginError) && (
          <div className="max-w-md mx-auto -mt-2 mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleResendConfirmation}>
              {t('auth.resendConfirmationButton')}
            </Button>
          </div>
        )}
        {/* Auth Card */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-border/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src={logo} alt="Tukana AI Logo" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {t('auth.welcomeTitle')}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t('auth.welcomeSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('auth.emailLabel')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                        required
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">{t('auth.passwordLabel')}</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs text-primary"
                        onClick={() => {
                          setResetEmail(loginForm.email);
                          setShowForgotPassword(true);
                        }}
                      >
                        {t('auth.forgotPassword')}
                      </Button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder={t('auth.passwordPlaceholder')}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                        required
                      />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? t('auth.enteringButton') : t('auth.enterButton')}
                  </Button>
                </form>
              </div>

              <Separator className="my-6" />

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('auth.noAccount')}{' '}
                  <Link to="/signup" className="text-primary font-medium hover:underline">
                    {t('auth.createAccountLink')}
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {t('auth.tagline')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('auth.termsAgreementPre')}{' '}
                  <Link to="/termos-de-uso" className="text-primary hover:underline">
                    {t('auth.termsOfUse')}
                  </Link>{' '}
                  {t('auth.and')}{' '}
                  <Link to="/politica-privacidade" className="text-primary hover:underline">
                    {t('auth.privacyPolicy')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('auth.forgotPasswordDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('auth.forgotPasswordDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t('auth.emailLabel')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                disabled={isResettingPassword}
              >
                {t('auth.cancel')}
              </Button>
              <Button
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? t('auth.sendingButton') : t('auth.sendLinkButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('auth.resetPasswordDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('auth.resetPasswordDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('auth.newPasswordLabel')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder={t('auth.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">{t('auth.confirmNewPasswordLabel')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder={t('auth.confirmNewPasswordPlaceholder')}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetPassword(false);
                  window.location.hash = '';
                }}
                disabled={isUpdatingPassword}
              >
                {t('auth.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? t('auth.updatingButton') : t('auth.resetPasswordButton')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;