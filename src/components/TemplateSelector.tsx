import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, Globe, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Template {
  id: string;
  title: string;
  category: string;
  content: string;
  variables: string[];
  is_global?: boolean;
}

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processData?: {
    client_name: string;
    client_email: string;
  };
  companyId: string;
  onTemplateSelected: (template: Template) => void;
}

export const TemplateSelector = ({ 
  open, 
  onOpenChange, 
  processData,
  companyId,
  onTemplateSelected 
}: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open && companyId) {
      fetchTemplates();
    }
  }, [open, companyId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // Fetch global templates
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

      const global = (globalTemplates || []).map(t => ({ ...t, is_global: true }));
      const company = (companyTemplates || []).map(t => ({ ...t, is_global: false }));
      
      setTemplates([...company, ...global]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
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

  const handleSelectTemplate = (template: Template) => {
    onTemplateSelected(template);
    onOpenChange(false);
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Selecionar Modelo de Documento</span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar modelos..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum modelo encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-foreground">{template.title}</h3>
                          <Badge className={getCategoriaColor(template.category)}>
                            {template.category}
                          </Badge>
                          {template.is_global && (
                            <Badge variant="outline" className="border-primary text-primary">
                              <Globe className="h-3 w-3 mr-1" />
                              Global
                            </Badge>
                          )}
                        </div>
                        
                        {template.variables.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Variáveis:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((variable) => (
                                <Badge key={variable} variant="outline" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.content.substring(0, 150)}...
                        </p>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="ml-2"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};