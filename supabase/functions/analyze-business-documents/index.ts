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

    // Preparar prompt para IA
    const systemPrompt = `Você é uma IA especializada em análise de documentação empresarial e contratual da plataforma Fuzen.

REGRAS FUNDAMENTAIS:
1. Você analisa APENAS processos de documentação administrativa/empresarial, NUNCA processos judiciais
2. Se informações estiverem ausentes, indique claramente e oriente o usuário
3. NUNCA invente documentos ou cláusulas inexistentes
4. Baseie suas análises em boas práticas documentais e contratuais
5. Tome iniciativa: se identificar risco ou inconsistência, sinalize proativamente

TIPOS DE PROCESSOS EMPRESARIAIS:
- Inventário documental
- Due diligence
- Compra e venda de empresa
- Regularização societária
- Fusão e aquisição
- Contratos de prestação de serviços
- Contratos trabalhistas
- Contratos comerciais
- Abertura de empresa
- Alteração contratual

DADOS DE TREINAMENTO DA EMPRESA:
${trainingContext}

CASOS DE TREINAMENTO ANTERIORES:
${casesContext}

TIPOS DE DOCUMENTOS CADASTRADOS:
${documentTypesContext}

Sua tarefa é analisar o processo descrito e retornar uma análise estruturada em formato JSON com:
{
  "processType": "tipo identificado do processo",
  "checklist": [
    {
      "document": "nome do documento",
      "status": "present|missing|recommended",
      "observations": "observações específicas"
    }
  ],
  "contractAnalysis": {
    "strongPoints": ["pontos fortes identificados"],
    "weakPoints": ["pontos fracos identificados"],
    "riskClauses": ["cláusulas de risco identificadas"]
  },
  "missingDocuments": ["documentos faltantes"],
  "recommendations": ["recomendações práticas"],
  "finalReport": "parecer completo e estruturado em português"
}`;

    const userPrompt = `
DESCRIÇÃO DO PROCESSO:
${processDescription}

DOCUMENTOS APRESENTADOS:
${documents.map(doc => `- ${doc.name} (${doc.type})${doc.content ? '\nConteúdo: ' + doc.content.substring(0, 500) : ''}`).join('\n')}

Analise este processo de documentação empresarial e forneça um parecer completo.`;

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
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback para estrutura básica
      analysis = {
        processType: 'Análise Documental',
        checklist: [],
        missingDocuments: [],
        recommendations: [],
        finalReport: aiContent,
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
            documents: documents.map(d => ({ name: d.name, type: d.type })),
            generated_at: new Date().toISOString(),
          },
          total_documents: documents.length,
          pending_documents: analysis.missingDocuments.length,
          approved_documents: documents.length - analysis.missingDocuments.length,
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
