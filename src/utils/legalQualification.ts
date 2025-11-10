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
  if (data.person_type === 'pj') {
    // Formato Pessoa Jurídica
    const parts: string[] = [];
    
    if (data.company_name) {
      parts.push(data.company_name);
    }
    
    if (data.cnpj) {
      parts.push(`inscrita no CNPJ sob o nº ${formatCNPJ(data.cnpj)}`);
    }
    
    if (data.address) {
      parts.push(`com sede em ${data.address}`);
    }
    
    if (data.legal_representative_name) {
      parts.push(`neste ato representada por ${data.legal_representative_name}`);
      
      if (data.legal_representative_cpf) {
        parts.push(`CPF nº ${formatCPF(data.legal_representative_cpf)}`);
      }
    }
    
    if (data.email) {
      parts.push(`e-mail ${data.email}`);
    }
    
    if (data.phone) {
      parts.push(`telefone ${data.phone}`);
    }
    
    return parts.join(', ') + '.';
  } else {
    // Formato Pessoa Física
    const parts: string[] = [];
    
    if (data.client_name) {
      parts.push(data.client_name);
    }
    
    if (data.nationality) {
      parts.push(`nacionalidade ${data.nationality}`);
    }
    
    if (data.marital_status) {
      parts.push(`estado civil ${data.marital_status}`);
    }
    
    if (data.profession) {
      parts.push(`profissão ${data.profession}`);
    }
    
    if (data.cpf) {
      parts.push(`portador do CPF nº ${formatCPF(data.cpf)}`);
      
      if (data.rg) {
        parts.push(`e RG nº ${data.rg}`);
      }
    }
    
    if (data.address) {
      parts.push(`residente e domiciliado em ${data.address}`);
    }
    
    if (data.email) {
      parts.push(`e-mail ${data.email}`);
    }
    
    if (data.phone) {
      parts.push(`telefone ${data.phone}`);
    }
    
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
