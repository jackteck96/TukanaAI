import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

// TODO(i18n): the rendered `terms.content` comes from the terms_of_service DB table
// (Portuguese only, no locale columns) and is NOT translated. Unreviewed EN/ES drafts
// (translated from the default seed migration, may be stale vs. the live DB row) live
// in docs/legal/ pending legal sign-off. See docs/legal/README.md for the schema
// options once approved.
const TermsOfService = () => {
  const { toast } = useToast();
  const [terms, setTerms] = useState<{ version: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTerms();
  }, []);

  const fetchActiveTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('terms_of_service')
        .select('version, content')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setTerms(data);
    } catch (error: any) {
      console.error('Error fetching terms:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os termos de uso.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando termos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Termos de Uso</h1>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Termos de Uso da Plataforma Fuzen</span>
              {terms && (
                <span className="text-sm font-normal text-muted-foreground">
                  Versão {terms.version}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            {terms ? (
              <ReactMarkdown>{terms.content}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">
                Nenhum termo de uso ativo encontrado. Entre em contato com o suporte.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link to="/signup">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Cadastro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;