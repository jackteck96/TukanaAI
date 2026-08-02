import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, GripVertical, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GlobalDocumentCategory {
  id: string;
  name: string;
  display_order: number;
}

interface GlobalDocumentCategoryManagerProps {
  onCategoriesChange?: () => void;
}

const GlobalDocumentCategoryManager = ({ onCategoriesChange }: GlobalDocumentCategoryManagerProps) => {
  const [categories, setCategories] = useState<GlobalDocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GlobalDocumentCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('global_document_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching global categories:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias globais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('global_document_categories')
          .update({ name: categoryName })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Categoria atualizada" });
      } else {
        const maxOrder = categories.length > 0 
          ? Math.max(...categories.map(c => c.display_order)) + 1 
          : 0;

        const { error } = await supabase
          .from('global_document_categories')
          .insert({
            name: categoryName,
            display_order: maxOrder
          });

        if (error) throw error;
        toast({ title: "Sucesso", description: "Categoria global criada" });
      }

      setCategoryName("");
      setEditingCategory(null);
      setIsModalOpen(false);
      fetchCategories();
      onCategoriesChange?.();
    } catch (error: any) {
      console.error('Error saving global category:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar categoria",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('global_document_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Categoria removida" });
      fetchCategories();
      onCategoriesChange?.();
    } catch (error: any) {
      console.error('Error deleting global category:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover categoria",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (category: GlobalDocumentCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setIsModalOpen(true);
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[newIndex];
    newCategories[newIndex] = temp;

    try {
      await Promise.all([
        supabase
          .from('global_document_categories')
          .update({ display_order: newIndex })
          .eq('id', temp.id),
        supabase
          .from('global_document_categories')
          .update({ display_order: index })
          .eq('id', newCategories[index].id)
      ]);

      setCategories(newCategories.map((c, i) => ({ ...c, display_order: i })));
      onCategoriesChange?.();
    } catch (error) {
      console.error('Error reordering categories:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Categorias Globais de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded w-full"></div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Categorias Globais de Documentos
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Estas categorias ficam disponíveis para todas as empresas e clientes da plataforma
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNewModal}>
              <Plus className="w-4 h-4 mr-1" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar' : 'Nova'} Categoria Global
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Nome da Categoria</Label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex: Pessoa Física, Certidões..."
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma categoria global cadastrada. Crie categorias para organizar os tipos de documentos de toda a plataforma.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors p-0.5"
                    >
                      <GripVertical className="w-4 h-4 rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === categories.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors p-0.5"
                    >
                      <GripVertical className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GlobalDocumentCategoryManager;
