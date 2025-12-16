import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomField {
  id?: string;
  template_id?: string;
  field_name: string;
  field_type: 'text' | 'date' | 'number' | 'select' | 'checkbox';
  field_value: string;
  is_required: boolean;
  options?: string[];
}

interface ClientCustomFieldsProps {
  companyId: string;
  customFields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  showAddButton?: boolean;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  date: 'Data',
  number: 'Número',
  select: 'Seleção',
  checkbox: 'Checkbox',
};

const ClientCustomFields = ({ 
  companyId, 
  customFields, 
  onChange, 
  showAddButton = true 
}: ClientCustomFieldsProps) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<CustomField>({
    field_name: '',
    field_type: 'text',
    field_value: '',
    is_required: false,
    options: [],
  });
  const [newOption, setNewOption] = useState('');

  // Carregar templates da empresa
  useEffect(() => {
    const loadTemplates = async () => {
      if (!companyId) return;
      
      const { data, error } = await supabase
        .from('client_custom_field_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setTemplates(data);
        
        // Adicionar campos dos templates que ainda não foram adicionados
        const existingTemplateIds = customFields
          .filter(f => f.template_id)
          .map(f => f.template_id);
        
        const newFieldsFromTemplates = data
          .filter(t => !existingTemplateIds.includes(t.id))
          .map(t => ({
            template_id: t.id,
            field_name: t.field_name,
            field_type: t.field_type as CustomField['field_type'],
            field_value: t.field_type === 'checkbox' ? 'false' : '',
            is_required: t.is_required,
            options: t.options || [],
          }));

        if (newFieldsFromTemplates.length > 0) {
          onChange([...customFields, ...newFieldsFromTemplates]);
        }
      }
    };

    loadTemplates();
  }, [companyId]);

  const handleFieldChange = (index: number, value: string) => {
    const updated = [...customFields];
    updated[index].field_value = value;
    onChange(updated);
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const updated = [...customFields];
    updated[index].field_value = checked ? 'true' : 'false';
    onChange(updated);
  };

  const handleAddField = () => {
    if (!newField.field_name.trim()) return;
    
    const fieldToAdd: CustomField = {
      ...newField,
      field_value: newField.field_type === 'checkbox' ? 'false' : '',
    };
    
    onChange([...customFields, fieldToAdd]);
    setNewField({
      field_name: '',
      field_type: 'text',
      field_value: '',
      is_required: false,
      options: [],
    });
    setShowAddField(false);
  };

  const handleRemoveField = (index: number) => {
    const field = customFields[index];
    // Só permitir remover campos ad-hoc (sem template_id)
    if (!field.template_id) {
      const updated = customFields.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    setNewField({
      ...newField,
      options: [...(newField.options || []), newOption.trim()],
    });
    setNewOption('');
  };

  const handleRemoveOption = (optionIndex: number) => {
    setNewField({
      ...newField,
      options: newField.options?.filter((_, i) => i !== optionIndex) || [],
    });
  };

  const renderFieldInput = (field: CustomField, index: number) => {
    switch (field.field_type) {
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`custom-field-${index}`}
              checked={field.field_value === 'true'}
              onCheckedChange={(checked) => handleCheckboxChange(index, checked as boolean)}
            />
            <Label htmlFor={`custom-field-${index}`} className="cursor-pointer">
              {field.field_name}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );
      
      case 'select':
        return (
          <div>
            <Label>
              {field.field_name}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={field.field_value}
              onValueChange={(value) => handleFieldChange(index, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt, i) => (
                  <SelectItem key={i} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'date':
        return (
          <div>
            <Label>
              {field.field_name}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="date"
              value={field.field_value}
              onChange={(e) => handleFieldChange(index, e.target.value)}
              required={field.is_required}
            />
          </div>
        );
      
      case 'number':
        return (
          <div>
            <Label>
              {field.field_name}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="number"
              value={field.field_value}
              onChange={(e) => handleFieldChange(index, e.target.value)}
              required={field.is_required}
            />
          </div>
        );
      
      default: // text
        return (
          <div>
            <Label>
              {field.field_name}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="text"
              value={field.field_value}
              onChange={(e) => handleFieldChange(index, e.target.value)}
              required={field.is_required}
            />
          </div>
        );
    }
  };

  // Se não há campos e não deve mostrar botão de adicionar, não renderizar nada
  if (customFields.length === 0 && !showAddButton) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Campos Personalizados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campos existentes */}
        {customFields.map((field, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1">
              {renderFieldInput(field, index)}
            </div>
            {!field.template_id && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-6"
                onClick={() => handleRemoveField(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
            {field.template_id && (
              <Badge variant="secondary" className="mt-6 text-xs">
                Pré-definido
              </Badge>
            )}
          </div>
        ))}

        {/* Formulário para adicionar novo campo */}
        {showAddField && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome do Campo</Label>
                  <Input
                    value={newField.field_name}
                    onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
                    placeholder="Ex: Faturamento Anual"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={newField.field_type}
                    onValueChange={(v) => setNewField({ 
                      ...newField, 
                      field_type: v as CustomField['field_type'],
                      options: v === 'select' ? [] : newField.options
                    })}
                  >
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
              </div>

              {newField.field_type === 'select' && (
                <div>
                  <Label>Opções</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Adicionar opção"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {newField.options?.map((opt, i) => (
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
                  id="new-field-required"
                  checked={newField.is_required}
                  onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked as boolean })}
                />
                <Label htmlFor="new-field-required" className="cursor-pointer">
                  Campo obrigatório
                </Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddField(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddField}
                  disabled={!newField.field_name.trim() || (newField.field_type === 'select' && (!newField.options || newField.options.length === 0))}
                >
                  Adicionar Campo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão para adicionar campo */}
        {showAddButton && !showAddField && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAddField(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Campo Personalizado
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientCustomFields;
