import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TimeEntry {
  id: string;
  type: 'entrada' | 'saida' | 'pausa' | 'retorno';
  timestamp: Date;
  employee_id: string;
  employee_name: string;
  company_id: string;
}

export const useTimeRecords = () => {
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [lastEntry, setLastEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTodayEntries = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('time_records')
        .select('*')
        .eq('employee_id', profile.id)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const entries: TimeEntry[] = data?.map(record => ({
        id: record.id,
        type: record.type as TimeEntry['type'],
        timestamp: new Date(record.timestamp),
        employee_id: record.employee_id,
        employee_name: record.employee_name,
        company_id: record.company_id
      })) || [];

      setTodayEntries(entries);
      setLastEntry(entries[0] || null);
    } catch (error: any) {
      console.error('Error fetching time records:', error);
      toast({
        title: "Erro ao carregar registros",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const recordTimeEntry = async (type: TimeEntry['type']) => {
    try {
      setLoading(true);
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, company_id')
        .eq('id', user.user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const { data, error } = await supabase
        .from('time_records')
        .insert({
          employee_id: profile.id,
          employee_name: profile.full_name || user.user.email || 'Usuário',
          type,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: TimeEntry = {
        id: data.id,
        type: data.type as TimeEntry['type'],
        timestamp: new Date(data.timestamp),
        employee_id: data.employee_id,
        employee_name: data.employee_name,
        company_id: data.company_id
      };

      setLastEntry(newEntry);
      setTodayEntries(prev => [newEntry, ...prev]);

      toast({
        title: "Ponto registrado!",
        description: `${getEntryTypeLabel(type)} registrada com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error recording time:', error);
      toast({
        title: "Erro ao registrar ponto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const fetchAllEmployeeRecords = async (startDate: Date, endDate: Date) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        throw new Error('Acesso não autorizado');
      }

      const { data, error } = await supabase
        .from('time_records')
        .select('*')
        .eq('company_id', profile.company_id)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data?.map(record => ({
        id: record.id,
        type: record.type as TimeEntry['type'],
        timestamp: new Date(record.timestamp),
        employee_id: record.employee_id,
        employee_name: record.employee_name,
        company_id: record.company_id
      })) || [];
    } catch (error: any) {
      console.error('Error fetching all records:', error);
      toast({
        title: "Erro ao buscar relatório",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    fetchTodayEntries();
  }, []);

  return {
    todayEntries,
    lastEntry,
    loading,
    recordTimeEntry,
    fetchTodayEntries,
    fetchAllEmployeeRecords,
    getEntryTypeLabel
  };
};