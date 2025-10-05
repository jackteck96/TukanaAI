import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  ArrowLeft, 
  Save,
  Search,
  Edit,
  Trash2,
  Eye,
  Copy,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ModeloDocumento {
  id: string;
  title: string;
  category: string;
  content: string;
  variables: string[];
  created_at: string;
  is_active: boolean;
  company_id?: string;
  is_global?: boolean;
}

const ModelosDocumentos = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: ""
  });

  const [modelos, setModelos] = useState<ModeloDocumento[]>([]);

  useEffect(() => {
    fetchUserCompany();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchModelos();
    }
  }, [companyId]);

  const fetchUserCompany = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching company:', error);
      return;
    }
    
    setCompanyId(data?.company_id || null);
  };

  const fetchModelos = async () => {
    try {
      setLoading(true);
      
      // Fetch global templates (admin)
      const { data: globalTemplates, error: globalError } = await supabase
        .from('global_document_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (globalError) throw globalError;

      // Fetch company templates
      const { data: companyTemplates, error: companyError } = await supabase
        .from('company_document_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (companyError) throw companyError;

      // Combine and mark templates
      const global = (globalTemplates || []).map(t => ({ ...t, is_global: true }));
      const company = (companyTemplates || []).map(t => ({ ...t, is_global: false }));
      
      setModelos([...company, ...global]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  };

  const categorias = [
    "Contrato",
    "Procuração", 
    "Certidão",
    "Declaração",
    "Petição",
    "Requerimento",
    "Acordo",
    "Outros"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const detectarVariaveis = (content: string): string[] => {
    const regex = /\[([^\]]+)\]/g;
    const variaveis = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variaveis.includes(match[1])) {
        variaveis.push(match[1]);
      }
    }
    return variaveis;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      toast.error('Empresa não encontrada');
      return;
    }

    const variables = detectarVariaveis(formData.content);
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('company_document_templates')
          .update({
            title: formData.title,
            category: formData.category,
            content: formData.content,
            variables
          })
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success("Modelo atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('company_document_templates')
          .insert({
            company_id: companyId,
            title: formData.title,
            category: formData.category,
            content: formData.content,
            variables
          });
        
        if (error) throw error;
        toast.success("Modelo criado com sucesso!");
      }
      
      setFormData({ title: "", category: "", content: "" });
      setShowForm(false);
      setEditingId(null);
      fetchModelos();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar modelo');
    }
  };

  const handleEdit = (modelo: ModeloDocumento) => {
    if (modelo.is_global) {
      toast.error('Modelos globais não podem ser editados');
      return;
    }

    setFormData({
      title: modelo.title,
      category: modelo.category,
      content: modelo.content
    });
    setEditingId(modelo.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, isGlobal: boolean) => {
    if (isGlobal) {
      toast.error('Modelos globais não podem ser excluídos');
      return;
    }

    try {
      const { error } = await supabase
        .from('company_document_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success("Modelo excluído com sucesso!");
      fetchModelos();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir modelo');
    }
  };

  const handlePreview = (modelo: ModeloDocumento) => {
    let conteudoPreview = modelo.content;
    conteudoPreview = conteudoPreview.replace(/\[CLIENTE\]/g, "João Silva, brasileiro, casado, empresário, portador do RG nº 12.345.678-9 SSP/SP e CPF nº 123.456.789-00, residente na Rua das Flores, 123, São Paulo/SP");
    conteudoPreview = conteudoPreview.replace(/\[EMPRESA\]/g, "Silva & Associados Advogados, CNPJ nº 12.345.678/0001-90, com sede na Av. Paulista, 1000, São Paulo/SP");
    conteudoPreview = conteudoPreview.replace(/\[DATA\]/g, new Date().toLocaleDateString('pt-BR'));
    
    setPreviewContent(conteudoPreview);
    setPreviewMode(true);
  };

  const getCategoriaColor = (categoria: string) => {
    const colors = {
      "Contrato": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "Procuração": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Certidão": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "Declaração": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      "Petição": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[categoria as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const filteredModelos = modelos.filter(modelo =>
    modelo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    modelo.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando modelos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/empresa">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Modelos de Documentos</h1>
                <p className="text-muted-foreground">Crie modelos de documentos com variáveis automáticas [CLIENTE] e [EMPRESA]</p>
              </div>
            </div>
            <Button 
              variant="hero" 
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ title: "", category: "", content: "" });
              }}
              disabled={showForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Modelo
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Modal de Preview */}
        {previewMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Preview do Documento</CardTitle>
                <Button variant="ghost" onClick={() => setPreviewMode(false)}>
                  ✕
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[70vh]">
                <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                  {previewContent}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulário de Cadastro */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>{editingId ? "Editar Modelo" : "Criar Novo Modelo"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Documento</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Ex: Contrato de Prestação de Serviços"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)} 
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Modelo do Documento</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Use <code className="bg-muted px-1 rounded">[CLIENTE]</code> e <code className="bg-muted px-1 rounded">[EMPRESA]</code> para inserir qualificações automáticas
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    placeholder="Digite o modelo do documento aqui... Use [CLIENTE] e [EMPRESA] onde quiser inserir as qualificações automáticas"
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                </div>

                {formData.content && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Variáveis detectadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {detectarVariaveis(formData.content).map((variavel) => (
                        <Badge key={variavel} variant="secondary">
                          {variavel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button type="submit" variant="hero">
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? "Atualizar Modelo" : "Salvar Modelo"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({ title: "", category: "", content: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Modelos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Modelos de Documentos</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar modelos..."
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredModelos.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum modelo encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredModelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-foreground">{modelo.title}</h3>
                        <Badge className={getCategoriaColor(modelo.category)}>
                          {modelo.category}
                        </Badge>
                        {modelo.is_global && (
                          <Badge variant="outline" className="border-primary text-primary">
                            <Globe className="h-3 w-3 mr-1" />
                            Global
                          </Badge>
                        )}
                        {modelo.is_active && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Ativo
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Criado em:</span> 
                          <span>{new Date(modelo.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Variáveis:</span> 
                          <span>{modelo.variables.length}</span>
                        </div>
                      </div>

                      {modelo.variables.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Variáveis do modelo:</p>
                          <div className="flex flex-wrap gap-1">
                            {modelo.variables.map((variavel) => (
                              <Badge key={variavel} variant="outline" className="text-xs">
                                {variavel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <p className="line-clamp-2">{modelo.content.substring(0, 100)}...</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePreview(modelo)}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(modelo.content);
                          toast.success("Modelo copiado para a área de transferência!");
                        }}
                        title="Copiar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(modelo)}
                        title="Editar"
                        disabled={modelo.is_global}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(modelo.id, modelo.is_global || false)}
                        title="Excluir"
                        disabled={modelo.is_global}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModelosDocumentos;