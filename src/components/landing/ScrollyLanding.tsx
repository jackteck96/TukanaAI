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
    <section ref={container} id="planos" className={ready ? undefined : "min-h-[36rem]"} aria-label={ready ? undefined : "Planos"}>
      {ready && <Suspense fallback={<div className="min-h-[36rem]" />}><PlansSection /></Suspense>}
    </section>
  );
};

const productNodes = ["EMPRESA", "SÓCIOS", "QUALIFICAÇÕES"];
const metrics = [
  ["4–6", "sistemas diferentes para encontrar e organizar informações"],
  ["11h", "por semana procurando arquivos"],
  ["30%", "dos contratos com versões desatualizadas"],
  ["1 em 5", "prazos descobertos na última hora"],
];
const workflow = [
  ["01 — IDENTIFICA", "A IA encontra a empresa, os sócios e suas qualificações."],
  ["02 — PREENCHE", "A documentação-base da Tukana é preenchida com essas informações."],
  ["03 — ORGANIZA", "Documentos, etapas, prazos e assinaturas ficam centralizados e rastreáveis."],
];

const ConnectionField = ({ id, className = "" }: { id: string; className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 1000 600" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="hsl(var(--brand-blue))" />
        <stop offset="0.45" stopColor="hsl(var(--primary))" />
        <stop offset="0.72" stopColor="hsl(var(--accent))" />
        <stop offset="1" stopColor="hsl(var(--brand-orange))" />
      </linearGradient>
    </defs>
    <path data-story-line d="M500 300 C330 280 280 140 130 145" fill="none" stroke={`url(#${id})`} strokeWidth="1.5" />
    <path data-story-line d="M500 300 C680 285 720 145 875 145" fill="none" stroke={`url(#${id})`} strokeWidth="1.5" />
    <path data-story-line d="M500 300 C340 330 290 470 145 475" fill="none" stroke={`url(#${id})`} strokeWidth="1.5" />
    <path data-story-line d="M500 300 C665 340 720 465 860 470" fill="none" stroke={`url(#${id})`} strokeWidth="1.5" />
    <circle cx="500" cy="300" r="115" fill="none" stroke="hsl(var(--border))" strokeOpacity="0.45" />
    <circle cx="500" cy="300" r="190" fill="none" stroke="hsl(var(--border))" strokeOpacity="0.22" />
  </svg>
);

const DocumentSheet = ({ index }: { index: number }) => (
  <div data-demo-doc className="absolute left-1/2 top-1/2 h-40 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-border bg-card p-3 shadow-lg md:h-52 md:w-36">
    <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
      <FileText className="h-4 w-4 text-accent" />
      <span className="text-[8px] font-semibold text-muted-foreground">DOC {index + 1}</span>
    </div>
    <div className="space-y-3">{[0, 1, 2, 3].map((line) => <div key={line} className="h-1.5 overflow-hidden rounded-full bg-secondary"><span data-demo-fill className="block h-full origin-left scale-x-0 rounded-full bg-primary" /></div>)}</div>
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
  const product = useRef<HTMLElement>(null);
  const demo = useRef<HTMLElement>(null);
  const costs = useRef<HTMLElement>(null);
  const control = useRef<HTMLElement>(null);

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
          scrollTrigger: element ? { trigger: element, start: "top top", end: `+=${distance}%`, pin: true, scrub: 0.35, anticipatePin: 1, invalidateOnRefresh: true } : undefined,
        });

        const productTl = pinTimeline(product.current, 55);
        productTl
          .to("[data-scroll-cue]", { opacity: 0, y: 12, duration: 0.12 }, 0)
          .to("[data-product-copy]", { y: -28, opacity: 0.18, duration: 0.28 }, 0)
          .to("[data-product-core]", { scale: 1.12, y: -38, duration: 0.2 }, 0)
          .fromTo("[data-product-flow]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.18 }, 0.12)
          .fromTo("[data-product-rail]", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 0.5 }, 0.12)
          .to("[data-product-core]", { x: -165, scale: 0.72, duration: 0.35 }, 0.26);

        const demoTl = pinTimeline(demo.current, 105);
        demoTl
          .fromTo("[data-demo-cnpj]", { scale: 1.2 }, { scale: 0.72, x: -205, y: -88, duration: 0.3 })
          .fromTo("[data-story-line]", { strokeDasharray: 900, strokeDashoffset: 900, opacity: 0 }, { strokeDashoffset: 0, opacity: 0.65, stagger: 0.025, duration: 0.38 }, 0)
          .fromTo("[data-demo-node]", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, x: (i) => [-135, 0, 135][i], y: -35, stagger: 0.06, duration: 0.22 }, 0.12)
          .fromTo("[data-demo-info]", { opacity: 0, scale: 0.55, y: 35 }, { opacity: 1, scale: 1, y: 20, duration: 0.25 }, 0.3)
          .fromTo("[data-demo-doc]", { opacity: 0, scale: 0.35, rotate: (i) => (i - 1) * 12 }, { opacity: 1, scale: 0.82, rotate: (i) => (i - 1) * 5, x: (i) => (i - 1) * 105, y: 72, stagger: 0.04, duration: 0.3 }, 0.48)
          .to("[data-demo-fill]", { scaleX: 1, stagger: 0.012, duration: 0.28 }, 0.62)
          .to("[data-demo-node], [data-demo-info], [data-demo-cnpj]", { opacity: 0.12, scale: 0.55, duration: 0.2 }, 0.75)
          .to("[data-demo-doc]", { rotate: 0, x: (i) => (i - 1) * 72, y: 12, scale: 0.92, duration: 0.26 }, 0.76)
          .fromTo("[data-demo-final]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.25 }, 0.82);

        const costsTl = pinTimeline(costs.current, 50);
        metrics.forEach((_, index) => costsTl.fromTo(`[data-metric='${index}']`, { opacity: 0, y: 24, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.2 }, index * 0.13));
        costsTl.fromTo("[data-cost-final]", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.2 }, 0.56);

        const controlTl = pinTimeline(control.current, 50);
        [0, 1, 2].forEach((index) => controlTl.fromTo(`[data-less='${index}']`, { opacity: 0, xPercent: index % 2 ? 30 : -30 }, { opacity: 1, xPercent: 0, duration: 0.18 }, index * 0.12));
        controlTl
          .to("[data-less]", { scale: 0.35, opacity: 0, x: 0, y: 0, stagger: 0.025, duration: 0.2 }, 0.4)
          .fromTo("[data-more]", { opacity: 0, scale: 0.68 }, { opacity: 1, scale: 1, duration: 0.24 }, 0.5)
          .fromTo("[data-more-copy]", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.18 }, 0.62);
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
      <PinnedScene sceneRef={product}>
        <ConnectionField id="line-product-intro" className="opacity-35" />
        <div data-product-copy className="relative z-20 flex max-w-5xl flex-col items-center px-5 text-center">
          <img src={LOGO_URL} alt="Tukana AI" className="mb-5 h-14 w-auto md:h-20" />
          <p className="mb-3 text-xs font-semibold uppercase text-primary">TUKANA AI</p>
          <h1 className="text-4xl font-bold leading-tight md:text-7xl">Tudo começa com um CNPJ.</h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-xl">Você fornece um CNPJ. A Tukana encontra a empresa e seus sócios, prepara a documentação e organiza o processo de M&amp;A para você.</p>
          <a href="#como-funciona" className="mt-6"><Button size="lg" className="group rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90">Conhecer a Tukana <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></a>
        </div>
        <div className="pointer-events-none absolute inset-x-4 bottom-20 z-30 mx-auto max-w-5xl">
          <div data-product-rail className="absolute left-[8%] right-[8%] top-1/2 h-px origin-left bg-rainbow" />
          <div className="relative grid grid-cols-5 gap-1 text-center">{["CNPJ", "EMPRESA + SÓCIOS", "DADOS", "DOCUMENTAÇÃO", "PROCESSO ORGANIZADO"].map((item, index) => <span key={item} data-product-flow className={`flex min-h-10 items-center justify-center text-[8px] font-bold md:text-xs ${index === 0 ? "text-accent" : "text-foreground"}`}>{item}</span>)}</div>
        </div>
        <div data-product-core className="pointer-events-none absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full border border-accent/50 bg-background px-5 py-3 text-sm font-bold text-accent opacity-0 md:opacity-100">CNPJ</div>
        <div data-scroll-cue className="absolute bottom-4 flex flex-col items-center gap-1 text-xs text-muted-foreground" aria-hidden="true"><ArrowDown className="h-4 w-4" /></div>
      </PinnedScene>

      <PinnedScene sceneRef={demo} id="como-funciona" className="bg-card/20">
        <ConnectionField id="line-demo" className="opacity-45" />
        <div className="absolute inset-x-5 top-12 z-30 text-center md:top-16"><h2 className="text-2xl font-bold md:text-5xl">Você fornece um CNPJ. A Tukana faz o resto.</h2></div>
        <div className="absolute left-1/2 top-[46%] h-[58vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2">
          <div data-demo-cnpj className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent/50 bg-background shadow-glow md:h-32 md:w-32"><span className="text-lg font-bold text-accent md:text-2xl">CNPJ</span></div>
          <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">{productNodes.map((node) => <span key={node} data-demo-node className="absolute left-1/2 top-1/2 min-w-24 -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card/95 px-2 py-2 text-center text-[8px] font-semibold shadow-md md:min-w-36 md:text-xs">{node}</span>)}</div>
          <div data-demo-info className="absolute left-1/2 top-1/2 z-20 max-w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/50 bg-background px-4 py-3 text-center text-[9px] font-bold text-primary shadow-glow md:max-w-none md:text-sm">INFORMAÇÕES ENCONTRADAS PELA IA</div>
          {[0, 1, 2].map((index) => <DocumentSheet key={index} index={index} />)}
        </div>
        <div data-demo-final className="pointer-events-none absolute inset-x-4 bottom-7 z-30 mx-auto max-w-4xl text-center opacity-0 md:bottom-10">
          <h3 className="text-2xl font-bold text-accent md:text-4xl">Você recebe a documentação pronta para revisar.</h3>
          <p className="mt-2 text-sm text-muted-foreground md:text-lg">Documentos preenchidos e processo organizado.</p>
        </div>
      </PinnedScene>

      <PinnedScene sceneRef={costs} className="bg-card/20">
        <h2 className="absolute inset-x-5 top-12 text-center text-2xl font-bold md:top-16 md:text-4xl">Quanto sua equipe perde fazendo isso manualmente?</h2>
        <div className="grid w-full max-w-6xl grid-cols-2 gap-2 px-4 md:gap-5 md:px-8">{metrics.map(([value, label], index) => <div key={value} data-metric={index} className="flex min-h-32 flex-col justify-center border-l border-border px-3 opacity-0 md:min-h-44 md:px-7"><p className="text-4xl font-bold text-accent md:text-7xl">{value}</p><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground md:text-base">{label}</p></div>)}</div>
        <p data-cost-final className="absolute bottom-8 text-lg font-semibold opacity-0 md:text-3xl">E isso antes do retrabalho.</p>
      </PinnedScene>

      <PinnedScene sceneRef={control} id="beneficios">
        <div className="relative flex h-72 w-full max-w-5xl items-center justify-center">{["Menos procura.", "Menos preenchimento.", "Menos retrabalho."].map((text, index) => <p key={text} data-less={index} className={`absolute text-2xl font-bold md:text-5xl ${index === 0 ? "left-[5%] top-[8%]" : index === 1 ? "right-[4%] top-[42%]" : "bottom-[4%] left-[12%]"}`}>{text}</p>)}<h2 data-more className="absolute max-w-4xl px-5 text-center text-5xl font-bold uppercase text-accent opacity-0 md:text-8xl">Mais controle</h2></div>
        <p data-more-copy className="absolute inset-x-5 bottom-10 mx-auto max-w-3xl text-center text-sm text-muted-foreground opacity-0 md:text-lg">Documentos, processos, prazos e assinaturas centralizados e rastreáveis em um único ambiente.</p>
      </PinnedScene>

      <section id="passos" className="story-scene relative border-b border-border/50 px-5 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center"><p className="mb-3 text-xs font-bold uppercase text-primary">Como funciona</p><h2 className="text-3xl font-bold md:text-5xl">Do CNPJ ao processo de M&amp;A.</h2></div>
          <div className="relative grid gap-8 md:grid-cols-3 md:gap-10"><div className="absolute left-[12%] right-[12%] top-5 hidden h-px bg-rainbow md:block" />{workflow.map(([title, text]) => <div key={title} className="relative text-center"><span className="mx-auto mb-5 block h-10 w-10 rounded-full border border-accent bg-background" /><p className="text-sm font-bold text-accent md:text-lg">{title}</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{text}</p></div>)}</div>
          <div id="para-quem" className="mt-20 border-t border-border/60 pt-16 text-center"><h3 className="text-2xl font-bold md:text-4xl">Para quem conduz operações complexas.</h3><div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">{["M&A", "Jurídico", "Financeiro", "Operações"].map((item) => <div key={item} className="flex min-h-24 items-center justify-center bg-card p-4 text-base font-semibold md:min-h-32 md:text-xl">{item}</div>)}</div></div>
        </div>
      </section>

      <section className="story-scene border-b border-border/50">
        <DeferredPlans />
        <div className="relative flex min-h-[78svh] items-center justify-center overflow-hidden border-t border-border/50 px-5 py-24 text-center"><ConnectionField id="line-footer" className="opacity-20" /><div className="relative z-10 max-w-5xl"><h2 className="text-4xl font-bold leading-tight md:text-7xl">Sua operação já é complexa. A documentação não precisa ser.</h2><img src={LOGO_URL} alt="Tukana AI" className="mx-auto my-8 h-16 w-auto md:h-20" /><p className="mb-8 text-lg text-muted-foreground md:text-2xl">Menos trabalho manual. Mais tempo para a operação.</p><Suspense fallback={<Button size="lg" disabled className="rounded-full px-8">Solicitar demonstração</Button>}><ContactFormDialog trigger={<Button size="lg" className="group rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90">Solicitar demonstração <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button>} /></Suspense></div></div>
      </section>
    </div>
  );
};

export default ScrollyLanding;
