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
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/50 to-accent/20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              ✨ Nova versão disponível
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Fuzen - Gerencie Documentos com Segurança e Eficiência
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A Fuzen é a plataforma completa para empresas que precisam solicitar, armazenar e gerenciar 
              documentos de clientes de forma segura e organizada.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/login">
                <Button size="lg" variant="hero" className="text-lg px-8">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Ver Demonstração
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Teste grátis por 14 dias</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-success" />
                <span>Dados 100% seguros</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-success" />
                <span>Conforme LGPD</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Tudo que você precisa em uma plataforma
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Recursos poderosos para simplificar a gestão de documentos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Por que escolher a Fuzen?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Mais de 1.000 empresas já confiam na Fuzen para gerenciar 
                seus documentos com segurança e eficiência.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <a href="#recursos">
                  <Button variant="gradient" size="lg">
                    Conhecer Todos os Recursos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl transform rotate-3"></div>
              <Card className="relative bg-gradient-card border-0 shadow-elegant">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Dashboard de Controle</h3>
                    <Badge variant="outline">Em tempo real</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Documentos processados</span>
                      <span className="font-semibold">2.847</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Clientes ativos</span>
                      <span className="font-semibold">156</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Taxa de aprovação</span>
                      <span className="font-semibold text-success">98.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tempo médio</span>
                      <span className="font-semibold">2.3h</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center space-x-2 text-sm text-success">
                      <Zap className="h-4 w-4" />
                      <span>Sistema funcionando perfeitamente</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Planos para cada necessidade
            </h2>
            <p className="text-xl text-muted-foreground">
              Escolha o plano ideal para sua empresa
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.highlighted ? 'border-primary shadow-elegant scale-105' : ''}`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white">
                    Mais Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {plan.price}
                    {plan.price !== "Sob consulta" && <span className="text-sm text-muted-foreground">/mês</span>}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/login">
                    <Button 
                      className="w-full" 
                      variant={plan.highlighted ? "hero" : "outline"}
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
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Pronto para transformar sua gestão de documentos?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Junte-se a mais de 1.000 empresas que já confiam na Fuzen
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button size="lg" variant="hero" className="text-lg px-8">
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Falar com Especialista
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              Teste grátis por 14 dias • Sem cartão de crédito • Suporte incluso
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;