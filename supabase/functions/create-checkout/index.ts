import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { plan_slug } = await req.json();
    if (!plan_slug) throw new Error("plan_slug é obrigatório");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY não configurada");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user?.email) throw new Error("Usuário inválido");
    const user = userData.user;

    // Plano
    const { data: plan, error: planErr } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("slug", plan_slug)
      .maybeSingle();
    if (planErr || !plan) throw new Error("Plano não encontrado");
    if (!plan.price_cents) throw new Error("Plano sem preço (use 'Falar com vendas')");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Reutiliza customer
    let customerId: string | undefined;
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length) customerId = existing.data[0].id;

    const origin = req.headers.get("origin") || "https://fuzen.online";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: `Fuzen ${plan.name}` },
            unit_amount: plan.price_cents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: { user_id: user.id, plan_slug: plan.slug },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("create-checkout error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
