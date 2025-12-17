import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash2, Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import DocumentCategoryManager from "@/components/DocumentCategoryManager";

interface TipoDocumento {
  id: string;
  name: string;
  has_issue_date: boolean;
  has_expiration_date: boolean;
  requires_issuing_location: boolean;
  notes: string;
  category_id: string | null;
}

interface DocumentCategory {
  id: string;
  name: string;
  display_order: number;
  is_global?: boolean;
}

const CadastroTiposDocumentos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoDocumento | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    has_issue_date: false,
    has_expiration_date: false,
    requires_issuing_location: false,
    notes: "",
    category_id: ""
  });

  const fetchDocumentTypes = async () => {
    if (!company?.id) return;

    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTiposDocumentos(data || []);
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de documentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch global categories
      const { data: globalData, error: globalError } = await supabase
        .from('global_document_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (globalError) throw globalError;

      // Fetch company-specific categories
      let companyCategories: DocumentCategory[] = [];
      if (company?.id) {
        const { data: companyData, error: companyError } = await supabase
          .from('document_categories')
          .select('*')
          .eq('company_id', company.id)
          .order('display_order', { ascending: true });

        if (companyError) throw companyError;
        companyCategories = (companyData || []).map(c => ({ ...c, is_global: false }));
      }

      // Merge global and company categories
      const globalCategories = (globalData || []).map(c => ({ ...c, is_global: true }));
      setCategories([...globalCategories, ...companyCategories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
    fetchCategories();
  }, [company?.id]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do documento é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!company?.id || !user?.id) {
      toast({
        title: "Erro",
        description: "Usuário ou empresa não identificados",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        name: formData.name,
        has_issue_date: formData.has_issue_date,
        has_expiration_date: formData.has_expiration_date,
        requires_issuing_location: formData.requires_issuing_location,
        notes: formData.notes,
        category_id: formData.category_id || null
      };

      if (editingTipo) {
        const { error } = await supabase
          .from('document_types')
          .update(payload)
          .eq('id', editingTipo.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Tipo de documento atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('document_types')
          .insert({
            ...payload,
            company_id: company.id
          });

        if (error) throw error;

        toast({
          title: "Sucesso", 
          description: "Tipo de documento cadastrado com sucesso"
        });
      }

      setFormData({
        name: "",
        has_issue_date: false,
        has_expiration_date: false,
        requires_issuing_location: false,
        notes: "",
        category_id: ""
      });
      setEditingTipo(null);
      setIsModalOpen(false);
      fetchDocumentTypes();
    } catch (error: any) {
      console.error('Error saving document type:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar tipo de documento",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (tipo: TipoDocumento) => {
    setEditingTipo(tipo);
    setFormData({
      name: tipo.name,
      has_issue_date: tipo.has_issue_date,
      has_expiration_date: tipo.has_expiration_date,
      requires_issuing_location: tipo.requires_issuing_location,
      notes: tipo.notes,
      category_id: tipo.category_id || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('document_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de documento removido com sucesso"
      });
      fetchDocumentTypes();
    } catch (error: any) {
      console.error('Error deleting document type:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover tipo de documento",
        variant: "destructive"
      });
    }
  };

  const openNewModal = () => {
    setEditingTipo(null);
    setFormData({
      name: "",
      has_issue_date: false,
      has_expiration_date: false,
      requires_issuing_location: false,
      notes: "",
      category_id: ""
    });
    setIsModalOpen(true);
  };

  const getCategoryInfo = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category ? { name: category.name, is_global: category.is_global } : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/empresa')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tipos de Documentos
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie categorias e tipos de documentos
            </p>
          </div>
        </div>

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="documents">Tipos de Documentos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-end">
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
                      <Label htmlFor="name">Nome do Documento</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Ex: RG, CPF, CNH..."
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.category_id || "__none__"}
                        onValueChange={(value) => handleInputChange('category_id', value === "__none__" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sem categoria</SelectItem>
                          {categories.filter(c => c.is_global).length > 0 && (
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                              Categorias Globais
                            </div>
                          )}
                          {categories.filter(c => c.is_global).map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                          {categories.filter(c => !c.is_global).length > 0 && (
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                              Categorias da Empresa
                            </div>
                          )}
                          {categories.filter(c => !c.is_global).map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_issue_date"
                          checked={formData.has_issue_date}
                          onCheckedChange={(checked) => 
                            handleInputChange('has_issue_date', checked as boolean)
                          }
                        />
                        <Label htmlFor="has_issue_date">Possui data de emissão</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_expiration_date"
                          checked={formData.has_expiration_date}
                          onCheckedChange={(checked) => 
                            handleInputChange('has_expiration_date', checked as boolean)
                          }
                        />
                        <Label htmlFor="has_expiration_date">Possui data de expiração</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requires_issuing_location"
                          checked={formData.requires_issuing_location}
                          onCheckedChange={(checked) => 
                            handleInputChange('requires_issuing_location', checked as boolean)
                          }
                        />
                        <Label htmlFor="requires_issuing_location">Requer local de emissão</Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
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
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{tipo.name}</CardTitle>
                        {getCategoryInfo(tipo.category_id) && (
                          <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                            getCategoryInfo(tipo.category_id)?.is_global 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <Folder className="w-3 h-3" />
                            {getCategoryInfo(tipo.category_id)?.name}
                          </span>
                        )}
                      </div>
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
                        {tipo.has_issue_date && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            Data de Emissão
                          </span>
                        )}
                        {tipo.has_expiration_date && (
                          <span className="px-2 py-1 bg-accent/10 text-accent-foreground text-xs rounded-full">
                            Data de Expiração
                          </span>
                        )}
                        {tipo.requires_issuing_location && (
                          <span className="px-2 py-1 bg-secondary/50 text-secondary-foreground text-xs rounded-full">
                            Local de Emissão
                          </span>
                        )}
                      </div>
                      {tipo.notes && (
                        <p className="text-sm text-muted-foreground">
                          {tipo.notes}
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
          </TabsContent>

          <TabsContent value="categories">
            <DocumentCategoryManager onCategoriesChange={fetchCategories} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CadastroTiposDocumentos;