import { useLayoutEffect, useRef } from "react";
import { ArrowDown, ArrowRight, Check, FileText } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { ContactFormDialog } from "@/components/shared/ContactFormDialog";
import PlansSection from "@/components/billing/PlansSection";
import { LOGO_URL } from "@/lib/assets";

gsap.registerPlugin(ScrollTrigger);

const dataNodes = [
  { label: "EMPRESA", className: "left-[7%] top-[25%] md:left-[16%]" },
  { label: "SÓCIOS", className: "right-[7%] top-[24%] md:right-[16%]" },
  { label: "QUALIFICAÇÕES", className: "left-[4%] bottom-[25%] md:left-[20%]" },
  { label: "INFORMAÇÕES", className: "right-[4%] bottom-[24%] md:right-[20%]" },
];

const documents = ["Contrato", "Instrumento", "Declaração", "Anexo"];
const complexityItems = ["Documentos.", "Dados societários.", "Contratos.", "Certidões.", "Prazos.", "Assinaturas.", "Etapas."];
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
      <linearGradient id="story-line" x1="0" y1="0" x2="1" y2="1">
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

const DocumentSheet = ({ index }: { index: number }) => (
  <div
    data-document
    className="absolute left-1/2 top-1/2 h-56 w-40 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-border bg-card p-4 shadow-lg md:h-72 md:w-52"
  >
    <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
      <FileText className="h-5 w-5 text-accent" />
      <span className="text-[9px] font-semibold text-muted-foreground">{documents[index]}</span>
    </div>
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((line) => (
        <div key={line} className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <span data-fill className="block h-full origin-left scale-x-0 rounded-full bg-primary" />
        </div>
      ))}
    </div>
    <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 border-t border-border pt-3">
      <span className="h-2 w-2 rounded-full bg-accent" />
      <span className="text-[8px] uppercase text-muted-foreground">Pronto para revisão</span>
    </div>
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
  const intelligence = useRef<HTMLElement>(null);
  const documentation = useRef<HTMLElement>(null);
  const ready = useRef<HTMLElement>(null);
  const complexity = useRef<HTMLElement>(null);
  const costs = useRef<HTMLElement>(null);
  const transformation = useRef<HTMLElement>(null);
  const control = useRef<HTMLElement>(null);
  const how = useRef<HTMLElement>(null);
  const team = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!root.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const context = gsap.context(() => {
      const pinTimeline = (element: HTMLElement | null, distance: number) => {
        if (!element) return gsap.timeline();
        return gsap.timeline({
          scrollTrigger: {
            trigger: element,
            start: "top top",
            end: `+=${distance}%`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      };

      pinTimeline(intro.current, 150)
        .to("[data-intro-logo]", { scale: 0.72, yPercent: -170, opacity: 0.55 }, 0)
        .to("[data-intro-title]", { scale: 0.72, yPercent: -48 }, 0)
        .to("[data-intro-cnpj]", { scale: 1.7, yPercent: 42 }, 0)
        .to("[data-intro-lines]", { opacity: 1, scale: 1 }, 0.15)
        .to("[data-scroll-cue]", { opacity: 0, y: 20 }, 0);

      const intelligenceTl = pinTimeline(intelligence.current, 300);
      intelligenceTl
        .fromTo("[data-intel-cnpj]", { scale: 1.85 }, { scale: 0.78, yPercent: -5, duration: 1.2 })
        .fromTo("[data-cnpj-char]", { x: 0 }, { x: (i) => (i - 8) * 2.2, duration: 0.7 }, 0.15)
        .fromTo("[data-line]", { strokeDasharray: 900, strokeDashoffset: 900, opacity: 0 }, { strokeDashoffset: 0, opacity: 0.75, stagger: 0.12, duration: 1.5 }, 0.25)
        .fromTo("[data-node]", { scale: 0.2, opacity: 0, x: 0, y: 0 }, { scale: 1, opacity: 1, stagger: 0.35, duration: 0.7 }, 0.45)
        .fromTo("[data-intel-copy]", { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.25, duration: 0.8 }, 1.25)
        .to("[data-node-depth='back']", { yPercent: -12, xPercent: -8, duration: 1 }, 1.25)
        .to("[data-node-depth='front']", { yPercent: 14, xPercent: 8, scale: 1.08, duration: 1 }, 1.25);

      const docsTl = pinTimeline(documentation.current, 300);
      docsTl
        .fromTo("[data-data-chip]", { opacity: 0, x: (i) => (i % 2 ? 260 : -260), y: (i) => (i - 2) * 50 }, { opacity: 1, x: 0, y: 0, stagger: 0.1, duration: 0.9 })
        .fromTo("[data-document]", { opacity: 0, scale: 0.35, rotate: (i) => (i - 1.5) * 18 }, { opacity: 1, scale: 0.82, rotate: (i) => (i - 1.5) * 5, x: (i) => (i - 1.5) * 150, stagger: 0.12, duration: 1.1 }, 0.5)
        .to("[data-data-chip]", { scale: 0.3, x: (i) => (i - 2) * 38, y: 20, opacity: 0, stagger: 0.08, duration: 0.8 }, 1.05)
        .to("[data-fill]", { scaleX: 1, stagger: 0.035, duration: 0.8 }, 1.2)
        .to("[data-document]", { scale: 0.7, x: (i) => (i - 1.5) * 100, y: (i) => Math.abs(i - 1.5) * 24, rotate: 0, stagger: 0.08, duration: 0.8 }, 1.8)
        .fromTo("[data-doc-copy]", { opacity: 0, y: 36 }, { opacity: 1, y: 0, stagger: 0.18, duration: 0.7 }, 0.25)
        .fromTo("[data-doc-final]", { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7 }, 2.2);

      pinTimeline(ready.current, 120)
        .fromTo("[data-ready-doc]", { x: (i) => (i - 1) * 210, rotate: (i) => (i - 1) * 10, scale: 0.75 }, { x: (i) => (i - 1) * 72, rotate: 0, scale: 0.9, stagger: 0.08 })
        .fromTo("[data-ready-copy]", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 }, 0.35);

      const complexityTl = pinTimeline(complexity.current, 230);
      complexityTl
        .fromTo("[data-complexity]", { opacity: 0.25, x: (i) => [-290, 280, -210, 310, -320, 250, -130][i], y: (i) => [-150, -190, 50, 105, 185, 190, -5][i], rotate: (i) => [-9, 8, -5, 10, -7, 6, -3][i] }, { opacity: 1, duration: 0.5, stagger: 0.06 })
        .to("[data-complexity]", { x: 0, y: (i) => (i - 3) * 43, rotate: 0, stagger: 0.05, duration: 1.4 }, 0.65)
        .fromTo("[data-central-line]", { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0.9)
        .fromTo("[data-complexity-final]", { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.8 }, 1.55);

      const costsTl = pinTimeline(costs.current, 320);
      metrics.forEach((_, index) => {
        costsTl.fromTo(`[data-metric='${index}']`, { opacity: 0, scale: 0.55, yPercent: 45 }, { opacity: 1, scale: 1, yPercent: 0, duration: 0.75 });
        if (index < metrics.length - 1) costsTl.to(`[data-metric='${index}']`, { opacity: 0, scale: 1.45, yPercent: -45, duration: 0.65 });
      });
      costsTl.fromTo("[data-cost-final]", { opacity: 0 }, { opacity: 1, duration: 0.5 });

      const transformTl = pinTimeline(transformation.current, 350);
      transformTl
        .fromTo("[data-transform-object]", { x: (i) => [-310, 270, -180, 320, 110][i], y: (i) => [-150, -110, 175, 150, 30][i], rotate: (i) => [-12, 9, 7, -10, 4][i] }, { opacity: 1, duration: 0.5, stagger: 0.07 })
        .to("[data-transform-object]", { x: 0, y: (i) => (i - 2) * 50, rotate: 0, scale: 0.88, duration: 1.1, stagger: 0.05 }, 0.5)
        .to("[data-transform-object]", { x: -210, scale: 0.55, opacity: 0.45, duration: 0.8 }, 1.45)
        .fromTo("[data-transform-doc]", { opacity: 0, x: -80, scale: 0.5 }, { opacity: 1, x: 0, scale: 1, stagger: 0.12, duration: 0.8 }, 1.55)
        .to("[data-transform-doc]", { x: 190, scale: 0.65, stagger: 0.08, duration: 0.8 }, 2.35)
        .fromTo("[data-transform-step]", { opacity: 0, y: 28 }, { opacity: 1, y: 0, stagger: 0.5, duration: 0.6 }, 0.3)
        .fromTo("[data-controlled]", { opacity: 0, scale: 0.65 }, { opacity: 1, scale: 1, duration: 0.8 }, 3.0);

      const controlTl = pinTimeline(control.current, 220);
      [0, 1, 2].forEach((index) => {
        controlTl.fromTo(`[data-less='${index}']`, { opacity: 0, xPercent: index % 2 ? 55 : -55, scale: 0.75 }, { opacity: 1, xPercent: 0, scale: 1, duration: 0.65 });
      });
      controlTl
        .to("[data-less]", { x: 0, y: 0, scale: 0.45, opacity: 0, stagger: 0.08, duration: 0.7 })
        .fromTo("[data-more]", { opacity: 0, scale: 0.55 }, { opacity: 1, scale: 1, duration: 0.9 })
        .fromTo("[data-more-copy]", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6 });

      const howTl = pinTimeline(how.current, 250);
      howTl.fromTo("[data-how-track]", { xPercent: 33 }, { xPercent: -33, ease: "none", duration: 2.6 });
      howTl.fromTo("[data-how-progress]", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 2.6 }, 0);
      howTl.fromTo("[data-how-item]", { opacity: 0.3, scale: 0.78 }, { opacity: 1, scale: 1, stagger: 0.85, duration: 0.5 }, 0);

      pinTimeline(team.current, 220)
        .fromTo("[data-team-task]", { opacity: 0, scale: 0.7, x: (i) => (i % 2 ? 190 : -190), y: (i) => (i - 2) * 48 }, { opacity: 1, scale: 1, x: 0, y: 0, stagger: 0.14, duration: 0.75 })
        .to("[data-team-task]", { opacity: 0.15, scale: 0.55, x: (i) => (i % 2 ? 280 : -280), stagger: 0.08, duration: 0.9 }, 1.15)
        .fromTo("[data-team-final]", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.9 }, 1.55);
    }, root);

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      window.clearTimeout(refresh);
      context.revert();
    };
  }, []);

  return (
    <div ref={root} className="scrolly-root bg-background text-foreground">
      <PinnedScene sceneRef={intro}>
        <div data-intro-lines className="absolute inset-0 scale-75 opacity-0"><ConnectionField /></div>
        <div className="relative z-10 flex flex-col items-center px-5 text-center">
          <img data-intro-logo src={LOGO_URL} alt="Tukana AI" className="mb-10 h-20 w-auto md:h-28" />
          <p data-intro-title className="mb-5 text-xs font-semibold uppercase text-primary">TUKANA AI</p>
          <h1 data-intro-cnpj className="max-w-5xl text-4xl font-bold leading-tight md:text-7xl lg:text-8xl">Tudo começa com um CNPJ.</h1>
        </div>
        <div data-scroll-cue className="absolute bottom-8 flex flex-col items-center gap-2 text-xs text-muted-foreground" aria-hidden="true">
          <span className="h-8 w-px bg-gradient-rainbow" /><ArrowDown className="h-4 w-4" />
        </div>
      </PinnedScene>

      <PinnedScene sceneRef={intelligence} className="bg-card/20">
        <ConnectionField className="opacity-70" />
        <div className="absolute inset-x-5 top-20 z-20 mx-auto max-w-3xl text-center md:top-24">
          <h2 data-intel-copy className="text-2xl font-bold md:text-4xl">Você fornece apenas um CNPJ.</h2>
          <p data-intel-copy className="mt-3 text-base text-accent md:text-xl">A IA encontra a empresa e seus sócios.</p>
        </div>
        <div data-intel-cnpj className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-accent/50 bg-background shadow-glow md:h-44 md:w-44">
          <span className="text-xl font-bold text-accent md:text-3xl">{"CNPJ".split("").map((char, i) => <span data-cnpj-char key={i} className="inline-block">{char}</span>)}</span>
        </div>
        {dataNodes.map((node, index) => (
          <div key={node.label} data-node data-node-depth={index < 2 ? "back" : "front"} className={`absolute z-10 min-w-28 rounded-md border border-border bg-card/90 px-4 py-3 text-center text-[10px] font-semibold shadow-md md:min-w-40 md:text-xs ${node.className}`}>{node.label}</div>
        ))}
        <div className="absolute inset-x-5 bottom-8 z-20 mx-auto max-w-3xl text-center md:bottom-14">
          <p data-intel-copy className="text-sm leading-relaxed text-muted-foreground md:text-base">A Tukana identifica a qualificação da empresa e dos sócios e reúne as informações necessárias para a operação.</p>
          <p data-intel-copy className="mt-3 text-xs font-medium text-foreground md:text-sm">Sem pesquisa manual. Sem perder horas levantando informações.</p>
        </div>
      </PinnedScene>

      <PinnedScene sceneRef={documentation} id="como-funciona">
        <div className="absolute inset-x-5 top-16 z-30 text-center md:top-20">
          <p data-doc-copy className="text-sm text-primary md:text-base">Você não precisa preencher documento por documento.</p>
          <h2 data-doc-copy className="mt-2 text-3xl font-bold md:text-5xl">A Tukana cuida da documentação completa.</h2>
          <p data-doc-copy className="mx-auto mt-3 max-w-3xl text-xs text-muted-foreground md:text-base">A Tukana já possui uma base de documentos para operações de M&amp;A.</p>
          <p data-doc-copy className="mx-auto mt-2 max-w-3xl text-xs text-muted-foreground md:text-base">A partir das informações encontradas pela IA, a Tukana preenche os documentos com os dados da empresa e dos sócios.</p>
        </div>
        <div className="absolute left-1/2 top-[58%] h-[46vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2">
          {["CNPJ", "EMPRESA", "SÓCIOS", "DADOS", "QUALIFICAÇÕES"].map((item, i) => <span key={item} data-data-chip className="absolute left-1/2 top-1/2 z-20 rounded-full border border-primary/40 bg-background px-3 py-1 text-[9px] font-semibold text-primary md:text-xs" style={{ marginLeft: `${(i - 2) * 54}px`, marginTop: `${(i % 2 ? 1 : -1) * 34}px` }}>{item}</span>)}
          {[0, 1, 2, 3].map((i) => <DocumentSheet key={i} index={i} />)}
        </div>
        <p data-doc-final className="absolute inset-x-5 bottom-8 z-30 text-center text-lg font-semibold text-accent md:bottom-12 md:text-2xl">Você fornece o CNPJ. A Tukana cuida da documentação completa.</p>
      </PinnedScene>

      <PinnedScene sceneRef={ready}>
        <div className="absolute inset-0 bg-gradient-glow opacity-70" />
        <div className="relative h-80 w-full max-w-3xl">
          {[0, 1, 2].map((i) => <div key={i} data-ready-doc className="absolute left-1/2 top-1/2 h-64 w-44 -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card p-5 shadow-lg"><FileText className="mb-6 h-6 w-6 text-accent" />{[0,1,2,3,4].map(j => <div key={j} className="mb-3 h-1.5 rounded-full bg-primary/30" />)}<Check className="absolute bottom-5 right-5 h-5 w-5 text-primary" /></div>)}
        </div>
        <h2 data-ready-copy className="absolute inset-x-5 bottom-16 z-20 text-center text-3xl font-bold md:text-5xl">Você recebe a documentação pronta para revisar.</h2>
      </PinnedScene>

      <PinnedScene sceneRef={complexity}>
        <div className="absolute inset-x-5 top-16 z-20 text-center md:top-20"><h2 className="text-3xl font-bold md:text-5xl">Uma operação de M&amp;A exige precisão.</h2><p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">Quanto maior a operação, maior o trabalho para manter tudo sob controle.</p></div>
        <div data-central-line className="absolute left-1/2 top-[28%] h-[48%] w-px origin-top bg-gradient-rainbow" />
        <div className="relative h-80 w-full max-w-4xl">
          {complexityItems.map((item) => <span key={item} data-complexity className="absolute left-1/2 top-1/2 min-w-40 -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card/95 px-5 py-3 text-center text-sm shadow-md">{item}</span>)}
        </div>
        <h3 data-complexity-final className="absolute inset-x-5 bottom-12 text-center text-2xl font-bold text-accent md:text-4xl">A Tukana centraliza esse processo para você.</h3>
      </PinnedScene>

      <PinnedScene sceneRef={costs} className="bg-card/20">
        <h2 className="absolute inset-x-5 top-16 text-center text-2xl font-bold md:top-20 md:text-4xl">Quanto sua equipe perde fazendo isso manualmente?</h2>
        <div className="relative h-96 w-full">
          {metrics.map(([value, label], index) => <div key={value} data-metric={index} className="absolute inset-0 flex items-center justify-center px-5 text-center opacity-0"><div><p className="text-7xl font-bold text-accent md:text-9xl">{value}</p><p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-xl">{label}</p></div></div>)}
        </div>
        <p data-cost-final className="absolute bottom-12 text-xl font-semibold md:text-3xl">E isso antes do retrabalho.</p>
      </PinnedScene>

      <PinnedScene sceneRef={transformation} id="beneficios">
        <ConnectionField className="opacity-40" />
        <div className="absolute left-4 top-1/2 h-[54vh] w-1/3 -translate-y-1/2 md:left-12">
          {["Informação", "Dados", "Documentos", "Prazos", "Processos"].map((item) => <span key={item} data-transform-object className="absolute left-1/2 top-1/2 rounded-md border border-border bg-card px-3 py-2 text-[10px] md:px-5 md:text-sm">{item}</span>)}
        </div>
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-5 text-center">
          {["Entra informação.", "A IA encontra.", "Entram os dados.", "A Tukana prepara a documentação.", "Entram os documentos.", "A Tukana organiza."].map((text) => <p key={text} data-transform-step className="text-sm font-semibold md:text-xl">{text}</p>)}
        </div>
        <div className="absolute right-5 top-1/2 h-64 w-1/3 -translate-y-1/2 md:right-16">{[0,1,2].map(i => <div key={i} data-transform-doc className="absolute left-1/2 top-1/2 h-36 w-24 -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card p-3 shadow-md md:h-48 md:w-32"><FileText className="h-4 w-4 text-primary" /></div>)}</div>
        <div data-controlled className="absolute bottom-10 z-20 rounded-full border border-accent/50 bg-background px-7 py-4 text-xl font-bold text-accent shadow-glow md:text-3xl">Sai processo controlado.</div>
      </PinnedScene>

      <PinnedScene sceneRef={control}>
        <div className="relative flex h-80 w-full max-w-5xl items-center justify-center">
          {["Menos procura.", "Menos preenchimento.", "Menos retrabalho."].map((text, index) => <p key={text} data-less={index} className={`absolute text-3xl font-bold md:text-6xl ${index === 0 ? "left-[5%] top-[10%]" : index === 1 ? "right-[4%] top-[42%]" : "bottom-[4%] left-[15%]"}`}>{text}</p>)}
          <h2 data-more className="absolute max-w-4xl px-5 text-center text-4xl font-bold text-accent opacity-0 md:text-7xl">Mais controle sobre a operação.</h2>
        </div>
        <p data-more-copy className="absolute inset-x-5 bottom-12 mx-auto max-w-3xl text-center text-sm text-muted-foreground opacity-0 md:text-lg">Documentos, processos, prazos e assinaturas centralizados e rastreáveis em um único ambiente.</p>
      </PinnedScene>

      <PinnedScene sceneRef={how} id="passos" className="bg-card/20">
        <h2 className="absolute inset-x-5 top-16 text-center text-3xl font-bold md:text-5xl">Do CNPJ ao processo de M&amp;A.</h2>
        <div className="absolute left-1/2 top-1/2 h-px w-[70%] -translate-x-1/2 bg-border"><span data-how-progress className="block h-full origin-left bg-gradient-rainbow" /></div>
        <div data-how-track className="flex w-[300%] items-center justify-around md:w-[170%]">
          {workflow.map(([title, text]) => <div key={title} data-how-item className="w-[80vw] max-w-lg px-5 text-center md:w-[28vw]"><p className="text-sm font-bold text-accent md:text-lg">{title}</p><p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-xl">{text}</p></div>)}
        </div>
      </PinnedScene>

      <PinnedScene sceneRef={team}>
        <h2 className="absolute inset-x-5 top-16 text-center text-3xl font-bold md:text-5xl">Pare de gastar tempo com trabalho manual.</h2>
        <div className="relative h-80 w-full max-w-4xl">{teamTasks.map((task, i) => <span key={task} data-team-task className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card px-4 py-3 text-sm shadow-md md:text-base ${i % 2 ? "text-primary" : "text-accent"}`}>{task}</span>)}</div>
        <p data-team-final className="absolute inset-x-5 bottom-14 mx-auto max-w-4xl text-center text-3xl font-bold opacity-0 md:text-5xl">Sua equipe ganha tempo para se concentrar na operação.</p>
      </PinnedScene>

      <section id="para-quem" className="relative border-b border-border/50 py-28 md:py-36">
        <div className="container mx-auto px-5"><h2 className="mx-auto mb-16 max-w-4xl text-center text-3xl font-bold md:text-5xl">Para quem conduz operações complexas.</h2><div className="relative mx-auto grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">{["M&A", "Jurídico", "Financeiro", "Operações"].map((item) => <div key={item} className="flex min-h-36 items-center justify-center bg-card p-5 text-center text-lg font-semibold md:min-h-48 md:text-xl">{item}</div>)}</div></div>
      </section>

      <PlansSection />

      <section className="relative flex min-h-[85svh] items-center justify-center overflow-hidden border-t border-border/50 px-5 py-24 text-center">
        <ConnectionField className="opacity-25" />
        <div className="relative z-10 max-w-5xl">
          <h2 className="text-4xl font-bold leading-tight md:text-7xl">Sua operação já é complexa. A documentação não precisa ser.</h2>
          <img src={LOGO_URL} alt="Tukana AI" className="mx-auto my-10 h-20 w-auto" />
          <p className="mb-10 text-xl font-semibold text-accent md:text-3xl">TUKANA AI</p>
          <p className="mb-10 text-lg text-muted-foreground md:text-2xl">Menos trabalho manual. Mais tempo para a operação.</p>
          <ContactFormDialog trigger={<Button size="lg" className="group rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90">Solicitar demonstração <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Button>} />
        </div>
      </section>
    </div>
  );
};

export default ScrollyLanding;