import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Download, Clock, Users } from "lucide-react";
import { useTimeRecords, TimeEntry } from "@/hooks/useTimeRecords";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface EmployeeReport {
  employee_name: string;
  employee_id: string;
  entries: TimeEntry[];
  totalHours: number;
}

const RelatoriosPonto = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [employeeReports, setEmployeeReports] = useState<EmployeeReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const { fetchAllEmployeeRecords, getEntryTypeLabel } = useTimeRecords();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.role === 'admin');
      }
    };

    checkAdminRole();
    
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [user]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Selecione as datas de início e fim",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const records = await fetchAllEmployeeRecords(start, end);
      
      // Group records by employee
      const employeeMap = new Map<string, EmployeeReport>();
      
      records.forEach(record => {
        if (!employeeMap.has(record.employee_id)) {
          employeeMap.set(record.employee_id, {
            employee_name: record.employee_name,
            employee_id: record.employee_id,
            entries: [],
            totalHours: 0
          });
        }
        employeeMap.get(record.employee_id)!.entries.push(record);
      });

      // Calculate total hours for each employee
      const reports = Array.from(employeeMap.values()).map(report => {
        const sortedEntries = report.entries.sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        let totalMinutes = 0;
        let currentSession: Date | null = null;
        
        sortedEntries.forEach(entry => {
          if (entry.type === 'entrada' || entry.type === 'retorno') {
            currentSession = entry.timestamp;
          } else if ((entry.type === 'saida' || entry.type === 'pausa') && currentSession) {
            const minutes = (entry.timestamp.getTime() - currentSession.getTime()) / (1000 * 60);
            totalMinutes += minutes;
            if (entry.type === 'saida') {
              currentSession = null;
            }
          }
        });
        
        return {
          ...report,
          totalHours: Math.round((totalMinutes / 60) * 100) / 100,
          entries: sortedEntries
        };
      });

      setEmployeeReports(reports);
    } catch (error: any) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntryTypeColor = (type: TimeEntry['type']) => {
    switch (type) {
      case 'entrada': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'saida': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pausa': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'retorno': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const exportToCsv = () => {
    if (employeeReports.length === 0) return;

    const csvContent = [
      ['Funcionário', 'Data/Hora', 'Tipo', 'Total de Horas'].join(','),
      ...employeeReports.flatMap(report =>
        report.entries.map(entry => [
          report.employee_name,
          entry.timestamp.toLocaleString('pt-BR'),
          getEntryTypeLabel(entry.type),
          ''
        ].join(','))
      ),
      ['', '', 'TOTAIS:', ''],
      ...employeeReports.map(report => [
        report.employee_name,
        '',
        '',
        `${report.totalHours}h`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-ponto-${startDate}-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
              <p className="text-muted-foreground">
                Apenas administradores podem acessar os relatórios de ponto.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios de Ponto</h1>
          <p className="text-muted-foreground">
            Visualize e exporte relatórios de ponto dos colaboradores
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Filtros de Período</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Data de Início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Data de Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end space-x-2">
              <Button 
                onClick={generateReport}
                disabled={loading}
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                {loading ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
              {employeeReports.length > 0 && (
                <Button
                  variant="outline"
                  onClick={exportToCsv}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios */}
      {employeeReports.length > 0 && (
        <div className="space-y-6">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {employeeReports.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Funcionários
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {employeeReports.reduce((total, report) => 
                      total + report.entries.length, 0
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total de Registros
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(
                      employeeReports.reduce((total, report) => 
                        total + report.totalHours, 0
                      ) * 100
                    ) / 100}h
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total de Horas
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relatório por funcionário */}
          {employeeReports.map((report) => (
            <Card key={report.employee_id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{report.employee_name}</span>
                  <Badge variant="secondary">
                    {report.totalHours}h trabalhadas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {report.entries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum registro no período selecionado
                    </p>
                  ) : (
                    report.entries.map((entry) => (
                      <div 
                        key={entry.id} 
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge className={getEntryTypeColor(entry.type)}>
                            {getEntryTypeLabel(entry.type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {entry.timestamp.toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <span className="font-mono text-sm">
                          {entry.timestamp.toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatoriosPonto;