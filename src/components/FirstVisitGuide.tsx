import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirstVisit } from '@/hooks/useFirstVisit';

interface GuideItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FirstVisitGuideProps {
  pageKey: string;
  title: string;
  items: GuideItem[];
}

const FirstVisitGuide = ({ pageKey, title, items }: FirstVisitGuideProps) => {
  const { isFirstVisit, dismissGuide } = useFirstVisit(pageKey);

  if (!isFirstVisit) return null;

  return (
    <div className="relative mb-6 rounded-xl border border-primary/20 bg-primary/5 p-5 animate-in fade-in slide-in-from-top-2 duration-500">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={dismissGuide}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg bg-background/60 p-3">
            <div className="mt-0.5 text-primary shrink-0">{item.icon}</div>
            <div>
              <p className="font-medium text-foreground text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="outline" onClick={dismissGuide} className="text-xs">
          Entendi, não mostrar novamente
        </Button>
      </div>
    </div>
  );
};

export default FirstVisitGuide;
