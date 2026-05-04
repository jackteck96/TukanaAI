import { supabase } from "@/integrations/supabase/client";

export type PlanLimitType = "users" | "active_cases" | "storage" | "documents";

export const PLAN_LIMIT_MESSAGE = "Você atingiu o limite do seu plano. Faça upgrade para continuar.";

export async function checkLimit(companyId: string, type: PlanLimitType) {
  const { data, error } = await supabase.rpc("check_plan_limits", {
    company_uuid: companyId,
    limit_type: type,
  });
  if (error) throw error;
  return data as unknown as {
    current_usage: number;
    limit: number;
    plan: string;
    plan_name: string;
    can_add: boolean;
  };
}

export async function ensureCanAdd(companyId: string, type: PlanLimitType) {
  const info = await checkLimit(companyId, type);
  if (!info.can_add) {
    const err = new Error(PLAN_LIMIT_MESSAGE);
    (err as any).planLimitInfo = info;
    throw err;
  }
  return info;
}
