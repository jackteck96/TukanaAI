import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Loader2, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: string;
  clientEmail: string;
  clientName: string;
}

export const CreateMeetingDialog = ({
  open,
  onOpenChange,
  processId,
  clientEmail,
  clientName,
}: CreateMeetingDialogProps) => {
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: `Reunião - ${clientName}`,
    description: '',
    date: '',
    time: '10:00',
    duration: '60',
  });

  const handleCreate = async () => {
    try {
      if (!formData.date || !formData.time) {
        toast.error('Preencha data e horário');
        return;
      }

      setCreating(true);

      const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

      const { data, error } = await supabase.functions.invoke('create-calendar-event', {
        body: {
          processId,
          title: formData.title,
          description: formData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          attendeeEmail: clientEmail,
        },
      });

      if (error) throw error;

      if (data?.meetingUrl) {
        toast.success('Reunião criada com sucesso!', {
          description: 'O link foi enviado para o cliente por email.',
        });
        onOpenChange(false);
        setFormData({
          title: `Reunião - ${clientName}`,
          description: '',
          date: '',
          time: '10:00',
          duration: '60',
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar reunião:', error);
      toast.error(error.message || 'Erro ao criar reunião');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Criar Reunião Google Meet
          </DialogTitle>
          <DialogDescription>
            Agende uma reunião e envie o link automaticamente para {clientEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Reunião</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião de Acompanhamento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Adicione detalhes sobre a reunião..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (minutos)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              min="15"
              step="15"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !formData.date || !formData.time}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Criar Reunião
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
