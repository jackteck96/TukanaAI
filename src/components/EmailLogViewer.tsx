import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface EmailLogViewerProps {
  processId: string;
}

interface EmailLog {
  id: string;
  type: string;
  status: 'success' | 'error';
  recipient: string;
  sent_at?: string;
  attempted_at?: string;
  error_message?: string;
  details: string;
  message_id?: string;
}

const EmailLogViewer: React.FC<EmailLogViewerProps> = ({ processId }) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmailLogs();
  }, [processId]);

  const fetchEmailLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_reports')
        .select('id, report_data, generated_at')
        .eq('process_id', processId)
        .order('generated_at', { ascending: false });

      if (error) throw error;

      const emailLogs: EmailLog[] = [];
      data?.forEach(item => {
        const reportData = item.report_data as any;
        if (reportData?.email_log) {
          emailLogs.push({
            id: item.id,
            type: reportData.type || '',
            status: reportData.status || 'error',
            recipient: reportData.recipient || '',
            sent_at: reportData.sent_at,
            attempted_at: reportData.attempted_at,
            error_message: reportData.error_message,
            details: reportData.details || '',
            message_id: reportData.message_id,
          });
        }
      });

      setLogs(emailLogs);
    } catch (error) {
      console.error('Erro ao buscar logs de email:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Enviado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'welcome_email':
        return 'Email de Boas-vindas';
      case 'invite_email':
        return 'Email de Convite';
      default:
        return 'Email';
    }
  };

  if (logs.length === 0 && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Histórico de Emails</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhum email foi enviado para este processo ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Histórico de Emails</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchEmailLogs} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="mt-1">
                  {getStatusIcon(log.status)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{getTypeLabel(log.type)}</span>
                      {getStatusBadge(log.status)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString('pt-BR') : 
                       log.attempted_at ? new Date(log.attempted_at).toLocaleString('pt-BR') : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para: {log.recipient}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.details}
                  </p>
                  {log.error_message && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      Erro: {log.error_message}
                    </p>
                  )}
                  {log.message_id && (
                    <p className="text-xs text-muted-foreground">
                      ID: {log.message_id}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EmailLogViewer;