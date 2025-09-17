import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProcessNote {
  id: string;
  content: string;
  user_name: string;
  user_id: string;
  created_at: string;
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
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
      // Buscar nome do usuário
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
          content: newNote.trim()
        });

      if (error) throw error;

      toast.success('Anotação adicionada com sucesso');
      setNewNote('');
      loadNotes(); // Recarregar anotações
    } catch (error) {
      console.error('Erro ao adicionar anotação:', error);
      toast.error('Erro ao adicionar anotação');
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
        <div className="space-y-3">
          <Textarea
            placeholder="Adicione uma anotação sobre este processo..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={addNote}
            disabled={!newNote.trim() || loading}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading ? 'Adicionando...' : 'Adicionar Anotação'}
          </Button>
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
              <div
                key={note.id}
                className="p-4 bg-muted/30 rounded-lg border-l-4 border-l-primary/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {note.user_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}