import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  BarChart3, 
  Lock, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  AlertTriangle,
  FolderOpen,
  RefreshCw,
  Building2,
  Scale,
  Home,
  DollarSign,
  Settings,
  Eye,
  Layers,
  Target
} from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import { ContactFormDialog } from "@/components/ContactFormDialog";
import PlansSection from "@/components/PlansSection";

const Landing = () => {
  const problems = [
    {
      icon: FolderOpen,
      title: "Documentos espalhados",
      description: "Arquivos dispersos em e-mails, pastas, drives e sistemas dificultam o acesso e atrasam decisões."
    },
    {
      icon: RefreshCw,
      title: "Processos manuais",
      description: "Controles em planilhas geram inconsistências, dependência de pessoas e falhas operacionais."
    },
    {
      icon: AlertTriangle,
      title: "Falta de controle",
      description: "Sem padronização, é impossível saber o status de cada documento ou processo em tempo real."
    },
    {
      icon: Clock,
      title: "Riscos e retrabalho",
      description: "Prazos perdidos, documentos vencidos e retrabalho constante comprometem a operação."
    }
  ];

  const steps = [
    {
      number: "01",
      icon: Cloud,
      title: "Centralização dos documentos",
      description: "Reúna todos os documentos, contratos e arquivos da empresa em um único ambiente seguro e acessível para toda a equipe."
    },
    {
      number: "02",
      icon: Layers,
      title: "Organização automática e padronização",
      description: "A Fuzen organiza e classifica documentos automaticamente, seguindo padrões definidos pela sua empresa. Sem bagunça, sem trabalho manual."
    },
    {
      number: "03",
      icon: BarChart3,
      title: "Controle de prazos, relatórios e visão geral",
      description: "Acompanhe o status de cada documento, receba alertas de vencimento e tenha relatórios claros para visão completa dos processos."
    }
  ];

  const benefits = [
    {
      icon: FolderOpen,
      title: "Centralização de documentos empresariais",
      description: "Todos os arquivos em um só lugar, organizados e acessíveis."
    },
    {
      icon: Target,
      title: "Padronização de processos",
      description: "Fluxos documentais consistentes e organizados em toda a empresa."
    },
    {
      icon: Shield,
      title: "Redução de erros e retrabalho",
      description: "Menos falhas com organização automática e alertas de vencimento."
    },
    {
      icon: Zap,
      title: "Mais produtividade para os times",
      description: "Equipes focam no trabalho estratégico, não em buscar arquivos."
    },
    {
      icon: Eye,
      title: "Visão clara e organizada da documentação",
      description: "Saiba exatamente onde está cada documento e qual seu status atual."
    },
    {
      icon: BarChart3,
      title: "Apoio à tomada de decisão",
      description: "Relatórios e informações organizadas para decisões mais rápidas."
    }
  ];

  const audiences = [
    {
      icon: Scale,
      title: "Escritórios jurídicos",
      description: "Organização de contratos, processos e documentos legais com segurança e controle de prazos."
    },
    {
      icon: Home,
      title: "Imobiliárias",
      description: "Controle de contratos, vistorias e documentação de imóveis e locatários em um só lugar."
    },
    {
      icon: Building2,
      title: "Empresas em crescimento",
      description: "Gestão de documentos, contratos e processos internos de forma organizada e escalável."
    },
    {
      icon: DollarSign,
      title: "Times financeiros e operacionais",
      description: "Controle de notas fiscais, compliance e documentos críticos com rastreabilidade."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Organização Inteligente de Documentos e Processos Empresariais | Fuzen</title>
        <meta name="description" content="Centralize, organize e controle documentos, contratos e processos da sua empresa com eficiência. Plataforma de gestão documental para escritórios jurídicos, imobiliárias e times financeiros." />
        <meta name="keywords" content="organização de documentos empresariais, gestão documental, controle de processos internos, documentos e contratos empresariais, organização documental profissional, software de gestão documental" />
        <link rel="canonical" href="https://fuzen.online/" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Fuzen",
            "applicationCategory": "BusinessApplication",
            "description": "Plataforma de organização inteligente de documentos e processos empresariais para centralização, controle e gestão documental",
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
            "description": "Plataforma de organização inteligente de documentos e processos empresariais",
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
              alt="Plataforma Fuzen - Organização inteligente de documentos empresariais"
              className="absolute inset-0 w-full h-full object-cover opacity-5"
            />
            <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 -right-40 w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="mb-8 px-4 py-1.5 bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20 backdrop-blur-sm animate-fade-in shadow-sm">
                <FileCheck className="h-4 w-4 mr-2 inline" />
                Controle total dos seus documentos
              </Badge>
              
              <div className="mb-6 animate-fade-in animation-delay-200">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
                    Organização inteligente de documentos e processos empresariais
                  </span>
                </h1>
              </div>
              
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in animation-delay-400">
                Centralize, organize e controle documentos, contratos e processos da sua empresa com eficiência — sem retrabalho, sem planilhas e sem perda de informação.
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
                  <Lock className="h-4 w-4 text-success" />
                  <span>Dados seguros</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                  <Globe className="h-4 w-4 text-success" />
                  <span>Conforme LGPD</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                  <Users className="h-4 w-4 text-success" />
                  <span>Suporte especializado</span>
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
                O problema da desorganização documental nas empresas
              </h2>
              <div className="text-lg md:text-xl text-muted-foreground leading-relaxed space-y-4 text-left md:text-center">
                <p>
                  A realidade de muitas empresas é a mesma: documentos espalhados entre e-mails, pastas locais, 
                  drives compartilhados e sistemas diferentes. Cada pessoa guarda arquivos de um jeito, e 
                  quando alguém precisa de um documento específico, começa uma verdadeira busca que consome 
                  tempo e gera frustração.
                </p>
                <p>
                  Processos manuais baseados em planilhas e controles individuais criam inconsistências graves. 
                  Há dependência de pessoas específicas que "sabem onde está tudo", e quando elas saem de férias 
                  ou deixam a empresa, o conhecimento vai junto. O retrabalho se torna rotina.
                </p>
                <p>
                  Os riscos operacionais são concretos: prazos perdidos por falta de acompanhamento, documentos 
                  vencidos sem aviso, erros em contratos por versões desatualizadas e dificuldade de localizar 
                  arquivos críticos em momentos decisivos. A falta de visibilidade sobre a documentação 
                  compromete a tomada de decisão e a eficiência do negócio.
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
                Como a Fuzen <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">organiza documentos e processos</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Em três passos simples, transforme a gestão documental da sua empresa
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
                Benefícios da <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">organização inteligente</span> da documentação
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Transforme a gestão documental da sua empresa e ganhe controle, produtividade e eficiência
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                Para quem a <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Fuzen</span> é indicada
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Empresas e times que precisam de organização documental profissional e controle de processos internos
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

        {/* Technology Section */}
        <section id="tecnologia" className="py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  Tecnologia como <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">apoio</span>
                </h2>
              </div>
              
              <Card className="border-2 border-primary/20 rounded-3xl overflow-hidden bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-6">
                    <div className="hidden md:flex w-16 h-16 flex-shrink-0 bg-gradient-to-br from-primary to-accent rounded-2xl items-center justify-center shadow-lg">
                      <Settings className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-4">
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        A Fuzen utiliza automação e inteligência para facilitar a organização documental 
                        e o controle de processos da sua empresa. A tecnologia trabalha nos bastidores, 
                        classificando arquivos, identificando padrões e gerando alertas de forma automática.
                      </p>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        Você não precisa de conhecimento técnico para usar a plataforma. A interface é 
                        simples e intuitiva, pensada para que qualquer pessoa da equipe consiga enviar, 
                        organizar e encontrar documentos com facilidade. Sem complexidade operacional.
                      </p>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        O foco está em resolver problemas práticos do dia a dia: localizar arquivos 
                        rapidamente, saber o status de cada documento, receber lembretes de vencimento 
                        e ter relatórios claros para apoiar a gestão.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <PlansSection />

        {/* Final CTA Section */}
        <section className="py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight">
                Tenha <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">controle e organização</span> sobre sua documentação
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
                Chega de documentos espalhados, processos manuais e retrabalho. Conheça a Fuzen na prática 
                e veja como sua empresa pode ganhar organização, controle e eficiência na gestão documental. 
                Solicite uma demonstração gratuita e descubra como funciona.
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
                  <span>Dados seguros</span>
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
