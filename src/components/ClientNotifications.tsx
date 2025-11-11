import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, X, FileText, AlertTriangle, ArrowRight, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  process_id: string;
  document_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ClientNotificationsProps {
  className?: string;
}

export default function ClientNotifications({ className }: ClientNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      if (!user?.email) {
        console.warn('[ClientNotifications] Usuário sem email');
        return;
      }

      console.log('[ClientNotifications] Buscando notificações para:', user.email);
      
      const { data, error } = await supabase
        .from('client_notifications')
        .select('*')
        .eq('client_email', user.email)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[ClientNotifications] Erro ao buscar:', error);
        throw error;
      }
      
      console.log('[ClientNotifications] Notificações encontradas:', data?.length || 0);
      setNotifications(data || []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('client_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      toast.error('Erro ao atualizar notificação');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('client_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao atualizar notificações');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('client_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificação excluída');
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      toast.error('Erro ao excluir notificação');
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'document_rejected') {
      return <X className="h-4 w-4 text-destructive" />;
    }
    if (type === 'document_expired') {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (type === 'document_expiring') {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    if (type === 'document_requested') {
      return <FileText className="h-4 w-4 text-primary" />;
    }
    if (type === 'information_request') {
      return <UserCircle className="h-4 w-4 text-blue-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-warning" />;
  };

  const getNotificationColor = (type: string) => {
    if (type === 'document_rejected' || type === 'document_expired') {
      return 'border-l-destructive bg-destructive/5';
    }
    if (type === 'document_expiring') {
      return 'border-l-warning bg-warning/5';
    }
    if (type === 'document_requested') {
      return 'border-l-primary bg-primary/5';
    }
    if (type === 'information_request') {
      return 'border-l-blue-600 bg-blue-50 dark:bg-blue-900/10';
    }
    return 'border-l-warning bg-warning/5';
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como lida ao clicar
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Solicitação de informações leva ao perfil
    if (notification.notification_type === 'information_request') {
      navigate('/cliente?openProfile=true');
      return;
    }

    // Navegar para o processo
    if (notification.process_id) {
      navigate(`/cliente?id=${notification.process_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse text-muted-foreground">Carregando notificações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <Bell className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle>Notificações</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <CardDescription>
          Atualizações sobre seus documentos e processos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma notificação encontrada</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-l-4 rounded-lg transition-all ${getNotificationColor(notification.notification_type)} ${
                !notification.is_read ? 'shadow-sm' : 'opacity-75'
              }`}
            >
              <Button
                variant="ghost"
                className="w-full h-auto p-4 justify-start hover:bg-background/50 text-left"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3 flex-1">
                  {getNotificationIcon(notification.notification_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}