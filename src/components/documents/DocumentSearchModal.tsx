import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Download, Eye, Filter, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  document_type: string;
  status: string;
  uploaded_by: string;
  created_at: string;
  process_id: string;
  // Dados do processo
  client_name?: string;
  process_type?: string;
}

interface DocumentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentSearchModal({ isOpen, onClose }: DocumentSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  useEffect(() => {
    filterDocuments();
  }, [searchTerm, documents, statusFilter, typeFilter]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          processes!inner(
            client_name,
            process_type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const documentsWithProcessInfo = (data || []).map(doc => ({
        ...doc,
        client_name: doc.processes?.client_name,
        process_type: doc.processes?.process_type
      }));

      setDocuments(documentsWithProcessInfo);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.file_name.toLowerCase().includes(term) ||
        doc.document_type.toLowerCase().includes(term) ||
        doc.uploaded_by.toLowerCase().includes(term) ||
        doc.client_name?.toLowerCase().includes(term) ||
        doc.process_type?.toLowerCase().includes(term)
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === typeFilter);
    }

    setFilteredDocuments(filtered);
  };

  const handleSearch = () => {
    filterDocuments();
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao fazer download do arquivo');
    }
  };

  const handleView = async (filePath: string) => {
    try {
      console.debug('[DocumentSearchModal] Visualizar via Blob:', filePath);

      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;
      if (!data) throw new Error('Arquivo não encontrado');

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error('Erro ao visualizar:', error);
      toast.error('Erro ao visualizar arquivo');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-green-100 text-green-800';
      case 'Rejeitado':
        return 'bg-red-100 text-red-800';
      case 'Ajustes Solicitados':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const documentTypes = [...new Set(documents.map(doc => doc.document_type))];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Documentos
          </DialogTitle>
          <DialogDescription>
            Encontre documentos por nome, tipo, cliente ou responsável
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros de busca */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Digite o nome do arquivo, cliente, tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                <SelectItem value="Ajustes Solicitados">Ajustes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="default">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {/* Resultados */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  {filteredDocuments.length} documento(s) encontrado(s)
                </div>
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gradient-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate">{doc.file_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{doc.document_type}</span>
                            <span>•</span>
                            <span>{doc.client_name} - {doc.process_type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {doc.uploaded_by}
                        </span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(doc.file_path)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(doc.file_path, doc.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}