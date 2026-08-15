import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
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
import { HERO_BG_URL as heroImage } from "@/lib/assets";
import { ContactFormDialog } from "@/components/shared/ContactFormDialog";
import PlansSection from "@/components/billing/PlansSection";

type CardCopy = { title: string; description: string };
type StepCopy = { number: string; title: string; description: string };

const Landing = () => {
  const { t } = useTranslation();

  const problemIcons = [FolderOpen, RefreshCw, AlertTriangle, Clock];
  const problems = (t('landing.problems.items', { returnObjects: true }) as CardCopy[]).map((item, i) => ({
    ...item,
    icon: problemIcons[i],
  }));

  const stepIcons = [Cloud, Layers, BarChart3];
  const steps = (t('landing.howItWorks.items', { returnObjects: true }) as StepCopy[]).map((item, i) => ({
    ...item,
    icon: stepIcons[i],
  }));

  const benefitIcons = [FolderOpen, Target, Shield, Zap, Eye, BarChart3];
  const benefits = (t('landing.benefits.items', { returnObjects: true }) as CardCopy[]).map((item, i) => ({
    ...item,
    icon: benefitIcons[i],
  }));

  const audienceIcons = [Scale, Home, Building2, DollarSign];
  const audiences = (t('landing.audiences.items', { returnObjects: true }) as CardCopy[]).map((item, i) => ({
    ...item,
    icon: audienceIcons[i],
  }));

  const problemParagraphs = t('landing.problems.paragraphs', { returnObjects: true }) as string[];
  const technologyParagraphs = t('landing.technology.paragraphs', { returnObjects: true }) as string[];

  return (
    <>
      <Helmet>
        <title>{t('landing.seo.title')}</title>
        <meta name="description" content={t('landing.seo.description')} />
        <meta name="keywords" content={t('landing.seo.keywords')} />
        <link rel="canonical" href="https://fuzen.online/" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Tukana AI",
            "applicationCategory": "BusinessApplication",
            "description": t('landing.seo.description'),
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
            "name": "Tukana AI",
            "url": "https://fuzen.online",
            "description": t('landing.seo.description'),
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
              alt={t('landing.seo.heroImageAlt')}
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
                {t('landing.hero.badge')}
              </Badge>

              <div className="mb-6 animate-fade-in animation-delay-200">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
                    {t('landing.hero.title')}
                  </span>
                </h1>
              </div>

              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in animation-delay-400">
                {t('landing.hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in animation-delay-600">
                <ContactFormDialog
                  trigger={
                    <Button
                      size="lg"
                      className="group text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-primary to-primary-dark hover:shadow-elegant transition-all duration-300 hover:scale-105"
                    >
                      {t('landing.hero.ctaDemo')}
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
                    {t('landing.hero.ctaLogin')}
                    <FileCheck className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm md:text-base text-muted-foreground animate-fade-in animation-delay-800">
                <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                  <Lock className="h-4 w-4 text-success" />
                  <span>{t('landing.hero.trust.secureData')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                  <Globe className="h-4 w-4 text-success" />
                  <span>{t('landing.hero.trust.lgpd')}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-full border border-success/20">
                  <Users className="h-4 w-4 text-success" />
                  <span>{t('landing.hero.trust.support')}</span>
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
                {t('landing.problems.title')}
              </h2>
              <div className="text-lg md:text-xl text-muted-foreground leading-relaxed space-y-4 text-left md:text-center">
                {problemParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
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
                {t('landing.howItWorks.titlePre')} <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('landing.howItWorks.titleHighlight')}</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.howItWorks.subtitle')}
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
                {t('landing.benefits.titlePre')} <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('landing.benefits.titleHighlight')}</span> {t('landing.benefits.titlePost')}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.benefits.subtitle')}
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
                    {t('landing.finalCta.ctaDemo')}
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
                {t('landing.audiences.titlePre')} <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('landing.audiences.titleHighlight')}</span> {t('landing.audiences.titlePost')}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.audiences.subtitle')}
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
                  {t('landing.technology.titlePre')} <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('landing.technology.titleHighlight')}</span>
                </h2>
              </div>

              <Card className="border-2 border-primary/20 rounded-3xl overflow-hidden bg-gradient-to-br from-card to-primary/5">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-6">
                    <div className="hidden md:flex w-16 h-16 flex-shrink-0 bg-gradient-to-br from-primary to-accent rounded-2xl items-center justify-center shadow-lg">
                      <Settings className="h-8 w-8 text-white" />
                    </div>
                    <div className="space-y-4">
                      {technologyParagraphs.map((paragraph, index) => (
                        <p key={index} className="text-lg text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
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
                {t('landing.finalCta.titlePre')} <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('landing.finalCta.titleHighlight')}</span> {t('landing.finalCta.titlePost')}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
                {t('landing.finalCta.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <ContactFormDialog
                  trigger={
                    <Button
                      size="lg"
                      className="group text-lg px-10 py-6 rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-elegant transition-all duration-300 hover:scale-105"
                    >
                      {t('landing.finalCta.ctaDemo')}
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
                    {t('landing.finalCta.ctaLogin')}
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>{t('landing.finalCta.freeDemo')}</span>
                </div>
                <span className="text-border">•</span>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-success" />
                  <span>{t('landing.finalCta.secureData')}</span>
                </div>
                <span className="text-border">•</span>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-success" />
                  <span>{t('landing.finalCta.lgpd')}</span>
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
