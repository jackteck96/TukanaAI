import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGO_URL } from "@/lib/assets";

const PlansSection = lazy(() => import("@/components/billing/PlansSection"));
const ContactFormDialog = lazy(() => import("@/components/shared/ContactFormDialog").then((module) => ({ default: module.ContactFormDialog })));

const DeferredPlans = () => {
  const container = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element || ready) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setReady(true);
      observer.disconnect();
    }, { rootMargin: "900px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <section ref={container} id={ready ? undefined : "planos"} className={ready ? undefined : "min-h-[36rem]"} aria-label={ready ? undefined : "Planos"}>
      {ready && <Suspense fallback={<div className="min-h-[36rem]" />}><PlansSection /></Suspense>}
    </section>
  );
};

const productNodes = ["EMPRESA", "SÓCIOS", "QUALIFICAÇÕES"];
const operationalItems = ["Documentos", "Processos", "Prazos", "Assinaturas", "Etapas"];
const metrics = [
  ["4–6", "sistemas diferentes para encontrar e organizar informações"],
  ["11h", "por semana procurando arquivos"],
  ["30%", "dos contratos com versões desatualizadas"],
  ["1 em 5", "prazos descobertos na última hora"],
];
const workflow = [
  ["01 — IDENTIFICA", "A IA encontra a empresa, os sócios e suas qualificações a partir do CNPJ."],
  ["02 — PREENCHE", "A documentação-base da Tukana é preenchida com as informações encontradas pela IA."],
  ["03 — ORGANIZA", "Documentos, etapas, prazos e assinaturas ficam centralizados e rastreáveis."],
];
const teamTasks = ["Pesquisar informações", "Preencher documentos", "Encontrar arquivos", "Controlar etapas", "Controlar prazos"];

const ConnectionField = ({ className = "" }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 1000 600" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
    <defs>
      <linearGradient id="story-line-$RANDOM" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="hsl(var(--brand-blue))" />
        <stop offset="0.45" stopColor="hsl(var(--primary))" />
        <stop offset="0.72" stopColor="hsl(var(--accent))" />
        <stop offset="1" stopColor="hsl(var(--brand-orange))" />
      </linearGradient>
    </defs>
    <path data-line d="M500 300 C330 280 280 140 130 145" fill="none" stroke="url(#story-line)" strokeWidth="1.5" />
    <path data-line d="M500 300 C680 285 720 145 875 145" fill="none" stroke="url(#story-line)" strokeWidth="1.5" />
    <path data-line d="M500 300 C340 330 290 470 145 475" fill="none" stroke="url(#story-line)" strokeWidth="1.5" />
    <path data-line d="M500 300 C665 340 720 465 860 470" fill="none" stroke="url(#story-line)" strokeWidth="1.5" />
    <circle cx="500" cy="300" r="115" fill="none" stroke="hsl(var(--border))" strokeOpacity="0.45" />
    <circle cx="500" cy="300" r="190" fill="none" stroke="hsl(var(--border))" strokeOpacity="0.22" />
  </svg>
);

