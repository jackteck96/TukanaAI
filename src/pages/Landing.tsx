import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Cloud, 
  Users, 
  FileCheck, 
  Search, 
  BarChart3, 
  Lock, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Zap,
  Globe
} from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Landing = () => {
  const features = [
    {
      icon: Shield,
      title: "Segurança Avançada",
      description: "Criptografia de ponta e backup automático para proteger seus documentos"
    },
    {
      icon: Cloud,
      title: "Armazenamento em Nuvem",
      description: "Acesse seus documentos de qualquer lugar, a qualquer hora"
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Organize documentos por cliente com controle de acesso personalizado"
    },
    {
      icon: FileCheck,
      title: "Aprovação Digital",
      description: "Fluxos de aprovação automatizados com assinatura digital"
    },
    {
      icon: Search,
      title: "Busca Inteligente",
      description: "Encontre qualquer documento em segundos com busca avançada"
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Acompanhe o progresso e gere relatórios completos"
    }
  ];

  const benefits = [
    "Redução de 80% no tempo de processamento",
    "Segurança bancária para seus documentos",
    "Interface intuitiva e fácil de usar",
    "Suporte técnico especializado 24/7",
    "Integração com sistemas existentes",
    "Conformidade com LGPD"
  ];

  const plans = [
    {
      name: "Starter",
      price: "R$ 49",
      description: "Ideal para pequenas empresas",
      features: [
        "Até 5 usuários",
        "100GB de armazenamento",
        "Suporte por email",
        "Relatórios básicos"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "R$ 149",
      description: "Para empresas em crescimento",
      features: [
        "Até 25 usuários",
        "500GB de armazenamento",
        "Suporte prioritário",
        "Relatórios avançados",
        "Integrações personalizadas",
        "Assinatura digital"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      description: "Para grandes corporações",
      features: [
        "Usuários ilimitados",
        "Armazenamento ilimitado",
        "Suporte dedicado",
        "Personalização completa",
        "SLA garantido",
        "Auditoria completa"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 lg:py-40 overflow-hidden">
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 -right-40 w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20 backdrop-blur-sm animate-fade-in shadow-sm">
              ✨ Nova versão disponível
            </Badge>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight animate-fade-in animation-delay-200">
              <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
                Fuzen - Gerencie Documentos com Segurança e Eficiência
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in animation-delay-400">
              A Fuzen é a plataforma completa para empresas que precisam solicitar, armazenar e gerenciar 
              documentos de clientes de forma segura e organizada.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in animation-delay-600">
              <a href="#precos">
                <Button 
                  size="lg" 
                  className="group text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-primary to-primary-dark hover:shadow-elegant transition-all duration-300 hover:scale-105"
                >
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 py-6 rounded-2xl border-2 hover:bg-muted/50 transition-all duration-300 hover:scale-105"
                >
                  Já tem conta? Entrar
                  <FileCheck className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm md:text-base text-muted-foreground animate-fade-in animation-delay-800">
              <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                <Lock className="h-4 w-4 text-success" />
                <span>Dados 100% seguros</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                <Globe className="h-4 w-4 text-success" />
                <span>Conforme LGPD</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Suporte especializado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-muted/30 to-background" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Tudo que você precisa em uma plataforma
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Recursos poderosos para simplificar a gestão de documentos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-2 hover:border-primary/20 transition-all duration-500 hover:shadow-card backdrop-blur-sm bg-card/50 hover:-translate-y-2 rounded-3xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="text-center relative z-10">
                  <div className="relative mb-6 inline-block mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl md:text-2xl mb-2 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10">
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Por que escolher a <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Fuzen?</span>
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                  Mais de 1.000 empresas já confiam na Fuzen para gerenciar 
                  seus documentos com segurança e eficiência.
                </p>
              </div>
              
              <div className="space-y-5">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-success/5 transition-all duration-300 group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <span className="text-lg text-foreground leading-relaxed pt-1">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <a href="#recursos">
                  <Button 
                    size="lg" 
                    className="group bg-gradient-to-r from-primary to-accent hover:shadow-elegant transition-all duration-300 hover:scale-105 rounded-2xl px-8"
                  >
                    Conhecer Todos os Recursos
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="relative order-first lg:order-last">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-3 blur-2xl opacity-30" />
              
              <Card className="relative border-2 hover:border-primary/20 transition-all duration-500 overflow-hidden rounded-3xl shadow-2xl backdrop-blur-sm bg-card/80">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                
                <CardContent className="p-8 md:p-10 relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl md:text-2xl font-bold">Dashboard de Controle</h3>
                    <Badge className="px-3 py-1 bg-success/10 text-success border-success/20 animate-pulse">
                      Em tempo real
                    </Badge>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                      <span className="text-muted-foreground text-lg">Documentos processados</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">2.847</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                      <span className="text-muted-foreground text-lg">Clientes ativos</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">156</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                      <span className="text-muted-foreground text-lg">Taxa de aprovação</span>
                      <span className="text-2xl font-bold text-success">98.5%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                      <span className="text-muted-foreground text-lg">Tempo médio</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">2.3h</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t-2 border-border">
                    <div className="flex items-center gap-3 text-base">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-success" />
                      </div>
                      <span className="text-success font-medium">Sistema funcionando perfeitamente</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Planos para cada necessidade
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
              Escolha o plano ideal para sua empresa
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="group text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-elegant transition-all duration-300 hover:scale-105"
                >
                  Cadastrar Empresa
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/cadastro-cliente">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 py-6 rounded-2xl border-2 hover:bg-muted/50 transition-all duration-300 hover:scale-105"
                >
                  Cadastrar como Cliente
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative overflow-hidden transition-all duration-500 rounded-3xl border-2 ${
                  plan.highlighted 
                    ? 'border-primary shadow-2xl lg:scale-105 bg-gradient-to-b from-card to-primary/5' 
                    : 'border-border hover:border-primary/30 hover:shadow-xl backdrop-blur-sm bg-card/50'
                }`}
              >
                {plan.highlighted && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
                    <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-primary to-accent text-white shadow-lg z-10 text-sm font-semibold">
                      Mais Popular
                    </Badge>
                  </>
                )}
                
                <CardHeader className="text-center pt-12 pb-8 relative z-10">
                  <CardTitle className="text-2xl md:text-3xl mb-4 font-bold">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <div className={`text-5xl md:text-6xl font-bold ${plan.highlighted ? 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent' : 'text-primary'}`}>
                      {plan.price}
                    </div>
                    {plan.price !== "Sob consulta" && (
                      <span className="text-lg text-muted-foreground">/mês</span>
                    )}
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                </CardHeader>
                
                <CardContent className="relative z-10 px-6 pb-10">
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3 group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle className="h-4 w-4 text-success" />
                        </div>
                        <span className="text-base leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/signup">
                    <Button 
                      className={`w-full py-6 rounded-2xl text-lg font-semibold transition-all duration-300 hover:scale-105 ${
                        plan.highlighted 
                          ? 'bg-gradient-to-r from-primary to-accent hover:shadow-elegant' 
                          : 'border-2 hover:bg-primary/5'
                      }`}
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      {plan.name === "Enterprise" ? "Falar com Vendas" : "Começar Agora"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                Pronto para transformar sua <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">gestão de documentos?</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Junte-se a mais de 1.000 empresas que já confiam na Fuzen
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="group text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-elegant transition-all duration-300 hover:scale-105"
                >
                  Cadastrar Empresa
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/cadastro-cliente">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 py-6 rounded-2xl border-2 hover:bg-muted/50 transition-all duration-300 hover:scale-105"
                >
                  Cadastrar como Cliente
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="text-lg px-10 py-6 rounded-2xl hover:bg-muted/50 transition-all duration-300"
                >
                  Já tem conta? Entrar
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-success" />
                <span>Plataforma segura</span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Suporte incluso</span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-success" />
                <span>Conforme LGPD</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;