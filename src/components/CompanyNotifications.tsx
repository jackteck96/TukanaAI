import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, X, FileText, AlertTriangle, ArrowRight, PenTool } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  process_id?: string;
  document_id?: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  client_email?: string;
}

interface CompanyNotificationsProps {
  className?: string;
}

export default function CompanyNotifications({ className }: CompanyNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Setup realtime subscription for new notifications
      const channel = supabase
        .channel('company-notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'client_notifications'
          },
          () => {
            console.log('[CompanyNotifications] Nova notificação recebida, recarregando...');
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      if (!user?.id) {
        console.warn('[CompanyNotifications] Usuário sem ID');
        return;
      }

      // Buscar company_id do usuário
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user.id)
        .in('role', ['company_admin', 'company_collaborator'])
        .limit(1)
        .single();

      if (roleError || !userRole?.company_id) {
        console.warn('[CompanyNotifications] Usuário sem company_id');
        return;
      }

      console.log('[CompanyNotifications] Buscando notificações para company:', userRole.company_id);
      
      // Buscar TODAS as notificações da empresa (sem filtro de tipo)
      const { data, error } = await supabase
        .from('client_notifications')
        .select('*')
        .eq('company_id', userRole.company_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[CompanyNotifications] Erro ao buscar:', error);
        throw error;
      }
      
      console.log('[CompanyNotifications] Notificações encontradas:', data?.length || 0);
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
    if (type === 'signatures_complete') {
      return <PenTool className="h-4 w-4 text-green-500" />;
    }
    if (type === 'document_uploaded') {
      return <FileText className="h-4 w-4 text-primary" />;
    }
    return <AlertTriangle className="h-4 w-4 text-warning" />;
  };

  const getNotificationColor = (type: string) => {
    if (type === 'signatures_complete') {
      return 'border-l-green-500 bg-green-500/5';
    }
    if (type === 'document_uploaded') {
      return 'border-l-primary bg-primary/5';
    }
    return 'border-l-warning bg-warning/5';
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como lida ao clicar
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navegar baseado no tipo
    if (notification.notification_type === 'signatures_complete') {
      navigate('/gerenciar-processos');
    } else if (notification.process_id) {
      navigate(`/gerenciar-processos?process=${notification.process_id}`);
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
          Atualizações sobre assinaturas e documentos
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
