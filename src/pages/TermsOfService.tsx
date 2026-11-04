import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { termsEn, termsPt, TERMS_LAST_UPDATED } from '@/content/legal/termsOfService';

const TermsOfService = () => {
  const { i18n } = useTranslation();
  const isEn = (i18n.language || '').toLowerCase().startsWith('en');

  const copy = isEn
    ? {
        title: 'Terms of Service',
        cardTitle: 'Tukana AI Terms of Service',
        updated: `Last updated: ${TERMS_LAST_UPDATED['en-US']}`,
        back: 'Back',
        content: termsEn,
      }
    : {
        title: 'Termos de Uso',
        cardTitle: 'Termos de Uso da Plataforma Tukana AI',
        updated: `Atualizado em: ${TERMS_LAST_UPDATED['pt-BR']}`,
        back: 'Voltar',
        content: termsPt,
      };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{copy.title}</h1>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span>{copy.cardTitle}</span>
              <span className="text-sm font-normal text-muted-foreground">{copy.updated}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="content-prose [&_h2]:text-xl [&_h2]:mt-8">
            <ReactMarkdown>{copy.content}</ReactMarkdown>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {copy.back}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
