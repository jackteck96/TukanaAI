import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const passwordSchema = z.object({
  password: z.string()
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .max(100, 'A senha deve ter no máximo 100 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a senha')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar se há uma sessão de recuperação válida
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setValidSession(false);
        toast.error('Sessão inválida ou expirada. Solicite um novo link de recuperação.');
        setTimeout(() => navigate('/auth'), 3000);
        return;
      }

      setValidSession(true);
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar dados
      const validationResult = passwordSchema.safeParse({
        password,
        confirmPassword
      });
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      // Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Senha redefinida com sucesso! Faça login com sua nova senha.');
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.message || 'Erro ao redefinir senha. Tente novamente.');
      setLoading(false);
    }
  };

  if (validSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (validSession === false) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Sessão Inválida</CardTitle>
              <CardDescription>
                O link de recuperação expirou ou é inválido. Você será redirecionado para solicitar um novo link.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua nova senha (mínimo 6 caracteres)"
                    className="pl-10 pr-10"
                    required
                    maxLength={100}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="pl-10 pr-10"
                    required
                    maxLength={100}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !password || !confirmPassword}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Redefinir Senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
