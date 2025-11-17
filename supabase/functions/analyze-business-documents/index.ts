import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  processDescription: string;
  documents: Array<{
    name: string;
    type: string;
    content?: string;
  }>;
  companyId: string;
  processId?: string;
}

interface AnalysisResponse {
  processType: string;
  checklist: Array<{
    document: string;
    status: 'present' | 'missing' | 'recommended';
    observations?: string;
  }>;
  contractAnalysis?: {
    strongPoints: string[];
    weakPoints: string[];
    riskClauses: string[];
  };
  missingDocuments: string[];
  recommendations: string[];
  finalReport: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseKey || !lovableApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { processDescription, documents, companyId, processId }: AnalysisRequest = await req.json();

    console.log('Starting document analysis for company:', companyId);

    // Buscar documentos automaticamente do processo se processId foi fornecido
    let processDocuments = documents;
    let processInfo = null;
    
    if (processId) {
      console.log('Fetching documents from process:', processId);
      
      // Buscar informações do processo
      const { data: process, error: processError } = await supabase
        .from('processes')
        .select('*')
        .eq('id', processId)
        .single();

      if (processError) {
        console.error('Error fetching process:', processError);
      } else {
        processInfo = process;
        console.log('Process info loaded:', processInfo?.process_type);
      }

      // Buscar documentos vinculados ao processo
      const { data: dbDocuments, error: docsError } = await supabase
        .from('documents')
        .select('id, file_name, document_type, status, file_path, validity_date, expiration_date, issuing_location')
        .eq('process_id', processId);

      if (docsError) {
        console.error('Error fetching documents:', docsError);
      } else if (dbDocuments && dbDocuments.length > 0) {
        // Adicionar documentos do banco de dados à lista
        const loadedDocs = dbDocuments.map(doc => ({
          name: doc.file_name,
          type: doc.document_type,
          content: `Status: ${doc.status}${doc.validity_date ? `, Validade: ${doc.validity_date}` : ''}${doc.expiration_date ? `, Vencimento: ${doc.expiration_date}` : ''}${doc.issuing_location ? `, Local de Emissão: ${doc.issuing_location}` : ''}`
        }));
        
        // Combinar com documentos adicionais fornecidos manualmente
        processDocuments = [...loadedDocs, ...documents];
        console.log(`Loaded ${dbDocuments.length} documents from database, total: ${processDocuments.length}`);
      }
    }

    // Buscar dados de treinamento da IA (globais e da empresa)
    const { data: trainingData, error: trainingError } = await supabase
      .from('ai_training_data')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (trainingError) {
      console.error('Error fetching training data:', trainingError);
    }

    // Buscar casos de treinamento
    const { data: trainingCases, error: casesError } = await supabase
      .from('ai_training_cases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (casesError) {
      console.error('Error fetching training cases:', casesError);
    }

    // Buscar tipos de documentos da empresa
    const { data: documentTypes, error: docTypesError } = await supabase
      .from('document_types')
      .select('*')
      .eq('company_id', companyId);

    if (docTypesError) {
      console.error('Error fetching document types:', docTypesError);
    }

    // Construir contexto de treinamento
    const trainingContext = trainingData?.map(rule => `
      Tipo de Processo: ${rule.process_type}
      Palavras-chave: ${rule.keywords.join(', ')}
      Documentos Obrigatórios: ${rule.required_documents.join(', ')}
      Documentos Sugeridos: ${rule.suggested_documents.join(', ')}
      Condições: ${rule.conditions || 'N/A'}
      Prioridade: ${rule.priority}
    `).join('\n---\n') || '';

    const casesContext = trainingCases?.map(case_ => `
      Tipo: ${case_.process_type}
      Descrição: ${case_.description}
      Documentos Recebidos: ${case_.documents_received.join(', ')}
      Documentos Corretos: ${case_.correct_documents.join(', ')}
      Resultado: ${case_.result}
      Feedback: ${case_.feedback || 'N/A'}
    `).join('\n---\n') || '';

    const documentTypesContext = documentTypes?.map(dt => 
      `${dt.name}${dt.has_validity_date ? ' (com data de validade)' : ''}${dt.has_expiration_date ? ' (com data de vencimento)' : ''}`
    ).join(', ') || '';

