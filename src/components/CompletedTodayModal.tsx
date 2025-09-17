import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, User, Calendar, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CompletedProcess {
  id: string;
  client_name: string;
  client_email: string;
  process_type: string;
  status: string;
  progress: number;
  updated_at: string;
  description?: string;
}

interface CompletedTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompletedTodayModal({ isOpen, onClose }: CompletedTodayModalProps) {
  const [completedProcesses, setCompletedProcesses] = useState<CompletedProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadCompletedToday();
    }
  }, [isOpen]);

  const loadCompletedToday = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('processes')
        .select('*')
        .eq('status', 'Concluído')
        .gte('updated_at', today);

      if (error) throw error;

      setCompletedProcesses(data || []);
    } catch (error) {
      console.error('Erro ao carregar processos concluídos:', error);
      toast.error('Erro ao carregar processos concluídos');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewProcess = (processId: string) => {
    navigate(`/gerenciar-processos?id=${processId}`);
    onClose();
  };

  const handleViewClient = (clientEmail: string) => {
    navigate(`/cliente/${encodeURIComponent(clientEmail)}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Processos Concluídos Hoje
          </DialogTitle>
          <DialogDescription>
            {completedProcesses.length} processo(s) foram concluídos hoje
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : completedProcesses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum processo foi concluído hoje</p>
              <p className="text-sm">Continue trabalhando nos processos em andamento</p>
            </div>
          ) : (
            completedProcesses.map((process) => (
              <Card key={process.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{process.process_type}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {process.client_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Concluído
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatTime(process.updated_at)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {process.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {process.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {process.progress}% concluído
                        </span>
                        <span className="text-muted-foreground">
                          Cliente: {process.client_email}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClient(process.client_email)}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Cliente
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProcess(process.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Processo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}