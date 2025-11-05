import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

export const GoogleCalendarConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
    
    // Listener para mensagem do popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'google-auth-success') {
        toast.success('Google Calendar conectado com sucesso!');
        checkConnection();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      const { data: tokens, error } = await supabase
        .from('google_calendar_tokens')
        .select('id')
        .eq('company_id', profile.company_id)
        .limit(1);

      if (!error && tokens && tokens.length > 0) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      const { data, error } = await supabase.functions.invoke('google-auth-init');

      if (error) throw error;

      if (data?.authUrl) {
        // Abrir popup de autenticação
        const width = 600;
        const height = 700;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;
        
        window.open(
          data.authUrl,
          'Google Calendar Auth',
          `width=${width},height=${height},left=${left},top=${top}`
        );
      }
    } catch (error) {
      console.error('Erro ao conectar Google Calendar:', error);
      toast.error('Erro ao conectar Google Calendar');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('company_id', profile.company_id)
        .eq('user_id', user.id);

      setIsConnected(false);
      toast.success('Google Calendar desconectado');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar Google Calendar');
    }
  };

  if (loading) {
    return (
      <Card className="p-4 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Verificando conexão...</span>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-medium">Google Calendar</h3>
            <p className="text-sm text-muted-foreground">
              {isConnected 
                ? 'Conectado - Crie reuniões automaticamente' 
                : 'Conecte para criar reuniões no Google Meet'}
            </p>
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-success">
              <Check className="h-4 w-4" />
              <span>Conectado</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              <X className="h-4 w-4 mr-1" />
              Desconectar
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={connecting}
            size="sm"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Conectar
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};
