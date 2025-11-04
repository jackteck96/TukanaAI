import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { Building2, User, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Login = () => {
  const [userType, setUserType] = useState<"empresa" | "cliente" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      
      // Redirect based on user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'client') {
        navigate('/cliente');
      } else {
        navigate('/empresa');
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setIsResetModalOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Fuzen Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Fazer Login</h1>
            <p className="text-muted-foreground">Selecione o tipo de acesso</p>
          </div>

          <div className="space-y-4">
            <Card 
              className="cursor-pointer hover:shadow-card transition-all duration-300 border-2 hover:border-primary/20"
              onClick={() => setUserType("empresa")}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Área da Empresa</h3>
                    <p className="text-sm text-muted-foreground">Gerencie clientes e documentos</p>
                  </div>
                  <Badge variant="outline">Admin</Badge>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-card transition-all duration-300 border-2 hover:border-primary/20"
              onClick={() => setUserType("cliente")}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-lg flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Área do Cliente</h3>
                    <p className="text-sm text-muted-foreground">Acompanhe seus processos</p>
                  </div>
                  <Badge variant="outline">Cliente</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Fuzen Logo" className="h-12 w-auto" />
          </div>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              Login - {userType === "empresa" ? "Empresa" : "Cliente"}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setUserType(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Entre com suas credenciais para acessar a plataforma
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
                  <DialogTrigger asChild>
                    <button 
                      type="button"
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Recuperar Senha</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        variant="hero"
                        disabled={isLoading}
                      >
                        {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Voltar ao início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;