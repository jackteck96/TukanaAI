import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ClientInviteView from "@/components/ClientInviteView";
import { useToast } from "@/hooks/use-toast";

export default function CadastroViaConvite() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInviteDetails() {
      try {
        const urlToken = new URLSearchParams(window.location.search).get("token");
        if (!urlToken) {
          toast({
            title: "Token inválido",
            description: "O link de convite não é válido.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setToken(urlToken);

        const { data, error } = await supabase.functions.invoke('get-invite-details', {
          body: { token: urlToken }
        });

        if (error || !data || data.error) {
          console.error('Erro ao buscar convite:', error || data?.error);
          toast({
            title: "Convite não encontrado",
            description: data?.error || "Não foi possível carregar os detalhes do convite.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setInviteDetails(data);
      } catch (err: any) {
        console.error('Erro ao buscar convite:', err);
        toast({
          title: "Erro",
          description: err.message || "Erro ao carregar o convite.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInviteDetails();
  }, [toast]);

  const handleUploadSuccess = async () => {
    // Recarregar os detalhes do convite após upload
    if (!token) return;
    
    try {
      const { data } = await supabase.functions.invoke('get-invite-details', {
        body: { token }
      });
      if (data && !data.error) {
        setInviteDetails(data);
      }
    } catch (err) {
      console.error('Erro ao recarregar dados:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Convite Inválido</h1>
          <p className="text-muted-foreground">O link de convite não é válido ou expirou.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <ClientInviteView
          processData={inviteDetails.process}
          companyData={inviteDetails.company}
          documentRequests={inviteDetails.documentRequests || []}
          onUploadSuccess={handleUploadSuccess}
          inviteToken={token || ""}
        />
      </div>
    </div>
  );
}
