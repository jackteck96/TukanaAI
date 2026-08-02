import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  client_name: string;
  client_email: string;
  cpf_cnpj: string;
}

interface ClientAutocompleteProps {
  companyId: string;
  value: string;
  onChange: (value: string) => void;
  onClientSelect: (client: Client) => void;
  disabled?: boolean;
}

export const ClientAutocomplete = ({ 
  companyId, 
  value, 
  onChange, 
  onClientSelect,
  disabled 
}: ClientAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search clients
  useEffect(() => {
    const searchClients = async () => {
      // Only search after 3 characters
      if (value.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('processes')
          .select('client_name, client_email, cpf_cnpj')
          .eq('company_id', companyId)
          .ilike('client_name', `%${value}%`)
          .order('created_at', { ascending: false })
          .limit(50); // Get more to deduplicate

        if (error) throw error;

        // Remove duplicates by email and limit to 5
        const uniqueClients = data?.reduce((acc: Client[], current) => {
          const exists = acc.find(item => item.client_email === current.client_email);
          if (!exists && acc.length < 5) {
            acc.push(current);
          }
          return acc;
        }, []) || [];

        setSuggestions(uniqueClients);
        setShowSuggestions(uniqueClients.length > 0);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchClients, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [value, companyId]);

  const handleSelectClient = (client: Client) => {
    console.log('Cliente selecionado:', client); // Debug
    onChange(client.client_name);
    onClientSelect(client);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Label htmlFor="clientName">Nome do Cliente</Label>
      <div className="relative">
        <Input
          id="clientName"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite pelo menos 3 caracteres para buscar..."
          disabled={disabled}
          required
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((client, index) => (
            <button
              key={`${client.client_email}-${index}`}
              type="button"
              onClick={() => handleSelectClient(client)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-accent transition-colors",
                "flex items-start gap-3 border-b last:border-b-0"
              )}
            >
              <div className="mt-0.5">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{client.client_name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {client.client_email}
                </div>
                {client.cpf_cnpj && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {client.cpf_cnpj}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {value.length >= 3 && !isLoading && suggestions.length === 0 && showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <UserPlus className="h-4 w-4" />
            <div className="text-sm">
              Nenhum cliente encontrado. Um novo cliente será cadastrado.
            </div>
          </div>
        </div>
      )}

      {/* Helper text */}
      {value.length > 0 && value.length < 3 && (
        <p className="text-xs text-muted-foreground mt-1">
          Digite mais {3 - value.length} caractere(s) para buscar clientes existentes
        </p>
      )}
    </div>
  );
};
