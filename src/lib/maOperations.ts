export interface OperationDocument { name: string; purpose: string; }
export interface MAOperation { id: string; name: string; documents: OperationDocument[]; }

// Instruments explicitly listed in the supplied PDF, revised 16/11/2026.
export const maOperations: MAOperation[] = [
  {
    "id": "due-diligence",
    "name": "Due Diligence Isolada",
    "documents": [
      {
        "name": "NDA",
        "purpose": "Condição de acesso ao data room"
      },
      {
        "name": "Scope Letter (escopo)",
        "purpose": "Delimita áreas, período de retrospectão, materialidade e exclusões"
      },
      {
        "name": "Document Request List (DRL)",
        "purpose": "Solicitação estruturada por área, numerada e rastreável"
      },
      {
        "name": "Registo de Q&A",
        "purpose": "Perguntas, respostas e pendências, com responsável e prazo"
      },
      {
        "name": "Relatório de DD executivo",
        "purpose": "Sumário dos achados críticos para quem decide"
      },
      {
        "name": "Relatório de DD detalhado",
        "purpose": "Análise por área, do societário ao regulatório"
      },
      {
        "name": "Matriz de Riscos",
        "purpose": "Classificação por probabilidade e impacto, com valor estimado"
      },
      {
        "name": "Mapa de Contingências",
        "purpose": "Quantificação do passivo e sugestão de provisionamento"
      },
      {
        "name": "Lista de Red Flags e Deal Breakers",
        "purpose": "Achados que impedem ou reprecificam a operação"
      },
      {
        "name": "Recomendações de estruturação",
        "purpose": "Como escrow, holdback e indenização mitigam cada risco"
      },
      {
        "name": "Plano de remediação (vendor DD)",
        "purpose": "Saneamento prévio antes de ir a mercado"
      },
      {
        "name": "Anexo de certidões e evidências",
        "purpose": "Todas as certidões com data, validade e fonte"
      }
    ]
  },
  {
    "id": "compra-quotas",
    "name": "Compra de Quotas",
    "documents": [
      {
        "name": "NDA e Clean Team Agreement",
        "purpose": "Confidencialidade antes de abrir o data room; clean team se as partes forem concorrentes"
      },
      {
        "name": "Term Sheet / MoU",
        "purpose": "Preço, estrutura, exclusividade, break-up fee"
      },
      {
        "name": "Contrato de Compra e Venda de Quotas (QPA)",
        "purpose": "Instrumento principal: preço, ajuste, R&W, indenização, non-compete"
      },
      {
        "name": "Disclosure Schedules",
        "purpose": "Anexos de exceção às declarações e garantias, alimentados pela DD"
      },
      {
        "name": "Aditivo ou novo Acordo de Sócios",
        "purpose": "Governança pós-closing, tag e drag along, deadlock"
      },
      {
        "name": "Alteração do Contrato Social",
        "purpose": "Ato que efetivamente transfere a titularidade das quotas; arquivamento em até 30 dias"
      },
      {
        "name": "Termo de não oposição e renúncia à preferência",
        "purpose": "Não oposição dos demais sócios à cessão (art. 1.057 do CC) e renúncia à preferência, se prevista no contrato social"
      },
      {
        "name": "Contrato de Escrow",
        "purpose": "Retenção de parcela do preço como garantia de indenização"
      },
      {
        "name": "Termo de Quitação dos administradores retirantes",
        "purpose": "Encerra responsabilidades recíprocas"
      },
      {
        "name": "Contrato de Não Concorrência",
        "purpose": "Protege o goodwill adquirido"
      },
      {
        "name": "Procurações de fechamento",
        "purpose": "Viabilizam o arquivamento na Junta"
      }
    ]
  },
  {
    "id": "investimento",
    "name": "Investimento",
    "documents": [
      {
        "name": "NDA",
        "purpose": "Confidencialidade antes do data room"
      },
      {
        "name": "Term Sheet",
        "purpose": "Valuation pre e post money, liquidação preferencial, anti-diluição, veto, vesting"
      },
      {
        "name": "Contrato de Investimento / Subscrição",
        "purpose": "Condições do aporte, tranches, milestones, R&W, indenização"
      },
      {
        "name": "Boletim de subscrição",
        "purpose": "Formaliza a subscrição das novas participações"
      },
      {
        "name": "Ata de AGE ou alteração de aumento de capital",
        "purpose": "Ato societário que efetiva a emissão"
      },
      {
        "name": "Acordo de Sócios novo ou aditado",
        "purpose": "Liquidação preferencial, anti-diluição, conselho, veto, drag, tag, ROFR, lock-up"
      },
      {
        "name": "Termo de Renúncia ao Direito de Preferência",
        "purpose": "Renúncia dos sócios existentes à preferência no aumento de capital (art. 1.081, §1º, do CC ou art. 171 da LSA)"
      },
      {
        "name": "Contrato de Vesting dos Fundadores",
        "purpose": "Vinculação dos fundadores e reverse vesting"
      },
      {
        "name": "Contratos de cessão de PI dos fundadores",
        "purpose": "Saneamento da titularidade da PI antes do aporte"
      },
      {
        "name": "Plano de Opções (SOP)",
        "purpose": "Reserva do pool de opções, no pre ou post money"
      },
      {
        "name": "Mútuo Conversível ou SAFE",
        "purpose": "Rodadas ponte, se a estrutura não for aumento direto"
      },
      {
        "name": "Disclosure Schedules",
        "purpose": "Exceções às declarações e garantias"
      },
      {
        "name": "Side Letters",
        "purpose": "Direitos individualizados de investidores específicos"
      }
    ]
  },
  {
    "id": "compra-acoes",
    "name": "Compra de Ações",
    "documents": [
      {
        "name": "NDA e Clean Team Agreement",
        "purpose": "Controle de informação não pública e de insider trading desde o início; clean team se concorrentes"
      },
      {
        "name": "Term Sheet / MoU",
        "purpose": "Preço por ação, estrutura, tag along"
      },
      {
        "name": "Share Purchase Agreement (SPA)",
        "purpose": "Instrumento principal da compra de ações"
      },
      {
        "name": "Disclosure Schedules",
        "purpose": "Exceções às R&W"
      },
      {
        "name": "Acordo de Acionistas novo ou aditado",
        "purpose": "Conselho, veto, tag e drag along, deadlock, lock-up"
      },
      {
        "name": "Termo de Transferência de Ações Nominativas",
        "purpose": "Ato que opera a transferência no livro próprio (art. 31 da LSA)"
      },
      {
        "name": "Ordem de transferência ao escriturador",
        "purpose": "Ações escriturais"
      },
      {
        "name": "Atas de eleição da administração",
        "purpose": "AGE e, se houver conselho, RCA; substituem a gestão anterior no closing"
      },
      {
        "name": "Cartas de renúncia dos administradores",
        "purpose": "Formalizam a saída da administração anterior"
      },
      {
        "name": "Contrato de Escrow",
        "purpose": "Garantia de indenização"
      },
      {
        "name": "Contrato de Não Concorrência",
        "purpose": "Proteção do goodwill"
      },
      {
        "name": "Comunicado de fato relevante",
        "purpose": "Divulgação no signing, se companhia aberta (Res. CVM 44/2021)"
      },
      {
        "name": "Edital de OPA (se companhia aberta)",
        "purpose": "Após o fechamento: preço mínimo de 80% do pago ao controlador, para as ações com voto (art. 254-A); 100% no Novo Mercado"
      }
    ]
  },
  {
    "id": "joint-venture",
    "name": "Joint Venture",
    "documents": [
      {
        "name": "NDA e Clean Team Agreement",
        "purpose": "Protege informação e evita gun jumping entre concorrentes"
      },
      {
        "name": "MoU / Heads of Terms",
        "purpose": "Estrutura, aportes, governança e exclusividade"
      },
      {
        "name": "Joint Venture Agreement (JVA)",
        "purpose": "Instrumento-mestre: objeto, aportes, governança, exit, non-compete"
      },
      {
        "name": "Contrato Social ou Estatuto da SPE",
        "purpose": "JV societária: ato constitutivo do veículo"
      },
      {
        "name": "Acordo de Sócios da SPE",
        "purpose": "Veto, quórum, tag e drag, put e call, deadlock (buy-sell, shotgun)"
      },
      {
        "name": "Contrato de Consórcio",
        "purpose": "JV contratual: sem personalidade jurídica e sem solidariedade presumida (art. 278, §1º, da LSA); arquivado na Junta (art. 279)"
      },
      {
        "name": "Contrato de licenciamento de PI / marca",
        "purpose": "Regula o uso dos intangíveis aportados"
      },
      {
        "name": "Contrato de aporte / conferência de bens",
        "purpose": "Formaliza o aporte de ativos não monetários"
      },
      {
        "name": "Contrato de compartilhamento de serviços",
        "purpose": "Serviços prestados pelas partes à JV"
      },
      {
        "name": "Acordo de exclusividade e não concorrência",
        "purpose": "Delimita o campo de atuação da JV e das partes"
      },
      {
        "name": "Plano de exit",
        "purpose": "Put, call, ROFO, venda a terceiro, IPO ou dissolução"
      }
    ]
  },
  {
    "id": "incorporacao",
    "name": "Incorporação",
    "documents": [
      {
        "name": "Protocolo de Incorporação",
        "purpose": "Relação de substituição, critérios de avaliação, tratamento das participações"
      },
      {
        "name": "Justificação",
        "purpose": "Motivos, interesse societário e critérios da operação"
      },
      {
        "name": "Indicação dos peritos",
        "purpose": "Indicação ad referendum, ratificada na AGE da incorporadora (arts. 8º e 227 da LSA)"
      },
      {
        "name": "Pacote de dados do laudo",
        "purpose": "Dados validados entregues aos peritos; o laudo é deles, que respondem por ele (art. 8º, §6º, da LSA)"
      },
      {
        "name": "Ata de AGE da incorporada",
        "purpose": "Aprova a incorporação e autoriza a subscrição do aumento de capital"
      },
      {
        "name": "Ata de AGE da incorporadora",
        "purpose": "Aprova protocolo, peritos, laudo e aumento de capital; declara extinta a incorporada"
      },
      {
        "name": "Alteração do Estatuto ou Contrato Social",
        "purpose": "Reflete o aumento de capital e o novo quadro societário"
      },
      {
        "name": "Termos de cessão de contratos e waivers",
        "purpose": "Contratos que exigem anuência para a sucessão"
      },
      {
        "name": "Instrumentos de averbação (RI, DETRAN, INPI)",
        "purpose": "Transferência dos bens e direitos registráveis"
      },
      {
        "name": "Requerimentos de baixa da incorporada",
        "purpose": "Receita, SEFAZ, prefeitura, INSS e FGTS"
      }
    ]
  },
  {
    "id": "fusao",
    "name": "Fusão",
    "documents": [
      {
        "name": "NDA e Clean Team Agreement",
        "purpose": "Se as sociedades forem concorrentes"
      },
      {
        "name": "Protocolo de Fusão",
        "purpose": "Relação de substituição e critérios, firmado entre todas as administrações"
      },
      {
        "name": "Justificação",
        "purpose": "Motivos e critérios da operação"
      },
      {
        "name": "Pacote de dados dos laudos",
        "purpose": "Dados validados entregues aos peritos de cada patrimônio; o laudo é deles (art. 8º da LSA)"
      },
      {
        "name": "Ata de AGE de cada sociedade fundida",
        "purpose": "Aprovam protocolo e justificação e nomeiam os peritos que avaliam as demais (art. 228, §1º)"
      },
      {
        "name": "Ata da assembleia de constituição",
        "purpose": "Aprova os laudos, sem voto sobre o da própria sociedade, constitui a nova sociedade e elege a administração (art. 228, §2º)"
      },
      {
        "name": "Contrato Social ou Estatuto da nova sociedade",
        "purpose": "Ato constitutivo da sociedade resultante"
      },
      {
        "name": "Acordo de Sócios da nova sociedade",
        "purpose": "Governança, veto e deadlock (quadros equilibrados são conflituosos)"
      },
      {
        "name": "Termos de cessão de contratos e waivers",
        "purpose": "Migração da carteira contratual"
      },
      {
        "name": "Requerimentos de novo CNPJ e inscrições",
        "purpose": "Habilitam a nova sociedade a operar"
      },
      {
        "name": "Requerimentos de baixa das sociedades fundidas",
        "purpose": "Extinção das sociedades originárias"
      },
      {
        "name": "Requerimentos de novas licenças",
        "purpose": "Reconstituem o licenciamento em nome da nova sociedade"
      }
    ]
  },
  {
    "id": "cisao",
    "name": "Cisão",
    "documents": [
      {
        "name": "Protocolo de Cisão",
        "purpose": "Discrimina ativos e passivos de cada parcela, critérios e relação de substituição"
      },
      {
        "name": "Justificação",
        "purpose": "Motivos e interesse societário"
      },
      {
        "name": "Pacote de dados do laudo da parcela cindida",
        "purpose": "Dados validados entregues aos peritos; o laudo é deles (art. 8º da LSA)"
      },
      {
        "name": "Cláusula de solidariedade ou de afastamento",
        "purpose": "Define a responsabilidade por obrigações anteriores (art. 233); o credor anterior pode se opor em 90 dias (par. único)"
      },
      {
        "name": "Ata de AGE da cindida",
        "purpose": "Aprova a cisão, o laudo e a redução do capital na cisão parcial"
      },
      {
        "name": "Ata de AGE da(s) receptora(s)",
        "purpose": "Aprova a versão do patrimônio e o aumento de capital"
      },
      {
        "name": "Ato constitutivo da nova sociedade",
        "purpose": "Se a receptora for constituída para a cisão"
      },
      {
        "name": "Alteração do Contrato Social da cindida",
        "purpose": "Reduz o capital e ajusta o objeto na cisão parcial"
      },
      {
        "name": "Acordo de Sócios da receptora",
        "purpose": "Governança da sociedade que recebe o patrimônio"
      },
      {
        "name": "Instrumentos de averbação e transferência de bens",
        "purpose": "Imóveis, veículos, marcas e contratos"
      }
    ]
  }
];

export function changeOperationDocuments(current: string[], previousId: string, nextId: string): string[] {
  const previous = new Set(maOperations.find(o => o.id === previousId)?.documents.map(d => d.name) ?? []);
  const next = maOperations.find(o => o.id === nextId)?.documents.map(d => d.name) ?? [];
  return [...new Set([...next, ...current.filter(name => !previous.has(name))])];
}

export function buildDocumentRequests(names: string[], configs: {name: string; hasIssueDate: boolean; hasExpirationDate: boolean; requiresIssuingLocation: boolean}[], processId: string, companyId: string) {
  return [...new Set(names)].map(name => {
    const config = configs.find(d => d.name === name);
    return { process_id: processId, company_id: companyId, document_name: name, required: true, current_status: "pendente", has_issue_date: config?.hasIssueDate ?? false, has_expiration_date: config?.hasExpirationDate ?? false, requires_issuing_location: config?.requiresIssuingLocation ?? false };
  });
}
