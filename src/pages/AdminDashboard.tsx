import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  FileText, 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Settings,
  BookOpen,
  Target,
  Save,
  Eye,
  Copy,
  UserPlus,
  Crown,
  Mail,
  FolderOpen,
  Building2
} from "lucide-react";
import DocumentCategoryManager from "@/components/DocumentCategoryManager";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

interface GlobalDocumentType {
  id: string;
  name: string;
  has_issue_date: boolean;
  has_expiration_date: boolean;
  requires_issuing_location: boolean;
  notes: string;
}

interface GlobalDocumentTemplate {
  id: string;
  title: string;
  category: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

interface AITrainingData {
  id: string;
  process_type: string;
  keywords: string[];
  required_documents: string[];
  suggested_documents: string[];
  conditions: string;
  priority: number;
  is_active: boolean;
  input_example: string;
  expected_output: string;
  notes: string;
}

interface AITrainingCase {
  id: string;
  process_type: string;
  description: string;
  documents_received: string[];
  correct_documents: string[];
  result: 'success' | 'failure';
  feedback: string;
}

interface TermsOfService {
  id: string;
  version: string;
  content: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { company } = useCompany();


  // States for platform admins
  const [platformAdmins, setPlatformAdmins] = useState<any[]>([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [sendingAdminInvite, setSendingAdminInvite] = useState(false);
  
  // States for terms of service
  const [termsOfService, setTermsOfService] = useState<TermsOfService[]>([]);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState<TermsOfService | null>(null);
  const [termsForm, setTermsForm] = useState({
    version: "",
    content: ""
  });
  
  // States for document types
  const [documentTypes, setDocumentTypes] = useState<GlobalDocumentType[]>([]);
  const [isDocTypeModalOpen, setIsDocTypeModalOpen] = useState(false);
  const [editingDocType, setEditingDocType] = useState<GlobalDocumentType | null>(null);
  const [docTypeForm, setDocTypeForm] = useState({
    name: "",
    has_issue_date: false,
    has_expiration_date: false,
    requires_issuing_location: false,
    notes: ""
  });

  // States for document templates
  const [templates, setTemplates] = useState<GlobalDocumentTemplate[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GlobalDocumentTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    title: "",
    category: "",
    content: ""
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  // States for AI training
  const [trainingData, setTrainingData] = useState<AITrainingData[]>([]);
  const [trainingCases, setTrainingCases] = useState<AITrainingCase[]>([]);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<AITrainingData | null>(null);
  const [trainingForm, setTrainingForm] = useState({
    process_type: "",
    input_example: "",
    expected_output: "",
    notes: "",
    keywords: [] as string[],
    required_documents: [] as string[],
    suggested_documents: [] as string[],
    conditions: "",
    priority: 1
  });

  const [loading, setLoading] = useState(true);

  // States for company categories management
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Categories and document options
  const categories = [
    "Contrato", "Procuração", "Certidão", "Declaração", 
    "Petição", "Requerimento", "Acordo", "Outros"
  ];

  const documentOptions = [
    "RG", "CPF", "Comprovante de Residência", "CNPJ", 
    "Carteira de Trabalho", "Contrato Social", "Inscrição Estadual",
    "Alvará de Funcionamento", "Declaração de IR", "Procuração"
  ];

  const processTypes = [
    "Contrato de Prestação de Serviços", "Documentação Fiscal",
    "Processo Trabalhista", "Abertura de Empresa", "Alteração Contratual"
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchPlatformAdmins(),
        fetchTermsOfService(),
        fetchDocumentTypes(),
        fetchTemplates(),
        fetchTrainingData(),
        fetchTrainingCases(),
        fetchCompanies()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchPlatformAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at,
          profiles!inner(email, full_name)
        `)
        .eq('role', 'platform_admin')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const admins = (data || []).map((item: any) => ({
        id: item.user_id,
        email: item.profiles.email,
        full_name: item.profiles.full_name,
        created_at: item.created_at
      }));
      
      setPlatformAdmins(admins);
    } catch (error) {
      console.error('Error fetching platform admins:', error);
    }
  };

  const handleInvitePlatformAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminEmail || !newAdminName) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    try {
      setSendingAdminInvite(true);

      // Check if email is already registered
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAdminEmail)
        .maybeSingle();

      if (existingUser) {
        // Check if already has platform_admin role
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('role', 'platform_admin')
          .maybeSingle();

        if (existingRole) {
          toast({ title: "Erro", description: "Este email já é um administrador da plataforma", variant: "destructive" });
          return;
        }
      }

      // Get current user data to send approval email
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Usuário não autenticado');

      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', currentUser.id)
        .single();

      // Create admin invite
      const { data: invite, error: inviteError } = await supabase
        .from('admin_invites')
        .insert({
          email: newAdminEmail,
          full_name: newAdminName,
          invited_by: currentUser.id
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send approval email to current admin
      const approvalLink = `${window.location.origin}/approve-admin?token=${invite.approval_token}`;
      
      const { error: emailError } = await supabase.functions.invoke('send-unified-email', {
        body: {
          to: currentUserProfile?.email || currentUser.email,
          recipientName: 'Administrador',
          companyName: 'Plataforma',
          inviteLink: approvalLink,
          isCollaboratorInvite: false
        }
      });

      if (emailError) throw emailError;

      toast({ 
        title: "Convite criado!", 
        description: `Um email foi enviado para você aprovar o convite de ${newAdminEmail}.`
      });

      setIsAdminModalOpen(false);
      setNewAdminEmail("");
      setNewAdminName("");
      fetchPlatformAdmins();
    } catch (error: any) {
      console.error('Error inviting platform admin:', error);
      toast({ title: "Erro", description: error.message || "Erro ao criar convite", variant: "destructive" });
    } finally {
      setSendingAdminInvite(false);
    }
  };

  const fetchTermsOfService = async () => {
    const { data, error } = await supabase
      .from('terms_of_service')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTermsOfService(data || []);
  };

  const handleTermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTerms) {
        const { error } = await supabase
          .from('terms_of_service')
          .update(termsForm)
          .eq('id', editingTerms.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Termos de uso atualizados" });
      } else {
        const { error } = await supabase
          .from('terms_of_service')
          .insert({ ...termsForm, is_active: false });
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Termos de uso criados" });
      }
      
      setIsTermsModalOpen(false);
      setEditingTerms(null);
      setTermsForm({ version: "", content: "" });
      fetchTermsOfService();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleActivateTerms = async (id: string) => {
    try {
      // Deactivate all terms first
      await supabase
        .from('terms_of_service')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Activate selected term
      const { error } = await supabase
        .from('terms_of_service')
        .update({ is_active: true })
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Sucesso", description: "Termos ativados com sucesso" });
      fetchTermsOfService();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const fetchDocumentTypes = async () => {
    const { data, error } = await supabase
      .from('global_document_types')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setDocumentTypes(data || []);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('global_document_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTemplates(data || []);
  };

  const fetchTrainingData = async () => {
    const { data, error } = await supabase
      .from('ai_training_data')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTrainingData(data || []);
  };

  const fetchTrainingCases = async () => {
    const { data, error } = await supabase
      .from('ai_training_cases')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTrainingCases((data || []).map(caseData => ({
      ...caseData,
      result: caseData.result as 'success' | 'failure'
    })));
  };

  // Document Type handlers
  const handleDocTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDocType) {
        const { error } = await supabase
          .from('global_document_types')
          .update(docTypeForm)
          .eq('id', editingDocType.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Tipo de documento atualizado" });
      } else {
        const { error } = await supabase
          .from('global_document_types')
          .insert(docTypeForm);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Tipo de documento criado" });
      }
      
      setIsDocTypeModalOpen(false);
      setEditingDocType(null);
      setDocTypeForm({ name: "", has_issue_date: false, has_expiration_date: false, requires_issuing_location: false, notes: "" });
      fetchDocumentTypes();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteDocType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('global_document_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Sucesso", description: "Tipo de documento removido" });
      fetchDocumentTypes();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  // Template handlers
  const detectVariables = (content: string): string[] => {
    const regex = /\[([^\]]+)\]/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const variables = detectVariables(templateForm.content);
    
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('global_document_templates')
          .update({ ...templateForm, variables })
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Modelo atualizado" });
      } else {
        const { error } = await supabase
          .from('global_document_templates')
          .insert({ ...templateForm, variables });
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Modelo criado" });
      }
      
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      setTemplateForm({ title: "", category: "", content: "" });
      fetchTemplates();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  // AI Training handlers
  const handleTrainingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTraining) {
        const { error } = await supabase
          .from('ai_training_data')
          .update(trainingForm)
          .eq('id', editingTraining.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Exemplo de treinamento atualizado" });
      } else {
        const { error } = await supabase
          .from('ai_training_data')
          .insert({ ...trainingForm, is_active: true });
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Exemplo de treinamento criado" });
      }
      
      setIsTrainingModalOpen(false);
      setEditingTraining(null);
      setTrainingForm({
        process_type: "",
        input_example: "",
        expected_output: "",
        notes: "",
        keywords: [],
        required_documents: [],
        suggested_documents: [],
        conditions: "",
        priority: 1
      });
      fetchTrainingData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTraining = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_training_data')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Sucesso", description: "Exemplo de treinamento removido" });
      fetchTrainingData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handlePreview = (template: GlobalDocumentTemplate) => {
    let content = template.content;
    content = content.replace(/\[CLIENTE\]/g, "João Silva, brasileiro, casado, empresário");
    content = content.replace(/\[EMPRESA\]/g, "Silva & Associados Advogados");
    content = content.replace(/\[DATA\]/g, new Date().toLocaleDateString('pt-BR'));
    
    setPreviewContent(content);
    setPreviewMode(true);
  };

  const handleKeywordAdd = (keyword: string) => {
    if (keyword && !trainingForm.keywords.includes(keyword)) {
      setTrainingForm(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
    }
  };

  const handleKeywordRemove = (index: number) => {
    setTrainingForm(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  const handleDocumentAdd = (type: 'required' | 'suggested', doc: string) => {
    if (doc && !trainingForm[`${type}_documents`].includes(doc)) {
      setTrainingForm(prev => ({
        ...prev,
        [`${type}_documents`]: [...prev[`${type}_documents`], doc]
      }));
    }
  };

  const handleDocumentRemove = (type: 'required' | 'suggested', index: number) => {
    setTrainingForm(prev => ({
      ...prev,
      [`${type}_documents`]: prev[`${type}_documents`].filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-accent"
          >
            <Shield className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Painel do Administrador
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie tipos de documentos, modelos e treinamento da IA para toda a plataforma
            </p>
          </div>
        </div>

        <Tabs defaultValue="admins" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Administradores
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Termos de Uso
            </TabsTrigger>
            <TabsTrigger value="document-types" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tipos de Documentos
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Modelos de Documentos
            </TabsTrigger>
            <TabsTrigger value="ai-training" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Treinamento da IA
            </TabsTrigger>
          </TabsList>

          {/* Admins Tab */}
          <TabsContent value="admins" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Administradores da Plataforma</h2>
              <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar Administrador
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Convidar Novo Administrador</DialogTitle>
                    <DialogDescription>
                      Adicione um novo administrador da plataforma. Um email de aprovação será enviado.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvitePlatformAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="adminName">Nome Completo</Label>
                      <Input
                        id="adminName"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="Nome do novo administrador"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminEmail">E-mail</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        required
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1" disabled={sendingAdminInvite}>
                        {sendingAdminInvite ? 'Enviando...' : 'Enviar Convite'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAdminModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {platformAdmins.map((admin) => (
                <Card key={admin.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{admin.full_name || admin.email}</CardTitle>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        Administrador
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Adicionado em: {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {platformAdmins.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">
                    Nenhum administrador cadastrado ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Document Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Categorias de Documentos por Empresa</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Selecione uma Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companySelect">Empresa</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger id="companySelect">
                      <SelectValue placeholder="Selecione uma empresa para gerenciar categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompanyId && (
                  <div className="mt-6">
                    <DocumentCategoryManager 
                      key={selectedCompanyId}
                      companyId={selectedCompanyId}
                    />
                  </div>
                )}

                {!selectedCompanyId && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Selecione uma empresa acima para gerenciar suas categorias de documentos.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terms of Service Tab */}
          <TabsContent value="terms" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Termos de Uso da Plataforma</h2>
              <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingTerms(null);
                    setTermsForm({ version: "", content: "" });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Versão
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTerms ? 'Editar' : 'Criar'} Termos de Uso
                    </DialogTitle>
                    <DialogDescription>
                      Crie ou edite os termos de uso da plataforma. Use Markdown para formatação.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleTermsSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="version">Versão</Label>
                      <Input
                        id="version"
                        value={termsForm.version}
                        onChange={(e) => setTermsForm({ ...termsForm, version: e.target.value })}
                        placeholder="1.0, 2.0, etc."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Conteúdo (Markdown)</Label>
                      <Textarea
                        id="content"
                        value={termsForm.content}
                        onChange={(e) => setTermsForm({ ...termsForm, content: e.target.value })}
                        placeholder="# TERMOS DE USO&#10;&#10;## 1. ACEITAÇÃO DOS TERMOS&#10;..."
                        className="min-h-[400px] font-mono text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Use Markdown para formatação: # para títulos, ## para subtítulos, - para listas, etc.
                      </p>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingTerms ? 'Atualizar' : 'Criar'} Termos
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTermsModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {termsOfService.map((terms) => (
                <Card key={terms.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Versão {terms.version}
                          {terms.is_active && (
                            <Badge variant="default" className="bg-success">Ativa</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Criado em: {new Date(terms.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!terms.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivateTerms(terms.id)}
                          >
                            Ativar
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingTerms(terms);
                            setTermsForm({ version: terms.version, content: terms.content });
                            setIsTermsModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none line-clamp-3 text-muted-foreground">
                      {terms.content.substring(0, 200)}...
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {termsOfService.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">
                    Nenhum termo de uso cadastrado ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Document Types Tab */}
          <TabsContent value="document-types" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Tipos de Documentos Globais</h2>
              <Dialog open={isDocTypeModalOpen} onOpenChange={setIsDocTypeModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingDocType(null);
                    setDocTypeForm({ name: "", has_issue_date: false, has_expiration_date: false, requires_issuing_location: false, notes: "" });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Tipo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDocType ? 'Editar' : 'Criar'} Tipo de Documento
                    </DialogTitle>
                    <DialogDescription>
                      Este tipo ficará disponível para todos os usuários da plataforma
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDocTypeSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Documento</Label>
                      <Input
                        id="name"
                        value={docTypeForm.name}
                        onChange={(e) => setDocTypeForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: RG, CPF, CNH..."
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_issue_date"
                          checked={docTypeForm.has_issue_date}
                          onCheckedChange={(checked) => 
                            setDocTypeForm(prev => ({ ...prev, has_issue_date: checked as boolean }))
                          }
                        />
                        <Label htmlFor="has_issue_date">Possui data de emissão</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_expiration_date"
                          checked={docTypeForm.has_expiration_date}
                          onCheckedChange={(checked) => 
                            setDocTypeForm(prev => ({ ...prev, has_expiration_date: checked as boolean }))
                          }
                        />
                        <Label htmlFor="has_expiration_date">Possui data de expiração</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requires_issuing_location"
                          checked={docTypeForm.requires_issuing_location}
                          onCheckedChange={(checked) => 
                            setDocTypeForm(prev => ({ ...prev, requires_issuing_location: checked as boolean }))
                          }
                        />
                        <Label htmlFor="requires_issuing_location">Requer local de emissão</Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={docTypeForm.notes}
                        onChange={(e) => setDocTypeForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Informações adicionais..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingDocType ? 'Atualizar' : 'Criar'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDocTypeModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {documentTypes.map((type) => (
                <Card key={type.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingDocType(type);
                            setDocTypeForm({
                              name: type.name,
                              has_issue_date: type.has_issue_date,
                              has_expiration_date: type.has_expiration_date,
                              requires_issuing_location: type.requires_issuing_location,
                              notes: type.notes
                            });
                            setIsDocTypeModalOpen(true);
                          }}
                          className="h-8 w-8 hover:bg-accent"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocType(type.id)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {type.has_issue_date && (
                          <Badge variant="secondary">Data de Emissão</Badge>
                        )}
                        {type.has_expiration_date && (
                          <Badge variant="secondary">Data de Expiração</Badge>
                        )}
                        {type.requires_issuing_location && (
                          <Badge variant="secondary">Local de Emissão</Badge>
                        )}
                      </div>
                      {type.notes && (
                        <p className="text-sm text-muted-foreground">{type.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {documentTypes.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">
                    Nenhum tipo de documento cadastrado ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Modelos de Documentos Globais</h2>
              <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({ title: "", category: "", content: "" });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Modelo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? 'Editar' : 'Criar'} Modelo de Documento
                    </DialogTitle>
                    <DialogDescription>
                      Use [CLIENTE] e [EMPRESA] para inserir dados automáticos
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleTemplateSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Título</Label>
                        <Input
                          id="title"
                          value={templateForm.title}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Categoria</Label>
                        <Select 
                          value={templateForm.category}
                          onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="content">Conteúdo do Modelo</Label>
                      <Textarea
                        id="content"
                        value={templateForm.content}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                        rows={15}
                        className="font-mono text-sm"
                        required
                      />
                    </div>

                    {templateForm.content && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Variáveis detectadas:</p>
                        <div className="flex flex-wrap gap-2">
                          {detectVariables(templateForm.content).map((variable) => (
                            <Badge key={variable} variant="outline">{variable}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        {editingTemplate ? 'Atualizar' : 'Criar'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTemplateModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Preview Modal */}
            {previewMode && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Preview do Documento</CardTitle>
                    <Button variant="ghost" onClick={() => setPreviewMode(false)}>✕</Button>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[70vh]">
                    <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                      {previewContent}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="shadow-card hover:shadow-elegant transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{template.category}</Badge>
                          {template.is_active && <Badge variant="default">Ativo</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(template)}
                          className="h-8 w-8"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(template.content);
                            toast({ title: "Copiado!", description: "Modelo copiado para área de transferência" });
                          }}
                          className="h-8 w-8"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateForm({
                              title: template.title,
                              category: template.category,
                              content: template.content
                            });
                            setIsTemplateModalOpen(true);
                          }}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {template.content.substring(0, 200)}...
                      </p>
                      {template.variables.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Variáveis:</p>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.map((variable) => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {templates.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">
                    Nenhum modelo de documento cadastrado ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Training Tab */}
          <TabsContent value="ai-training" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Treinamento da IA</h2>
              <div className="flex gap-2">
                <Button onClick={() => setIsTrainingModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Regra
                </Button>
                <Button onClick={() => setIsCaseModalOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Caso
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Taxa de Acerto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">87.5%</div>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Regras Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trainingData.filter(d => d.is_active).length}</div>
                  <p className="text-xs text-muted-foreground">De {trainingData.length} total</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Casos de Treinamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trainingCases.length}</div>
                  <p className="text-xs text-muted-foreground">Casos registrados</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Exemplos de Treinamento</h3>
              {trainingData.map((rule) => (
                <Card key={rule.id} className={!rule.is_active ? 'opacity-50' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{rule.process_type}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTraining(rule);
                            setTrainingForm({
                              process_type: rule.process_type,
                              input_example: rule.input_example,
                              expected_output: rule.expected_output,
                              notes: rule.notes,
                              keywords: rule.keywords,
                              required_documents: rule.required_documents,
                              suggested_documents: rule.suggested_documents,
                              conditions: rule.conditions,
                              priority: rule.priority
                            });
                            setIsTrainingModalOpen(true);
                          }}
                          className="h-8 w-8 hover:bg-accent"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTraining(rule.id)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Exemplo de Entrada:</p>
                        <p className="text-sm text-muted-foreground bg-accent/30 p-2 rounded mt-1">
                          {rule.input_example || "Não definido"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Saída Esperada:</p>
                        <p className="text-sm text-muted-foreground bg-accent/30 p-2 rounded mt-1">
                          {rule.expected_output || "Não definido"}
                        </p>
                      </div>
                      {rule.notes && (
                        <div>
                          <p className="text-sm font-medium">Observações:</p>
                          <p className="text-sm text-muted-foreground">{rule.notes}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">Palavras-chave:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rule.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {trainingData.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">
                    Nenhuma regra de treinamento cadastrada ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Invite Platform Admin Modal */}
        <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Convidar Novo Administrador
              </DialogTitle>
              <DialogDescription>
                Envie um convite para que uma pessoa se torne administrador da plataforma
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvitePlatformAdmin} className="space-y-4">
              <div>
                <Label htmlFor="adminName">Nome Completo *</Label>
                <Input
                  id="adminName"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adminEmail">Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  required
                />
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-3">
                <p className="text-sm text-orange-900 dark:text-orange-300">
                  <strong>Lembre-se:</strong> Após o novo admin criar sua conta, você precisará definir manualmente o campo <code className="bg-orange-200 dark:bg-orange-900 px-1 rounded">role = 'admin'</code> na tabela <code className="bg-orange-200 dark:bg-orange-900 px-1 rounded">profiles</code> no banco de dados.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAdminModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={sendingAdminInvite}>
                  {sendingAdminInvite ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Invite Platform Admin Modal */}
        <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Convidar Novo Administrador
              </DialogTitle>
              <DialogDescription>
                Envie um convite para que uma pessoa se torne administrador da plataforma
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvitePlatformAdmin} className="space-y-4">
              <div>
                <Label htmlFor="adminName">Nome Completo *</Label>
                <Input
                  id="adminName"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="adminEmail">Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  required
                />
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-3">
                <p className="text-sm text-orange-900 dark:text-orange-300">
                  <strong>Lembre-se:</strong> Após o novo admin criar sua conta, você precisará definir manualmente o campo <code className="bg-orange-200 dark:bg-orange-900 px-1 rounded">role = 'admin'</code> na tabela <code className="bg-orange-200 dark:bg-orange-900 px-1 rounded">profiles</code> no banco de dados.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAdminModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={sendingAdminInvite}>
                  {sendingAdminInvite ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
