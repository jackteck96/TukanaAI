import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, FileText, Search, Globe, User } from 'lucide-react';
import InternalSignatureManager from './InternalSignatureManager';
import jsPDF from 'jspdf';
import { formatLegalQualification, LegalData } from '@/utils/legalQualification';
import { cn } from '@/lib/utils';

interface Client {
  client_email: string;
  client_name: string;
  id?: string;
}

interface RegisteredClient {
  id: string;
  email: string;
  company_name: string;
  phone: string;
  cnpj?: string;
  admin_full_name?: string;
  admin_cpf?: string;
}

interface Template {
  id: string;
  title: string;
  category: string;
  content: string;
  variables: string[];
  is_global?: boolean;
}

interface StandaloneDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isClientView?: boolean;
}

export const StandaloneDocumentUpload = ({
  open,
  onOpenChange,
  onSuccess,
  isClientView = false
}: StandaloneDocumentUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [registeredClients, setRegisteredClients] = useState<RegisteredClient[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isClientUser, setIsClientUser] = useState(false);
  const [userProfile, setUserProfile] = useState<{ email: string; full_name: string } | null>(null);
  
  // Client search for templates
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [filteredClients, setFilteredClients] = useState<RegisteredClient[]>([]);
  const clientSearchRef = useRef<HTMLDivElement>(null);
  
  // Company legal qualification
  const [companyQualification, setCompanyQualification] = useState<string>('');
  const [clientQualification, setClientQualification] = useState<string>('');
  
  // Tab de origem: upload ou modelo
  const [sourceTab, setSourceTab] = useState<'upload' | 'template'>('upload');
  
  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [templateSearch, setTemplateSearch] = useState('');
  
  const [formData, setFormData] = useState({
    client_email: '',
    client_name: '',
    document_name: '',
    signature_deadline: '',
    notes: '',
    file: null as File | null
  });
  const [createdDocumentId, setCreatedDocumentId] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSuccessStep, setShowSuccessStep] = useState(false);

  // Resetar fluxo ao fechar e carregar clientes ao abrir
  const resetSignatureFlow = () => {
    setFormData({
      client_email: '',
      client_name: '',
      document_name: '',
      signature_deadline: '',
      notes: '',
      file: null
    });
    setCreatedDocumentId(null);
    setShowSignatureModal(false);
    setShowSuccessStep(false);
    setLoading(false);
    setSourceTab('upload');
    setSelectedTemplate(null);
    setTemplateVariables({});
    setTemplateSearch('');
    setClientSearch('');
    setClientQualification('');
    setShowClientSuggestions(false);
  };

  // Close client suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter clients based on search
  useEffect(() => {
    if (clientSearch.length >= 2) {
      const filtered = registeredClients.filter(c =>
        c.company_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(clientSearch.toLowerCase())
      ).slice(0, 5);
      setFilteredClients(filtered);
      setShowClientSuggestions(filtered.length > 0);
    } else {
      setFilteredClients([]);
      setShowClientSuggestions(false);
    }
  }, [clientSearch, registeredClients]);

  useEffect(() => {
    if (open) {
      // Ao abrir, garantir que estamos no passo inicial
      setShowSuccessStep(false);
      setShowSignatureModal(false);
      // Carregar clientes e templates
      loadClients();
      loadTemplates();
    } else {
      // Ao fechar, resetar fluxo por completo
      resetSignatureFlow();
    }
  }, [open]);

  // Load company legal qualification
  const loadCompanyQualification = async (cId: string) => {
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', cId)
        .single();

      if (companyData) {
        const companyLegalData: LegalData = {
          person_type: 'pj',
          company_name: companyData.name,
          cnpj: companyData.cnpj || undefined,
          address: companyData.address || undefined,
          legal_representative_name: companyData.legal_representative_name || undefined,
          legal_representative_cpf: companyData.legal_representative_cpf || undefined,
          email: companyData.email || undefined,
          phone: companyData.phone || undefined
        };
        const qualification = formatLegalQualification(companyLegalData);
        setCompanyQualification(qualification);
        return qualification;
      }
    } catch (error) {
      console.error('Erro ao carregar qualificação da empresa:', error);
    }
    return '';
  };

  // Load client legal qualification
  const loadClientQualification = async (clientEmail: string, cId: string) => {
    try {
      // Try client_legal_data first
      const { data: legalData } = await supabase
        .from('client_legal_data')
        .select('*')
        .eq('client_email', clientEmail)
        .eq('company_id', cId)
        .maybeSingle();

      if (legalData) {
        let clientData: LegalData;
        if (legalData.person_type === 'pf') {
          clientData = {
            person_type: 'pf',
            client_name: legalData.client_name,
            cpf: legalData.cpf || undefined,
            rg: legalData.rg || undefined,
            nationality: legalData.nationality || undefined,
            marital_status: legalData.marital_status || undefined,
            profession: legalData.profession || undefined,
            address: legalData.address || undefined,
            email: legalData.email || clientEmail,
            phone: legalData.phone || undefined
          };
        } else {
          clientData = {
            person_type: 'pj',
            company_name: legalData.company_name || legalData.client_name,
            cnpj: legalData.cnpj || undefined,
            address: legalData.address || undefined,
            legal_representative_name: legalData.legal_representative_name || undefined,
            legal_representative_cpf: legalData.legal_representative_cpf || undefined,
            email: legalData.email || clientEmail,
            phone: legalData.phone || undefined
          };
        }
        const qualification = formatLegalQualification(clientData);
        setClientQualification(qualification);
        return qualification;
      }

      // Fallback: try clients table
      const { data: clientBasicData } = await supabase
        .from('clients')
        .select('*')
        .eq('email', clientEmail)
        .eq('company_id', cId)
        .maybeSingle();

      if (clientBasicData) {
        const address = [
          clientBasicData.address_street,
          clientBasicData.address_number,
          clientBasicData.address_complement,
          clientBasicData.address_neighborhood,
          clientBasicData.address_city,
          clientBasicData.address_state,
          clientBasicData.address_zipcode
        ].filter(Boolean).join(', ');

        const clientData: LegalData = {
          person_type: 'pj',
          company_name: clientBasicData.company_name,
          cnpj: clientBasicData.cnpj || undefined,
          address: address || undefined,
          legal_representative_name: clientBasicData.admin_full_name || undefined,
          legal_representative_cpf: clientBasicData.admin_cpf || undefined,
          email: clientBasicData.email,
          phone: clientBasicData.phone || undefined
        };
        const qualification = formatLegalQualification(clientData);
        setClientQualification(qualification);
        return qualification;
      }
    } catch (error) {
      console.error('Erro ao carregar qualificação do cliente:', error);
    }
    setClientQualification('');
    return '';
  };

  const loadTemplates = async () => {
    if (!user) return;
    
    setLoadingTemplates(true);
    try {
      // Fetch global templates
      const { data: globalTemplates, error: globalError } = await supabase
        .from('global_document_templates')
        .select('*')
        .eq('is_active', true)
        .order('title');
      
      if (globalError) console.error('Erro ao carregar templates globais:', globalError);

      // Fetch company templates (need company_id first)
      let companyTemplates: any[] = [];
      if (companyId) {
        const { data, error } = await supabase
          .from('company_document_templates')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('title');
        
        if (error) console.error('Erro ao carregar templates da empresa:', error);
        companyTemplates = data || [];
      }

      const global = (globalTemplates || []).map(t => ({ ...t, is_global: true }));
      const company = companyTemplates.map(t => ({ ...t, is_global: false }));
      
      setTemplates([...company, ...global]);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Recarregar templates quando companyId mudar
  useEffect(() => {
    if (open && companyId) {
      loadTemplates();
    }
  }, [companyId]);

  const loadClients = async () => {
    if (!user) return;
    
    setLoadingClients(true);
    try {
      // Se isClientView está definido, usar diretamente
      if (isClientView) {
        setIsClientUser(true);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name, company_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          setFormData(prev => ({
            ...prev,
            client_email: profile.email,
            client_name: profile.full_name
          }));
          setCompanyId(profile.company_id);
        }

        setLoadingClients(false);
        return;
      }

      // Caso contrário, verificar se o usuário é um cliente
      const { data: clientRoleData } = await supabase
        .from('user_roles')
        .select('role, client_email')
        .eq('user_id', user.id)
        .in('role', ['client', 'client_collaborator'])
        .limit(1);

      // Se for cliente, buscar informações do perfil
      if (clientRoleData && clientRoleData.length > 0) {
        setIsClientUser(true);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name, company_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          setFormData(prev => ({
            ...prev,
            client_email: profile.email,
            client_name: profile.full_name
          }));
          
          // Clientes também precisam de company_id para upload standalone
          setCompanyId(profile.company_id);
        }

        setLoadingClients(false);
        return;
      }

      // Se não for cliente, é empresa - buscar company_id
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user.id)
        .in('role', ['company_admin', 'company_collaborator'])
        .limit(1);

      if (userError) {
        console.error('Erro ao buscar company_id:', userError);
        throw userError;
      }

      const userCompanyId = userData?.[0]?.company_id;
      
      if (userCompanyId) {
        setCompanyId(userCompanyId);
        
        // Load company qualification
        loadCompanyQualification(userCompanyId);

        // Buscar clientes cadastrados da tabela clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, email, company_name, phone, cnpj, admin_full_name, admin_cpf')
          .eq('company_id', userCompanyId)
          .order('company_name', { ascending: true });

        let loadedRegisteredClients: RegisteredClient[] = [];
        let loadedClients: Client[] = [];

        if (clientsError) {
          console.error('Erro ao buscar clientes cadastrados:', clientsError);
        } else if (clientsData && clientsData.length > 0) {
          loadedRegisteredClients = clientsData;
          setRegisteredClients(clientsData);
          // Also set as regular clients for backwards compatibility
          loadedClients = clientsData.map(c => ({
            client_email: c.email,
            client_name: c.company_name
          }));
          console.log('Clientes cadastrados carregados:', clientsData.length);
        }

        // Also fetch from processes for clients not in clients table
        const { data: processData, error: processError } = await supabase
          .from('processes')
          .select('client_email, client_name')
          .eq('company_id', userCompanyId)
          .order('client_name', { ascending: true });

        if (processError) {
          console.error('Erro ao buscar processos:', processError);
        } else if (processData && processData.length > 0) {
          // Merge with registered clients, removing duplicates
          const existingEmails = new Set(loadedRegisteredClients.map(c => c.email));
          const processClients = processData
            .filter(p => !existingEmails.has(p.client_email))
            .map(item => ({
              client_email: item.client_email,
              client_name: item.client_name
            }));
          
          loadedClients = Array.from(
            new Map(
              [...loadedClients, ...processClients].map(item => [item.client_email, item])
            ).values()
          );
        }
        
        setClients(loadedClients);
        
        if (loadedClients.length === 0 && loadedRegisteredClients.length === 0) {
          toast({
            title: 'Aviso',
            description: 'Nenhum cliente encontrado. Cadastre clientes primeiro.',
            variant: 'default'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar lista de clientes',
        variant: 'destructive'
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleClientChange = async (email: string) => {
    const selectedClient = clients.find(c => c.client_email === email);
    if (selectedClient) {
      setFormData({
        ...formData,
        client_email: email,
        client_name: selectedClient.client_name
      });
      // Load client qualification for templates
      if (companyId) {
        await loadClientQualification(email, companyId);
      }
    }
  };

  // Handle registered client selection in template tab
  const handleRegisteredClientSelect = async (client: RegisteredClient) => {
    setFormData(prev => ({
      ...prev,
      client_email: client.email,
      client_name: client.company_name
    }));
    setClientSearch(client.company_name);
    setShowClientSuggestions(false);
    
    // Load client qualification
    if (companyId) {
      const clientQual = await loadClientQualification(client.email, companyId);
      
      // Auto-fill template variables if template is selected
      if (selectedTemplate) {
        setTemplateVariables(prev => {
          const updated = { ...prev };
          // Auto-fill common variable names
          const qualificationVars = ['qualificacao_cliente', 'qualificação_cliente', 'cliente_qualificacao', 'CLIENTE'];
          qualificationVars.forEach(varName => {
            if (varName in updated || selectedTemplate.variables.includes(varName)) {
              updated[varName] = clientQual;
            }
          });
          return updated;
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        file,
        document_name: formData.document_name || file.name
      });
    }
  };

  // Selecionar um template
  const handleSelectTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      document_name: template.title
    }));
    
    // Inicializar variáveis do template com qualificações pré-preenchidas
    const vars: Record<string, string> = {};
    template.variables.forEach(v => {
      // Auto-fill company qualification variables
      const companyVars = ['qualificacao_empresa', 'qualificação_empresa', 'empresa_qualificacao', 'EMPRESA', 'CONTRATANTE'];
      const clientVars = ['qualificacao_cliente', 'qualificação_cliente', 'cliente_qualificacao', 'CLIENTE', 'CONTRATADO'];
      
      if (companyVars.some(cv => v.toLowerCase().includes(cv.toLowerCase()))) {
        vars[v] = companyQualification;
      } else if (clientVars.some(cv => v.toLowerCase().includes(cv.toLowerCase()))) {
        vars[v] = clientQualification;
      } else {
        vars[v] = '';
      }
    });
    setTemplateVariables(vars);
  };

  // Gerar PDF a partir do template
  const generatePdfFromTemplate = async (): Promise<File | null> => {
    if (!selectedTemplate) return null;

    try {
      let content = selectedTemplate.content;
      
      // Substituir variáveis no conteúdo
      Object.entries(templateVariables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        content = content.replace(regex, value || `[${key}]`);
      });

      // Criar PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Título
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedTemplate.title, margin, 25);
      
      // Linha separadora
      pdf.setDrawColor(200);
      pdf.line(margin, 30, pageWidth - margin, 30);
      
      // Conteúdo
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const lines = pdf.splitTextToSize(content, maxWidth);
      let yPosition = 40;
      const lineHeight = 6;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      for (const line of lines) {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      }

      // Converter para File
      const pdfBlob = pdf.output('blob');
      const fileName = `${selectedTemplate.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      return new File([pdfBlob], fileName, { type: 'application/pdf' });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar PDF do modelo',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Obter preview do conteúdo do template
  const getTemplatePreview = () => {
    if (!selectedTemplate) return '';
    let content = selectedTemplate.content;
    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value || `[${key}]`);
    });
    return content;
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      "Contrato": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "Procuração": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Certidão": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "Declaração": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      "Petição": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[categoria] || "bg-muted text-muted-foreground";
  };

  const handleSubmit = async () => {
    // Validar cliente
    if (!formData.client_email) {
      toast({
        title: 'Erro',
        description: 'Selecione um cliente',
        variant: 'destructive'
      });
      return;
    }

    // Validar arquivo ou template
    if (sourceTab === 'upload' && !formData.file) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo',
        variant: 'destructive'
      });
      return;
    }

    if (sourceTab === 'template' && !selectedTemplate) {
      toast({
        title: 'Erro',
        description: 'Selecione um modelo de documento',
        variant: 'destructive'
      });
      return;
    }

    // Para clientes, buscar company_id dos seus processos
    let targetCompanyId = companyId;
    
    if (isClientUser && !companyId) {
      const { data: processData } = await supabase
        .from('processes')
        .select('company_id')
        .eq('client_email', formData.client_email)
        .limit(1)
        .single();
      
      targetCompanyId = processData?.company_id || null;
    }

    if (!targetCompanyId) {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar a empresa associada',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Determinar o arquivo a ser enviado
      let fileToUpload: File;
      
      if (sourceTab === 'template') {
        const generatedPdf = await generatePdfFromTemplate();
        if (!generatedPdf) {
          setLoading(false);
          return;
        }
        fileToUpload = generatedPdf;
      } else {
        fileToUpload = formData.file!;
      }

      // Upload do arquivo para o storage
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `standalone-signatures/${targetCompanyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      // Inserir registro no banco
      const { data: newDocument, error: insertError } = await supabase
        .from('standalone_signature_documents')
        .insert({
          company_id: targetCompanyId,
          client_email: formData.client_email,
          client_name: formData.client_name,
          document_name: formData.document_name,
          file_path: filePath,
          file_type: fileToUpload.type,
          file_size: fileToUpload.size,
          signature_deadline: formData.signature_deadline || null,
          signature_status: 'pending',
          uploaded_by: user!.id,
          notes: formData.notes || null
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Criar notificação apropriada (tolerante a RLS)
      if (isClientUser) {
        const { error: notifErr } = await supabase
          .from('client_notifications')
          .insert({
            company_id: targetCompanyId,
            client_email: formData.client_email,
            document_id: newDocument.id,
            notification_type: 'signature_request',
            title: `📝 Documento Aguardando Assinatura da Empresa`,
            message: `O cliente "${formData.client_name}" enviou o documento "${formData.document_name}" para assinatura da empresa.`
          } as any);
        if (notifErr) {
          console.warn('[StandaloneDocumentUpload] Notificação não criada (ignorado):', notifErr.message);
        }
      } else {
        const { error: notifErr } = await supabase
          .from('client_notifications')
          .insert({
            client_email: formData.client_email,
            document_id: newDocument.id,
            notification_type: 'document_uploaded',
            title: `📄 Novo Documento Enviado`,
            message: `Um documento "${formData.document_name}" foi enviado para você e aguarda assinatura após a empresa assinar primeiro.`
          } as any);
        if (notifErr) {
          console.warn('[StandaloneDocumentUpload] Notificação não criada (ignorado):', notifErr.message);
        }
      }

      toast({
        title: 'Documento criado com sucesso',
        description: 'Clique em "Seguinte" para posicionar e assinar o documento',
      });

      // Guardar o ID do documento criado e mostrar o passo de sucesso
      console.log('Documento criado com ID:', newDocument.id);
      setCreatedDocumentId(newDocument.id);
      setShowSuccessStep(true);
      console.log('showSuccessStep definido como true');
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar documento para assinatura',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureComplete = () => {
    toast({
      title: 'Assinatura concluída',
      description: 'Documento assinado e enviado para o cliente com sucesso'
    });
    
    // Reset form e fechar todos os modais
    setFormData({
      client_email: '',
      client_name: '',
      document_name: '',
      signature_deadline: '',
      notes: '',
      file: null
    });
    setCreatedDocumentId(null);
    setShowSignatureModal(false);
    setShowSuccessStep(false);
    onOpenChange(false); // Fechar o modal principal também
    onSuccess?.();
  };

  const handleContinueToSignature = () => {
    console.log('handleContinueToSignature chamado, documentId:', createdDocumentId);
    if (!createdDocumentId) {
      toast({
        title: 'Preparando documento...',
        description: 'Aguarde alguns segundos e tente novamente.',
      });
      return;
    }
    setShowSignatureModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={showSignatureModal ? "max-w-[95vw] max-h-[95vh] overflow-y-auto" : "max-w-2xl max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enviar Documento para Assinatura
          </DialogTitle>
          <DialogDescription>
            {isClientUser 
              ? 'Envie um documento para a empresa assinar. Você poderá posicionar sua assinatura após o upload.'
              : 'Posicione sua assinatura antes de enviar ao cliente. Você poderá revisar antes de confirmar.'
            }
          </DialogDescription>
        </DialogHeader>

        {loadingClients ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : showSignatureModal && createdDocumentId ? (
          <div className="py-2">
            <InternalSignatureManager
              documentId={createdDocumentId}
              documentName={formData.document_name}
              isStandalone={true}
              onSuccess={handleSignatureComplete}
              onClose={() => {
                setShowSignatureModal(false);
              }}
            />
          </div>
        ) : showSuccessStep ? (
          <div className="space-y-6 py-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Documento Criado com Sucesso!</h3>
                <p className="text-muted-foreground">
                  Documento: <span className="font-medium">{formData.document_name}</span>
                </p>
                <p className="text-muted-foreground">
                  Cliente: <span className="font-medium">{formData.client_name}</span>
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Próximos Passos:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>Posicione sua assinatura no documento</li>
                <li>Preencha seus dados para autenticação</li>
                <li>Confirme com o código enviado por email</li>
                <li>Após sua assinatura, o cliente será notificado</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mostrar campo de cliente apenas para empresas */}
            {!isClientUser && (
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select
                  value={formData.client_email}
                  onValueChange={handleClientChange}
                  disabled={clients.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      clients.length === 0 
                        ? "Nenhum cliente disponível" 
                        : "Selecione um cliente"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhum cliente encontrado
                      </div>
                    ) : (
                      clients.map(client => (
                        <SelectItem key={client.client_email} value={client.client_email}>
                          {client.client_name} ({client.client_email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {clients.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Para enviar documentos, você precisa ter pelo menos um processo cadastrado com um cliente.
                  </p>
                )}
              </div>
            )}
            
            {/* Mostrar informações do cliente para usuários cliente */}
            {isClientUser && userProfile && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Enviando como:</p>
                <p className="text-sm">{userProfile.full_name}</p>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
              </div>
            )}

            {/* Tabs para escolher entre upload de arquivo ou usar modelo */}
            <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as 'upload' | 'template')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Arquivo
                </TabsTrigger>
                <TabsTrigger value="template">
                  <FileText className="h-4 w-4 mr-2" />
                  Usar Modelo
                </TabsTrigger>
              </TabsList>

              {/* Tab de Upload */}
              <TabsContent value="upload" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="document_name">Nome do Documento *</Label>
                  <Input
                    id="document_name"
                    value={formData.document_name}
                    onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
                    placeholder="Ex: Contrato de Prestação de Serviços"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="flex-1"
                    />
                    {formData.file && (
                      <span className="text-sm text-muted-foreground">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PDF, DOC, DOCX
                  </p>
                </div>
              </TabsContent>

              {/* Tab de Modelo */}
              <TabsContent value="template" className="space-y-4 mt-4">
                {!selectedTemplate ? (
                  <>
                    {/* Busca de templates */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar modelos..."
                        className="pl-10"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                      />
                    </div>

                    {/* Lista de templates */}
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {loadingTemplates ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : filteredTemplates.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhum modelo encontrado</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Crie modelos em "Modelos de Documentos"
                          </p>
                        </div>
                      ) : (
                        filteredTemplates.map((template) => (
                          <Card 
                            key={template.id}
                            className="hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{template.title}</span>
                                    <Badge className={getCategoriaColor(template.category)} variant="secondary">
                                      {template.category}
                                    </Badge>
                                    {template.is_global && (
                                      <Badge variant="outline" className="text-xs">
                                        <Globe className="h-3 w-3 mr-1" />
                                        Global
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {template.content.substring(0, 80)}...
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Modelo selecionado */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{selectedTemplate.title}</p>
                          <Badge className={getCategoriaColor(selectedTemplate.category)} variant="secondary">
                            {selectedTemplate.category}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setTemplateVariables({});
                          setClientSearch('');
                          setClientQualification('');
                        }}
                      >
                        Trocar
                      </Button>
                    </div>

                    {/* Seleção de cliente para modelos (apenas para empresas) */}
                    {!isClientUser && (
                      <div ref={clientSearchRef} className="space-y-2 relative">
                        <Label>Cliente *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Buscar cliente cadastrado..."
                            className="pl-10"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                          />
                        </div>
                        
                        {/* Client suggestions dropdown */}
                        {showClientSuggestions && filteredClients.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredClients.map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => handleRegisteredClientSelect(client)}
                                className={cn(
                                  "w-full text-left px-4 py-3 hover:bg-accent transition-colors",
                                  "flex items-start gap-3 border-b last:border-b-0"
                                )}
                              >
                                <User className="h-4 w-4 text-primary mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{client.company_name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                                  {client.cnpj && (
                                    <div className="text-xs text-muted-foreground">CNPJ: {client.cnpj}</div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Selected client info */}
                        {formData.client_email && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Cliente selecionado: {formData.client_name}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-300">{formData.client_email}</p>
                          </div>
                        )}
                        
                        {clientSearch.length > 0 && clientSearch.length < 2 && (
                          <p className="text-xs text-muted-foreground">
                            Digite mais {2 - clientSearch.length} caractere(s) para buscar
                          </p>
                        )}
                      </div>
                    )}

                    {/* Company qualification info */}
                    {companyQualification && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Label className="text-xs text-blue-800 dark:text-blue-200">Qualificação da Empresa (preenchida automaticamente)</Label>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1 line-clamp-2">
                          {companyQualification.substring(0, 150)}...
                        </p>
                      </div>
                    )}

                    {/* Variáveis do template */}
                    {selectedTemplate.variables.length > 0 && (
                      <div className="space-y-3">
                        <Label>Preencha as variáveis:</Label>
                        {selectedTemplate.variables.map((variable) => (
                          <div key={variable} className="space-y-1">
                            <Label htmlFor={variable} className="text-sm text-muted-foreground">
                              {variable}
                            </Label>
                            <Textarea
                              id={variable}
                              value={templateVariables[variable] || ''}
                              onChange={(e) => setTemplateVariables(prev => ({
                                ...prev,
                                [variable]: e.target.value
                              }))}
                              placeholder={`Digite o valor para ${variable}`}
                              rows={variable.toLowerCase().includes('qualifica') ? 4 : 1}
                              className="min-h-[40px]"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Preview do conteúdo */}
                    <div className="space-y-2">
                      <Label>Preview do documento:</Label>
                      <div className="max-h-40 overflow-y-auto p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                        {getTemplatePreview().substring(0, 500)}
                        {getTemplatePreview().length > 500 && '...'}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            {/* Campos comuns */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo para Assinatura</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formData.signature_deadline}
                onChange={(e) => setFormData({ ...formData, signature_deadline: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Adicione informações ou instruções adicionais..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {showSignatureModal ? null : (
            showSuccessStep ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSuccessStep(false);
                    setCreatedDocumentId(null);
                    onOpenChange(false);
                    onSuccess?.();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleContinueToSignature}>
                  Seguinte: Assinar Documento
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={loading || loadingClients}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Upload className="mr-2 h-4 w-4" />
                  Criar Documento
                </Button>
              </>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
