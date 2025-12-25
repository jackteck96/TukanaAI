-- Inserir categorias globais de documentos
INSERT INTO public.global_document_categories (name, display_order) VALUES
('Certidões e Regularidade', 1),
('Societário e Governança', 2),
('Contratos e Relações Comerciais', 3),
('Financeiro e Contábil', 4),
('Imobiliário e Licenças', 5),
('Ambiental', 6),
('Contencioso e Riscos', 7),
('Tributário', 8),
('Trabalhista e RH', 9),
('Outros Documentos', 10);

-- Inserir tipos de documentos globais - Certidões e Regularidade
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT docs.doc_name, c.id, true, true FROM (VALUES
  ('Certidão Conjunta de Débitos Federais e Dívida Ativa da União – RFB/PGFN'),
  ('Certidão de Débitos Relativos a Tributos Estaduais'),
  ('Certidão de Débitos Relativos à Dívida Ativa do Estado'),
  ('Certidão de Débitos Relativos a Tributos Municipais'),
  ('Certidão de Débitos Relativos à Dívida Ativa do Município'),
  ('CRF – Certificado de Regularidade do FGTS'),
  ('CNDT – Certidão Negativa de Débitos Trabalhistas (TST)'),
  ('Certidão Negativa de Débitos Trabalhistas – MTE'),
  ('Certidões de Ações Trabalhistas – TRT (1ª e 2ª instâncias)'),
  ('Certidões das Procuradorias Regionais do Trabalho / MPT'),
  ('Certidões de Protesto – Cartórios (CENPROT)'),
  ('Certidão de Autuações e Embargos – IBAMA'),
  ('Certidão Negativa de Débitos – SEMA (Bahia)'),
  ('Certidão Negativa de Débitos – INEMA'),
  ('Certidões dos Distribuidores (Justiça Federal – cível/fiscal/criminal)')
) AS docs(doc_name)
CROSS JOIN public.global_document_categories c WHERE c.name = 'Certidões e Regularidade';

-- Inserir tipos de documentos globais - Societário e Governança
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT docs.doc_name, c.id, true, false FROM (VALUES
  ('Contrato Social e Alterações'),
  ('Atas de AGO, AGE, Conselho de Administração/Fiscal/Diretoria (últ. 5 anos)'),
  ('Relação de Diretores/Conselheiros/Administradores'),
  ('Livros Societários Obrigatórios'),
  ('Acordos de Acionistas'),
  ('Ações Dadas em Garantia'),
  ('Documentos de Reorganizações Societárias (últ. 5 anos)'),
  ('Memorandos e Relatórios Internos Relevantes'),
  ('Investimentos Estrangeiros – RDE-IED (Banco Central)'),
  ('Investimentos no Exterior'),
  ('Procurações Vigentes (inclusive e-CAC)')
) AS docs(doc_name)
CROSS JOIN public.global_document_categories c WHERE c.name = 'Societário e Governança';

-- Inserir tipos de documentos globais - Contratos e Relações Comerciais
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT docs.doc_name, c.id, true, true FROM (VALUES
  ('Contratos Entre Partes Relacionadas'),
  ('Contratos Comerciais com Fornecedores/Clientes'),
  ('Contratos de Importação/Exportação'),
  ('Contratos de Compra e Venda, Empreitada, Construção'),
  ('Acordos de Não Concorrência'),
  ('Contratos com Cláusula de Vencimento Antecipado (Change of Control)'),
  ('Contratos com Cláusula de Sigilo ou Indenização'),
  ('Lista de Principais Fornecedores'),
  ('Informação sobre Cumprimento Contratual'),
  ('Contratos Verbais Relevantes'),
  ('Acordos com Familiares ou Acionistas')
) AS docs(doc_name)
CROSS JOIN public.global_document_categories c WHERE c.name = 'Contratos e Relações Comerciais';

-- Inserir tipos de documentos globais - Financeiro e Contábil
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT docs.doc_name, c.id, true, false FROM (VALUES
  ('Demonstrações Financeiras (últ. 5 anos)'),
  ('Eventos Subsequentes Relevantes'),
  ('ECD, ECF, EFD-Contribuições, EFD-ICMS/IPI (últ. 5 anos)'),
  ('Planilhas Internas de IOF'),
  ('DCTFs Mensais desde 2022'),
  ('Contratos de Mútuo'),
  ('Ativo Imobilizado em Andamento'),
  ('Livro de Apuração do ISS'),
  ('Contratos de Empréstimos/Financiamentos'),
  ('Contratos de Derivativos (ISDA etc.)'),
  ('Arrendamentos Mercantis ou Financeiros'),
  ('Endividamento Intercompany'),
  ('Garantias Prestadas ou Recebidas'),
  ('Garantias Reais sobre Bens/Ativos/Direitos'),
  ('Ativos e Valores Mobiliários Caucionados'),
  ('Empréstimos Externos Registrados no BACEN'),
  ('Correspondência com Credores'),
  ('Contratos Relevantes Não Escritos (Resumo)')
) AS docs(doc_name)
CROSS JOIN public.global_document_categories c WHERE c.name = 'Financeiro e Contábil';

