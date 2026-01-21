import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  Globe,
  Brain,
  AlertTriangle,
  FolderOpen,
  RefreshCw,
  Building2,
  Scale,
  Home,
  DollarSign,
  Sparkles
} from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import { ContactFormDialog } from "@/components/ContactFormDialog";

const Landing = () => {
  const problems = [
    {
      icon: FolderOpen,
      title: "Documentos espalhados",
      description: "Arquivos em e-mails, pastas locais, drives e sistemas diferentes dificultam o acesso rápido."
    },
    {
      icon: RefreshCw,
      title: "Controle manual",
      description: "Planilhas e processos manuais geram inconsistências e dependência de pessoas específicas."
    },
    {
      icon: AlertTriangle,
      title: "Retrabalho constante",
      description: "Buscar, organizar e conferir documentos consome tempo valioso da equipe."
    },
    {
      icon: Clock,
      title: "Riscos de erros e prazos",
      description: "Sem alertas automáticos, documentos vencem e oportunidades são perdidas."
    }
  ];

  const steps = [
    {
      number: "01",
      icon: Cloud,
      title: "Envie seus documentos",
      description: "Faça upload de contratos, arquivos e documentos críticos de forma simples e segura. Aceite envios de clientes e parceiros diretamente na plataforma."
    },
    {
      number: "02",
      icon: Brain,
      title: "Organização automática com IA",
      description: "A inteligência artificial da Fuzen classifica, categoriza e indexa documentos automaticamente. Sem trabalho manual, sem erros de organização."
    },
    {
      number: "03",
      icon: BarChart3,
      title: "Relatórios, alertas e controle",
      description: "Receba notificações de vencimentos, gere relatórios detalhados e tenha visibilidade total sobre todos os documentos da empresa."
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Economia de tempo",
      description: "Reduza em até 80% o tempo gasto com busca e organização de documentos."
    },
    {
      icon: Shield,
      title: "Redução de erros",
      description: "Elimine falhas humanas com automação documental inteligente."
    },
    {
      icon: Zap,
      title: "Aumento de produtividade",
      description: "Equipes focam no que importa, não em tarefas repetitivas."
    },
    {
      icon: BarChart3,
      title: "Decisões mais rápidas",
      description: "Acesso instantâneo a informações críticas para tomada de decisão."
    }
  ];

  const audiences = [
    {
      icon: Scale,
      title: "Escritórios jurídicos",
      description: "Gestão de contratos, processos e documentos de clientes com segurança e conformidade."
    },
    {
      icon: Building2,
      title: "Empresas administrativas",
      description: "Centralização de documentos fiscais, RH, financeiros e operacionais."
    },
    {
      icon: Home,
      title: "Imobiliárias",
      description: "Controle de contratos, vistorias, documentação de imóveis e locatários."
    },
    {
      icon: DollarSign,
      title: "Times financeiros",
      description: "Gestão de notas fiscais, contratos e documentos de compliance."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Gestão Inteligente de Documentos com IA para Empresas | Fuzen</title>
        <meta name="description" content="Automatize a organização, análise e controle de documentos empresariais com IA. Software de gestão documental para escritórios jurídicos, imobiliárias e times financeiros. Solicite uma demonstração." />
        <meta name="keywords" content="gestão inteligente de documentos, automação documental, gestão de documentos empresariais, software de gestão documental, gestão de documentos com IA, controle de documentos empresariais" />
        <link rel="canonical" href="https://fuzen.online/" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Fuzen",
            "applicationCategory": "BusinessApplication",
            "description": "Software de gestão inteligente de documentos com IA para empresas",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "availability": "https://schema.org/InStock",
              "priceSpecification": {
                "@type": "PriceSpecification",
                "priceCurrency": "BRL"
              }
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "127"
            }
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Fuzen",
            "url": "https://fuzen.online",
            "description": "Plataforma de gestão inteligente de documentos com IA para empresas",
            "logo": "https://fuzen.online/logo.png"
          })}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <Header />
      
        {/* Hero Section */}
        <section className="relative py-24 lg:py-40 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src={heroImage}
              alt="Plataforma Fuzen - Gestão inteligente de documentos empresariais com IA"
              className="absolute inset-0 w-full h-full object-cover opacity-5"
            />
            <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-40 w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="mb-8 px-4 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20 backdrop-blur-sm animate-fade-in shadow-sm">
                <Sparkles className="h-4 w-4 mr-2 inline" />
                Powered by IA
              </Badge>
              
              <div className="mb-6 animate-fade-in animation-delay-200">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
                    Gestão inteligente de documentos com IA para empresas
                  </span>
                </h1>
              </div>
              
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in animation-delay-400">
                Automatize a organização, análise e controle de documentos empresariais, contratos e arquivos críticos em um só lugar.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in animation-delay-600">
                <ContactFormDialog 
                  trigger={
                    <Button 
                      size="lg" 
                      className="group text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-primary to-primary-dark hover:shadow-elegant transition-all duration-300 hover:scale-105"
                    >
                      Solicitar Demonstração
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  }
                />
                <Link to="/auth">
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
                  <Brain className="h-4 w-4 text-success" />
                  <span>IA integrada</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                  <Lock className="h-4 w-4 text-success" />
                  <span>100% seguro</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                  <Globe className="h-4 w-4 text-success" />
                  <span>Conforme LGPD</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problems Section */}
        <section id="problemas" className="py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-muted/30 to-background" />
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Problemas comuns na gestão de documentos empresariais
              </h2>
              <div className="text-lg md:text-xl text-muted-foreground leading-relaxed space-y-4">
                <p>
                  Empresas de todos os portes enfrentam desafios diários com a gestão de documentos. 
                  Arquivos espalhados entre e-mails, pastas locais, drives compartilhados e sistemas 
                  diferentes criam um cenário caótico que dificulta o acesso rápido às informações.
                </p>
                <p>
                  O controle manual por meio de planilhas e processos despadronizados gera inconsistências, 
                  retrabalho constante e dependência excessiva de pessoas específicas. Sem automação, 
                  equipes perdem horas preciosas buscando, organizando e conferindo documentos.
                </p>
                <p>
                  Os riscos são reais: documentos vencem sem aviso, contratos importantes são perdidos, 
                  prazos críticos são esquecidos e oportunidades de negócio são desperdiçadas. 
                  A falta de visibilidade e controle compromete a produtividade e a tomada de decisão.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {problems.map((problem, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden border-2 hover:border-destructive/30 transition-all duration-500 hover:shadow-card backdrop-blur-sm bg-card/50 hover:-translate-y-2 rounded-3xl"
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 bg-destructive/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <problem.icon className="h-7 w-7 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                    <p className="text-muted-foreground text-sm">{problem.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="como-funciona" className="py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Como funciona a <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">gestão documental inteligente</span> da Fuzen
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Em três passos simples, transforme a forma como sua empresa gerencia documentos
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {steps.map((step, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-card backdrop-blur-sm bg-card/50 hover:-translate-y-2 rounded-3xl"
                >
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors duration-300">
                    {step.number}
                  </div>
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="w-16 h-16 mb-6 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
          
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Benefícios da <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">automação documental</span> para empresas
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Com a Fuzen, sua empresa ganha eficiência, segurança e controle total sobre documentos
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden border-2 hover:border-success/30 transition-all duration-500 hover:shadow-card backdrop-blur-sm bg-card/50 hover:-translate-y-2 rounded-3xl"
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 bg-success/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <benefit.icon className="h-7 w-7 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <ContactFormDialog 
                trigger={
                  <Button 
                    size="lg" 
                    className="group text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-elegant transition-all duration-300 hover:scale-105"
                  >
                    Solicitar Demonstração
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                }
              />
            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        <section id="para-quem" className="py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Software de <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">gestão documental</span> feito para equipes
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                A Fuzen atende empresas e times que precisam de controle de documentos empresariais com segurança e eficiência
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {audiences.map((audience, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-card backdrop-blur-sm bg-card/50 hover:-translate-y-2 rounded-3xl"
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <audience.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{audience.title}</h3>
                    <p className="text-muted-foreground text-sm">{audience.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section id="planos" className="py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Planos <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">sob medida</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Nossos planos são personalizados de acordo com o volume de documentos, número de usuários 
                e nível de automação que sua empresa precisa. Cada negócio é único, e a Fuzen se adapta 
                às suas necessidades específicas de gestão de documentos empresariais.
              </p>
              
              <Card className="border-2 border-primary/20 rounded-3xl overflow-hidden bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-left">
                      <h3 className="text-2xl md:text-3xl font-bold mb-2">Quer saber qual plano é ideal para você?</h3>
                      <p className="text-muted-foreground">Nossa equipe irá entender sua demanda e apresentar a melhor solução.</p>
                    </div>
                    <ContactFormDialog 
                      trigger={
                        <Button 
                          size="lg" 
                          className="group text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-elegant transition-all duration-300 hover:scale-105 whitespace-nowrap"
                        >
                          Solicitar Demonstração
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight">
                Pronto para ter <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">controle total</span> sobre seus documentos?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
                Empresas que usam a Fuzen reduzem em até 80% o tempo gasto com gestão documental. 
                Solicite uma demonstração e veja como a automação documental com IA pode transformar sua operação.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <ContactFormDialog 
                  trigger={
                    <Button 
                      size="lg" 
                      className="group text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-elegant transition-all duration-300 hover:scale-105"
                    >
                      Solicitar Demonstração
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  }
                />
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-10 py-6 rounded-2xl border-2 hover:bg-muted/50 transition-all duration-300 hover:scale-105"
                  >
                    Já tem conta? Entrar
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Demonstração gratuita</span>
                </div>
                <span className="text-border">•</span>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-success" />
                  <span>Dados 100% seguros</span>
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
    </>
  );
};

export default Landing;
