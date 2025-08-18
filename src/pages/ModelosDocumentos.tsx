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

interface TipoDocumento {
  id: number;
  nomeDocumento: string;
  tipoDocumento: string;
  exigeDatas: boolean;
  exigeLocal: boolean;
  observacoes: string;
  ativo: boolean;
}

const ModelosDocumentos = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nomeDocumento: "",
    tipoDocumento: "",
    exigeDatas: false,
    exigeLocal: false,
    observacoes: ""
  });

  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([
    {
      id: 1,
      nomeDocumento: "RG - Registro Geral",
      tipoDocumento: "Documento de Identidade",
      exigeDatas: true,
      exigeLocal: true,
      observacoes: "Documento de identificação pessoal",
      ativo: true
    },
    {
      id: 2,
      nomeDocumento: "CPF - Cadastro de Pessoa Física",
      tipoDocumento: "Documento Fiscal",
      exigeDatas: false,
      exigeLocal: false,
      observacoes: "Documento fiscal obrigatório",
      ativo: true
    },
    {
      id: 3,
      nomeDocumento: "Comprovante de Residência",
      tipoDocumento: "Comprovante",
      exigeDatas: true,
      exigeLocal: false,
      observacoes: "Comprovante de endereço atualizado",
      ativo: true
    },
    {
      id: 4,
      nomeDocumento: "CNPJ - Cadastro Nacional da Pessoa Jurídica",
      tipoDocumento: "Documento Empresarial",
      exigeDatas: true,
      exigeLocal: true,
      observacoes: "Documento de identificação da empresa",
      ativo: true
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
    if (field === "exigeDatas" || field === "exigeLocal") {
      setFormData(prev => ({
        ...prev,
        [field]: value === "true"
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novoTipo: TipoDocumento = {
      id: tiposDocumentos.length + 1,
      ...formData,
      ativo: true
    };
    setTiposDocumentos(prev => [...prev, novoTipo]);
    setFormData({
      nomeDocumento: "",
      tipoDocumento: "",
      exigeDatas: false,
      exigeLocal: false,
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
                <h1 className="text-2xl font-bold text-foreground">Tipos de Documentos</h1>
                <p className="text-muted-foreground">Cadastre os tipos de documentos que podem ser solicitados aos clientes</p>
              </div>
            </div>
            <Button 
              variant="hero" 
              onClick={() => setShowForm(true)}
              disabled={showForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
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
                <span>Cadastrar Novo Tipo de Documento</span>
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
                      placeholder="Ex: RG - Registro Geral"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tipoDocumento">Categoria do Documento</Label>
                    <Select onValueChange={(value) => handleInputChange("tipoDocumento", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposDocumento.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="exigeDatas"
                      checked={formData.exigeDatas}
                      onChange={(e) => handleInputChange("exigeDatas", e.target.checked.toString())}
                      className="rounded border-border"
                    />
                    <Label htmlFor="exigeDatas">Exige datas de emissão/expiração</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="exigeLocal"
                      checked={formData.exigeLocal}
                      onChange={(e) => handleInputChange("exigeLocal", e.target.checked.toString())}
                      className="rounded border-border"
                    />
                    <Label htmlFor="exigeLocal">Exige local de expedição</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange("observacoes", e.target.value)}
                    placeholder="Adicione observações sobre este tipo de documento..."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" variant="hero">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Tipo
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

        {/* Lista de Tipos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Tipos de Documentos Cadastrados</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar tipos..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tiposDocumentos.map((tipo) => (
                <div
                  key={tipo.id}
                  className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-foreground">{tipo.nomeDocumento}</h3>
                        <Badge className={getTipoColor(tipo.tipoDocumento)}>
                          {tipo.tipoDocumento}
                        </Badge>
                        {tipo.ativo && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Ativo
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Datas:</span> 
                          <span className={tipo.exigeDatas ? "text-green-600" : "text-red-600"}>
                            {tipo.exigeDatas ? "Obrigatórias" : "Não exigidas"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Local:</span> 
                          <span className={tipo.exigeLocal ? "text-green-600" : "text-red-600"}>
                            {tipo.exigeLocal ? "Obrigatório" : "Não exigido"}
                          </span>
                        </div>
                      </div>

                      {tipo.observacoes && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Observações:</span> {tipo.observacoes}
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