-- Inserir tipos de documentos globais - Imobiliário e Licenças
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT docs.doc_name, c.id, true, true FROM (VALUES
  ('Lista de Imóveis'),
  ('Contratos de Locação/Sublocação/Comodato'),
  ('Notificações de Violações Urbanísticas'),
  ('Certidões Vintenárias'),
  ('Certidões Negativas de Ônus'),
  ('Escrituras/Instrumentos de Compra e Venda'),
  ('Lançamentos de IPTU (últ. 5 anos)'),
  ('CND de IPTU'),
  ('Convenção de Condomínio e Regimento Interno'),
  ('Declaração de Quitação Condominial'),
  ('Certidão de Desapropriação/Tombamento'),
  ('Licença de Funcionamento (LIF)'),
  ('AVCB – Auto de Vistoria do Corpo de Bombeiros'),
  ('Habite-se e CND-INSS da Obra'),
  ('Outras Licenças Municipais Aplicáveis'),
  ('Matrícula de Imóvel')
) AS docs(doc_name)
CROSS JOIN public.global_document_categories c WHERE c.name = 'Imobiliário e Licenças';

-- Inserir tipos de documentos globais - Ambiental
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT docs.doc_name, c.id, true, true FROM (VALUES
  ('Estudos Ambientais (EIA/RIMA, RCA/PCA)'),
  ('Licenças Ambientais (LP, LI, LO)'),
  ('TACs e Recomendações do MPF/MPE'),
  ('Processos Administrativos ou Judiciais Ambientais'),
  ('Documentos de Sentenças, Acordos, Multas'),
  ('TACs Firmados'),
  ('Certidões de Regularidade Ambiental')
) AS docs(doc_name)
CROSS JOIN public.global_document_categories c WHERE c.name = 'Ambiental';

-- Inserir tipos de documentos globais - Contencioso e Riscos
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT docs.doc_name, c.id, true, false FROM (VALUES
  ('Relatório de Processos Judiciais, Arbitragens e Inquéritos'),
  ('Inquéritos contra Administradores/Sócios/Empregados'),
  ('Pendências Relevantes Não Judicializadas'),
  ('Lista de Garantias (Depósitos, Penhoras, Cauções)'),
  ('Política de Provisionamento de Contingências'),
  ('Política de Acordos e Histórico de Conciliações')
) AS docs(doc_name)
CROSS JOIN public.global_document_categories c WHERE c.name = 'Contencioso e Riscos';

-- Inserir tipos de documentos globais - Tributário
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT docs.doc_name, c.id, true, false FROM (VALUES
  ('Relatório de Processos Tributários'),
  ('Principais Peças e Decisões Tributárias'),
  ('Histórico de Provisões e Garantias Tributárias'),
  ('Regimes Fiscais Especiais'),
  ('Acordos de Parcelamento de Débitos (Refis etc.)'),
  ('Procedimentos de Fiscalização (últ. 6 meses)'),
  ('Livros de Ocorrências e Encerramento de Auditoria'),
  ('Consultas Tributárias'),
  ('Compensações de Créditos Tributários'),
  ('Planejamentos Fiscais de Base Controvertida'),
  ('Operações Societárias com Efeitos Fiscais Relevantes'),
  ('Extratos de Débitos Fiscais')
) AS docs(doc_name)
CROSS JOIN public.global_document_categories c WHERE c.name = 'Tributário';

-- Inserir tipos de documentos globais - Trabalhista e RH
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT docs.doc_name, c.id, true, false FROM (VALUES
  ('Relatório de Processos e Autos Administrativos'),
  ('Provisões e Garantias Judiciais'),
  ('Política de Acordos e Processos com Acordo Firmado'),
  ('Livro de Inspeção do Trabalho'),
  ('Autos de Infração, Defesas e Pagamentos'),
  ('Procedimentos do MPT – TACs/Investigações'),
  ('Processos de Sindicatos e do MPT'),
  ('Contratos com Prestadores de Serviço (Terceiros)'),
  ('Relação de Prestadores (PJ)'),
  ('Relação de Empregados'),
  ('Contratos de Trabalho (Amostragem e Executivos)'),
  ('Políticas de Bônus, Retenção, Indenização, Stock Options'),
  ('Contratos de Confidencialidade e Não Concorrência'),
  ('Programas de Remuneração Variável (PLR, Bônus)'),
  ('Benefícios (Incluindo Não Empregados)'),
  ('Políticas de Benefícios'),
  ('Convenções e Acordos Coletivos'),
  ('Histórico de Greves e Paralisações'),
  ('Terceirizados: Empresas, Número, Atividades'),
  ('Contratos com Cooperativas, Autônomos, PJs'),
  ('Documentos de SST (PPRA, PCMSO, CIPA)'),
  ('Cumprimento de Cotas (Menor Aprendiz, PCDs)'),
  ('Holerites (Amostragem)')
) AS docs(doc_name)
CROSS JOIN public.global_document_categories c WHERE c.name = 'Trabalhista e RH';

-- Inserir tipos de documentos globais - Outros Documentos
INSERT INTO public.global_document_types (name, category_id, has_issue_date, has_expiration_date)
SELECT 'Outros', c.id, false, false
FROM public.global_document_categories c WHERE c.name = 'Outros Documentos';