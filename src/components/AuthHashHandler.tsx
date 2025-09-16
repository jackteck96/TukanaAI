import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Processa hashes de autenticação do Supabase presentes na URL
 * Ex.: #access_token=...&refresh_token=...&type=invite
 * - Garante que a sessão seja inicializada
 * - Remove o hash da URL para evitar estados quebrados
 */
export const AuthHashHandler = () => {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const hasSupabaseAuthHash =
      hash.includes("access_token=") ||
      hash.includes("type=invite") ||
      hash.includes("provider_token=");

    if (!hasSupabaseAuthHash) return;

    // Força o Supabase a consolidar a sessão do hash
    supabase.auth.getSession().finally(() => {
      // Remove o hash mantendo path e query
      const url = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", url);
    });
  }, []);

  return null;
};

export default AuthHashHandler;
