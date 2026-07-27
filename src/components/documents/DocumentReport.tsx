import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Download, BarChart3, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProcessData {
  id: string;
  client_name: string;
  project_name: string;
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

  console.log('DocumentReport rendered with processId:', processId);

  useEffect(() => {
    loadReportData();
  }, [processId, refreshKey]);

  const loadReportData = async () => {
    try {
      console.log('Carregando relatório para processo:', processId);
      
      // Carregar dados do processo
      const { data: process, error: processError } = await supabase
        .from('processes')
        .select('*')
        .eq('id', processId)
        .maybeSingle();

      if (processError) {
        console.error('Erro ao buscar processo:', processError);
        throw processError;
      }
      
      if (!process) {
        toast.error('Processo não encontrado');
        setLoading(false);
        return;
      }
      
      console.log('Processo encontrado:', process.client_name);
      setProcessData(process);

      // Carregar último relatório
      const { data: reportData, error: reportError } = await supabase
        .from('document_reports')
        .select('*')
        .eq('process_id', processId)
        .order('generated_at', { ascending: false })
        .limit(1);

      if (reportError) {
        console.error('Erro ao buscar relatório:', reportError);
        throw reportError;
      }

      console.log('Relatórios encontrados:', reportData?.length || 0);
      
      if (reportData && reportData.length > 0) {
        const latestReport = reportData[0];
        console.log('Usando relatório existente:', latestReport.id);
        console.log('Report data type:', typeof latestReport.report_data);
        console.log('Report data is array:', Array.isArray(latestReport.report_data));
        
        // Validar formato do report_data
        if (!Array.isArray(latestReport.report_data)) {
          console.warn('Formato de relatório incompatível, regenerando...');
          await generateNewReport();
          return;
        }
        
        setReport(latestReport);
      } else {
        // Se não há relatório, gerar um novo
        console.log('Nenhum relatório encontrado, gerando novo...');
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
      console.log('Gerando novo relatório para processo:', processId);
      
      const { data, error } = await supabase.rpc('generate_document_report', { 
        process_uuid: processId 
      });

      if (error) {
        console.error('Erro na RPC generate_document_report:', error);
        throw error;
      }

      console.log('Relatório gerado com ID:', data);

      // Pequeno delay para garantir que o relatório foi salvo
      await new Promise(resolve => setTimeout(resolve, 500));

      // Recarregar dados após gerar relatório
      await loadReportData();
      toast.success('Relatório gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao gerar relatório';
      toast.error(`Erro ao gerar relatório: ${errorMessage}`);
    }
  };

  const downloadReportPDF = async () => {
    if (!report || !processData) return;

    try {
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF();
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPos = 30;
      
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > 280) {
          pdf.addPage();
          yPos = 30;
        }
      };
      
      const addText = (text: string, fontSize: number = 10, indent: number = 0) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth - indent);
        
        lines.forEach((line: string) => {
          checkNewPage(10);
          pdf.text(line, margin + indent, yPos);
          yPos += fontSize === 14 ? 8 : fontSize === 20 ? 10 : 6;
        });
      };
      
      // Título
      addText('Relatório de Documentos', 20);
      yPos += 10;
      
      // Informações do processo
      addText('Dados do Processo', 14);
      yPos += 5;
      addText(`Cliente: ${processData.client_name}`);
      
      const processTypeLines = pdf.splitTextToSize(`Tipo: ${processData.process_type}`, maxWidth);
      processTypeLines.forEach((line: string) => {
        checkNewPage(10);
        pdf.setFontSize(10);
        pdf.text(line, margin, yPos);
        yPos += 6;
      });
      
      addText(`Status: ${processData.status}`);
      addText(`Criado em: ${new Date(processData.created_at).toLocaleDateString('pt-BR')}`);
      yPos += 10;
      
      // Estatísticas
      checkNewPage(40);
      addText('Estatísticas', 14);
      yPos += 5;
      addText(`Total de Documentos: ${report.total_documents}`);
      addText(`Documentos Pendentes: ${report.pending_documents}`);
      addText(`Documentos Aprovados: ${report.approved_documents}`);
      yPos += 10;
      
      // Lista de documentos
      if (Array.isArray(report.report_data) && report.report_data.length > 0) {
        checkNewPage(20);
        addText('Documentos', 14);
        yPos += 5;
        
        report.report_data.forEach((doc: any, index: number) => {
          checkNewPage(50);
          
          pdf.setFontSize(10);
          const fileNameLines = pdf.splitTextToSize(`${index + 1}. ${doc.file_name}`, maxWidth);
          fileNameLines.forEach((line: string) => {
            checkNewPage(10);
            pdf.text(line, margin, yPos);
            yPos += 6;
          });
          
          const typeLines = pdf.splitTextToSize(`   Tipo: ${doc.document_type}`, maxWidth);
          typeLines.forEach((line: string) => {
            checkNewPage(10);
            pdf.text(line, margin, yPos);
            yPos += 6;
          });
          
          addText(`   Status: ${doc.status}`, 10, 3);
          addText(`   Enviado por: ${doc.uploaded_by}`, 10, 3);
          addText(`   Data de envio: ${new Date(doc.created_at).toLocaleDateString('pt-BR')}`, 10, 3);
          
          if (doc.issue_date) {
            addText(`   Data de Emissão: ${new Date(doc.issue_date).toLocaleDateString('pt-BR')}`, 10, 3);
          }
          if (doc.expiration_date) {
            addText(`   Data de Expiração: ${new Date(doc.expiration_date).toLocaleDateString('pt-BR')}`, 10, 3);
          }
          if (doc.issuing_location) {
            const locationLines = pdf.splitTextToSize(`   Local de Emissão: ${doc.issuing_location}`, maxWidth);
            locationLines.forEach((line: string) => {
              checkNewPage(10);
              pdf.setFontSize(10);
              pdf.text(line, margin, yPos);
              yPos += 6;
            });
          }
          addText(`   Tamanho: ${(doc.file_size / 1024).toFixed(1)} KB`, 10, 3);
          yPos += 8;
        });
      }
      
      pdf.save(`relatorio_${processData.project_name || processData.client_name}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
      toast.success('Relatório PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const downloadReportExcel = async () => {
    if (!report || !processData) return;

    try {
      const XLSX = await import('xlsx');
      
      // Dados do processo
      const processInfo = [
        ['RELATÓRIO DE DOCUMENTOS'],
        [''],
        ['Dados do Processo'],
        ['Cliente', processData.client_name],
        ['Tipo', processData.process_type],
        ['Status', processData.status],
        ['Criado em', new Date(processData.created_at).toLocaleDateString('pt-BR')],
        [''],
        ['Estatísticas'],
        ['Total de Documentos', report.total_documents],
        ['Documentos Pendentes', report.pending_documents],
        ['Documentos Aprovados', report.approved_documents],
        [''],
        ['Lista de Documentos'],
        ['Nome do Arquivo', 'Tipo', 'Status', 'Enviado por', 'Data de Criação', 'Data de Emissão', 'Data de Expiração', 'Local de Emissão', 'Tamanho (KB)']
      ];
      
      // Adicionar documentos
      if (Array.isArray(report.report_data)) {
        report.report_data.forEach((doc: any) => {
          processInfo.push([
            doc.file_name,
            doc.document_type,
            doc.status,
            doc.uploaded_by,
            new Date(doc.created_at).toLocaleDateString('pt-BR'),
            doc.issue_date ? new Date(doc.issue_date).toLocaleDateString('pt-BR') : 'N/A',
            doc.expiration_date ? new Date(doc.expiration_date).toLocaleDateString('pt-BR') : 'N/A',
            doc.issuing_location || 'N/A',
            doc.file_size ? (doc.file_size / 1024).toFixed(1) : 'N/A'
          ]);
        });
      }
      
      const ws = XLSX.utils.aoa_to_sheet(processInfo);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
      
      XLSX.writeFile(wb, `relatorio_${(processData.project_name || processData.client_name).replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Relatório Excel baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast.error('Erro ao gerar Excel. Tente novamente.');
    }
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
      
      const processFolder = zip.folder(`${processData?.project_name || processData?.client_name || 'processo'}-documentos`);
      
      const sanitize = (s: string) => (s || '').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim();
      const processLabel = sanitize(processData?.project_name || processData?.client_name || 'processo');
      const usedNames = new Map<string, number>();

      for (const doc of report.report_data) {
        try {
          const { data, error } = await supabase.storage
            .from('documents')
            .download(doc.file_path);
          
          if (error) {
            console.error(`Erro ao baixar ${doc.file_name}:`, error);
            continue;
          }
          
          const dotIdx = (doc.file_name || '').lastIndexOf('.');
          const ext = dotIdx >= 0 ? doc.file_name.slice(dotIdx) : '';
          const docType = sanitize(doc.document_type || 'documento');
          let renamed = `${processLabel} - ${docType}${ext}`;
          const count = usedNames.get(renamed) || 0;
          if (count > 0) {
            const base = renamed.slice(0, renamed.length - ext.length);
            renamed = `${base} (${count + 1})${ext}`;
          }
          usedNames.set(`${processLabel} - ${docType}${ext}`, count + 1);
          
          processFolder?.file(renamed, data);
        } catch (error) {
          console.error(`Erro ao processar ${doc.file_name}:`, error);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${processData?.project_name || processData?.client_name || 'processo'}-documentos-${new Date().toISOString().split('T')[0]}.zip`;
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Relatório
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={downloadReportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Baixar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadReportExcel}>
                  <FileText className="h-4 w-4 mr-2" />
                  Baixar como Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg bg-gradient-card"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium break-words">{doc.file_name}</div>
                      <div className="text-sm text-muted-foreground break-words">
                        {doc.document_type} • Enviado por {doc.uploaded_by}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Adicionado em {new Date(doc.created_at).toLocaleDateString('pt-BR')} às {new Date(doc.created_at).toLocaleTimeString('pt-BR')}
                      </div>
                      {(doc.issue_date || doc.expiration_date || doc.issuing_location) && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          {doc.issue_date && (
                            <div className="break-words">📅 Emitido em: {new Date(doc.issue_date).toLocaleDateString('pt-BR')}</div>
                          )}
                          {doc.expiration_date && (
                            <div className="break-words">⏰ Expira em: {new Date(doc.expiration_date).toLocaleDateString('pt-BR')}</div>
                          )}
                          {doc.issuing_location && (
                            <div className="break-words">📍 Local: {doc.issuing_location}</div>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {(doc.file_size / 1024).toFixed(1)} KB • {doc.file_type}
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(doc.status)} flex-shrink-0`}>
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