import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  company_id: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'expired' | 'canceled';
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id?: string;
}

interface UsageMetrics {
  id: string;
  company_id: string;
  user_count: number;
  document_count: number;
  storage_used_bytes: number;
  last_calculated_at: string;
}

interface PlanLimits {
  current_usage: number;
  limit: number;
  plan: string;
  can_add: boolean;
}

interface CompanyContextType {
  company: Company | null;
  subscription: Subscription | null;
  usageMetrics: UsageMetrics | null;
  loading: boolean;
  checkPlanLimits: (limitType: 'users' | 'documents') => Promise<PlanLimits | null>;
  refreshMetrics: () => Promise<void>;
  updateCompany: (data: Partial<Company>) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanyData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user profile to get company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // Fetch company data
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (companyData) {
        setCompany(companyData);

        // Fetch subscription
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('company_id', companyData.id)
          .single();

        setSubscription(subscriptionData);

        // Fetch usage metrics
        const { data: metricsData } = await supabase
          .from('usage_metrics')
          .select('*')
          .eq('company_id', companyData.id)
          .single();

        setUsageMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPlanLimits = async (limitType: 'users' | 'documents'): Promise<PlanLimits | null> => {
    if (!company) return null;

    try {
      const { data } = await supabase.rpc('check_plan_limits', {
        company_uuid: company.id,
        limit_type: limitType
      });

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data as unknown as PlanLimits;
      }
      return null;
    } catch (error) {
      console.error('Error checking plan limits:', error);
      return null;
    }
  };

  const refreshMetrics = async () => {
    if (!company) return;

    try {
      await supabase.rpc('update_usage_metrics', {
        company_uuid: company.id
      });

      // Refetch metrics
      const { data: metricsData } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('company_id', company.id)
        .single();

      setUsageMetrics(metricsData);
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    }
  };

  const updateCompany = async (data: Partial<Company>) => {
    if (!company) return;

    try {
      const { data: updatedCompany } = await supabase
        .from('companies')
        .update(data)
        .eq('id', company.id)
        .select()
        .single();

      if (updatedCompany) {
        setCompany(updatedCompany);
      }
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [user]);

  const value = {
    company,
    subscription,
    usageMetrics,
    loading,
    checkPlanLimits,
    refreshMetrics,
    updateCompany,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};