    // Preparar prompt para IA - Sistema unificado e profissional
    const systemPrompt = `Você é a IA de Análise de Documentos da Fuzen. Sua missão:

🔍 IDENTIFICAÇÃO AUTOMÁTICA DE TIPOS:
Identifique automaticamente o tipo de documento, incluindo (mas não se limitando a):
- Contratos (prestação de serviços, compra e venda, locação, trabalho, parcerias, etc.)
- Certidões (negativa de débitos, nascimento, casamento, óbito, imobiliária, etc.)
- RG / CNH / Identidade Civil
- CNPJ / Contrato Social / Alteração Contratual
- Matrícula de imóvel / Escrituras
- Certidão negativa (federal, estadual, municipal, trabalhista)
- Nota Fiscal (serviços, produtos, entrada, saída)
- Declaração (IR, IRPJ, IRPF, ITR, imposto de renda, rendimentos, etc.)
- Comprovante de endereço (conta de luz, água, telefone, correspondência)
- Boletos / Recibos / Comprovantes de pagamento
- Documentos bancários (extratos, comprovantes, contratos)
- Comprovantes fiscais e tributários
- Documentos internacionais (passaporte, visto, apostila de Haia)
- Documentos empresariais (atas, balanços, demonstrativos)
- Termo / Procuração / Autorização / Declaração
- Qualquer outro tipo de documento (modo open-domain)

📄 EXTRAÇÃO COMPLETA DE DADOS:
Extraia TODOS os campos relevantes do documento:
- Partes envolvidas (nomes completos, razões sociais)
- CPF, CNPJ, RG, inscrições (municipal, estadual, federal)
- Datas críticas: emissão, validade, vencimento, assinatura, vigência
- Endereços completos
- Valores monetários, multas, encargos, taxas
- Cláusulas contratuais relevantes
- Números de processo, protocolo, matrícula, certidão
- Órgão emissor / autoridade competente
- Objeto do documento / finalidade
- Páginas faltantes ou ilegíveis
- Incoerências internas ou dados conflitantes
- Campos obrigatórios ausentes

✅ VALIDAÇÃO DE STATUS:
Classifique o documento em:
- "valido": documento está em conformidade, válido e completo
- "vencido": prazo de validade expirado
- "incompleto": faltam dados, assinaturas ou páginas
- "ilegivel": qualidade ruim, impossível extrair dados
- "inconsistente": dados conflitantes ou incoerentes

📋 GERAÇÃO AUTOMÁTICA:
Gere automaticamente:
1. JSON estruturado com todos os dados extraídos
2. Checklist visual com ✔️ (presente), ❌ (ausente), ⚠️ (incompleto), ⏳ (pendente)
3. Resumo executivo em 3–6 linhas claras e objetivas
4. Lista de inconsistências e problemas identificados
5. Lista de documentos faltantes
6. Ações recomendadas e próximos passos
7. Linha do tempo quando aplicável (datas críticas, prazos)

🚨 SINALIZAÇÃO DE RISCOS:
Identifique e sinalize proativamente:
- Cláusulas abusivas ou de risco
- Prazos críticos próximos do vencimento
- Documentos essenciais ausentes
- Inconsistências que possam gerar problemas jurídicos
- Valores divergentes ou suspeitos
- Falta de assinaturas ou autenticações

⚙️ ESTRUTURA OBRIGATÓRIA DE RESPOSTA:
Sempre responda com 4 blocos nesta ordem:

(1) JSON ESTRUTURADO:
{
  "tipoDocumento": "tipo identificado automaticamente",
  "dadosExtraidos": {
    "partes": ["nome completo ou razão social"],
    "cpfCnpj": ["documentos identificados"],
    "datas": {
      "emissao": "YYYY-MM-DD ou null",
      "validade": "YYYY-MM-DD ou null",
      "vencimento": "YYYY-MM-DD ou null",
      "assinatura": "YYYY-MM-DD ou null"
    },
    "valores": ["valores monetários identificados"],
    "orgaoEmissor": "órgão ou autoridade emissora",
    "objeto": "finalidade ou objeto do documento",
    "clausulasRelevantes": ["cláusulas importantes"],
    "numeroDocumento": "número de protocolo/processo/matrícula",
    "endereco": "endereço completo se presente",
    "outrosCampos": {}
  },
  "status": "valido | vencido | incompleto | ilegivel | inconsistente",
  "motivoStatus": "explicação clara do status atribuído",
  "itensCriticos": [
    "lista de problemas, riscos ou itens que exigem atenção imediata"
  ],
  "recomendacoes": [
    "ações práticas e específicas recomendadas"
  ]
}

(2) CHECKLIST VISUAL:
✔️ Documento principal presente
❌ Assinatura da segunda parte ausente
⚠️ Data de validade não identificada
⏳ Aguardando autenticação

(3) RESUMO EXECUTIVO:
[3-6 linhas descrevendo de forma clara e objetiva o documento, sua situação atual e principais pontos de atenção]

(4) AÇÕES RECOMENDADAS:
1. [Ação específica e prática]
2. [Ação específica e prática]
3. [Ação específica e prática]

🔒 REGRAS CRÍTICAS:
- NUNCA invente ou simule dados que não estejam no documento real
- Se um campo não estiver presente, marque como null ou "não identificado"
- Se estiver incerto sobre algo, marque explicitamente como "incompleto" ou "ilegível"
- Base todas as análises EXCLUSIVAMENTE nos documentos fornecidos
- Seja preciso e objetivo nas análises
- Modo fintech (regras regulatórias adicionais): só ative se o usuário escrever "Ativar modo fintech"

📊 ANÁLISE DE MÚLTIPLOS DOCUMENTOS:
Quando analisar vários documentos:
1. Analise cada documento individualmente primeiro
2. Gere uma análise consolidada identificando:
   - Documentos obrigatórios ausentes (baseado no contexto analisado)
   - Documentos complementares sugeridos
   - Linha do tempo consolidada (todas as datas críticas)
   - Inconsistências entre documentos
   - Conclusão final e próximos passos

DADOS DE TREINAMENTO DA EMPRESA:
${trainingContext}

CASOS DE TREINAMENTO ANTERIORES:
${casesContext}

TIPOS DE DOCUMENTOS CADASTRADOS:
${documentTypesContext}

Sua tarefa é analisar o(s) documento(s) fornecido(s) e retornar uma análise estruturada seguindo rigorosamente os 4 blocos obrigatórios acima.`;

