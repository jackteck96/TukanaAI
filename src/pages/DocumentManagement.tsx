import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Search, FileText, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';
import DocumentReport from '@/components/DocumentReport';
import TaskManager from '@/components/TaskManager';
import { useCompany } from '@/contexts/CompanyContext';

interface Process {
  id: string;
  client_name: string;
  client_email: string;
  process_type: string;
  status: string;
  priority: string;
  description: string;
  created_at: string;
}

export default function DocumentManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company } = useCompany();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Estados para criar novo processo
  const [isCreatingProcess, setIsCreatingProcess] = useState(false);
  const [newProcess, setNewProcess] = useState({
    client_name: '',
    client_email: '',
    process_type: '',
    description: ''
  });

  const processTypes = [
    'Divórcio',
    'Inventário',
    'Pensão Alimentícia',
    'Guarda Compartilhada',
    'Ação de Cobrança',
    'Ação Trabalhista',
    'Ação Civil',
    'Ação Penal',
    'Outros'
  ];

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProcesses(data || []);
      
      // Selecionar primeiro processo se houver
      if (data && data.length > 0 && !selectedProcess) {
        setSelectedProcess(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
      toast.error('Erro ao carregar processos');
    } finally {
      setLoading(false);
    }
  };

  const createProcess = async () => {
    if (!newProcess.client_name || !newProcess.client_email || !newProcess.process_type) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('processes')
        .insert([{
          ...newProcess,
          created_by: user?.id,
          assigned_user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Processo criado com sucesso!');
      setProcesses([data, ...processes]);
      setSelectedProcess(data);
      setIsCreatingProcess(false);
      setNewProcess({
        client_name: '',
        client_email: '',
        process_type: '',
        description: ''
      });
    } catch (error) {
      console.error('Erro ao criar processo:', error);
      toast.error('Erro ao criar processo');
    }
  };

  const filteredProcesses = processes.filter(process =>
    process.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.process_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/empresa')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gerenciamento de Documentos</h1>
              <p className="text-muted-foreground">
                Sistema completo de armazenamento e relatórios de documentos
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreatingProcess(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Processo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Lista de Processos */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Processos
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar processos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProcesses.map((process) => (
                  <div
                    key={process.id}
                    onClick={() => setSelectedProcess(process)}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedProcess?.id === process.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted border-transparent'
                    }`}
                  >
                    <div className="font-medium truncate">{process.client_name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {process.process_type}
                    </div>
                  </div>
                ))}
                {filteredProcesses.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum processo encontrado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal de Criação */}
            {isCreatingProcess && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md m-4">
                  <CardHeader>
                    <CardTitle>Novo Processo</CardTitle>
                    <CardDescription>
                      Crie um novo processo para gerenciar documentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nome do Cliente *</Label>
                      <Input
                        value={newProcess.client_name}
                        onChange={(e) => setNewProcess({ ...newProcess, client_name: e.target.value })}
                        placeholder="Digite o nome do cliente"
                      />
                    </div>
                    <div>
                      <Label>Email do Cliente *</Label>
                      <Input
                        type="email"
                        value={newProcess.client_email}
                        onChange={(e) => setNewProcess({ ...newProcess, client_email: e.target.value })}
                        placeholder="Digite o email do cliente"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Processo *</Label>
                      <Select 
                        value={newProcess.process_type} 
                        onValueChange={(value) => setNewProcess({ ...newProcess, process_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {processTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Input
                        value={newProcess.description}
                        onChange={(e) => setNewProcess({ ...newProcess, description: e.target.value })}
                        placeholder="Descrição opcional"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreatingProcess(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button onClick={createProcess} className="flex-1">
                        Criar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-3">
            {selectedProcess ? (
              <div className="space-y-6">
                {/* Info do Processo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Processo: {selectedProcess.client_name}</CardTitle>
                    <CardDescription>
                      {selectedProcess.process_type} • Status: {selectedProcess.status}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="tasks" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="tasks">Tarefas</TabsTrigger>
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                    <TabsTrigger value="reports">Relatórios</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tasks" className="space-y-6">
                    <TaskManager 
                      processId={selectedProcess.id} 
                      companyId={company?.id || ''}
                    />
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-6">
                    <DocumentUpload 
                      processId={selectedProcess.id} 
                      onUploadComplete={handleUploadComplete}
                    />
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-6">
                    <DocumentList 
                      processId={selectedProcess.id} 
                      refreshKey={refreshKey}
                    />
                  </TabsContent>

                  <TabsContent value="reports" className="space-y-6">
                    <DocumentReport 
                      processId={selectedProcess.id} 
                      refreshKey={refreshKey}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Selecione um Processo</h3>
                    <p className="text-muted-foreground">
                      Selecione um processo da lista ou crie um novo para começar
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}