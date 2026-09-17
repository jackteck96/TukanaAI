import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollyLanding from "@/components/landing/ScrollyLanding";

const Landing = () => {
  const { t } = useTranslation();

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
          })}
        </script>
      </Helmet>
      <div className="dark landing-scrolly min-h-screen bg-background text-foreground">
        <Header />
        <main>
          <ScrollyLanding />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Landing;