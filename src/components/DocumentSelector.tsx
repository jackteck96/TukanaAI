import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Plus, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

interface DocumentType {
  id: string;
  name: string;
  category_id: string | null;
}

interface DocumentCategory {
  id: string;
  name: string;
  display_order: number;
}

interface DocumentSelectorProps {
  selectedDocuments: string[];
  onSelectionChange: (documents: string[]) => void;
}

const DocumentSelector = ({ selectedDocuments, onSelectionChange }: DocumentSelectorProps) => {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherDocumentName, setOtherDocumentName] = useState("");
  const { company } = useCompany();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch global categories first (these are the main categories)
        const { data: globalCategoriesData } = await supabase
          .from('global_document_categories')
          .select('*')
          .order('display_order', { ascending: true });

        // Fetch company-specific categories if company exists
        let companyCategoriesData: DocumentCategory[] = [];
        if (company?.id) {
          const { data } = await supabase
            .from('document_categories')
            .select('*')
            .eq('company_id', company.id)
            .order('display_order', { ascending: true });
          companyCategoriesData = data || [];
        }

        // Fetch company document types
        let companyTypes: DocumentType[] = [];
        if (company?.id) {
          const { data } = await supabase
            .from('document_types')
            .select('id, name, category_id')
            .eq('company_id', company.id)
            .order('name');
          companyTypes = data || [];
        }

        // Fetch global document types
        const { data: globalTypes } = await supabase
          .from('global_document_types')
          .select('id, name, category_id')
          .order('name');

        // Combine categories - global first, then company-specific
        const allCategories: DocumentCategory[] = [
          ...(globalCategoriesData || []),
          ...(companyCategoriesData || [])
        ];
        setCategories(allCategories);
        
        // Combine and dedupe document types by name
        const allTypes: DocumentType[] = [];
        const seenNames = new Set<string>();
        
        // Company types take priority
        for (const type of companyTypes) {
          if (!seenNames.has(type.name)) {
            seenNames.add(type.name);
            allTypes.push(type);
          }
        }
        
        // Then global types
        for (const type of (globalTypes || [])) {
          if (!seenNames.has(type.name)) {
            seenNames.add(type.name);
            allTypes.push(type);
          }
        }

        setDocumentTypes(allTypes);
      } catch (error) {
        console.error('Error fetching document data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [company?.id]);

  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documentTypes;
    return documentTypes.filter(doc => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documentTypes, searchTerm]);

  const documentsByCategory = useMemo(() => {
    const grouped: Record<string, DocumentType[]> = {
      uncategorized: []
    };

    categories.forEach(cat => {
      grouped[cat.id] = [];
    });

    filteredDocuments.forEach(doc => {
      if (doc.category_id && grouped[doc.category_id]) {
        grouped[doc.category_id].push(doc);
      } else {
        grouped.uncategorized.push(doc);
      }
    });

    return grouped;
  }, [categories, filteredDocuments]);

  const handleToggleDocument = (docName: string) => {
    if (selectedDocuments.includes(docName)) {
      onSelectionChange(selectedDocuments.filter(d => d !== docName));
    } else {
      onSelectionChange([...selectedDocuments, docName]);
    }
  };

  const handleAddOtherDocument = () => {
    if (otherDocumentName.trim() && !selectedDocuments.includes(otherDocumentName.trim())) {
      onSelectionChange([...selectedDocuments, otherDocumentName.trim()]);
      setOtherDocumentName("");
      setShowOtherInput(false);
    }
  };

  const handleRemoveDocument = (docName: string) => {
    onSelectionChange(selectedDocuments.filter(d => d !== docName));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Label>Documentos Necessários</Label>
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-muted rounded w-full"></div>
          <div className="h-32 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }

  const hasDocuments = documentTypes.length > 0;
  const hasCategories = categories.length > 0;

  return (
    <div className="space-y-3">
      <Label>Documentos Necessários</Label>
      
      <p className="text-sm text-muted-foreground">
        Selecione apenas os documentos necessários para este processo. Você poderá alterar essa lista a qualquer momento.
      </p>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Document Selection */}
      <div className="border rounded-lg bg-muted/20 overflow-hidden">
        {!hasDocuments ? (
          <div className="text-center py-6 px-4">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum tipo de documento cadastrado.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre tipos de documentos em <strong>Configurações → Tipos de Documentos</strong>
            </p>
          </div>
        ) : hasCategories ? (
          <Accordion type="multiple" className="w-full">
            <div className="max-h-64 overflow-y-auto">
              {categories.map((category) => {
                const categoryDocs = documentsByCategory[category.id] || [];
                const selectedInCategory = categoryDocs.filter(d => 
                  selectedDocuments.includes(d.name)
                ).length;

                // Skip empty categories when searching
                if (searchTerm && categoryDocs.length === 0) return null;
                // Skip categories with no documents
                if (categoryDocs.length === 0) return null;

                return (
                  <AccordionItem key={category.id} value={category.id} className="border-b last:border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-medium">{category.name}</span>
                        <div className="flex items-center gap-2">
                          {selectedInCategory > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedInCategory}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {categoryDocs.length} doc{categoryDocs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      <div className="space-y-2">
                        {categoryDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center space-x-3 py-1">
                            <Checkbox
                              id={`doc-${doc.id}`}
                              checked={selectedDocuments.includes(doc.name)}
                              onCheckedChange={() => handleToggleDocument(doc.name)}
                            />
                            <Label 
                              htmlFor={`doc-${doc.id}`} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {doc.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}

              {/* Uncategorized Documents */}
              {documentsByCategory.uncategorized.length > 0 && (
                <AccordionItem value="uncategorized" className="border-b last:border-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="font-medium">Outros Documentos</span>
                      <div className="flex items-center gap-2">
                        {documentsByCategory.uncategorized.filter(d => 
                          selectedDocuments.includes(d.name)
                        ).length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {documentsByCategory.uncategorized.filter(d => 
                              selectedDocuments.includes(d.name)
                            ).length}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {documentsByCategory.uncategorized.length} doc{documentsByCategory.uncategorized.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <div className="space-y-2">
                      {documentsByCategory.uncategorized.map((doc) => (
                        <div key={doc.id} className="flex items-center space-x-3 py-1">
                          <Checkbox
                            id={`doc-${doc.id}`}
                            checked={selectedDocuments.includes(doc.name)}
                            onCheckedChange={() => handleToggleDocument(doc.name)}
                          />
                          <Label 
                            htmlFor={`doc-${doc.id}`} 
                            className="text-sm cursor-pointer flex-1"
                          >
                            {doc.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </div>
          </Accordion>
        ) : (
          // Flat list when no categories exist
          <div className="max-h-64 overflow-y-auto p-3 space-y-2">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center space-x-3 py-1">
                <Checkbox
                  id={`doc-${doc.id}`}
                  checked={selectedDocuments.includes(doc.name)}
                  onCheckedChange={() => handleToggleDocument(doc.name)}
                />
                <Label 
                  htmlFor={`doc-${doc.id}`} 
                  className="text-sm cursor-pointer flex-1"
                >
                  {doc.name}
                </Label>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Document Option */}
        <div className="border-t px-4 py-3 bg-muted/30">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="doc-outro"
              checked={showOtherInput}
              onCheckedChange={(checked) => setShowOtherInput(checked as boolean)}
            />
            <Label htmlFor="doc-outro" className="text-sm cursor-pointer font-medium">
              Outro (especificar)
            </Label>
          </div>
        </div>
      </div>

      {/* Custom Document Input */}
      {showOtherInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Digite o nome do documento..."
            value={otherDocumentName}
            onChange={(e) => setOtherDocumentName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddOtherDocument();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAddOtherDocument}
            disabled={!otherDocumentName.trim()}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected Documents */}
      {selectedDocuments.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {selectedDocuments.length} documento(s) selecionado(s):
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDocuments.map((doc) => (
              <Badge key={doc} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
                {doc}
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(doc)}
                  className="ml-1 hover:text-destructive rounded-full p-0.5 hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSelector;
