import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, BarChart, Users, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Consent {
  id: string;
  consent_type: string;
  purpose: string;
  consent_given: boolean;
  consent_date: string | null;
  version: string;
}

export const ConsentManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(false);

  const consentTypes = [
    {
      type: "terms",
      icon: Shield,
      title: "Termos de Uso",
      description: "Aceite dos termos e condições da plataforma",
      required: true,
      purpose: "Execução do contrato de prestação de serviços"
    },
    {
      type: "privacy",
      icon: Shield,
      title: "Política de Privacidade",
      description: "Tratamento de dados conforme política de privacidade",
      required: true,
      purpose: "Base legal para processamento de dados"
    },
    {
      type: "marketing",
      icon: Mail,
      title: "Comunicações de Marketing",
      description: "Receber emails sobre novidades, promoções e atualizações",
      required: false,
      purpose: "Envio de comunicações comerciais (consentimento)"
    },
    {
      type: "data_processing",
      icon: BarChart,
      title: "Análise e Melhoria de Serviços",
      description: "Uso de dados para análise e melhorias na plataforma",
      required: false,
      purpose: "Legítimo interesse para melhoria dos serviços"
    },
    {
      type: "third_party_sharing",
      icon: Users,
      title: "Compartilhamento com Parceiros",
      description: "Compartilhar dados com parceiros selecionados",
      required: false,
      purpose: "Consentimento explícito para compartilhamento"
    }
  ];

  useEffect(() => {
    if (user) {
      loadConsents();
    }
  }, [user]);

  const loadConsents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_consents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Pegar apenas o consentimento mais recente de cada tipo
      const latestConsents = data?.reduce((acc: Consent[], consent) => {
        if (!acc.find(c => c.consent_type === consent.consent_type)) {
          acc.push(consent);
        }
        return acc;
      }, []) || [];

      setConsents(latestConsents);
    } catch (error: any) {
      console.error("Erro ao carregar consentimentos:", error);
    }
  };

  const updateConsent = async (consentType: string, given: boolean) => {
    if (!user) return;

    const consentDef = consentTypes.find(c => c.type === consentType);
    if (!consentDef) return;

    if (consentDef.required && !given) {
      toast({
        title: "Consentimento Obrigatório",
        description: "Este consentimento é necessário para usar a plataforma.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_consents")
        .insert({
          user_id: user.id,
          consent_type: consentType,
          purpose: consentDef.purpose,
          consent_given: given,
          consent_date: given ? new Date().toISOString() : null,
          revoked_date: !given ? new Date().toISOString() : null,
          version: "1.0"
        });

      if (error) throw error;

      toast({
        title: given ? "Consentimento concedido" : "Consentimento revogado",
        description: given 
          ? "Seu consentimento foi registrado com sucesso."
          : "Seu consentimento foi revogado. Isso pode afetar alguns recursos.",
      });

      loadConsents();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar consentimento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConsentStatus = (type: string) => {
    const consent = consents.find(c => c.consent_type === type);
    return consent?.consent_given ?? false;
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Você pode gerenciar seus consentimentos a qualquer momento. Consentimentos obrigatórios 
          são necessários para o funcionamento da plataforma.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {consentTypes.map((item) => {
          const Icon = item.icon;
          const isGiven = getConsentStatus(item.type);

          return (
            <Card key={item.type}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {item.title}
                        {item.required && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Obrigatório
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={isGiven}
                    onCheckedChange={(checked) => updateConsent(item.type, checked)}
                    disabled={loading || (item.required && isGiven)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <strong>Base Legal:</strong> {item.purpose}
                </div>
                {isGiven && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Consentimento concedido em:{" "}
                    {consents.find(c => c.consent_type === item.type)?.consent_date 
                      ? new Date(consents.find(c => c.consent_type === item.type)!.consent_date!).toLocaleDateString('pt-BR')
                      : "Data não disponível"}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • Você pode revogar seu consentimento a qualquer momento para tratamentos não obrigatórios.
          </p>
          <p>
            • A revogação não afeta a licitude do tratamento baseado no consentimento antes de sua retirada.
          </p>
          <p>
            • Consentimentos obrigatórios são necessários para a execução do contrato e funcionamento da plataforma.
          </p>
          <p>
            • Todas as alterações são registradas com data e hora para fins de auditoria e compliance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
