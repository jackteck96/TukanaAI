import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

interface ExpiringDocument {
  document_id: string;
  document_name: string;
  document_type: string;
  expiration_date: string;
  days_until_expiration: number;
  process_id: string;
  client_name: string;
  client_email: string;
  company_id: string;
  status: 'expired' | 'expiring_soon' | 'valid';
}

export default function ExpiringDocumentsAlert() {
  const { company } = useCompany();
  const [expiringDocuments, setExpiringDocuments] = useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpiringDocuments();
  }, [company?.id]);

  const loadExpiringDocuments = async () => {
    if (!company?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('check_expiring_documents', { days_ahead: 30 });

      if (error) throw error;

      // Filtrar apenas documentos da empresa atual
      const companyDocuments = (data || []).filter(
        (doc: ExpiringDocument) => doc.company_id === company.id
      ) as ExpiringDocument[];

      setExpiringDocuments(companyDocuments);
    } catch (error) {
      console.error('Erro ao carregar documentos vencidos:', error);
      toast.error('Erro ao carregar alertas de documentos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (expiringDocuments.length === 0) {
    return null;
  }

  const expiredDocs = expiringDocuments.filter(doc => doc.status === 'expired');
  const expiringSoonDocs = expiringDocuments.filter(doc => doc.status === 'expiring_soon');

  return (
    <div className="space-y-4">
      {expiredDocs.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Documentos Vencidos</AlertTitle>
          <AlertDescription>
            {expiredDocs.length} documento(s) vencido(s). É necessário solicitar atualização dos documentos.
          </AlertDescription>
        </Alert>
      )}

      {expiringSoonDocs.length > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Documentos Próximos do Vencimento</AlertTitle>
          <AlertDescription>
            {expiringSoonDocs.length} documento(s) vence(m) nos próximos 30 dias.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Alertas de Vencimento
          </CardTitle>
          <CardDescription>
            Documentos que expiraram ou estão próximos do vencimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expiringDocuments.map((doc) => (
              <div
                key={doc.document_id}
                className={`p-4 rounded-lg border ${
                  doc.status === 'expired'
                    ? 'bg-destructive/10 border-destructive/20'
                    : 'bg-warning/10 border-warning/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-medium break-words line-clamp-2 flex-1 min-w-0">{doc.document_name}</h4>
                      <Badge
                        variant={doc.status === 'expired' ? 'destructive' : 'secondary'}
                        className={`flex-shrink-0 ${doc.status === 'expiring_soon' ? 'bg-warning/10 text-warning border-warning/20' : ''}`}
                      >
                        {doc.status === 'expired' ? 'Vencido' : 'Vence em breve'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Tipo: {doc.document_type}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Cliente: {doc.client_name} ({doc.client_email})
                    </p>
                    <p className="text-sm font-medium">
                      {doc.status === 'expired' ? (
                        <span className="text-destructive">
                          Venceu há {Math.abs(doc.days_until_expiration)} dia(s)
                        </span>
                      ) : (
                        <span className="text-warning">
                          Vence em {doc.days_until_expiration} dia(s)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Data de expiração: {new Date(doc.expiration_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/gerenciar-processos?process=${doc.process_id}`}
                  >
                    Ver Processo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
