import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, BarChart3, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProcessData {
  id: string;
  client_name: string;
  process_type: string;
  status: string;
  created_at: string;
}

interface DocumentReport {
  id: string;
  process_id: string;
  report_data: any;
  generated_at: string;
  total_documents: number;
  pending_documents: number;
  approved_documents: number;
}

interface DocumentReportProps {
  processId: string;
  refreshKey?: number;
}

export default function DocumentReport({ processId, refreshKey = 0 }: DocumentReportProps) {
  const [report, setReport] = useState<DocumentReport | null>(null);
  const [processData, setProcessData] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [processId, refreshKey]);

  const loadReportData = async () => {
    try {
      // Carregar dados do processo
      const { data: process, error: processError } = await supabase
        .from('processes')
        .select('*')
        .eq('id', processId)
        .single();

      if (processError) throw processError;
      setProcessData(process);

      // Carregar último relatório
      const { data: reportData, error: reportError } = await supabase
        .from('document_reports')
        .select('*')
        .eq('process_id', processId)
        .order('generated_at', { ascending: false })
        .limit(1);

      if (reportError) throw reportError;

      if (reportData && reportData.length > 0) {
        setReport(reportData[0]);
      } else {
        // Se não há relatório, gerar um novo
        await generateNewReport();
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const generateNewReport = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_document_report', { 
        process_uuid: processId 
      });

      if (error) throw error;

      // Recarregar dados após gerar relatório
      await loadReportData();
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    }
  };

  const downloadReport = () => {
    if (!report || !processData) return;

    const reportContent = {
      processo: {
        id: processData.id,
        cliente: processData.client_name,
        tipo: processData.process_type,
        status: processData.status,
        criado_em: new Date(processData.created_at).toLocaleDateString('pt-BR')
      },
      relatorio: {
        gerado_em: new Date(report.generated_at).toLocaleDateString('pt-BR'),
        total_documentos: report.total_documents,
        documentos_pendentes: report.pending_documents,
        documentos_aprovados: report.approved_documents
      },
      documentos: report.report_data
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_processo_${processData.client_name}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Relatório baixado com sucesso!');
  };

  const downloadAllDocuments = async () => {
    if (!report?.report_data || !Array.isArray(report.report_data) || report.report_data.length === 0) {
      toast.error('Nenhum documento encontrado para download');
      return;
    }

    try {
      toast.info('Preparando download dos documentos...');
      
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const processFolder = zip.folder(`${processData?.client_name || 'processo'}-documentos`);
      
      for (const doc of report.report_data) {
        try {
          const { data, error } = await supabase.storage
            .from('documents')
            .download(doc.file_path);
          
          if (error) {
            console.error(`Erro ao baixar ${doc.file_name}:`, error);
            continue;
          }
          
          processFolder?.file(doc.file_name, data);
        } catch (error) {
          console.error(`Erro ao processar ${doc.file_name}:`, error);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${processData?.client_name || 'processo'}-documentos-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Download concluído com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar arquivo ZIP:', error);
      toast.error('Erro ao preparar download dos documentos');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'Rejeitado':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-success/10 text-success border-success/20';
      case 'Rejeitado':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Gerando relatório...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report || !processData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Nenhum relatório disponível</p>
            <Button onClick={generateNewReport}>
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório de Documentos
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={generateNewReport}>
              Atualizar
            </Button>
            <Button size="sm" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Relatório
            </Button>
            <Button size="sm" variant="outline" onClick={downloadAllDocuments}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Todos os Documentos
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Gerado em {new Date(report.generated_at).toLocaleDateString('pt-BR')} às {new Date(report.generated_at).toLocaleTimeString('pt-BR')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo Estatístico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-card rounded-lg border">
            <div className="text-2xl font-bold text-primary">{report.total_documents}</div>
            <div className="text-sm text-muted-foreground">Total de Documentos</div>
          </div>
          <div className="text-center p-4 bg-gradient-card rounded-lg border">
            <div className="text-2xl font-bold text-warning">{report.pending_documents}</div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </div>
          <div className="text-center p-4 bg-gradient-card rounded-lg border">
            <div className="text-2xl font-bold text-success">{report.approved_documents}</div>
            <div className="text-sm text-muted-foreground">Aprovados</div>
          </div>
        </div>

        {/* Informações do Processo */}
        <div className="p-4 bg-gradient-card rounded-lg border">
          <h3 className="font-medium mb-3">Dados do Processo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Cliente:</span> {processData.client_name}
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span> {processData.process_type}
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge className={`ml-2 ${getStatusColor(processData.status)}`}>
                {processData.status}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Criado em:</span> {new Date(processData.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div>
          <h3 className="font-medium mb-3">Documentos Anexados</h3>
          {!Array.isArray(report.report_data) || report.report_data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Array.isArray(report.report_data) && report.report_data.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gradient-card"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">{doc.file_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {doc.document_type} • Enviado por {doc.uploaded_by}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(doc.status)}>
                    {getStatusIcon(doc.status)}
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}