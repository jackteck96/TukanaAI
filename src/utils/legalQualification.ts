// Utilitário para formatar qualificação jurídica

export interface LegalDataPF {
  person_type: 'pf';
  client_name: string;
  cpf?: string;
  rg?: string;
  nationality?: string;
  marital_status?: string;
  profession?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface LegalDataPJ {
  person_type: 'pj';
  company_name: string;
  cnpj?: string;
  address?: string;
  legal_representative_name?: string;
  legal_representative_cpf?: string;
  email?: string;
  phone?: string;
}

export type LegalData = LegalDataPF | LegalDataPJ;

export function formatLegalQualification(data: LegalData): string {
  const MISSING = '[informação faltante]';
  
  if (data.person_type === 'pj') {
    // Formato Pessoa Jurídica - todos os campos sempre presentes
    const parts: string[] = [];
    
    parts.push(data.company_name || MISSING);
    parts.push(`inscrita no CNPJ sob o nº ${data.cnpj ? formatCNPJ(data.cnpj) : MISSING}`);
    parts.push(`com sede em ${data.address || MISSING}`);
    parts.push(`neste ato representada por ${data.legal_representative_name || MISSING}`);
    parts.push(`CPF nº ${data.legal_representative_cpf ? formatCPF(data.legal_representative_cpf) : MISSING}`);
    parts.push(`e-mail ${data.email || MISSING}`);
    parts.push(`telefone ${data.phone || MISSING}`);
    
    return parts.join(', ') + '.';
  } else {
    // Formato Pessoa Física - todos os campos sempre presentes
    const parts: string[] = [];
    
    parts.push(data.client_name || MISSING);
    parts.push(`nacionalidade ${data.nationality || MISSING}`);
    parts.push(`estado civil ${data.marital_status || MISSING}`);
    parts.push(`profissão ${data.profession || MISSING}`);
    parts.push(`portador do CPF nº ${data.cpf ? formatCPF(data.cpf) : MISSING}`);
    parts.push(`e RG nº ${data.rg || MISSING}`);
    parts.push(`residente e domiciliado em ${data.address || MISSING}`);
    parts.push(`e-mail ${data.email || MISSING}`);
    parts.push(`telefone ${data.phone || MISSING}`);
    
    return parts.join(', ') + '.';
  }
}

export async function copyLegalQualificationToClipboard(data: LegalData): Promise<boolean> {
  try {
    const text = formatLegalQualification(data);
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erro ao copiar para área de transferência:', error);
    return false;
  }
}

// Funções auxiliares de formatação
function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
}
