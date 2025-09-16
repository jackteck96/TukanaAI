import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Processa hashes de autenticação do Supabase presentes na URL
 * Ex.: #access_token=...&refresh_token=...&type=invite
 * - Garante que a sessão seja inicializada
 * - Remove o hash da URL para evitar estados quebrados
 */
export const AuthHashHandler = () => {
  const { toast } = useToast();
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const hasSupabaseAuthHash =
      hash.includes("access_token=") ||
      hash.includes("type=invite") ||
      hash.includes("provider_token=") ||
      hash.includes("error=") ||
      hash.includes("error_code=");

    if (!hasSupabaseAuthHash) return;

    console.log("[AuthHashHandler] Hash de auth detectado, inicializando sessão...");

    // Trate erros de autenticação no hash (ex.: otp_expired)
    const params = new URLSearchParams(hash.slice(1));
    if (params.get("error")) {
      const code = params.get("error_code") || "unknown_error";
      const description = decodeURIComponent(params.get("error_description") || "");
      console.warn("[AuthHashHandler] Erro de auth no hash:", code, description);

      // Feedback ao usuário
      if (code === "otp_expired") {
        toast({
          title: "Link expirado",
          description: "O link de acesso/convite expirou. Solicite um novo e-mail.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Falha na autenticação",
          description: description || "Não foi possível autenticar. Tente novamente.",
          variant: "destructive",
        });
      }

      // Limpa o hash e registra o erro sem recarregar a página
      if (window.location.pathname.startsWith("/cadastro-via-convite")) {
        const url = new URL(window.location.href);
        url.hash = "";
        url.searchParams.set("invite_error", code);
        window.history.replaceState(null, "", url.pathname + url.search);
      } else {
        try { sessionStorage.setItem("last_auth_error", code); } catch {}
        const url = new URL(window.location.href);
        url.hash = "";
        url.searchParams.set("auth_error", code);
        window.history.replaceState(null, "", url.pathname + url.search);
      }
      return;
    }

    // Em /cadastro-via-convite, deixamos a página tratar o hash (não removemos aqui)
    if (window.location.pathname.startsWith('/cadastro-via-convite')) {
      supabase.auth.getSession();
      return;
    }

    // Força o Supabase a consolidar a sessão do hash e limpa a URL nas demais rotas
    supabase.auth.getSession().finally(() => {
      const url = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", url);
      console.log("[AuthHashHandler] Hash limpo da URL.");
    });
  }, []);

  return null;
};

export default AuthHashHandler;
