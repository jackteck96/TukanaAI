-- Insert sample global document types
INSERT INTO public.global_document_types (name, has_validity_date, has_expiration_date, requires_issuing_location, notes) VALUES
('RG - Registro Geral', false, true, true, 'Documento de identificação civil obrigatório'),
('CPF - Cadastro de Pessoa Física', false, false, false, 'Documento fiscal obrigatório para pessoa física'),
('CNH - Carteira Nacional de Habilitação', true, true, true, 'Documento de habilitação para conduzir veículos'),
('CNPJ - Cadastro Nacional da Pessoa Jurídica', false, false, false, 'Documento fiscal obrigatório para pessoa jurídica'),
('Comprovante de Residência', false, false, false, 'Comprovante atual de endereço residencial');

-- Insert sample global document templates
INSERT INTO public.global_document_templates (title, category, content, variables) VALUES
('Contrato de Prestação de Serviços Jurídicos', 'Contrato', 
'CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS

CONTRATANTE: [CLIENTE]
CONTRATADA: [EMPRESA]

Pelo presente instrumento particular, o CONTRATANTE e a CONTRATADA celebram o presente contrato de prestação de serviços jurídicos, mediante as seguintes cláusulas e condições:

1. DO OBJETO
A CONTRATADA prestará serviços jurídicos ao CONTRATANTE conforme especificado no Anexo I deste contrato.

2. DAS OBRIGAÇÕES DO CONTRATANTE
- Fornecer todas as informações e documentos necessários;
- Efetuar o pagamento dos honorários conforme pactuado.

3. DAS OBRIGAÇÕES DA CONTRATADA
- Executar os serviços com diligência e competência;
- Manter sigilo sobre todas as informações recebidas.

4. DOS HONORÁRIOS
Os honorários serão conforme proposta comercial anexa.

Data: [DATA]

_________________________        _________________________
[CLIENTE]                        [EMPRESA]',
ARRAY['CLIENTE', 'EMPRESA', 'DATA']),

('Procuração Específica', 'Procuração',
'PROCURAÇÃO ESPECÍFICA

Outorgante: [CLIENTE]
Outorgado: [EMPRESA]

Por este instrumento particular de procuração, [CLIENTE], nomeia e constitui seu bastante procurador [EMPRESA], para o fim específico de:

- Representar o outorgante perante órgãos públicos;
- Assinar documentos em nome do outorgante;
- Praticar todos os atos necessários ao cumprimento do presente mandato.

Esta procuração é válida até [DATA].

Local e data: _____________, [DATA]

_________________________
[CLIENTE]',
ARRAY['CLIENTE', 'EMPRESA', 'DATA']);

-- Insert sample AI training data
INSERT INTO public.ai_training_data (process_type, keywords, required_documents, suggested_documents, conditions, priority) VALUES
('Abertura de Empresa', 
ARRAY['abertura', 'empresa', 'CNPJ', 'constituição', 'societário'],
ARRAY['RG', 'CPF', 'Comprovante de Residência'],
ARRAY['Contrato Social', 'Declaração de IR', 'Certidão de Antecedentes'],
'Se capital social > R$ 100.000, solicitar comprovação de origem dos recursos',
1),

('Processo Trabalhista',
ARRAY['trabalhista', 'CLT', 'rescisão', 'demissão', 'direitos'],
ARRAY['CTPS', 'RG', 'CPF'],
ARRAY['Comprovante de Renda', 'Declaração de IR', 'Extrato FGTS'],
'Se valor da causa > R$ 50.000, recomendar perícia contábil',
2),

('Documentação Fiscal',
ARRAY['fiscal', 'imposto', 'tributário', 'receita', 'auditoria'],
ARRAY['CNPJ', 'Inscrição Estadual'],
ARRAY['Declaração de IR', 'Balanço Patrimonial', 'Livros Contábeis'],
'Para empresas de grande porte, exigir auditoria independente',
1);

-- Insert sample AI training cases
INSERT INTO public.ai_training_cases (process_type, description, documents_received, correct_documents, result, feedback) VALUES
('Abertura de Empresa',
'Cliente solicitou abertura de empresa de tecnologia com 2 sócios',
ARRAY['RG', 'CPF', 'Comprovante de Residência'],
ARRAY['RG', 'CPF', 'Comprovante de Residência', 'Contrato Social', 'Declaração de IR'],
'success',
'IA identificou corretamente a necessidade do Contrato Social e Declaração de IR'),

('Processo Trabalhista',
'Ex-funcionário entrando com ação por verbas rescisórias não pagas',
ARRAY['CTPS', 'RG'],
ARRAY['CTPS', 'RG', 'CPF', 'Comprovante de Renda', 'Extrato FGTS'],
'success',
'IA sugeriu corretamente documentos adicionais para comprovação de vínculo e valores'),

('Documentação Fiscal',
'Empresa sendo auditada pela Receita Federal',
ARRAY['CNPJ'],
ARRAY['CNPJ', 'Inscrição Estadual', 'Declaração de IR', 'Balanço Patrimonial'],
'failure',
'IA não identificou a necessidade de documentação contábil completa para auditoria');