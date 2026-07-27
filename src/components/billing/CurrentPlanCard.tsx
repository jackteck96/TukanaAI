import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowUpRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { ContactFormDialog } from "@/components/shared/ContactFormDialog";
import { Link } from "react-router-dom";

interface LimitInfo {
  current_usage: number;
  limit: number;
  plan: string;
  plan_name: string;
  can_add: boolean;
}

const formatGB = (bytes: number) => (bytes / (1024 ** 3)).toFixed(2);

const CurrentPlanCard = () => {
  const { company } = useCompany();
  const [users, setUsers] = useState<LimitInfo | null>(null);
  const [cases, setCases] = useState<LimitInfo | null>(null);
  const [storage, setStorage] = useState<LimitInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    (async () => {
      setLoading(true);
      const [u, c, s] = await Promise.all([
        supabase.rpc("check_plan_limits", { company_uuid: company.id, limit_type: "users" }),
        supabase.rpc("check_plan_limits", { company_uuid: company.id, limit_type: "active_cases" }),
        supabase.rpc("check_plan_limits", { company_uuid: company.id, limit_type: "storage" }),
      ]);
      setUsers(u.data as any);
      setCases(c.data as any);
      setStorage(s.data as any);
      setLoading(false);
    })();
  }, [company]);

  if (!company) return null;
  if (loading) return (
    <Card><CardContent className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
  );

  const planName = users?.plan_name || "Starter";
  const isEnterprise = users?.plan === "enterprise";

  const renderRow = (label: string, info: LimitInfo | null, formatter?: (n: number) => string) => {
    if (!info) return null;
    const unlimited = info.limit === -1 || info.limit === null;
    const fmt = formatter || ((n: number) => String(n));
    const pct = unlimited ? 0 : Math.min(100, (info.current_usage / info.limit) * 100);
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">
            {unlimited ? `${fmt(info.current_usage)} (ilimitado)` : `${fmt(info.current_usage)} / ${fmt(info.limit)}`}
          </span>
        </div>
        {!unlimited && <Progress value={pct} className="h-2" />}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Plano atual: {planName}
            </CardTitle>
            <CardDescription>Acompanhe o uso do seu plano</CardDescription>
          </div>
          <Badge variant={isEnterprise ? "default" : "secondary"}>{planName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderRow("Usuários", users)}
        {renderRow("Casos ativos no mês", cases)}
        {renderRow("Armazenamento (GB)", storage, (n) => formatGB(n))}

        <div className="pt-2">
          {isEnterprise ? (
            <ContactFormDialog
              trigger={<Button variant="outline" className="w-full">Falar com vendas <ArrowUpRight className="ml-2 h-4 w-4" /></Button>}
            />
          ) : (
            <Button asChild className="w-full">
              <Link to="/#planos">Fazer upgrade <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentPlanCard;