const DocumentSheet = ({ index, compact = false }: { index: number; compact?: boolean }) => (
  <div data-product-doc className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-border bg-card shadow-lg ${compact ? "h-40 w-28 p-3 md:h-52 md:w-36" : "h-52 w-36 p-4 md:h-64 md:w-44"}`}>
    <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
      <FileText className="h-4 w-4 text-accent" />
      <span className="text-[8px] font-semibold text-muted-foreground">DOC {index + 1}</span>
    </div>
    <div className="space-y-3">{[0, 1, 2, 3].map((line) => <div key={line} className="h-1.5 overflow-hidden rounded-full bg-secondary"><span data-product-fill className="block h-full origin-left scale-x-0 rounded-full bg-primary" /></div>)}</div>
    <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 border-t border-border pt-2"><Check className="h-3 w-3 text-primary" /><span className="text-[7px] uppercase text-muted-foreground">Pronto para revisão</span></div>
  </div>
);

const PinnedScene = ({ id, sceneRef, children, className = "" }: { id?: string; sceneRef: React.RefObject<HTMLElement>; children: React.ReactNode; className?: string }) => (
  <section id={id} ref={sceneRef} className={`story-scene relative min-h-screen overflow-hidden border-b border-border/50 ${className}`}>
    <div className="story-stage relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden">{children}</div>
  </section>
);

const ScrollyLanding = () => {
  const root = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLElement>(null);
  const product = useRef<HTMLElement>(null);
  const organized = useRef<HTMLElement>(null);
  const costs = useRef<HTMLElement>(null);
  const control = useRef<HTMLElement>(null);
  const how = useRef<HTMLElement>(null);
  const team = useRef<HTMLElement>(null);
  const audience = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let context: { revert: () => void } | undefined;
    let refresh: number | undefined;
    let cancelled = false;

    const prepareStory = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const pinTimeline = (element: HTMLElement | null, distance: number) => gsap.timeline({
          scrollTrigger: element ? { trigger: element, start: "top top", end: `+=${distance}%`, pin: true, scrub: 0.55, anticipatePin: 1, invalidateOnRefresh: true } : undefined,
        });

        pinTimeline(intro.current, 85)
          .to("[data-scroll-cue]", { opacity: 0, y: 18 }, 0)
          .to("[data-hero-copy]", { yPercent: -18, opacity: 0.35 }, 0)
          .to("[data-hero-cnpj]", { scale: 1.5, yPercent: 78 }, 0)
          .to("[data-intro-lines]", { opacity: 1, scale: 1 }, 0);

        const productTl = pinTimeline(product.current, 245);
        productTl
          .fromTo("[data-product-cnpj]", { scale: 1.45 }, { scale: 0.72, y: -125, duration: 0.65 })
          .fromTo("[data-line]", { strokeDasharray: 900, strokeDashoffset: 900, opacity: 0 }, { strokeDashoffset: 0, opacity: 0.7, stagger: 0.08, duration: 0.8 }, 0.05)
          .fromTo("[data-product-node]", { opacity: 0, scale: 0.3, x: 0, y: 0 }, { opacity: 1, scale: 1, x: (i) => [-150, 0, 150][i], y: -25, stagger: 0.12, duration: 0.55 }, 0.3)
          .fromTo("[data-product-message='0']", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45 }, 0.4)
          .to("[data-product-cnpj]", { opacity: 0, scale: 0.45, duration: 0.35 }, 0.92)
          .to("[data-product-message='0']", { opacity: 0, y: -12, duration: 0.3 }, 0.95)
          .to("[data-product-node]", { x: 0, y: 12, scale: 0.55, opacity: 0.35, stagger: 0.05, duration: 0.5 }, 1.0)
          .fromTo("[data-info-core]", { opacity: 0, scale: 0.45 }, { opacity: 1, scale: 1, duration: 0.5 }, 1.05)
          .fromTo("[data-product-message='1']", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45 }, 1.1)
          .to("[data-product-message='1']", { opacity: 0, y: -12, duration: 0.3 }, 1.58)
          .to("[data-info-core]", { opacity: 0, scale: 0.4, y: 55, duration: 0.5 }, 1.65)
          .to("[data-product-node]", { opacity: 0, scale: 0.25, duration: 0.35 }, 1.6)
          .fromTo("[data-product-doc]", { opacity: 0, scale: 0.35, rotate: (i) => (i - 1) * 12 }, { opacity: 1, scale: 0.8, rotate: (i) => (i - 1) * 5, x: (i) => (i - 1) * 115, stagger: 0.08, duration: 0.65 }, 1.65)
          .fromTo("[data-product-message='2']", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45 }, 1.72)
          .to("[data-product-fill]", { scaleX: 1, stagger: 0.025, duration: 0.55 }, 2.15)
          .to("[data-product-doc]", { rotate: 0, x: (i) => (i - 1) * 72, y: -8, scale: 0.9, stagger: 0.05, duration: 0.55 }, 2.45)
          .to("[data-product-message='2']", { opacity: 0, y: -12, duration: 0.3 }, 2.45)
          .fromTo("[data-product-final]", { opacity: 0, y: 24, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, 2.55)
          .fromTo("[data-process-organized]", { opacity: 0, scale: 0.6, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.55 }, 3.05);

        pinTimeline(organized.current, 115)
          .fromTo("[data-operation-item]", { opacity: 0.2, x: (i) => [-250, 210, -180, 250, 0][i], y: (i) => [-120, -90, 100, 125, 0][i], rotate: (i) => [-8, 7, -5, 9, 0][i] }, { opacity: 1, duration: 0.3, stagger: 0.06 })
          .to("[data-operation-item]", { x: 0, y: (i) => (i - 2) * 42, rotate: 0, duration: 0.75, stagger: 0.05 }, 0.35)
          .fromTo("[data-operation-copy]", { opacity: 0, x: 35 }, { opacity: 1, x: 0, duration: 0.45 }, 0.75);

        const costsTl = pinTimeline(costs.current, 145);
        metrics.forEach((_, index) => costsTl.fromTo(`[data-metric='${index}']`, { opacity: 0, y: 35, scale: 0.82 }, { opacity: 1, y: 0, scale: 1, duration: 0.4 }, index * 0.36));
        costsTl.fromTo("[data-cost-final]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45 }, 1.55);

        const controlTl = pinTimeline(control.current, 135);
        [0, 1, 2].forEach((index) => controlTl.fromTo(`[data-less='${index}']`, { opacity: 0, xPercent: index % 2 ? 45 : -45 }, { opacity: 1, xPercent: 0, duration: 0.4 }, index * 0.38));
        controlTl.to("[data-less]", { scale: 0.35, opacity: 0, x: 0, y: 0, stagger: 0.05, duration: 0.45 }, 1.15)
          .fromTo("[data-more]", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.55 }, 1.45)
          .fromTo("[data-more-copy]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4 }, 1.7);

        pinTimeline(how.current, 105)
          .fromTo("[data-how-progress]", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1.2 })
          .fromTo("[data-how-item]", { opacity: 0.25, y: 25 }, { opacity: 1, y: 0, stagger: 0.38, duration: 0.35 }, 0);

        pinTimeline(team.current, 95)
          .fromTo("[data-team-task]", { opacity: 0, scale: 0.75, x: (i) => (i % 2 ? 120 : -120) }, { opacity: 1, scale: 1, x: 0, stagger: 0.08, duration: 0.45 })
          .to("[data-team-task]", { opacity: 0.12, scale: 0.55, y: -20, stagger: 0.04, duration: 0.4 }, 0.65)
          .fromTo("[data-team-final]", { opacity: 0, scale: 0.75 }, { opacity: 1, scale: 1, duration: 0.5 }, 0.8);

        pinTimeline(audience.current, 75)
          .fromTo("[data-audience-item]", { opacity: 0, y: 35, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, stagger: 0.12, duration: 0.4 });
      }, root);
      refresh = window.setTimeout(() => ScrollTrigger.refresh(), 100);
    };

    const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const idleId = idleWindow.requestIdleCallback ? idleWindow.requestIdleCallback(() => void prepareStory(), { timeout: 350 }) : window.setTimeout(() => void prepareStory(), 0);
    return () => {
      cancelled = true;
      if (idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(idleId); else window.clearTimeout(idleId);
      if (refresh !== undefined) window.clearTimeout(refresh);
      context?.revert();
    };
  }, []);

  return (
    <div ref={root} className="scrolly-root bg-background text-foreground">
      <PinnedScene sceneRef={intro}>
        <div data-intro-lines className="absolute inset-0 scale-75 opacity-0"><ConnectionField /></div>
        <div data-hero-copy className="relative z-10 flex max-w-5xl flex-col items-center px-5 text-center">
          <img src={LOGO_URL} alt="Tukana AI" className="mb-7 h-16 w-auto md:h-24" />
          <p className="mb-4 text-xs font-semibold uppercase text-primary">TUKANA AI</p>
          <h1 data-hero-cnpj className="text-4xl font-bold leading-tight md:text-7xl lg:text-8xl">Tudo começa com um CNPJ.</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-xl">Você fornece um CNPJ. A Tukana encontra a empresa e seus sócios, prepara a documentação e organiza o processo de M&amp;A para você.</p>
          <a href="#como-funciona" className="mt-7"><Button size="lg" className="group rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90">Conhecer a Tukana <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></a>
        </div>
        <div data-scroll-cue className="absolute bottom-5 flex flex-col items-center gap-1 text-xs text-muted-foreground" aria-hidden="true"><span className="h-6 w-px bg-gradient-rainbow" /><ArrowDown className="h-4 w-4" /></div>
      </PinnedScene>

      <PinnedScene sceneRef={product} id="como-funciona" className="bg-card/20">
        <ConnectionField className="opacity-55" />
        <div className="absolute inset-x-5 top-24 z-30 text-center md:top-20"><h2 className="text-2xl font-bold md:text-5xl">Você fornece um CNPJ. A Tukana faz o resto.</h2></div>
        <div className="absolute left-1/2 top-[46%] h-[56vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2">
          <div data-product-cnpj className="absolute left-1/2 top-1/2 z-20 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent/50 bg-background shadow-glow md:h-36 md:w-36"><span className="text-xl font-bold text-accent md:text-2xl">CNPJ</span></div>
          <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">{productNodes.map((node) => <span key={node} data-product-node className="absolute left-1/2 top-1/2 min-w-28 -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card/95 px-3 py-2 text-center text-[9px] font-semibold shadow-md md:min-w-36 md:text-xs">{node}</span>)}</div>
          <div data-info-core className="absolute left-1/2 top-1/2 z-20 max-w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/50 bg-background px-5 py-4 text-center text-xs font-bold text-primary shadow-glow md:max-w-none md:text-base">INFORMAÇÕES ENCONTRADAS PELA IA</div>
          {[0, 1, 2].map((index) => <DocumentSheet key={index} index={index} compact />)}
        </div>
        <div className="pointer-events-none absolute inset-x-4 bottom-7 z-30 mx-auto max-w-4xl text-center md:bottom-10">
          <p data-product-message="0" className="absolute inset-x-0 bottom-16 text-sm font-semibold text-primary opacity-0 md:text-lg">A IA encontra a empresa e seus sócios.</p>
          <p data-product-message="1" className="absolute inset-x-0 bottom-16 text-sm font-semibold text-primary opacity-0 md:text-lg">A Tukana já possui uma base de documentos para operações de M&amp;A.</p>
          <p data-product-message="2" className="absolute inset-x-0 bottom-16 text-xs font-semibold text-primary opacity-0 md:text-lg">A partir das informações encontradas pela IA, a Tukana preenche os documentos com os dados da empresa e dos sócios.</p>
          <h3 data-product-final className="text-2xl font-bold text-accent opacity-0 md:text-4xl">Você recebe a documentação pronta para revisar.</h3>
          <p data-process-organized className="mt-3 text-sm font-semibold opacity-0 md:text-xl">E o processo fica organizado.</p>
        </div>
      </PinnedScene>

      <PinnedScene sceneRef={organized} id="beneficios">
        <div className="absolute inset-x-5 top-14 z-20 text-center md:top-20"><h2 className="text-3xl font-bold md:text-5xl">E a operação continua organizada.</h2></div>
        <div className="relative h-80 w-full max-w-4xl">{operationalItems.map((item) => <span key={item} data-operation-item className="absolute left-1/2 top-1/2 min-w-40 -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card/95 px-5 py-3 text-center text-sm shadow-md">{item}</span>)}</div>
        <p data-operation-copy className="absolute inset-x-5 bottom-12 text-center text-lg font-semibold text-accent opacity-0 md:text-3xl">Tudo centralizado e rastreável em um único ambiente.</p>
      </PinnedScene>

      <PinnedScene sceneRef={costs} className="bg-card/20">
        <h2 className="absolute inset-x-5 top-14 text-center text-2xl font-bold md:top-20 md:text-4xl">Quanto sua equipe perde fazendo isso manualmente?</h2>
        <div className="grid w-full max-w-6xl grid-cols-2 gap-3 px-4 md:gap-5 md:px-8">{metrics.map(([value, label], index) => <div key={value} data-metric={index} className="flex min-h-36 flex-col justify-center border-l border-border px-4 opacity-0 md:min-h-44 md:px-7"><p className="text-4xl font-bold text-accent md:text-7xl">{value}</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground md:text-base">{label}</p></div>)}</div>
        <p data-cost-final className="absolute bottom-10 text-lg font-semibold opacity-0 md:text-3xl">E isso antes do retrabalho.</p>
      </PinnedScene>

      <PinnedScene sceneRef={control}>
        <div className="relative flex h-80 w-full max-w-5xl items-center justify-center">{["Menos procura.", "Menos preenchimento.", "Menos retrabalho."].map((text, index) => <p key={text} data-less={index} className={`absolute text-3xl font-bold md:text-6xl ${index === 0 ? "left-[5%] top-[10%]" : index === 1 ? "right-[4%] top-[42%]" : "bottom-[4%] left-[15%]"}`}>{text}</p>)}<h2 data-more className="absolute max-w-4xl px-5 text-center text-4xl font-bold text-accent opacity-0 md:text-7xl">Mais controle sobre a operação.</h2></div>
        <p data-more-copy className="absolute inset-x-5 bottom-12 mx-auto max-w-3xl text-center text-sm text-muted-foreground opacity-0 md:text-lg">Documentos, processos, prazos e assinaturas centralizados e rastreáveis em um único ambiente.</p>
      </PinnedScene>

      <PinnedScene sceneRef={how} id="passos" className="bg-card/20">
        <h2 className="absolute inset-x-5 top-14 text-center text-3xl font-bold md:top-20 md:text-5xl">Do CNPJ ao processo de M&amp;A.</h2>
        <div className="absolute left-1/2 top-[42%] h-px w-[76%] -translate-x-1/2 bg-border"><span data-how-progress className="block h-full origin-left bg-gradient-rainbow" /></div>
        <div className="grid w-full max-w-6xl grid-cols-1 gap-5 px-5 md:grid-cols-3 md:gap-8">{workflow.map(([title, text]) => <div key={title} data-how-item className="text-center"><p className="text-sm font-bold text-accent md:text-lg">{title}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground md:mt-4 md:text-lg">{text}</p></div>)}</div>
      </PinnedScene>

      <PinnedScene sceneRef={team}>
        <h2 className="absolute inset-x-5 top-14 text-center text-3xl font-bold md:top-20 md:text-5xl">Pare de gastar tempo com trabalho manual.</h2>
        <div className="relative h-72 w-full max-w-4xl">{teamTasks.map((task, index) => <span key={task} data-team-task className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card px-4 py-3 text-sm shadow-md ${index % 2 ? "text-primary" : "text-accent"}`}>{task}</span>)}</div>
        <p data-team-final className="absolute inset-x-5 bottom-12 mx-auto max-w-4xl text-center text-3xl font-bold opacity-0 md:text-5xl">Sua equipe ganha tempo para se concentrar na operação.</p>
      </PinnedScene>

      <PinnedScene sceneRef={audience} id="para-quem" className="bg-card/20">
        <div className="container mx-auto px-5"><h2 className="mx-auto mb-10 max-w-4xl text-center text-3xl font-bold md:text-5xl">Para quem conduz operações complexas.</h2><div className="relative mx-auto grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">{["M&A", "Jurídico", "Financeiro", "Operações"].map((item) => <div key={item} data-audience-item className="flex min-h-28 items-center justify-center bg-card p-5 text-center text-lg font-semibold md:min-h-40 md:text-xl">{item}</div>)}</div></div>
      </PinnedScene>

      <DeferredPlans />

      <section className="relative flex min-h-[85svh] items-center justify-center overflow-hidden border-t border-border/50 px-5 py-24 text-center"><ConnectionField className="opacity-25" /><div className="relative z-10 max-w-5xl"><h2 className="text-4xl font-bold leading-tight md:text-7xl">Sua operação já é complexa. A documentação não precisa ser.</h2><img src={LOGO_URL} alt="Tukana AI" className="mx-auto my-9 h-20 w-auto" /><p className="mb-4 text-xl font-semibold text-accent md:text-3xl">TUKANA AI</p><p className="mb-9 text-lg text-muted-foreground md:text-2xl">Menos trabalho manual. Mais tempo para a operação.</p><Suspense fallback={<Button size="lg" disabled className="rounded-full px-8">Solicitar demonstração</Button>}><ContactFormDialog trigger={<Button size="lg" className="group rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90">Solicitar demonstração <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button>} /></Suspense></div></section>
    </div>
  );
};

export default ScrollyLanding;