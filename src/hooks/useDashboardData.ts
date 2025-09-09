import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalClients: number;
  totalProcesses: number;
  pendingProcesses: number;
  completedToday: number;
}

export interface RecentClient {
  id: string;
  client_name: string;
  client_email: string;
  status: string;
  document_count: number;
  last_update: string;
  priority: string;
}

export interface RecentProcess {
  id: string;
  client_name: string;
  process_type: string;
  status: string;
  progress: number;
  due_date: string | null;
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProcesses: 0,
    pendingProcesses: 0,
    completedToday: 0
  });
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [recentProcesses, setRecentProcesses] = useState<RecentProcess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Count total unique clients (processes with different client_email)
      const { data: clientsData, error: clientsError } = await supabase
        .from('processes')
        .select('client_email')
        .eq('company_id', profile.company_id);

      if (clientsError) throw clientsError;

      const uniqueClients = new Set(clientsData?.map(p => p.client_email)).size;

      // Count total processes
      const { count: totalProcesses } = await supabase
        .from('processes')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      // Count pending processes
      const { count: pendingProcesses } = await supabase
        .from('processes')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .in('status', ['Em andamento', 'Pendente']);

      // Count completed today
      const today = new Date().toISOString().split('T')[0];
      const { count: completedToday } = await supabase
        .from('processes')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('status', 'Concluído')
        .gte('updated_at', today);

      setStats({
        totalClients: uniqueClients,
        totalProcesses: totalProcesses || 0,
        pendingProcesses: pendingProcesses || 0,
        completedToday: completedToday || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentProcesses = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from('processes')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setRecentProcesses(data?.map(process => ({
        id: process.id,
        client_name: process.client_name,
        process_type: process.process_type,
        status: process.status,
        progress: process.progress,
        due_date: process.due_date
      })) || []);
    } catch (error) {
      console.error('Error fetching recent processes:', error);
    }
  };

  const fetchRecentClients = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Get recent processes grouped by client with document counts
      const { data, error } = await supabase
        .from('processes')
        .select(`
          client_name,
          client_email,
          status,
          updated_at,
          priority,
          documents!inner(id)
        `)
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Group by client and get most recent info
      const clientMap = new Map<string, RecentClient>();
      
      data?.forEach(process => {
        const existing = clientMap.get(process.client_email);
        if (!existing || new Date(process.updated_at) > new Date(existing.last_update)) {
          clientMap.set(process.client_email, {
            id: process.client_email,
            client_name: process.client_name,
            client_email: process.client_email,
            status: process.status,
            document_count: process.documents?.length || 0,
            last_update: process.updated_at,
            priority: process.priority || 'medium'
          });
        }
      });

      setRecentClients(Array.from(clientMap.values()).slice(0, 4));
    } catch (error) {
      console.error('Error fetching recent clients:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchRecentProcesses(),
      fetchRecentClients()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  return {
    stats,
    recentClients,
    recentProcesses,
    loading,
    refreshData
  };
};