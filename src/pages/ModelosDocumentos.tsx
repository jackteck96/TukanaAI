import { useState } from "react";
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
  Copy
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface ModeloDocumento {
  id: number;
  titulo: string;
  categoria: string;
  conteudo: string;
  variaveis: string[];
  criadoEm: string;
  ativo: boolean;
}

const ModelosDocumentos = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [formData, setFormData] = useState({
    titulo: "",
    categoria: "",
    conteudo: ""
  });

  const [modelos, setModelos] = useState<ModeloDocumento[]>([
    {
      id: 1,
      titulo: "Contrato de Prestação de Serviços",
      categoria: "Contrato",
      conteudo: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nCONTRATANTE: [CLIENTE]\nCONTRATADA: [EMPRESA]\n\nO CONTRATANTE, pessoa física/jurídica, qualificada como [CLIENTE], e a CONTRATADA, [EMPRESA], celebram o presente contrato mediante as seguintes cláusulas:\n\n1. DO OBJETO\nA CONTRATADA prestará serviços jurídicos conforme especificado no Anexo I.\n\n2. DAS OBRIGAÇÕES\nO CONTRATANTE se compromete a fornecer todas as informações necessárias.\nA CONTRATADA se compromete a executar os serviços com diligência.\n\n3. DO VALOR\nO valor dos serviços será conforme proposta anexa.\n\nData: [DATA]\n\n_____________________        _____________________\n[CLIENTE]                    [EMPRESA]",
      variaveis: ["CLIENTE", "EMPRESA", "DATA"],
      criadoEm: "2024-01-15",
      ativo: true
    },
    {
      id: 2,
      titulo: "Procuração Específica",
      categoria: "Procuração",
      conteudo: "PROCURAÇÃO ESPECÍFICA\n\nOutorgante: [CLIENTE]\nOutorgado: [EMPRESA]\n\nPelo presente instrumento particular de procuração, [CLIENTE], brasileiro(a), qualificado(a) como acima, nomeia e constitui seu bastante procurador [EMPRESA], para o fim específico de:\n\n- Representar o outorgante em todos os atos necessários;\n- Assinar documentos em nome do outorgante;\n- Praticar todos os demais atos necessários ao cumprimento do presente mandato.\n\nEsta procuração é válida até [DATA].\n\nLocal e data: _____________, ____ de _______ de 2024.\n\n_____________________\n[CLIENTE]",
      variaveis: ["CLIENTE", "EMPRESA", "DATA"],
      criadoEm: "2024-01-20",
      ativo: true
    }
  ]);

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

  const detectarVariaveis = (conteudo: string): string[] => {
    const regex = /\[([^\]]+)\]/g;
    const variaveis = [];
    let match;
    while ((match = regex.exec(conteudo)) !== null) {
      if (!variaveis.includes(match[1])) {
        variaveis.push(match[1]);
      }
    }
    return variaveis;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const variaveis = detectarVariaveis(formData.conteudo);
    
    if (editingId) {
      setModelos(prev => prev.map(modelo => 
        modelo.id === editingId 
          ? { ...modelo, ...formData, variaveis }
          : modelo
      ));
      toast("Modelo atualizado com sucesso!");
      setEditingId(null);
    } else {
      const novoModelo: ModeloDocumento = {
        id: modelos.length + 1,
        ...formData,
        variaveis,
        criadoEm: new Date().toISOString().split('T')[0],
        ativo: true
      };
      setModelos(prev => [...prev, novoModelo]);
      toast("Modelo criado com sucesso!");
    }
    
    setFormData({ titulo: "", categoria: "", conteudo: "" });
    setShowForm(false);
  };

  const handleEdit = (modelo: ModeloDocumento) => {
    setFormData({
      titulo: modelo.titulo,
      categoria: modelo.categoria,
      conteudo: modelo.conteudo
    });
    setEditingId(modelo.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setModelos(prev => prev.filter(modelo => modelo.id !== id));
    toast("Modelo excluído com sucesso!");
  };

  const handlePreview = (modelo: ModeloDocumento) => {
    // Simular dados de cliente e empresa para preview
    let conteudoPreview = modelo.conteudo;
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
                setFormData({ titulo: "", categoria: "", conteudo: "" });
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
                    <Label htmlFor="titulo">Título do Documento</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => handleInputChange("titulo", e.target.value)}
                      placeholder="Ex: Contrato de Prestação de Serviços"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select 
                      value={formData.categoria}
                      onValueChange={(value) => handleInputChange("categoria", value)} 
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
                  <Label htmlFor="conteudo">Modelo do Documento</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Use <code className="bg-muted px-1 rounded">[CLIENTE]</code> e <code className="bg-muted px-1 rounded">[EMPRESA]</code> para inserir qualificações automáticas
                  </div>
                  <Textarea
                    id="conteudo"
                    value={formData.conteudo}
                    onChange={(e) => handleInputChange("conteudo", e.target.value)}
                    placeholder="Digite o modelo do documento aqui... Use [CLIENTE] e [EMPRESA] onde quiser inserir as qualificações automáticas"
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                </div>

                {formData.conteudo && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Variáveis detectadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {detectarVariaveis(formData.conteudo).map((variavel) => (
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
                      setFormData({ titulo: "", categoria: "", conteudo: "" });
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
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-foreground">{modelo.titulo}</h3>
                        <Badge className={getCategoriaColor(modelo.categoria)}>
                          {modelo.categoria}
                        </Badge>
                        {modelo.ativo && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Ativo
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Criado em:</span> 
                          <span>{new Date(modelo.criadoEm).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Variáveis:</span> 
                          <span>{modelo.variaveis.length}</span>
                        </div>
                      </div>

                      {modelo.variaveis.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Variáveis do modelo:</p>
                          <div className="flex flex-wrap gap-1">
                            {modelo.variaveis.map((variavel) => (
                              <Badge key={variavel} variant="outline" className="text-xs">
                                {variavel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <p className="line-clamp-2">{modelo.conteudo.substring(0, 100)}...</p>
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
                          navigator.clipboard.writeText(modelo.conteudo);
                          toast("Modelo copiado para a área de transferência!");
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(modelo.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModelosDocumentos;