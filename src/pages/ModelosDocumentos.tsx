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
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";

interface ModeloDocumento {
  id: number;
  nomeDocumento: string;
  tipoDocumento: string;
  dataEmissao: string;
  dataExpiracao: string;
  localDocumento: string;
  observacoes: string;
}

const ModelosDocumentos = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nomeDocumento: "",
    tipoDocumento: "",
    dataEmissao: "",
    dataExpiracao: "",
    localDocumento: "",
    observacoes: ""
  });

  const [modelos, setModelos] = useState<ModeloDocumento[]>([
    {
      id: 1,
      nomeDocumento: "Contrato de Prestação de Serviços",
      tipoDocumento: "Contrato",
      dataEmissao: "2024-01-15",
      dataExpiracao: "2024-12-15",
      localDocumento: "São Paulo - SP",
      observacoes: "Modelo padrão para contratos de prestação de serviços"
    },
    {
      id: 2,
      nomeDocumento: "Certidão Negativa de Débitos",
      tipoDocumento: "Certidão",
      dataEmissao: "2024-02-10",
      dataExpiracao: "2024-08-10",
      localDocumento: "Receita Federal",
      observacoes: "Renovação automática a cada 6 meses"
    }
  ]);

  const tiposDocumento = [
    "Contrato",
    "Certidão",
    "Licença",
    "Alvará",
    "Autorização",
    "Declaração",
    "Comprovante",
    "Outros"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novoModelo: ModeloDocumento = {
      id: modelos.length + 1,
      ...formData
    };
    setModelos(prev => [...prev, novoModelo]);
    setFormData({
      nomeDocumento: "",
      tipoDocumento: "",
      dataEmissao: "",
      dataExpiracao: "",
      localDocumento: "",
      observacoes: ""
    });
    setShowForm(false);
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      "Contrato": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "Certidão": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Licença": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "Alvará": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      "Autorização": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    };
    return colors[tipo as keyof typeof colors] || "bg-muted text-muted-foreground";
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
                <p className="text-muted-foreground">Gerencie os modelos de documentos da empresa</p>
              </div>
            </div>
            <Button 
              variant="hero" 
              onClick={() => setShowForm(true)}
              disabled={showForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Modelo
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Formulário de Cadastro */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Cadastrar Novo Modelo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeDocumento">Nome do Documento</Label>
                    <Input
                      id="nomeDocumento"
                      value={formData.nomeDocumento}
                      onChange={(e) => handleInputChange("nomeDocumento", e.target.value)}
                      placeholder="Ex: Contrato de Prestação de Serviços"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tipoDocumento">Tipo do Documento</Label>
                    <Select onValueChange={(value) => handleInputChange("tipoDocumento", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposDocumento.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataEmissao">Data de Emissão</Label>
                    <Input
                      id="dataEmissao"
                      type="date"
                      value={formData.dataEmissao}
                      onChange={(e) => handleInputChange("dataEmissao", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataExpiracao">Data de Expiração</Label>
                    <Input
                      id="dataExpiracao"
                      type="date"
                      value={formData.dataExpiracao}
                      onChange={(e) => handleInputChange("dataExpiracao", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localDocumento">Local do Documento</Label>
                    <Input
                      id="localDocumento"
                      value={formData.localDocumento}
                      onChange={(e) => handleInputChange("localDocumento", e.target.value)}
                      placeholder="Ex: São Paulo - SP"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange("observacoes", e.target.value)}
                    placeholder="Adicione observações sobre este modelo de documento..."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" variant="hero">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Modelo
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
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
                <span>Modelos Cadastrados</span>
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
                        <h3 className="font-semibold text-foreground">{modelo.nomeDocumento}</h3>
                        <Badge className={getTipoColor(modelo.tipoDocumento)}>
                          {modelo.tipoDocumento}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-2">
                        <div>
                          <span className="font-medium">Emissão:</span> {new Date(modelo.dataEmissao).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-medium">Expiração:</span> {new Date(modelo.dataExpiracao).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-medium">Local:</span> {modelo.localDocumento}
                        </div>
                      </div>

                      {modelo.observacoes && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Observações:</span> {modelo.observacoes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
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