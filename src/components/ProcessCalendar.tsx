import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Plus, FileText, User, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProcessCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: string;
  companyId: string;
}

export const ProcessCalendar = ({
  open,
  onOpenChange,
  processId,
  companyId,
}: ProcessCalendarProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
  });

  useEffect(() => {
    if (open) {
      loadEvents();
    }
  }, [open, processId]);

  useEffect(() => {
    if (selectedDate) {
      filterEventsByDate(selectedDate);
    }
  }, [selectedDate, events]);

  const filterEventsByDate = (date: Date) => {
    const dayEvents = events.filter(event => {
      const eventDate = parseISO(event.event_date);
      return isSameDay(eventDate, date);
    });
    setSelectedDayEvents(dayEvents);
  };

  const loadEvents = async () => {
    try {
      setLoading(true);

      // Buscar eventos de calendário
      const { data: calendarEvents, error: calError } = await supabase
        .from('process_calendar_events')
        .select('*')
        .eq('process_id', processId)
        .order('event_date', { ascending: true });

      if (calError) throw calError;

      // Buscar perfis dos criadores dos eventos
      const creatorIds = (calendarEvents || []).map(e => e.created_by).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', creatorIds);

      const profilesMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      // Buscar documentos com suas datas de upload
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, file_name, document_type, created_at, uploaded_by')
        .eq('process_id', processId)
        .order('created_at', { ascending: false });

      if (docError) throw docError;

      // Combinar eventos de calendário e documentos
      const documentEvents = (documents || []).map((doc) => ({
        id: doc.id,
        type: 'document',
        title: `Documento anexado: ${doc.file_name}`,
        description: `Tipo: ${doc.document_type}`,
        event_date: new Date(doc.created_at).toISOString().split('T')[0],
        event_time: new Date(doc.created_at).toTimeString().split(' ')[0].slice(0, 5),
        uploaded_by: doc.uploaded_by,
        created_at: doc.created_at,
      }));

      const customEvents = (calendarEvents || []).map((event) => ({
        ...event,
        type: 'custom',
        uploaded_by: profilesMap.get(event.created_by) || 'Usuário',
      }));

      const allEvents = [...customEvents, ...documentEvents].sort((a, b) => {
        const dateA = new Date(`${a.event_date}T${a.event_time || '00:00'}`);
        const dateB = new Date(`${b.event_date}T${b.event_time || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
      });

      setEvents(allEvents);
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar eventos do calendário');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    try {
      if (!newEvent.title || !newEvent.event_date) {
        toast.error('Preencha o título e a data do evento');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('process_calendar_events')
        .insert({
          process_id: processId,
          company_id: companyId,
          title: newEvent.title,
          description: newEvent.description,
          event_date: newEvent.event_date,
          event_time: newEvent.event_time || null,
          event_type: 'custom',
          created_by: userData.user.id,
        });

      if (error) throw error;

      toast.success('Evento adicionado ao calendário');
      setNewEvent({ title: '', description: '', event_date: '', event_time: '' });
      setIsAddingEvent(false);
      loadEvents();
    } catch (error: any) {
      console.error('Erro ao adicionar evento:', error);
      toast.error('Erro ao adicionar evento');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('process_calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Evento removido do calendário');
      loadEvents();
    } catch (error: any) {
      console.error('Erro ao remover evento:', error);
      toast.error('Erro ao remover evento');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const hasEventsOnDate = (date: Date) => {
    return events.some(event => {
      const eventDate = parseISO(event.event_date);
      return isSameDay(eventDate, date);
    });
  };

  const modifiers = {
    hasEvents: (date: Date) => hasEventsOnDate(date),
  };

  const modifiersClassNames = {
    hasEvents: 'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Calendário do Processo
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 h-full overflow-hidden">
          {/* Calendário Visual */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                  className="rounded-md border-0"
                />
              </CardContent>
            </Card>

            {/* Adicionar novo evento */}
            {!isAddingEvent ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsAddingEvent(true);
                  setNewEvent({ 
                    title: '', 
                    description: '', 
                    event_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '', 
                    event_time: '' 
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Evento
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Novo Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Evento</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                      placeholder="Ex: Reunião de acompanhamento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, description: e.target.value })
                      }
                      placeholder="Detalhes sobre o evento..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="event_date">Data</Label>
                      <Input
                        id="event_date"
                        type="date"
                        value={newEvent.event_date}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, event_date: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event_time">Horário (opcional)</Label>
                      <Input
                        id="event_time"
                        type="time"
                        value={newEvent.event_time}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, event_time: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingEvent(false);
                        setNewEvent({ title: '', description: '', event_date: '', event_time: '' });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAddEvent}>Adicionar</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Eventos do dia selecionado */}
          <div className="space-y-3 overflow-y-auto max-h-[calc(85vh-120px)]">
            <div className="sticky top-0 bg-background pb-2 border-b">
              <h3 className="font-semibold text-sm">
                {selectedDate ? format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione uma data'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'evento' : 'eventos'}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando eventos...
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum evento neste dia</p>
              </div>
            ) : (
              selectedDayEvents.map((event) => (
                <Card key={event.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            event.type === 'document'
                              ? 'bg-blue-100 dark:bg-blue-900/20'
                              : 'bg-primary/10'
                          }`}
                        >
                          {event.type === 'document' ? (
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <CalendarIcon className="h-5 w-5 text-primary" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <Badge
                              variant={event.type === 'document' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {event.type === 'document' ? 'Documento' : 'Evento'}
                            </Badge>
                          </div>

                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {event.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {event.event_time && (
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {event.event_time}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {event.uploaded_by}
                            </div>
                          </div>
                        </div>
                      </div>

                      {event.type === 'custom' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};