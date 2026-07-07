import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, FileText, Upload, User, ListChecks } from 'lucide-react';

interface DocumentChecklistProps {
  processId: string;
  refreshKey?: number;
}

interface RequestItem {
  id: string;
  document_name: string;
  required: boolean;
  current_status: string;
  last_uploaded_at: string | null;
  last_upload_id: string | null;
  uploaded_by?: string | null;
  approved_at?: string | null;
}

const statusMeta: Record<string, { label: string; className: string; icon: any }> = {
  pendente: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  enviado: {
    label: 'Enviado',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Upload,
  },
  aprovado: {
    label: 'Aprovado',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
};

const formatDate = (d?: string | null) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ processId, refreshKey }) => {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        try {
          await supabase.functions.invoke('ensure-requests-for-process', {
            body: { processId },
          });
        } catch {}

        const { data: requests, error } = await supabase
          .from('document_requests')
          .select('id, document_name, required, current_status, last_uploaded_at, last_upload_id')
          .eq('process_id', processId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const uploadIds = (requests || [])
          .map((r) => r.last_upload_id)
          .filter(Boolean) as string[];

        let uploadersById = new Map<string, { uploaded_by: string | null; updated_at: string | null; status: string }>();
        if (uploadIds.length) {
          const { data: docs } = await supabase
            .from('documents')
            .select('id, uploaded_by, updated_at, status')
            .in('id', uploadIds);
          (docs || []).forEach((d: any) => uploadersById.set(d.id, d));
        }

        const merged: RequestItem[] = (requests || []).map((r) => {
          const doc = r.last_upload_id ? uploadersById.get(r.last_upload_id) : undefined;
          return {
            ...r,
            uploaded_by: doc?.uploaded_by ?? null,
            approved_at: doc?.status === 'Aprovado' ? doc?.updated_at ?? null : null,
          };
        });

        setItems(merged);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [processId, refreshKey]);

  const total = items.length;
  const approved = items.filter((i) => i.current_status === 'aprovado').length;
  const sent = items.filter((i) => i.current_status === 'enviado').length;
  const pending = items.filter((i) => i.current_status === 'pendente').length;
  const progress = total ? Math.round((approved / total) * 100) : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Carregando checklist...
        </CardContent>
      </Card>
    );
  }

  if (!total) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-5 w-5" />
            Checklist de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum documento foi solicitado neste processo ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-5 w-5" />
              Checklist de Documentos
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {approved} de {total} aprovados · {sent} em análise · {pending} pendentes
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums">{progress}%</p>
            <p className="text-xs text-muted-foreground">concluído</p>
          </div>
        </div>
        <Progress value={progress} className="h-2 mt-3" />
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-border/60 rounded-md border border-border/60 overflow-hidden">
          {items.map((item) => {
            const meta = statusMeta[item.current_status] ?? statusMeta.pendente;
            const Icon = meta.icon;
            const dateLabel =
              item.current_status === 'aprovado'
                ? formatDate(item.approved_at) || formatDate(item.last_uploaded_at)
                : formatDate(item.last_uploaded_at);
            const dateHint =
              item.current_status === 'aprovado'
                ? 'Aprovado em'
                : item.current_status === 'enviado'
                ? 'Enviado em'
                : 'Aguardando envio';

            return (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.document_name}
                    </p>
                    {item.required && (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>
                      {dateHint}
                      {dateLabel ? `: ${dateLabel}` : ''}
                    </span>
                    {item.uploaded_by && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.uploaded_by}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default DocumentChecklist;