    const userPrompt = `
CONTEXTO DO PROCESSO:
${processInfo ? `
Tipo de Processo: ${processInfo.process_type}
Cliente: ${processInfo.client_name}
${processInfo.description ? `Descrição: ${processInfo.description}` : ''}
Status: ${processInfo.status}
` : ''}

DESCRIÇÃO ADICIONAL:
${processDescription || 'Análise dos documentos vinculados ao processo'}

DOCUMENTOS DISPONÍVEIS PARA ANÁLISE (${processDocuments.length} no total):
${processDocuments.map(doc => `- ${doc.name} (${doc.type})${doc.content ? '\n  Informações: ' + doc.content.substring(0, 500) : ''}`).join('\n')}

INSTRUÇÕES CRÍTICAS:
- Analise APENAS os ${processDocuments.length} documentos listados acima
- Se alguma informação não estiver presente nesses documentos, informe claramente: "Informação não encontrada nos documentos analisados"
- NUNCA invente ou simule conteúdo de documentos
- Liste documentos faltantes apenas pelo nome, sem criar conteúdo fictício
- Base todas as análises exclusivamente nos documentos reais fornecidos

Forneça um parecer objetivo e estruturado em formato JSON.`;

    console.log('Calling Lovable AI for analysis...');

    // Chamar Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices[0].message.content;

    console.log('AI analysis completed');

    // Parse da resposta JSON
    let analysis: AnalysisResponse;
    try {
      // Tentar extrair JSON do conteúdo
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rawAnalysis = JSON.parse(jsonMatch[0]);
        
        // Mapear campos da resposta da IA para o formato esperado pelo frontend
        analysis = {
          processType: rawAnalysis.tipoDocumento || rawAnalysis.processType || 'Não identificado',
          checklist: rawAnalysis.checklist || [],
          contractAnalysis: rawAnalysis.contractAnalysis,
          missingDocuments: rawAnalysis.missingDocuments || [],
          recommendations: rawAnalysis.recomendacoes || rawAnalysis.recommendations || [],
          finalReport: rawAnalysis.finalReport || rawAnalysis.resumoExecutivo || rawAnalysis.motivoStatus || 'Análise concluída'
        };
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI content:', aiContent);
      
      // Fallback para estrutura básica
      analysis = {
        processType: 'Análise Documental',
        checklist: [],
        missingDocuments: [],
        recommendations: ['Não foi possível processar a resposta da IA. Por favor, tente novamente.'],
        finalReport: aiContent || 'Erro ao processar a análise. Por favor, tente novamente.',
      };
    }

    // Salvar análise no banco de dados
    if (processId) {
      const { error: reportError } = await supabase
        .from('document_reports')
        .insert({
          process_id: processId,
          company_id: companyId,
          report_data: {
            analysis,
            documents: processDocuments.map(d => ({ name: d.name, type: d.type })),
            generated_at: new Date().toISOString(),
            process_info: processInfo ? {
              type: processInfo.process_type,
              client: processInfo.client_name
            } : null
          },
          total_documents: processDocuments.length,
          pending_documents: analysis.missingDocuments.length,
          approved_documents: processDocuments.length - analysis.missingDocuments.length,
        });

      if (reportError) {
        console.error('Error saving report:', reportError);
      }
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-business-documents:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Erro ao processar análise de documentos'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
