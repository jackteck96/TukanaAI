import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContentBody from "@/components/content/ContentBody";
import { Content, contentsTable, formatDate } from "@/lib/contents";

const ConteudoDetalhe = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const [c, setC] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentsTable()
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }: { data: Content | null }) => {
        setC(data);
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col">
      {c && (
        <Helmet>
          <title>{`${c.title} | Tukana AI`}</title>
          {c.summary && <meta name="description" content={c.summary} />}
          <meta property="og:title" content={c.title} />
          <meta property="og:type" content="article" />
          <link rel="canonical" href={`https://fuzen.online/conteudos/${c.slug}`} />
        </Helmet>
      )}
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/conteudos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="h-4 w-4" /> {t("contents.backToAll")}
        </Link>
        {loading ? (
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : !c ? (
          <p className="text-muted-foreground">{t("contents.notFound")}</p>
        ) : (
          <article>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">{c.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-4 leading-tight">{c.title}</h1>
            {c.summary && <p className="text-lg text-muted-foreground mb-4">{c.summary}</p>}
            <p className="text-sm text-muted-foreground mb-8">
              {c.author ? `${c.author} · ` : ""}
              {formatDate(c.published_at, i18n.language)}
              {c.reading_minutes ? ` · ${t("contents.readingTime", { minutes: c.reading_minutes })}` : ""}
            </p>
            {c.cover_image_url && <img src={c.cover_image_url} alt="" className="w-full rounded-xl mb-10" />}
            <ContentBody body={c.body} />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ConteudoDetalhe;
