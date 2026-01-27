import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Users, FileText, Zap, Crown, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  max_users: number | null;
  max_documents_month: number | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const PlansManager = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    max_users: "",
    max_documents_month: "",
    features: "",
    is_active: true,
    display_order: "0"
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      const formattedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      }));
      
      setPlans(formattedPlans as SubscriptionPlan[]);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast({ title: "Erro", description: "Erro ao carregar planos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const featuresArray = form.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const payload = {
        name: form.name,
        slug: form.slug.toLowerCase().replace(/\s+/g, '-'),
        description: form.description || null,
        max_users: form.max_users ? parseInt(form.max_users) : null,
        max_documents_month: form.max_documents_month ? parseInt(form.max_documents_month) : null,
        features: featuresArray,
        is_active: form.is_active,
        display_order: parseInt(form.display_order) || 0
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(payload)
          .eq('id', editingPlan.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Plano atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(payload);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Plano criado com sucesso" });
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      max_users: "",
      max_documents_month: "",
      features: "",
      is_active: true,
      display_order: "0"
    });
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
      max_users: plan.max_users?.toString() || "",
      max_documents_month: plan.max_documents_month?.toString() || "",
      features: plan.features.join('\n'),
      is_active: plan.is_active,
      display_order: plan.display_order.toString()
    });
    setIsModalOpen(true);
  };

  const togglePlanStatus = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);
      
      if (error) throw error;
      toast({ 
        title: "Sucesso", 
        description: `Plano ${!plan.is_active ? 'ativado' : 'desativado'} com sucesso` 
      });
      fetchPlans();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'essencial':
        return <Building2 className="h-6 w-6" />;
      case 'profissional':
        return <Zap className="h-6 w-6" />;
      case 'estrategico':
        return <Crown className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Planos de Assinatura</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os planos disponíveis para uso interno em vendas B2B
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Atualize as configurações do plano.' : 'Configure um novo plano de assinatura.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Essencial"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="Ex: essencial"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição do plano..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_users">Máx. Usuários (vazio = ilimitado)</Label>
                  <Input
                    id="max_users"
                    type="number"
                    min="1"
                    value={form.max_users}
                    onChange={(e) => setForm({ ...form, max_users: e.target.value })}
                    placeholder="Ex: 5"
                  />
                </div>
                <div>
                  <Label htmlFor="max_documents_month">Máx. Docs/Mês (vazio = ilimitado)</Label>
                  <Input
                    id="max_documents_month"
                    type="number"
                    min="1"
                    value={form.max_documents_month}
                    onChange={(e) => setForm({ ...form, max_documents_month: e.target.value })}
                    placeholder="Ex: 1000"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="features">Funcionalidades (uma por linha)</Label>
                <Textarea
                  id="features"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="Organização de documentos&#10;Relatórios simples&#10;Suporte padrão"
                  rows={5}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Plano Ativo</Label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingPlan ? 'Atualizar' : 'Criar'} Plano
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative overflow-hidden transition-all duration-300 ${
              !plan.is_active ? 'opacity-60' : ''
            } ${plan.slug === 'estrategico' ? 'border-primary/50 bg-gradient-to-br from-card to-primary/5' : ''}`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  plan.slug === 'essencial' ? 'bg-blue-100 text-blue-600' :
                  plan.slug === 'profissional' ? 'bg-purple-100 text-purple-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {getPlanIcon(plan.slug)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(plan)}
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl mt-3">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{plan.max_users ? `Até ${plan.max_users} usuários` : 'Usuários ilimitados'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>{plan.max_documents_month ? `Até ${plan.max_documents_month.toLocaleString()} docs/mês` : 'Alto volume'}</span>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Funcionalidades:</p>
                <ul className="space-y-1">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-sm text-muted-foreground">
                      +{plan.features.length - 4} mais...
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="pt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => togglePlanStatus(plan)}
                >
                  {plan.is_active ? 'Desativar' : 'Ativar'} Plano
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum plano cadastrado.</p>
        </Card>
      )}
    </div>
  );
};

export default PlansManager;
