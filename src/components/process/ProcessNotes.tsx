import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Plus, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProcessNote {
  id: string;
  content: string;
  user_name: string;
  user_id: string;
  created_at: string;
  parent_note_id: string | null;
  replies?: ProcessNote[];
}

interface ProcessNotesProps {
  processId: string;
  companyId: string;
  className?: string;
}

export default function ProcessNotes({ processId, companyId, className }: ProcessNotesProps) {
  const [notes, setNotes] = useState<ProcessNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [replyToNoteId, setReplyToNoteId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadNotes();
  }, [processId]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('process_notes')
        .select('*')
        .eq('process_id', processId)
        .is('parent_note_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load replies for each note
      const notesWithReplies = await Promise.all(
        (data || []).map(async (note) => {
          const { data: replies } = await supabase
            .from('process_notes')
            .select('*')
            .eq('parent_note_id', note.id)
            .order('created_at', { ascending: true });
          
          return { ...note, replies: replies || [] };
        })
      );

      setNotes(notesWithReplies);
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
      toast.error('Erro ao carregar anotações');
    } finally {
      setLoadingNotes(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      const userName = profile?.full_name || profile?.email || 'Usuário';

      const { error } = await supabase
        .from('process_notes')
        .insert({
          process_id: processId,
          company_id: companyId,
          user_id: user.id,
          user_name: userName,
          content: newNote.trim(),
          parent_note_id: null
        });

      if (error) throw error;

      toast.success('Anotação adicionada com sucesso');
      setNewNote('');
      loadNotes();
    } catch (error) {
      console.error('Erro ao adicionar anotação:', error);
      toast.error('Erro ao adicionar anotação');
    } finally {
      setLoading(false);
    }
  };

  const addReply = async () => {
    if (!replyContent.trim() || !user || !replyToNoteId) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      const userName = profile?.full_name || profile?.email || 'Usuário';

      const { error } = await supabase
        .from('process_notes')
        .insert({
          process_id: processId,
          company_id: companyId,
          user_id: user.id,
          user_name: userName,
          content: replyContent.trim(),
          parent_note_id: replyToNoteId
        });

      if (error) throw error;

      toast.success('Resposta adicionada com sucesso');
      setReplyContent('');
      setReplyToNoteId(null);
      loadNotes();
    } catch (error) {
      console.error('Erro ao adicionar resposta:', error);
      toast.error('Erro ao adicionar resposta');
    } finally {
      setLoading(false);
    }
  };

  if (loadingNotes) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse text-muted-foreground">Carregando anotações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Anotações do Processo
        </CardTitle>
        <CardDescription>
          Adicione observações e comentários sobre este processo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Adicione uma anotação sobre este processo..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={addNote}
              disabled={!newNote.trim() || loading}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Adicionando...' : 'Adicionar Anotação'}
            </Button>
          </div>
        </div>

        {notes.length > 0 && <Separator />}

        {/* Notes history */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma anotação encontrada</p>
              <p className="text-sm">Adicione a primeira anotação para este processo</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="space-y-2">
                <div
                  className="p-4 bg-muted/30 rounded-lg border-l-4 border-l-primary/50 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {note.user_name}
                      </span>
                      {note.replies && note.replies.length > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          {note.replies.length} {note.replies.length === 1 ? 'resposta' : 'respostas'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {expandedNoteId === note.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                {/* Expanded view with replies */}
                {expandedNoteId === note.id && (
                  <div className="ml-8 space-y-2">
                    {note.replies && note.replies.length > 0 && (
                      <div className="space-y-2">
                        {note.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="p-3 bg-muted/20 rounded-lg border-l-2 border-l-primary/30"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-foreground">
                                {reply.user_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(reply.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyToNoteId(note.id);
                      }}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Responder
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Reply Dialog */}
        <Dialog open={!!replyToNoteId} onOpenChange={(open) => !open && setReplyToNoteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Responder Anotação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Digite sua resposta..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReplyToNoteId(null);
                    setReplyContent('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={addReply}
                  disabled={!replyContent.trim() || loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Resposta'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}