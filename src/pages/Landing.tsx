import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Check,
  FolderOpen,
  RefreshCw,
  AlertTriangle,
  Clock,
  Cloud,
  Layers,
  BarChart3,
  Shield,
  Zap,
  Eye,
  Target,
  Scale,
  Home,
  Building2,
  DollarSign,
} from "lucide-react";
import { ContactFormDialog } from "@/components/shared/ContactFormDialog";
import PlansSection from "@/components/billing/PlansSection";

type Stat = { value: string; label: string };
type Group = { title: string; items: string[] };
type Row = { metric: string; before: string; after: string; impact: string };
type CardCopy = { title: string; description: string };
type StepCopy = { number: string; title: string; description: string };

const Landing = () => {
  const { t } = useTranslation();

  const stats = t("landing.v2.problem.stats", { returnObjects: true }) as Stat[];
  const groups = t("landing.v2.solution.groups", { returnObjects: true }) as Group[];
  const outputs = t("landing.v2.solution.outputs", { returnObjects: true }) as string[];
  const headers = t("landing.v2.comparison.headers", { returnObjects: true }) as string[];
  const rows = t("landing.v2.comparison.rows", { returnObjects: true }) as Row[];
  const listItems = t("landing.v2.gains.listItems", { returnObjects: true }) as string[];

  const problemParagraphs = t("landing.problems.paragraphs", { returnObjects: true }) as string[];
  const problemIcons = [FolderOpen, RefreshCw, AlertTriangle, Clock];
  const problems = (t("landing.problems.items", { returnObjects: true }) as CardCopy[]).map((item, i) => ({
    ...item,
    icon: problemIcons[i],
  }));

  const stepIcons = [Cloud, Layers, BarChart3];
  const steps = (t("landing.howItWorks.items", { returnObjects: true }) as StepCopy[]).map((item, i) => ({
    ...item,
    icon: stepIcons[i],
  }));

  const benefitIcons = [FolderOpen, Target, Shield, Zap, Eye, BarChart3];
  const benefits = (t("landing.benefits.items", { returnObjects: true }) as CardCopy[]).map((item, i) => ({
    ...item,
    icon: benefitIcons[i],
  }));

  const audienceIcons = [Scale, Home, Building2, DollarSign];
  const audiences = (t("landing.audiences.items", { returnObjects: true }) as CardCopy[]).map((item, i) => ({
    ...item,
    icon: audienceIcons[i],
  }));

  const statAccents = [
    "bg-destructive",
    "bg-accent",
    "bg-primary",
    "bg-brand-blue",
  ];
  const statText = [
    "text-destructive",
    "text-accent",
    "text-primary",
    "text-brand-blue",
  ];

  const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.25em] text-primary";

  return (
    <>
      <Helmet>
        <title>{t("landing.seo.title")}</title>
        <meta name="description" content={t("landing.seo.description")} />
        <meta name="keywords" content={t("landing.seo.keywords")} />
        <link rel="canonical" href="https://fuzen.online/" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Tukana AI",
            applicationCategory: "BusinessApplication",
            description: t("landing.seo.description"),
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              availability: "https://schema.org/InStock",
              priceSpecification: {
                "@type": "PriceSpecification",
                priceCurrency: "BRL",
              },
            },
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Tukana AI",
            url: "https://fuzen.online",
            description: t("landing.seo.description"),
            logo: "https://fuzen.online/logo.png",
          })}
        </script>
      </Helmet>

      <div className="dark min-h-screen bg-background text-foreground">
        <Header />

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-gradient-glow opacity-70" />
          <div className="container mx-auto px-4 relative z-10 py-24 lg:py-36">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className={eyebrow}>{t("landing.v2.hero.eyebrow")}</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-8">
                  <span className="block">{t("landing.v2.hero.titleLine1")}</span>
                  <span className="block text-accent">{t("landing.v2.hero.titleAccent")}</span>
                  <span className="block">{t("landing.v2.hero.titleLine3")}</span>
                </h1>

                <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-10">
                  {t("landing.v2.hero.subtitle")}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <ContactFormDialog
                    trigger={
                      <Button size="lg" className="group rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-8">
                        {t("landing.v2.hero.ctaPrimary")}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    }
                  />
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="rounded-full px-8 w-full">
                      {t("landing.v2.hero.ctaSecondary")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Abstract orbit visual */}
              <div className="relative hidden lg:block h-[340px]" aria-hidden="true">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-64 w-64 rounded-full border border-border/70" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-40 w-40 rounded-full border border-accent/40" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-glow" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-accent glow" />
                </div>
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-rainbow opacity-40" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-rainbow opacity-20 rotate-12" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-rainbow opacity-20 -rotate-12" />
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section id="problemas" className="py-20 lg:py-28 border-b border-border/60">
          <div className="container mx-auto px-4">
            <p className={`${eyebrow} mb-4`}>{t("landing.v2.problem.eyebrow")}</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-12">
              {t("landing.v2.problem.titlePre")}{" "}
              <span className="text-accent">{t("landing.v2.problem.titleHighlight")}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/70 p-7 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1 ${
                    i % 2 === 1 ? "lg:translate-y-8" : ""
                  }`}
                >
                  <span className={`absolute -top-10 -right-8 h-24 w-24 rounded-full blur-2xl opacity-30 ${statAccents[i % 4]}`} />
                  <p className={`text-3xl md:text-4xl font-bold mb-3 ${statText[i % 4]}`}>{stat.value}</p>
                  <p className="text-sm text-muted-foreground leading-snug">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 lg:mt-24 max-w-2xl lg:ml-auto rounded-[2rem] rounded-tl-md border border-border/50 bg-card/50 p-8">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {t("landing.v2.problem.note")}
              </p>
            </div>
          </div>
        </section>

        {/* Problem in depth */}
        <section id="desorganizacao" className="relative overflow-hidden py-20 lg:py-28 bg-card/30 border-b border-border/60">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
              <div className="lg:sticky lg:top-28">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">{t("landing.problems.title")}</h2>
                <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                  {problemParagraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {problems.map((problem, i) => (
                  <div
                    key={i}
                    className={`rounded-[1.75rem] border border-border/50 bg-card/70 p-7 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1 ${
                      i % 2 === 1 ? "sm:translate-y-10" : ""
                    } ${i % 2 === 0 ? "rounded-tl-md" : "rounded-br-md"}`}
                  >
                    <div className="w-11 h-11 mb-5 rounded-2xl bg-destructive/10 flex items-center justify-center">
                      <problem.icon className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{problem.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Solution scope */}
        <section id="como-funciona" className="py-20 lg:py-28 border-b border-border/60">
          <div className="container mx-auto px-4">
            <p className={`${eyebrow} mb-4`}>{t("landing.v2.solution.eyebrow")}</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-14">
              {t("landing.v2.solution.titlePre")}{" "}
              <span className="text-accent">{t("landing.v2.solution.titleHighlight")}</span>
            </h2>

            <div className="grid lg:grid-cols-3 gap-12 items-start">
              {/* Inputs */}
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-3 mb-6">
                  {t("landing.v2.solution.inputsTitle")}
                </p>
                <div className="space-y-6">
                  {groups.map((group, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold mb-3">{group.title}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((item, j) => (
                          <span
                            key={j}
                            className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center */}
              <div className="flex flex-col items-center text-center">
                <div className="relative h-40 w-40 rounded-full border border-accent/40 flex items-center justify-center bg-gradient-glow">
                  <span className="text-lg font-semibold text-accent">
                    {t("landing.v2.solution.centerLabel")}
                  </span>
                </div>
                <p className="mt-6 text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {t("landing.v2.solution.centerCaption")}
                </p>
              </div>

              {/* Outputs */}
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-3 mb-6">
                  {t("landing.v2.solution.outputsTitle")}
                </p>
                <div className="space-y-3">
                  {outputs.map((output, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border border-l-2 border-l-accent bg-card px-4 py-3 text-sm"
                    >
                      {output}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-14 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {t("landing.v2.solution.footnote")}
            </p>
          </div>
        </section>

        {/* Steps */}
        <section id="passos" className="relative overflow-hidden py-20 lg:py-28 border-b border-border/60">
          <div className="pointer-events-none absolute left-1/3 -top-20 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {t("landing.howItWorks.titlePre")}{" "}
                <span className="text-accent">{t("landing.howItWorks.titleHighlight")}</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">{t("landing.howItWorks.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/70 p-8 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1 ${
                    i === 1 ? "lg:-translate-y-6" : i === 2 ? "lg:translate-y-6" : ""
                  }`}
                >
                  <span className="absolute top-6 right-7 text-5xl font-bold text-accent/15">{step.number}</span>
                  <div className="w-11 h-11 mb-5 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section id="comparativo" className="py-20 lg:py-28 bg-card/40 border-b border-border/60">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className={`${eyebrow} mb-4`}>{t("landing.v2.comparison.eyebrow")}</p>
              <h2 className="text-2xl md:text-3xl font-bold">
                {t("landing.v2.comparison.titlePre")}{" "}
                <span className="text-accent">{t("landing.v2.comparison.titleHighlight")}</span>
              </h2>
            </div>

            <div className="max-w-5xl mx-auto overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {headers.map((header, i) => (
                      <th
                        key={i}
                        className={`py-3 px-4 text-[11px] uppercase tracking-[0.18em] font-medium text-muted-foreground ${
                          i === 2 ? "bg-secondary/60" : ""
                        } ${i === 3 ? "text-right" : ""}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-4 px-4 font-medium">{row.metric}</td>
                      <td className="py-4 px-4 text-muted-foreground">{row.before}</td>
                      <td className="py-4 px-4 bg-secondary/40">{row.after}</td>
                      <td className="py-4 px-4 text-right font-semibold text-accent">{row.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="max-w-5xl mx-auto mt-6 text-xs text-muted-foreground/70 leading-relaxed">
              {t("landing.v2.comparison.note")}
            </p>
          </div>
        </section>

        {/* Gains */}
        <section id="beneficios" className="py-20 lg:py-28 border-b border-border/60">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8 items-stretch">
              <div className="flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                    {t("landing.v2.gains.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                    {t("landing.v2.gains.description")}
                  </p>
                </div>

                <div className="rounded-[2rem] bg-accent text-accent-foreground p-7">
                  <p className="text-[11px] uppercase tracking-[0.2em] mb-4 opacity-80">
                    {t("landing.v2.gains.ctaEyebrow")}
                  </p>
                  <p className="text-lg font-bold mb-2">{t("landing.v2.gains.ctaTitle")}</p>
                  <p className="text-sm mb-6 opacity-80">{t("landing.v2.gains.ctaDescription")}</p>
                  <ContactFormDialog
                    trigger={
                      <Button className="w-full rounded-lg bg-foreground text-background hover:bg-foreground/90">
                        {t("landing.v2.gains.ctaButton")}
                      </Button>
                    }
                  />
                </div>
              </div>

              <div className="rounded-[2rem] border border-border/50 bg-card/70 p-8 flex flex-col justify-between">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("landing.v2.gains.statLabel")}
                </p>
                <div className="my-8">
                  <p className="text-5xl font-bold leading-none mb-3">{t("landing.v2.gains.statValue")}</p>
                  <p className="text-sm text-muted-foreground">{t("landing.v2.gains.statUnit")}</p>
                </div>
                <p className="text-sm text-muted-foreground">{t("landing.v2.gains.statNote")}</p>
              </div>

              <div className="rounded-[2rem] rounded-tr-md border border-border/50 bg-secondary/30 p-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
                  {t("landing.v2.gains.listTitle")}
                </p>
                <p className="text-sm font-semibold mb-6">{t("landing.v2.gains.listSubtitle")}</p>
                <ul className="space-y-4">
                  {listItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="vantagens" className="relative overflow-hidden py-20 lg:py-28 bg-card/30 border-b border-border/60">
          <div className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-2xl mb-14 lg:ml-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {t("landing.benefits.titlePre")}{" "}
                <span className="text-accent">{t("landing.benefits.titleHighlight")}</span>{" "}
                {t("landing.benefits.titlePost")}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">{t("landing.benefits.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className={`rounded-[1.75rem] border border-border/50 bg-card/70 p-7 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1 ${
                    i % 3 === 1 ? "lg:translate-y-8" : i % 3 === 2 ? "lg:translate-y-4" : ""
                  } ${i % 2 === 0 ? "rounded-br-md" : "rounded-tl-md"}`}
                >
                  <div className="w-11 h-11 mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 lg:mt-24 flex justify-center">
              <ContactFormDialog
                trigger={
                  <Button size="lg" className="group rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-8">
                    {t("landing.finalCta.ctaDemo")}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                }
              />
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section id="para-quem" className="relative overflow-hidden py-20 lg:py-28 border-b border-border/60">
          <div className="pointer-events-none absolute -left-28 bottom-0 h-72 w-72 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {t("landing.audiences.titlePre")}{" "}
                <span className="text-accent">{t("landing.audiences.titleHighlight")}</span>{" "}
                {t("landing.audiences.titlePost")}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">{t("landing.audiences.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {audiences.map((audience, i) => (
                <div
                  key={i}
                  className={`rounded-[1.75rem] border border-border/50 bg-card/70 p-7 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1 ${
                    i % 2 === 1 ? "lg:translate-y-8" : ""
                  } ${i % 2 === 0 ? "rounded-tr-md" : "rounded-bl-md"}`}
                >
                  <div className="w-11 h-11 mb-5 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
                    <audience.icon className="h-5 w-5 text-brand-blue" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{audience.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{audience.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Plans */}
        <PlansSection />

        <Footer />
      </div>
    </>
  );
};

export default Landing;
