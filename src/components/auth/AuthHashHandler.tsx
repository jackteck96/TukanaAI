import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Processa hashes de autenticação do Supabase presentes na URL
 * Ex.: #access_token=...&refresh_token=...&type=invite
 * - Garante que a sessão seja inicializada
 * - Remove o hash da URL para evitar estados quebrados
 */
export const AuthHashHandler = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const hasSupabaseAuthHash =
      hash.includes("access_token=") ||
      hash.includes("type=invite") ||
      hash.includes("type=recovery") ||
      hash.includes("provider_token=") ||
      hash.includes("error=") ||
      hash.includes("error_code=");

    if (!hasSupabaseAuthHash) return;

    console.log("[AuthHashHandler] Hash de auth detectado, inicializando sessão...");
    
    // Verificar se é um link de recuperação de senha
    const hashParams = new URLSearchParams(hash.slice(1));
    const type = hashParams.get("type");
    
    if (type === "recovery") {
      console.log("[AuthHashHandler] Link de recuperação detectado, redirecionando...");
      // Processar sessão antes de redirecionar
      supabase.auth.getSession()
        .then(() => {
          window.location.href = "/reset-password";
        })
        .catch(err => {
          console.error("[AuthHashHandler] Erro ao processar sessão de recuperação:", err);
          toast({
            title: t('authHashHandler.recoveryErrorTitle'),
            description: t('authHashHandler.recoveryErrorDescription'),
            variant: "destructive",
          });
        });
      return;
    }

    // Trate erros de autenticação no hash (ex.: otp_expired)
    if (hashParams.get("error")) {
      const code = hashParams.get("error_code") || "unknown_error";
      const description = decodeURIComponent(hashParams.get("error_description") || "");
      console.warn("[AuthHashHandler] Erro de auth no hash:", code, description);

      // Feedback ao usuário
      if (code === "otp_expired") {
        toast({
          title: t('authHashHandler.linkExpiredTitle'),
          description: t('authHashHandler.linkExpiredDescription'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('authHashHandler.authFailedTitle'),
          description: description || t('authHashHandler.authFailedDescriptionDefault'),
          variant: "destructive",
        });
      }

      // Limpa o hash e encaminha de forma segura
      if (window.location.pathname.startsWith("/cadastro-via-convite")) {
        const url = new URL(window.location.href);
        url.hash = "";
        url.searchParams.set("invite_error", code);
        window.history.replaceState(null, "", url.pathname + url.search);
      } else {
        try { sessionStorage.setItem("last_auth_error", code); } catch {}
        const url = new URL(window.location.href);
        url.hash = "";
        if (url.pathname !== "/auth") {
          const target = new URL(window.location.origin + "/auth");
          target.searchParams.set("auth_error", code);
          window.location.replace(target.toString());
        } else {
          url.searchParams.set("auth_error", code);
          window.history.replaceState(null, "", url.pathname + url.search);
        }
      }
      return;
    }

    // Em /cadastro-via-convite, deixamos a página tratar o hash (não removemos aqui)
    if (window.location.pathname.startsWith('/cadastro-via-convite')) {
      supabase.auth.getSession();
      return;
    }

    // Processa a sessão primeiro e só então limpa a URL
    console.log("[AuthHashHandler] Processando hash de auth válido, consolidando sessão...");
    
    supabase.auth.getSession()
      .catch(err => {
        console.warn("[AuthHashHandler] Erro ao processar sessão:", err);
      })
      .finally(() => {
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", cleanUrl);
        console.log("[AuthHashHandler] Hash limpo da URL.");
      });
  }, []);

  return null;
};

export default AuthHashHandler;
