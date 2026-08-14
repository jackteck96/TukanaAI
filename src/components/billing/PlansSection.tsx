import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContactFormDialog } from "@/components/shared/ContactFormDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  max_users: number | null;
  max_active_cases_month: number | null;
  max_storage_gb: number | null;
  price_label: string | null;
  cta_type: string | null;
  is_highlighted: boolean | null;
  features: string[] | null;
  display_order: number | null;
}

const PlansSection = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("subscription_plans" as any)
        .select("id,name,slug,description,max_users,max_active_cases_month,max_storage_gb,price_label,cta_type,is_highlighted,features,display_order")
        .eq("is_active", true)
        .eq("is_public", true)
        .order("display_order", { ascending: true });
      setPlans((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const handleSubscribe = async (planSlug: string) => {
    if (!user) {
      sessionStorage.setItem("pending_checkout_plan", planSlug);
      toast.info(t('landing.plans.toastSignupToSubscribe'));
      window.location.href = `/auth?tab=signup&plan=${planSlug}`;
      return;
    }
    setCheckoutLoading(planSlug);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan_slug: planSlug },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(t('landing.plans.toastCheckoutError'), { description: e?.message });
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <section id="planos" className="py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {t('landing.plans.titlePre')} <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('landing.plans.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('landing.plans.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const highlighted = !!plan.is_highlighted;
              const isContact = plan.cta_type === "contact_sales";

              // Known plan slugs get real per-language copy from the catalog in common.json;
              // any future plan slug not yet in the catalog falls back to the raw DB text
              // (Portuguese) via defaultValue instead of rendering a broken translation key.
              const catalogKey = `landing.plans.catalog.${plan.slug}`;
              const description = t(`${catalogKey}.description`, { defaultValue: plan.description ?? '' });
              const priceLabel = t(`${catalogKey}.priceLabel`, { defaultValue: plan.price_label ?? '' });
              const extraFeatures = t(`${catalogKey}.extraFeatures`, {
                returnObjects: true,
                defaultValue: (plan.features || []).slice(3),
              }) as string[];

              return (
                <Card
                  key={plan.id}
                  className={`relative rounded-2xl flex flex-col ${
                    highlighted
                      ? "border-2 border-primary shadow-elegant scale-[1.02] bg-gradient-to-br from-card to-primary/5"
                      : "border-border"
                  }`}
                >
                  {highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      {t('landing.plans.mostPopular')}
                    </Badge>
                  )}
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* plan.name (e.g. "Starter"/"Growth") is used as-is across locales, like a
                        product tier name rather than translated prose. */}
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{priceLabel}</span>
                    </div>
                    <ul className="space-y-2 mb-6 flex-1">
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{plan.max_users ? t('landing.plans.usersLimited', { count: plan.max_users }) : t('landing.plans.usersUnlimited')}</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{plan.max_active_cases_month ? t('landing.plans.activeCasesLimited', { count: plan.max_active_cases_month }) : t('landing.plans.activeCasesUnlimited')}</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{plan.max_storage_gb ? t('landing.plans.storageLimited', { count: plan.max_storage_gb }) : t('landing.plans.storageUnlimited')}</span>
                      </li>
                      {extraFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {isContact ? (
                      <ContactFormDialog
                        trigger={
                          <Button variant="outline" className="w-full">
                            {t('landing.plans.talkToSales')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        }
                      />
                    ) : (
                      <Button
                        className="w-full"
                        variant={highlighted ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan.slug)}
                        disabled={checkoutLoading === plan.slug}
                      >
                        {checkoutLoading === plan.slug ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>{t('landing.plans.subscribe')} <ArrowRight className="ml-2 h-4 w-4" /></>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default PlansSection;
