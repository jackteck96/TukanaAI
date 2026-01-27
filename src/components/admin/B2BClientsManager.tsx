import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Search, Building2, Mail, Phone, Ticket, AlertCircle, CheckCircle, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface B2BClient {
  id: string;
  company_id: string | null;
  company_name: string;
  cnpj: string | null;
  cpf: string | null;
  email: string;
  phone: string | null;
  status: 'pilot' | 'active' | 'cancelled';
  plan: string;
  started_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  pilot_start_date: string | null;
  pilot_end_date: string | null;
  subscription_plan_id: string | null;
  coupon_applied_id: string | null;
  access_blocked: boolean;
  blocked_reason: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
}

interface DiscountCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_pilot_coupon: boolean;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pilot: { label: "Piloto", variant: "secondary" },
  active: { label: "Ativo", variant: "default" },
  cancelled: { label: "Encerrado", variant: "destructive" }
};

const planLabels: Record<string, string> = {
  essencial: "Essencial",
  profissional: "Profissional",
  estrategico: "Estratégico",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise"
};

const B2BClientsManager = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<B2BClient[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<B2BClient | null>(null);
  const [selectedClientForCoupon, setSelectedClientForCoupon] = useState<B2BClient | null>(null);
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  const [form, setForm] = useState({
    company_name: "",
    cnpj: "",
    cpf: "",
    email: "",
    phone: "",
    status: "pilot" as 'pilot' | 'active' | 'cancelled',
    plan: "essencial",
    notes: ""
  });

  useEffect(() => {
    fetchClients();
    fetchPlans();
    fetchCoupons();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('b2b_clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClients((data || []) as B2BClient[]);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({ title: "Erro", description: "Erro ao carregar clientes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setPlans((data || []) as SubscriptionPlan[]);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('id, code, discount_type, discount_value, is_pilot_coupon')
        .eq('is_active', true)
        .order('code', { ascending: true });
      
      if (error) throw error;
      setCoupons((data || []) as DiscountCoupon[]);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
    }
  };

  const handleApplyCoupon = async () => {
    if (!selectedClientForCoupon || !selectedCouponCode) return;
    
    setApplyingCoupon(true);
    try {
      const { data, error } = await supabase.rpc('apply_coupon_to_b2b_client', {
        p_client_id: selectedClientForCoupon.id,
        p_coupon_code: selectedCouponCode
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string; pilot_end_date?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao aplicar cupom');
      }

      toast({ 
        title: "Sucesso", 
        description: result.message || "Cupom aplicado com sucesso"
      });
      
      setIsCouponModalOpen(false);
      setSelectedClientForCoupon(null);
      setSelectedCouponCode("");
      fetchClients();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleToggleAccess = async (client: B2BClient) => {
    try {
      const { error } = await supabase
        .from('b2b_clients')
        .update({ 
          access_blocked: !client.access_blocked,
          blocked_at: !client.access_blocked ? new Date().toISOString() : null,
          blocked_reason: !client.access_blocked ? 'Bloqueado manualmente pelo administrador' : null
        })
        .eq('id', client.id);
      
      if (error) throw error;
      
      toast({ 
        title: "Sucesso", 
        description: `Acesso ${client.access_blocked ? 'liberado' : 'bloqueado'} com sucesso` 
      });
      fetchClients();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const openCouponModal = (client: B2BClient) => {
    setSelectedClientForCoupon(client);
    setSelectedCouponCode("");
    setIsCouponModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        company_name: form.company_name,
        cnpj: form.cnpj || null,
        cpf: form.cpf || null,
        email: form.email,
        phone: form.phone || null,
        status: form.status,
        plan: form.plan,
        notes: form.notes || null
      };

      if (editingClient) {
        const { error } = await supabase
          .from('b2b_clients')
          .update(payload)
          .eq('id', editingClient.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Cliente atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from('b2b_clients')
          .insert(payload);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Cliente criado com sucesso" });
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingClient(null);
    setForm({
      company_name: "",
      cnpj: "",
      cpf: "",
      email: "",
      phone: "",
      status: "pilot",
      plan: plans.length > 0 ? plans[0].slug : "essencial",
      notes: ""
    });
  };

  const openEditModal = (client: B2BClient) => {
    setEditingClient(client);
    setForm({
      company_name: client.company_name,
      cnpj: client.cnpj || "",
      cpf: client.cpf || "",
      email: client.email,
      phone: client.phone || "",
      status: client.status,
      plan: client.plan || "essencial",
      notes: client.notes || ""
    });
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.cnpj && client.cnpj.includes(searchTerm)) ||
      (client.cpf && client.cpf.includes(searchTerm));
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        <h2 className="text-2xl font-semibold">Clientes B2B</h2>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pilot">Piloto</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente B2B'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Atualize as informações do cliente.' : 'Cadastre um novo cliente B2B na plataforma.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="Nome da empresa"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={form.cnpj}
                      onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={form.cpf}
                      onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contato@empresa.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.status} onValueChange={(v: 'pilot' | 'active' | 'cancelled') => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pilot">Piloto</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="cancelled">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="plan">Plano</Label>
                    <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.length > 0 ? (
                          plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.slug}>{plan.name}</SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="essencial">Essencial</SelectItem>
                            <SelectItem value="profissional">Profissional</SelectItem>
                            <SelectItem value="estrategico">Estratégico</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Notas internas sobre o cliente..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingClient ? 'Atualizar' : 'Criar'} Cliente
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Piloto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {clients.filter(c => c.status === 'pilot').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {clients.filter(c => c.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {clients.filter(c => c.status === 'cancelled').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acesso Bloqueado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">
              {clients.filter(c => c.access_blocked).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Piloto</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className={client.access_blocked ? 'bg-destructive/5' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{client.company_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {client.cnpj || client.cpf || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[client.status]?.variant || "secondary"}>
                        {statusLabels[client.status]?.label || client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{planLabels[client.plan] || client.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.status === 'pilot' && client.pilot_end_date ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">
                            Até {format(new Date(client.pilot_end_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          {new Date(client.pilot_end_date) < new Date() && (
                            <Badge variant="destructive" className="text-xs w-fit">Expirado</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.access_blocked ? (
                        <div className="flex items-center gap-1 text-destructive">
                          <Lock className="w-4 h-4" />
                          <span className="text-xs">Bloqueado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-success">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Liberado</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(client)}
                          className="h-8 w-8"
                          title="Editar cliente"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openCouponModal(client)}
                          className="h-8 w-8"
                          title="Aplicar cupom"
                        >
                          <Ticket className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleAccess(client)}
                          className={`h-8 w-8 ${client.access_blocked ? 'text-success hover:text-success' : 'text-destructive hover:text-destructive'}`}
                          title={client.access_blocked ? 'Liberar acesso' : 'Bloquear acesso'}
                        >
                          {client.access_blocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Coupon Application Modal */}
      <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar Cupom</DialogTitle>
            <DialogDescription>
              Aplique um cupom de desconto ou piloto para {selectedClientForCoupon?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecionar Cupom</Label>
              <Select value={selectedCouponCode} onValueChange={setSelectedCouponCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um cupom..." />
                </SelectTrigger>
                <SelectContent>
                  {coupons.map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{coupon.code}</span>
                        <Badge variant={coupon.is_pilot_coupon ? "secondary" : "outline"} className="text-xs">
                          {coupon.is_pilot_coupon ? 'Piloto' : 
                            coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}%` 
                              : `R$ ${coupon.discount_value}`
                          }
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedClientForCoupon?.coupon_applied_id && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg text-warning">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Este cliente já possui um cupom aplicado</span>
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleApplyCoupon} 
                disabled={!selectedCouponCode || applyingCoupon}
                className="flex-1"
              >
                {applyingCoupon ? 'Aplicando...' : 'Aplicar Cupom'}
              </Button>
              <Button variant="outline" onClick={() => setIsCouponModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default B2BClientsManager;
