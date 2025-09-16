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

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');

  const [searchParams] = useSearchParams();
  const authError = searchParams.get('auth_error') || sessionStorage.getItem('last_auth_error');
  const errorMessage = authError === 'otp_expired'
    ? 'O link de acesso expirou. Solicite um novo e-mail e tente novamente.'
    : authError
    ? 'Não foi possível concluir o login. Tente novamente.'
    : null;

  useEffect(() => {
    try { sessionStorage.removeItem('last_auth_error'); } catch {}
  }, []);

  // Redirect if already authenticated
  if (user) {
    const userRole = user.user_metadata?.role;
    const redirectPath = userRole === 'client' ? '/cliente' : '/empresa';
    return <Navigate to={redirectPath} replace />;
  }

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
    const userRole = user?.user_metadata?.role;
    
    if (userRole === 'client') {
      navigate('/cliente');
    } else {
      navigate('/empresa');
    }
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
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">LegalTech Platform</span>
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
        {/* Auth Card */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Entrar na Plataforma
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Acesse sua conta para gerenciar processos jurídicos
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
                    <Label htmlFor="login-password">Senha</Label>
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
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Não tem uma conta?{' '}
                  <Link to="/signup" className="text-primary hover:underline">
                    Criar conta empresarial
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Ao fazer login, você concorda com nossos{' '}
                  <a href="#" className="text-primary hover:underline">
                    Termos de Uso
                  </a>{' '}
                  e{' '}
                  <a href="#" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;