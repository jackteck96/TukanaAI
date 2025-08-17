import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut as LogOutIcon, Coffee, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TimeEntry {
  id: string;
  type: 'entrada' | 'saida' | 'pausa' | 'retorno';
  timestamp: Date;
  employee: string;
}

const PontoClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lastEntry, setLastEntry] = useState<TimeEntry | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);

  // Simulando funcionário logado
  const currentEmployee = "João Silva";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePonto = (type: TimeEntry['type']) => {
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      type,
      timestamp: new Date(),
      employee: currentEmployee
    };

    setLastEntry(newEntry);
    setTodayEntries(prev => [...prev, newEntry]);
    setIsDialogOpen(false);

    // Aqui você salvaria no banco de dados
    console.log('Ponto registrado:', newEntry);
  };

  const getNextAction = () => {
    if (!lastEntry) return { type: 'entrada' as const, label: 'Entrada', icon: LogIn, color: 'bg-green-500' };
    
    switch (lastEntry.type) {
      case 'entrada':
      case 'retorno':
        return { type: 'saida' as const, label: 'Saída', icon: LogOutIcon, color: 'bg-red-500' };
      case 'saida':
        return { type: 'entrada' as const, label: 'Entrada', icon: LogIn, color: 'bg-green-500' };
      case 'pausa':
        return { type: 'retorno' as const, label: 'Retorno', icon: LogIn, color: 'bg-blue-500' };
      default:
        return { type: 'entrada' as const, label: 'Entrada', icon: LogIn, color: 'bg-green-500' };
    }
  };

  const nextAction = getNextAction();
  const NextActionIcon = nextAction.icon;

  const getEntryTypeColor = (type: TimeEntry['type']) => {
    switch (type) {
      case 'entrada': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'saida': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pausa': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'retorno': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEntryTypeLabel = (type: TimeEntry['type']) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'pausa': return 'Pausa';
      case 'retorno': return 'Retorno';
      default: return type;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Controle de Ponto</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Relógio Digital */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-primary mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Informações do Funcionário */}
        <div className="flex items-center justify-center space-x-2 p-3 bg-muted/30 rounded-lg">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{currentEmployee}</span>
        </div>

        {/* Último Registro */}
        {lastEntry && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Último registro:</div>
            <div className="flex items-center justify-between">
              <Badge className={getEntryTypeColor(lastEntry.type)}>
                {getEntryTypeLabel(lastEntry.type)}
              </Badge>
              <span className="text-sm font-mono">
                {formatTime(lastEntry.timestamp)}
              </span>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => handlePonto(nextAction.type)}
            className={`${nextAction.color} hover:opacity-90 text-white`}
          >
            <NextActionIcon className="h-4 w-4 mr-2" />
            {nextAction.label}
          </Button>
          
          {(lastEntry?.type === 'entrada' || lastEntry?.type === 'retorno') && (
            <Button 
              onClick={() => handlePonto('pausa')}
              variant="outline"
            >
              <Coffee className="h-4 w-4 mr-2" />
              Pausa
            </Button>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="col-span-2">
                <Clock className="h-4 w-4 mr-2" />
                Ver Registros de Hoje
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registros de Hoje</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {todayEntries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum registro hoje
                  </p>
                ) : (
                  todayEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <Badge className={getEntryTypeColor(entry.type)}>
                        {getEntryTypeLabel(entry.type)}
                      </Badge>
                      <span className="font-mono text-sm">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default PontoClock;