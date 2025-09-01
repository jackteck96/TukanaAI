import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Register = () => {
  const [step, setStep] = useState<"company" | "user">("company");
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: "",
    domain: "",
  });
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "employee" | "client",
  });
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create company
      const { data: company, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (error) throw error;

      // Move to user step with company ID
      setStep("user");
      toast({
        title: "Empresa cadastrada!",
        description: "Agora cadastre o administrador da empresa.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar empresa",
        description: error.message || "Erro inesperado. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the company ID
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('name', companyData.name)
        .eq('domain', companyData.domain)
        .single();

      if (!company) throw new Error("Empresa não encontrada");

      const { error } = await signUp(userData.email, userData.password, {
        name: userData.name,
        role: userData.role,
        company_id: company.id,
      });

      if (error) throw error;

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta.",
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar usuário",
        description: error.message || "Erro inesperado. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === "company") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Cadastrar Empresa</CardTitle>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground">
              Primeiro, vamos cadastrar sua empresa
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  placeholder="Fuzen Tecnologia"
                  value={companyData.name}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domínio da Empresa</Label>
                <Input
                  id="domain"
                  placeholder="fuzen.com.br"
                  value={companyData.domain}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, domain: e.target.value }))}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                variant="hero"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Cadastrar Empresa
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Cadastrar Administrador</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setStep("company")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Agora cadastre o administrador da empresa
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="João Silva"
                value={userData.name}
                onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@fuzen.com.br"
                value={userData.email}
                onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={userData.password}
                onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuário</Label>
              <Select 
                value={userData.role} 
                onValueChange={(value: "admin" | "employee" | "client") => 
                  setUserData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              variant="hero"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Já tem uma conta? Fazer login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;