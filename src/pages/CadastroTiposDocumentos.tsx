import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface TipoDocumento {
  id: number;
  nome: string;
  temDataValidade: boolean;
  temDataExpiracao: boolean;
  temLocalEmissao: boolean;
  observacoes: string;
}

const CadastroTiposDocumentos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([
    {
      id: 1,
      nome: "RG",
      temDataValidade: false,
      temDataExpiracao: false,
      temLocalEmissao: true,
      observacoes: "Documento de identidade obrigatório"
    },
    {
      id: 2,
      nome: "CPF",
      temDataValidade: false,
      temDataExpiracao: false,
      temLocalEmissao: false,
      observacoes: "Cadastro de Pessoa Física"
    },
    {
      id: 3,
      nome: "CNH",
      temDataValidade: true,
      temDataExpiracao: true,
      temLocalEmissao: true,
      observacoes: "Carteira Nacional de Habilitação"
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoDocumento | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    temDataValidade: false,
    temDataExpiracao: false,
    temLocalEmissao: false,
    observacoes: ""
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do documento é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (editingTipo) {
      setTiposDocumentos(prev => prev.map(tipo => 
        tipo.id === editingTipo.id 
          ? { ...tipo, ...formData }
          : tipo
      ));
      toast({
        title: "Sucesso",
        description: "Tipo de documento atualizado com sucesso"
      });
    } else {
      const novoTipo: TipoDocumento = {
        id: Date.now(),
        ...formData
      };
      setTiposDocumentos(prev => [...prev, novoTipo]);
      toast({
        title: "Sucesso", 
        description: "Tipo de documento cadastrado com sucesso"
      });
    }

    setFormData({
      nome: "",
      temDataValidade: false,
      temDataExpiracao: false,
      temLocalEmissao: false,
      observacoes: ""
    });
    setEditingTipo(null);
    setIsModalOpen(false);
  };

  const handleEdit = (tipo: TipoDocumento) => {
    setEditingTipo(tipo);
    setFormData({
      nome: tipo.nome,
      temDataValidade: tipo.temDataValidade,
      temDataExpiracao: tipo.temDataExpiracao,
      temLocalEmissao: tipo.temLocalEmissao,
      observacoes: tipo.observacoes
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setTiposDocumentos(prev => prev.filter(tipo => tipo.id !== id));
    toast({
      title: "Sucesso",
      description: "Tipo de documento removido com sucesso"
    });
  };

  const openNewModal = () => {
    setEditingTipo(null);
    setFormData({
      nome: "",
      temDataValidade: false,
      temDataExpiracao: false,
      temLocalEmissao: false,
      observacoes: ""
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Cadastro de Tipos de Documentos
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os tipos de documentos disponíveis no sistema
            </p>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewModal} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Tipo de Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTipo ? 'Editar' : 'Cadastrar'} Tipo de Documento
                </DialogTitle>
                <DialogDescription>
                  {editingTipo ? 'Atualize' : 'Adicione'} as informações do tipo de documento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Documento</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: RG, CPF, CNH..."
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="temDataValidade"
                      checked={formData.temDataValidade}
                      onCheckedChange={(checked) => 
                        handleInputChange('temDataValidade', checked as boolean)
                      }
                    />
                    <Label htmlFor="temDataValidade">Possui data de validade</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="temDataExpiracao"
                      checked={formData.temDataExpiracao}
                      onCheckedChange={(checked) => 
                        handleInputChange('temDataExpiracao', checked as boolean)
                      }
                    />
                    <Label htmlFor="temDataExpiracao">Possui data de expiração</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="temLocalEmissao"
                      checked={formData.temLocalEmissao}
                      onCheckedChange={(checked) => 
                        handleInputChange('temLocalEmissao', checked as boolean)
                      }
                    />
                    <Label htmlFor="temLocalEmissao">Requer local de emissão</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Informações adicionais sobre o documento..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingTipo ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {tiposDocumentos.map((tipo) => (
            <Card key={tipo.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tipo.nome}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(tipo)}
                      className="h-8 w-8 hover:bg-accent"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(tipo.id)}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tipo.temDataValidade && (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        Data de Validade
                      </span>
                    )}
                    {tipo.temDataExpiracao && (
                      <span className="px-2 py-1 bg-accent/10 text-accent-foreground text-xs rounded-full">
                        Data de Expiração
                      </span>
                    )}
                    {tipo.temLocalEmissao && (
                      <span className="px-2 py-1 bg-secondary/50 text-secondary-foreground text-xs rounded-full">
                        Local de Emissão
                      </span>
                    )}
                  </div>
                  {tipo.observacoes && (
                    <p className="text-sm text-muted-foreground">
                      {tipo.observacoes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tiposDocumentos.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">
                Nenhum tipo de documento cadastrado ainda.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Novo Tipo de Documento" para começar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CadastroTiposDocumentos;