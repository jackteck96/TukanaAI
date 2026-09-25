import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Content, contentsTable, formatDate } from "@/lib/contents";

const Conteudos = () => {
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentsTable()
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .then(({ data }: { data: Content[] | null }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Helmet>
        <title>Conteúdos | Tukana AI</title>
        <meta name="description" content="Artigos, análises e notícias sobre M&A, jurídico e tecnologia pela Tukana AI." />
        <link rel="canonical" href="https://fuzen.online/conteudos" />
      </Helmet>
      <div className="dark min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-14">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">Conteúdos</h1>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            Artigos, análises e notícias sobre M&A, jurídico, tecnologia e operações.
          </p>
          {loading ? (
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Nenhum conteúdo publicado ainda.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <Link
                  key={c.id}
                  to={`/conteudos/${c.slug}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-colors"
                >
                  <div className="aspect-[16/9] bg-muted overflow-hidden">
                    {c.cover_image_url && (
                      <img src={c.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">{c.category}</span>
                    <h2 className="text-lg font-semibold leading-snug">{c.title}</h2>
                    {c.summary && <p className="text-sm text-muted-foreground line-clamp-3">{c.summary}</p>}
                    <p className="text-xs text-muted-foreground pt-1">
                      {formatDate(c.published_at)}
                      {c.reading_minutes ? ` · ${c.reading_minutes} min de leitura` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Conteudos;
