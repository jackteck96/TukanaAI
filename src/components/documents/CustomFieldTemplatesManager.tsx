import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Plus, Trash2, Settings2, GripVertical, Pencil } from "lucide-react";

interface CustomFieldTemplate {
  id: string;
  company_id: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  options: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  date: 'Data',
  number: 'Número',
  select: 'Seleção',
  checkbox: 'Checkbox',
};

const CustomFieldTemplatesManager = () => {
  const { company } = useCompany();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<CustomFieldTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomFieldTemplate | null>(null);
  
  // Form state
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<string>('text');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (company?.id) {
      loadTemplates();
    }
  }, [company?.id]);

  const loadTemplates = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('client_custom_field_templates')
      .select('*')
      .eq('company_id', company.id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os campos personalizados.",
        variant: "destructive",
      });
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFieldName('');
    setFieldType('text');
    setIsRequired(false);
    setOptions([]);
    setNewOption('');
    setEditingTemplate(null);
  };

  const handleOpenDialog = (template?: CustomFieldTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFieldName(template.field_name);
      setFieldType(template.field_type);
      setIsRequired(template.is_required);
      setOptions(template.options || []);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    setOptions([...options, newOption.trim()]);
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!company?.id || !fieldName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do campo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (fieldType === 'select' && options.length === 0) {
      toast({
        title: "Erro",
        description: "Campos do tipo seleção precisam de pelo menos uma opção.",
        variant: "destructive",
      });
      return;
    }

    if (fieldType === 'checkbox' && options.length === 0) {
      toast({
        title: "Erro",
        description: "Campos do tipo checkbox precisam de pelo menos uma opção (ex: Sim, Não).",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTemplate) {
        // Update existing
        const { error } = await supabase
          .from('client_custom_field_templates')
          .update({
            field_name: fieldName,
            field_type: fieldType,
            is_required: isRequired,
            options: (fieldType === 'select' || fieldType === 'checkbox') ? options : [],
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Campo atualizado com sucesso.",
        });
      } else {
        // Create new
        const maxOrder = templates.length > 0 
          ? Math.max(...templates.map(t => t.display_order)) + 1 
          : 0;

        const { error } = await supabase
          .from('client_custom_field_templates')
          .insert({
            company_id: company.id,
            field_name: fieldName,
            field_type: fieldType,
            is_required: isRequired,
            options: (fieldType === 'select' || fieldType === 'checkbox') ? options : [],
            display_order: maxOrder,
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Campo criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      console.error('Erro ao salvar campo:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o campo.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return;

    try {
      const { error } = await supabase
        .from('client_custom_field_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Campo excluído com sucesso.",
      });
      loadTemplates();
    } catch (error: any) {
      console.error('Erro ao excluir campo:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o campo.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (template: CustomFieldTemplate) => {
    try {
      const { error } = await supabase
        .from('client_custom_field_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: template.is_active ? "Campo desativado." : "Campo ativado.",
      });
      loadTemplates();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Campos Personalizados de Cliente
            </CardTitle>
            <CardDescription>
              Configure campos extras que aparecerão automaticamente ao cadastrar novos clientes
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Campo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Editar Campo' : 'Novo Campo Personalizado'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome do Campo *</Label>
                  <Input
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="Ex: Faturamento Anual"
                  />
                </div>

                <div>
                  <Label>Tipo do Campo</Label>
                  <Select value={fieldType} onValueChange={setFieldType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(fieldType === 'select' || fieldType === 'checkbox') && (
                  <div>
                    <Label>Opções {fieldType === 'checkbox' && '(ex: Sim, Não)'}</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Adicionar opção"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOption();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddOption}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {options.map((opt, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {opt}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(i)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="field-required"
                    checked={isRequired}
                    onCheckedChange={(checked) => setIsRequired(checked as boolean)}
                  />
                  <Label htmlFor="field-required" className="cursor-pointer">
                    Campo obrigatório
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingTemplate ? 'Salvar' : 'Criar Campo'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum campo personalizado configurado.</p>
            <p className="text-sm">Crie campos que aparecerão automaticamente ao cadastrar clientes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  template.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.field_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {FIELD_TYPE_LABELS[template.field_type] || template.field_type}
                      </Badge>
                      {template.is_required && (
                        <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                      )}
                      {!template.is_active && (
                        <Badge variant="destructive" className="text-xs">Inativo</Badge>
                      )}
                    </div>
                    {(template.field_type === 'select' || template.field_type === 'checkbox') && template.options?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Opções: {template.options.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(template)}
                    title={template.is_active ? 'Desativar' : 'Ativar'}
                  >
                    <Checkbox checked={template.is_active} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(template)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
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

export default CustomFieldTemplatesManager;
