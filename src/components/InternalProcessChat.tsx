import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, X, Minimize2, Maximize2, Paperclip, FileIcon, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface InternalProcessChatProps {
  processId: string;
  companyId: string;
}

interface ChatMessage {
  id: string;
  user_name: string;
  message: string;
  created_at: string;
  user_id: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
}

export function InternalProcessChat({ processId, companyId }: InternalProcessChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    loadMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`internal-chat-${processId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_process_chat',
          filter: `process_id=eq.${processId}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMsg]);
          
          // Increment unread if not from current user and chat is closed
          if (newMsg.user_id !== user?.id && !isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [processId, user?.id, isOpen]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_process_chat')
        .select('*')
        .eq('process_id', processId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !user) return;

    setSending(true);
    try {
      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;
      let attachmentSize: number | undefined;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${processId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('internal-chat-attachments')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        attachmentUrl = filePath;
        attachmentName = selectedFile.name;
        attachmentSize = selectedFile.size;
      }

      const { error } = await supabase
        .from('internal_process_chat')
        .insert({
          process_id: processId,
          company_id: companyId,
          user_id: user.id,
          user_name: profile?.full_name || user.email || 'Usuário',
          message: newMessage.trim() || '📎 Anexo',
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_size: attachmentSize
        });

      if (error) throw error;

      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit to 20MB
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo: 20MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const downloadAttachment = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('internal-chat-attachments')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg relative hover:scale-110 transition-transform"
          >
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 shadow-2xl rounded-lg border bg-background transition-all duration-300",
          isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
        )}>
          <Card className="h-full flex flex-col border-0">
            <CardHeader 
              className="border-b p-4 cursor-pointer hover:bg-muted/50 transition-colors" 
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5" />
                  Chat Interno
                  <Badge variant="secondary" className="text-xs">
                    Apenas equipe
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(!isMinimized);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-sm">Inicie a conversa com sua equipe</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex flex-col space-y-1 max-w-[85%]",
                            message.user_id === user?.id ? "ml-auto" : "mr-auto"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-lg px-3 py-2",
                              message.user_id === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-xs font-semibold mb-1">{message.user_name}</p>
                            <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                            
                            {message.attachment_url && message.attachment_name && (
                              <div 
                                className={cn(
                                  "mt-2 p-2 rounded border flex items-center gap-2 cursor-pointer hover:bg-background/10 transition-colors",
                                  message.user_id === user?.id
                                    ? "border-primary-foreground/20"
                                    : "border-border"
                                )}
                                onClick={() => downloadAttachment(message.attachment_url!, message.attachment_name!)}
                              >
                                <FileIcon className="h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{message.attachment_name}</p>
                                  {message.attachment_size && (
                                    <p className="text-xs opacity-70">{formatFileSize(message.attachment_size)}</p>
                                  )}
                                </div>
                                <Download className="h-3 w-3 flex-shrink-0" />
                              </div>
                            )}
                          </div>
                          <p className={cn(
                            "text-xs text-muted-foreground px-1",
                            message.user_id === user?.id ? "text-right" : "text-left"
                          )}>
                            {format(new Date(message.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  {selectedFile && (
                    <div className="mb-2 p-2 bg-muted rounded flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="resize-none min-h-[60px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(e);
                          }
                        }}
                        disabled={sending}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={sending}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                        className="shrink-0"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        type="submit"
                        size="icon"
                        disabled={(!newMessage.trim() && !selectedFile) || sending}
                        className="shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter para enviar, Shift+Enter para nova linha. Máx: 20MB por arquivo
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
