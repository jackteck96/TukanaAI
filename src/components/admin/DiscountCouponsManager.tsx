import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Search, Ticket, Calendar, Users, History, Copy, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiscountCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  expiration_date: string;
  max_uses: number | null;
  current_uses: number;
  restrict_single_use_per_client: boolean;
  eligible_plans: string[];
  discount_duration_months: number | null;
  discount_duration_days: number | null;
  is_pilot_coupon: boolean;
  is_active: boolean;
  created_at: string;
}

interface CouponUsage {
  id: string;
  coupon_id: string;
  cpf_cnpj: string;
  used_at: string;
  discount_applied: number;
  plan_at_use: string | null;
}

type DurationType = 'months' | 'days';

const DiscountCouponsManager = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [usageHistory, setUsageHistory] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [selectedCouponForHistory, setSelectedCouponForHistory] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage" as 'percentage' | 'fixed',
    discount_value: "",
    start_date: "",
    expiration_date: "",
    max_uses: "",
    restrict_single_use_per_client: true,
    eligible_plans: ['essencial', 'profissional', 'estrategico'] as string[],
    duration_type: "days" as DurationType,
    duration_value: "14",
    is_pilot_coupon: false,
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCoupons((data || []) as DiscountCoupon[]);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast({ title: "Erro", description: "Erro ao carregar cupons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageHistory = async (couponId: string) => {
    try {
      const { data, error } = await supabase
        .from('coupon_usage_history')
        .select('*')
        .eq('coupon_id', couponId)
        .order('used_at', { ascending: false });
      
      if (error) throw error;
      setUsageHistory((data || []) as CouponUsage[]);
      setSelectedCouponForHistory(couponId);
    } catch (error: any) {
      console.error('Error fetching usage history:', error);
      toast({ title: "Erro", description: "Erro ao carregar histórico", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const durationValue = parseInt(form.duration_value) || 14;
      const payload = {
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        start_date: new Date(form.start_date).toISOString(),
        expiration_date: new Date(form.expiration_date).toISOString(),
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        restrict_single_use_per_client: form.restrict_single_use_per_client,
        eligible_plans: form.eligible_plans,
        discount_duration_months: form.duration_type === 'months' ? durationValue : null,
        discount_duration_days: form.duration_type === 'days' ? durationValue : null,
        is_pilot_coupon: form.is_pilot_coupon,
        is_active: form.is_active
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('discount_coupons')
          .update(payload)
          .eq('id', editingCoupon.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Cupom atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from('discount_coupons')
          .insert(payload);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Cupom criado com sucesso" });
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const toggleCouponStatus = async (coupon: DiscountCoupon) => {
    try {
      const { error } = await supabase
        .from('discount_coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);
      
      if (error) throw error;
      toast({ 
        title: "Sucesso", 
        description: `Cupom ${!coupon.is_active ? 'ativado' : 'desativado'} com sucesso` 
      });
      fetchCoupons();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setForm({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      start_date: "",
      expiration_date: "",
      max_uses: "",
      restrict_single_use_per_client: true,
      eligible_plans: ['essencial', 'profissional', 'estrategico'],
      duration_type: "days",
      duration_value: "14",
      is_pilot_coupon: false,
      is_active: true
    });
  };

  const openEditModal = (coupon: DiscountCoupon) => {
    setEditingCoupon(coupon);
    const hasDays = coupon.discount_duration_days !== null;
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      start_date: coupon.start_date.split('T')[0],
      expiration_date: coupon.expiration_date.split('T')[0],
      max_uses: coupon.max_uses?.toString() || "",
      restrict_single_use_per_client: coupon.restrict_single_use_per_client,
      eligible_plans: coupon.eligible_plans,
      duration_type: hasDays ? "days" : "months",
      duration_value: (hasDays ? coupon.discount_duration_days : coupon.discount_duration_months)?.toString() || "14",
      is_pilot_coupon: coupon.is_pilot_coupon,
      is_active: coupon.is_active
    });
    setIsModalOpen(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copiado!", description: "Código copiado para a área de transferência" });
  };

  const handlePlanToggle = (plan: string) => {
    setForm(prev => ({
      ...prev,
      eligible_plans: prev.eligible_plans.includes(plan)
        ? prev.eligible_plans.filter(p => p !== plan)
        : [...prev.eligible_plans, plan]
    }));
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="coupons" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Cupons
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico de Uso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-semibold">Cupons de Desconto</h2>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cupom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dialog open={isModalOpen} onOpenChange={(open) => {
                setIsModalOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Cupom
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCoupon ? 'Editar Cupom' : 'Novo Cupom de Desconto'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCoupon ? 'Atualize as configurações do cupom.' : 'Configure um novo cupom de desconto.'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="code">Código do Cupom *</Label>
                      <Input
                        id="code"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        placeholder="EX: DESCONTO20"
                        className="uppercase"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount_type">Tipo de Desconto</Label>
                        <Select 
                          value={form.discount_type} 
                          onValueChange={(v: 'percentage' | 'fixed') => setForm({ ...form, discount_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentual (%)</SelectItem>
                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="discount_value">Valor do Desconto *</Label>
                        <Input
                          id="discount_value"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.discount_value}
                          onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                          placeholder={form.discount_type === 'percentage' ? "20" : "50.00"}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">Data de Início *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={form.start_date}
                          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="expiration_date">Data de Expiração *</Label>
                        <Input
                          id="expiration_date"
                          type="date"
                          value={form.expiration_date}
                          onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max_uses">Limite de Usos (vazio = ilimitado)</Label>
                        <Input
                          id="max_uses"
                          type="number"
                          min="1"
                          value={form.max_uses}
                          onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration_value">
                          Duração do Desconto ({form.duration_type === 'days' ? 'dias' : 'meses'})
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="duration_value"
                            type="number"
                            min="1"
                            value={form.duration_value}
                            onChange={(e) => setForm({ ...form, duration_value: e.target.value })}
                            placeholder={form.duration_type === 'days' ? "14" : "1"}
                            className="flex-1"
                          />
                          <Select 
                            value={form.duration_type} 
                            onValueChange={(v: DurationType) => setForm({ ...form, duration_type: v })}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days">Dias</SelectItem>
                              <SelectItem value="months">Meses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_pilot_coupon"
                        checked={form.is_pilot_coupon}
                        onCheckedChange={(checked) => setForm({ ...form, is_pilot_coupon: checked as boolean })}
                      />
                      <Label htmlFor="is_pilot_coupon">Cupom de Piloto Gratuito (100% de desconto)</Label>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Planos Elegíveis</Label>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { slug: 'essencial', label: 'Essencial' },
                          { slug: 'profissional', label: 'Profissional' },
                          { slug: 'estrategico', label: 'Estratégico' }
                        ].map((plan) => (
                          <div key={plan.slug} className="flex items-center space-x-2">
                            <Checkbox
                              id={`plan-${plan.slug}`}
                              checked={form.eligible_plans.includes(plan.slug)}
                              onCheckedChange={() => handlePlanToggle(plan.slug)}
                            />
                            <Label htmlFor={`plan-${plan.slug}`}>{plan.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="restrict_single_use"
                        checked={form.restrict_single_use_per_client}
                        onCheckedChange={(checked) => setForm({ ...form, restrict_single_use_per_client: checked as boolean })}
                      />
                      <Label htmlFor="restrict_single_use">Limitar a 1 uso por CPF/CNPJ</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={form.is_active}
                        onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Cupom Ativo</Label>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Cupons</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cupons Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">
                  {coupons.filter(c => c.is_active && !isExpired(c.expiration_date)).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cupons Expirados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">
                  {coupons.filter(c => isExpired(c.expiration_date)).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {coupons.reduce((acc, c) => acc + c.current_uses, 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Coupons Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Planos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[140px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum cupom encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCoupons.map((coupon) => {
                      const expired = isExpired(coupon.expiration_date);
                      return (
                        <TableRow key={coupon.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                                {coupon.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyCode(coupon.code)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {coupon.discount_type === 'percentage' 
                                ? `${coupon.discount_value}%` 
                                : `R$ ${coupon.discount_value.toFixed(2)}`
                              }
                            </span>
                            {coupon.discount_duration_months && coupon.discount_duration_months > 1 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({coupon.discount_duration_months} meses)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              <span>{format(new Date(coupon.start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                              <span className="text-muted-foreground">
                                até {format(new Date(coupon.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{coupon.current_uses}</span>
                            {coupon.max_uses && (
                              <span className="text-muted-foreground">/{coupon.max_uses}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {coupon.eligible_plans.map(plan => (
                                <Badge key={plan} variant="outline" className="text-xs capitalize">
                                  {plan}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {expired ? (
                              <Badge variant="destructive">Expirado</Badge>
                            ) : coupon.is_active ? (
                              <Badge variant="default" className="bg-success">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(coupon)}
                                className="h-8 w-8"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => fetchUsageHistory(coupon.id)}
                                className="h-8 w-8"
                              >
                                <History className="w-4 h-4" />
                              </Button>
                              <Switch
                                checked={coupon.is_active}
                                onCheckedChange={() => toggleCouponStatus(coupon)}
                                disabled={expired}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Histórico de Uso de Cupons</h2>
          </div>

          {selectedCouponForHistory ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico do Cupom
                </CardTitle>
                <CardDescription>
                  Cupom selecionado: {coupons.find(c => c.id === selectedCouponForHistory)?.code}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usageHistory.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum uso registrado para este cupom
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CPF/CNPJ</TableHead>
                        <TableHead>Data de Uso</TableHead>
                        <TableHead>Desconto Aplicado</TableHead>
                        <TableHead>Plano</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageHistory.map((usage) => (
                        <TableRow key={usage.id}>
                          <TableCell className="font-mono">{usage.cpf_cnpj}</TableCell>
                          <TableCell>
                            {format(new Date(usage.used_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>R$ {usage.discount_applied.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {usage.plan_at_use || '-'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um cupom na aba "Cupons" para ver o histórico de uso</p>
                <p className="text-sm mt-2">Clique no ícone <History className="w-4 h-4 inline" /> ao lado do cupom</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiscountCouponsManager;
