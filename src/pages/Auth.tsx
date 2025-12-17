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
import logo from '@/assets/logo.png';

const Auth = () => {
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
    ? 'O link de acesso expirou. Solicite um novo e-mail e tente novamente.'
    : authError
    ? 'Não foi possível concluir o login. Tente novamente.'
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

  // Prefill email from invite
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    if (prefill) {
      setLoginForm((prev) => ({ ...prev, email: prefill }));
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (user) {
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
      newErrors.email = 'Email inválido';
    }

    if (!validatePassword(loginForm.password)) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    setLoginError(null);
    if (Object.keys(newErrors).length > 0) return;

    const { error } = await signIn(loginForm.email, loginForm.password);
    
    if (error) {
      const message = error.message?.toLowerCase() || '';
      if (message.includes('invalid login credentials')) {
        setLoginError('Email ou senha incorretos. Caso tenha acabado de criar a conta, confirme seu e-mail pelo link enviado.');
      } else if (message.includes('email not confirmed')) {
        setLoginError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e spam para confirmar.');
      } else {
        setLoginError('Não foi possível entrar. Tente novamente.');
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
      setLoginError('Informe um e-mail válido para reenviar a confirmação.');
      return;
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) {
      setLoginError('Não foi possível reenviar o e-mail de confirmação. Tente novamente.');
    } else {
      setLoginError('Enviamos um novo e-mail de confirmação. Verifique sua caixa de entrada e spam.');
    }
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(resetEmail)) {
      toast.error('Por favor, informe um e-mail válido');
      return;
    }

    setIsResettingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error('Erro ao enviar e-mail de recuperação. Tente novamente.');
    } else {
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
      setResetEmail('');
    }
    setIsResettingPassword(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(newPassword)) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsUpdatingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error('Erro ao redefinir senha. Tente novamente.');
    } else {
      toast.success('Senha redefinida com sucesso! Faça login com sua nova senha.');
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
      newErrors.email = 'Email inválido';
    }

    if (!validatePassword(signupForm.password)) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (!signupForm.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
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
            Voltar para o início
          </Link>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Fuzen Logo" className="h-8 w-auto" />
          </div>
        </div>

        {/* Mensagens de erro de autenticação */}
        {errorMessage && (
          <div className="max-w-md mx-auto mb-4">
            <Alert variant="destructive">
              <AlertTitle>Não foi possível autenticar</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}
        {loginError && (
          <div className="max-w-md mx-auto mb-4">
            <Alert variant="destructive">
              <AlertTitle>Erro no login</AlertTitle>
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          </div>
        )}
        {loginError && /confirm/i.test(loginError) && (
          <div className="max-w-md mx-auto -mt-2 mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleResendConfirmation}>
              Reenviar e-mail de confirmação
            </Button>
          </div>
        )}
        {/* Auth Card */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-border/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src={logo} alt="Fuzen Logo" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Bem-vindo à Fuzen
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Acesse sua conta para organizar, acompanhar e centralizar documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
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
                      <Label htmlFor="login-password">Senha</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs text-primary"
                        onClick={() => {
                          setResetEmail(loginForm.email);
                          setShowForgotPassword(true);
                        }}
                      >
                        Esqueci minha senha
                      </Button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Digite sua senha"
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
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </div>

              <Separator className="my-6" />
              
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{' '}
                  <Link to="/signup" className="text-primary font-medium hover:underline">
                    Criar conta para minha empresa
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Menos planilhas. Mais controle.
                </p>
                <p className="text-xs text-muted-foreground">
                  Ao fazer login, você concorda com nossos{' '}
                  <Link to="/termos-de-uso" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link to="/politica-privacidade" className="text-primary hover:underline">
                    Política de Privacidade
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
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
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
                Cancelar
              </Button>
              <Button
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? 'Enviando...' : 'Enviar Link'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Digite sua nova senha abaixo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirme sua nova senha"
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
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? 'Atualizando...' : 'Redefinir Senha'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;