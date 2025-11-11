import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Função para enviar email usando API do Resend diretamente
const sendEmail = async (emailData: any) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.error("RESEND_API_KEY não configurada");
    return { data: null, error: "API key não configurada" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Erro ao enviar email:", data);
      return { data: null, error: data };
    }

    console.log("Email enviado com sucesso:", data);
    return { data, error: null };
  } catch (error: any) {
    console.error("Erro na requisição para Resend:", error);
    return { data: null, error: error.message };
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Validation schema for input security
const UnifiedEmailSchema = z.object({
  email: z.string().email().max(255),
  full_name: z.string().trim().min(1).max(200),
  processId: z.string().uuid().optional(),
  processName: z.string().trim().max(300).optional(),
  companyId: z.string().uuid().optional(),
  inviteLink: z.string().url().max(1000).optional(),
  directAccessLink: z.string().url().max(1000).optional(),
  inviterName: z.string().trim().min(1).max(200),
  role: z.string().max(50).optional(),
  isCollaborator: z.boolean().optional(),
  isExistingClient: z.boolean().optional(),
  template: z.string().max(100).optional(),
  subject: z.string().max(300).optional(),
  data: z.record(z.any()).optional()
}).refine(data => {
  // Para notificações (templates de assinatura), links não são obrigatórios
  const notificationTemplates = ['signatures_complete', 'signature_request', 'pending_signature'];
  if (data.template && notificationTemplates.includes(data.template)) {
    return true;
  }
  // Para convites, ao menos um link é obrigatório
  return data.inviteLink || data.directAccessLink;
}, {
  message: "Either inviteLink or directAccessLink must be provided for invites"
});

interface UnifiedEmailRequest {
  email: string;
  full_name: string;
  processId?: string;
  processName?: string;
  companyId?: string;
  inviteLink?: string;
  directAccessLink?: string;
  inviterName: string;
  role?: string;
  isCollaborator?: boolean;
  isExistingClient?: boolean;
  template?: string;
  subject?: string;
  data?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[send-unified-email] Function invoked at:', new Date().toISOString());
  console.log('[send-unified-email] Request method:', req.method);
  console.log('[send-unified-email] Request URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('[send-unified-email] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[send-unified-email] Parsing request body...');
    const body = await req.json();
    console.log('[send-unified-email] Body received:', JSON.stringify(body, null, 2));
    
    // Validate input to prevent injection attacks
    console.log('[send-unified-email] Validating input...');
    const validationResult = UnifiedEmailSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("[send-unified-email] Validation failed:", JSON.stringify(validationResult.error, null, 2));
      return new Response(
        JSON.stringify({ 
          error: "Invalid input parameters",
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    console.log('[send-unified-email] Validation successful');

    const { 
      email, 
      full_name, 
      processId, 
      processName, 
      companyId, 
      inviteLink,
      directAccessLink,
      inviterName,
      role,
      isCollaborator = false,
      isExistingClient = false,
      template,
      subject: customSubject,
      data: customData
    } = validationResult.data;

    const accessLink = directAccessLink || inviteLink || "";
    const isClientInvite = !isCollaborator && processId;
    const isDirectAccess = isExistingClient && directAccessLink;
    const companyName = "Fuzen - Sistema de Gestão Documental";
    
    // Se for um template de notificação, usar o subject customizado
    const isNotification = template && ['signatures_complete', 'signature_request', 'pending_signature'].includes(template);
    
    const subject = customSubject || (isDirectAccess
      ? `🔔 Novo processo criado: ${processName}`
      : isClientInvite 
      ? `🎉 Bem-vindo! Acesse seu processo: ${processName}`
      : `🤝 Convite para fazer parte da equipe - ${companyName}`);

    // ALWAYS use verified domain in production
    const fromEmail = "convites@fuzen.online";

    // Se for notificação de assinatura, usar template específico
    let emailHtml = '';
    
    if (isNotification && template === 'signatures_complete') {
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 600; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .success-icon {
              text-align: center;
              font-size: 64px;
              margin: 20px 0;
            }
            .document-info { 
              background: #f1f5f9; 
              border-left: 4px solid #10b981; 
              padding: 20px; 
              margin: 25px 0; 
              border-radius: 6px; 
            }
            .footer { 
              background: #f9fafb; 
              padding: 30px; 
              text-align: center; 
              border-top: 1px solid #e5e7eb; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Documento Totalmente Assinado</h1>
            </div>
            <div class="content">
              <div class="success-icon">🎉</div>
              <div class="greeting">Olá <strong>${full_name}</strong>,</div>
              <p>Temos uma ótima notícia! O documento foi assinado por todas as partes envolvidas.</p>
              <div class="document-info">
                <h3>📄 ${customData?.documentName || 'Documento'}</h3>
                <p><strong>Status:</strong> Totalmente assinado</p>
                <p><strong>Empresa:</strong> ${customData?.companyName || companyName}</p>
              </div>
              <p>O documento está disponível para download na sua área de Assinaturas.</p>
              <p>Atenciosamente,<br><strong>${inviterName}</strong></p>
            </div>
            <div class="footer">
              <p><strong>${companyName}</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (isNotification && template === 'signature_request') {
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 600; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .document-info { 
              background: #fef3cd; 
              border-left: 4px solid #f59e0b; 
              padding: 20px; 
              margin: 25px 0; 
              border-radius: 6px; 
            }
            .footer { 
              background: #f9fafb; 
              padding: 30px; 
              text-align: center; 
              border-top: 1px solid #e5e7eb; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Documento Aguardando Assinatura</h1>
            </div>
            <div class="content">
              <div class="greeting">Olá <strong>${full_name}</strong>,</div>
              <p>Um documento foi enviado e aguarda sua assinatura.</p>
              <div class="document-info">
                <h3>📄 ${customData?.documentName || 'Documento'}</h3>
                <p><strong>Enviado por:</strong> ${inviterName}</p>
                <p><strong>Status:</strong> Aguardando sua assinatura</p>
              </div>
              <p>Acesse a aba de <strong>Assinaturas</strong> em seu dashboard para visualizar e assinar o documento.</p>
              <p>Atenciosamente,<br><strong>${inviterName}</strong></p>
            </div>
            <div class="footer">
              <p><strong>${companyName}</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (isNotification && template === 'pending_signature') {
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 600; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .document-info { 
              background: #dbeafe; 
              border-left: 4px solid #3b82f6; 
              padding: 20px; 
              margin: 25px 0; 
              border-radius: 6px; 
            }
            .footer { 
              background: #f9fafb; 
              padding: 30px; 
              text-align: center; 
              border-top: 1px solid #e5e7eb; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✍️ Cliente Assinou o Documento</h1>
            </div>
            <div class="content">
              <div class="greeting">Olá <strong>${full_name}</strong>,</div>
              <p>O cliente <strong>${inviterName}</strong> assinou o documento. Agora é sua vez!</p>
              <div class="document-info">
                <h3>📄 ${customData?.documentName || 'Documento'}</h3>
                <p><strong>Assinado por:</strong> ${customData?.signerName || inviterName}</p>
                <p><strong>Status:</strong> Aguardando assinatura da empresa</p>
              </div>
              <p>Acesse a aba de <strong>Assinaturas</strong> em seu dashboard para visualizar e assinar o documento.</p>
              <p>Atenciosamente,<br><strong>${companyName}</strong></p>
            </div>
            <div class="footer">
              <p><strong>${companyName}</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Template original para convites
      emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 600; 
          }
          .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 16px; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .greeting { 
            font-size: 18px; 
            margin-bottom: 20px; 
            color: #374151; 
          }
          .process-info { 
            background: #f1f5f9; 
            border-left: 4px solid #667eea; 
            padding: 20px; 
            margin: 25px 0; 
            border-radius: 6px; 
          }
          .process-info h3 { 
            margin: 0 0 10px 0; 
            color: #374151; 
            font-size: 16px; 
          }
          .cta-button { 
            display: inline-block; 
            padding: 16px 32px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px; 
            margin: 30px 0; 
            text-align: center; 
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .steps { 
            margin: 25px 0; 
          }
          .steps ol { 
            padding-left: 20px; 
          }
          .steps li { 
            margin: 8px 0; 
            color: #4b5563; 
          }
          .footer { 
            background: #f9fafb; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb; 
          }
          .footer p { 
            margin: 5px 0; 
            color: #6b7280; 
            font-size: 14px; 
          }
          .company-name { 
            color: #667eea; 
            font-weight: 600; 
          }
          .security-note {
            background: #fef3cd;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isDirectAccess ? '🔔 Novo Processo' : isClientInvite ? '🎉 Bem-vindo!' : '🤝 Você foi convidado!'}</h1>
            <p>${isDirectAccess ? 'Um novo processo foi criado para você' : isClientInvite ? 'Seu processo foi criado com sucesso' : 'Para fazer parte da nossa equipe'}</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Olá <strong>${full_name}</strong>,
            </div>
            
            ${isDirectAccess ? `
              <p>Informamos que um novo processo foi criado para você em nosso sistema!</p>
              
              <div class="process-info">
                <h3>📋 Detalhes do Processo</h3>
                <p><strong>Processo:</strong> ${processName}</p>
                <p><strong>Responsável:</strong> ${inviterName}</p>
                <p><strong>Empresa:</strong> ${companyName}</p>
              </div>
              
              <p>Clique no botão abaixo para acessar o processo e acompanhar o andamento:</p>
            ` : isClientInvite ? `
              <p>É com grande satisfação que informamos que seu processo foi criado com sucesso em nosso sistema!</p>
              
              <div class="process-info">
                <h3>📋 Detalhes do Processo</h3>
                <p><strong>Processo:</strong> ${processName}</p>
                <p><strong>Responsável:</strong> ${inviterName}</p>
                <p><strong>Empresa:</strong> ${companyName}</p>
              </div>
              
              <p>Para acessar sua área exclusiva e acompanhar o andamento do seu processo, clique no botão abaixo:</p>
            ` : `
              <p><strong>${inviterName}</strong> convidou você para fazer parte da equipe do <span class="company-name">${companyName}</span>!</p>
              
              <div class="process-info">
                <h3>👥 Detalhes do Convite</h3>
                <p><strong>Função:</strong> ${role || 'Colaborador'}</p>
                <p><strong>Convidado por:</strong> ${inviterName}</p>
                <p><strong>Empresa:</strong> ${companyName}</p>
              </div>
              
              <p>Para aceitar o convite e criar sua conta, clique no botão abaixo:</p>
            `}
            
            <div style="text-align: center;">
              <a href="${accessLink}" class="cta-button">
                ${isDirectAccess ? '🔗 Ver Processo' : isClientInvite ? '🔗 Acessar Minha Área' : '✅ Aceitar Convite'}
              </a>
            </div>
            
            <div class="steps">
              <h3>📝 Próximos passos:</h3>
              <ol>
                ${isDirectAccess ? `
                  <li>Clique no botão acima para acessar o processo</li>
                  <li>Faça login com suas credenciais</li>
                  <li>Acompanhe o andamento em tempo real</li>
                  <li>Envie documentos e receba notificações automáticas</li>
                ` : isClientInvite ? `
                  <li>Clique no botão acima para acessar sua área exclusiva</li>
                  <li>Complete seu cadastro com suas informações</li>
                  <li>Acompanhe o andamento do seu processo em tempo real</li>
                  <li>Envie documentos e receba notificações automáticas</li>
                ` : `
                  <li>Clique no botão acima para aceitar o convite</li>
                  <li>Complete seu cadastro no sistema</li>
                  <li>Comece a colaborar com a equipe</li>
                  <li>Acesse todas as ferramentas disponíveis</li>
                `}
              </ol>
            </div>
            
            <div class="security-note">
              🔒 <strong>Segurança:</strong> ${isDirectAccess ? 'Use suas credenciais para acessar.' : 'Este link é único e pessoal. Não compartilhe com terceiros.'} 
              ${!isDirectAccess && (isClientInvite ? 'Ele expira em 7 dias.' : 'Válido por 7 dias.')}
            </div>
            
            <p style="margin-top: 30px;">
              Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.
            </p>
            
            <p>
              Atenciosamente,<br>
              <strong>${inviterName}</strong><br>
              <span class="company-name">${companyName}</span>
            </p>
          </div>
          
          <div class="footer">
            <p class="company-name"><strong>${companyName}</strong></p>
            <p>Sistema de Gestão Documental Inteligente</p>
            <p style="margin-top: 20px; font-size: 12px;">
              Este é um email automático. Se você não solicitou este convite, pode ignorar esta mensagem.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    console.log('[send-unified-email] Email details:');
    console.log('  - To:', email);
    console.log('  - Full name:', full_name);
    console.log('  - Type:', isDirectAccess ? 'existing_client' : isClientInvite ? 'new_client' : 'collaborator');
    console.log('  - Is existing client:', isExistingClient);
    console.log('  - Company ID:', companyId);
    console.log('  - Access link:', accessLink);
    console.log('  - RESEND_API_KEY configured:', !!Deno.env.get("RESEND_API_KEY"));
    console.log('  - RESEND_FROM value:', fromEmail);

    // Build base payload
    const payload = {
      from: `Fuzen <${fromEmail}>`,
      to: [email],
      subject,
      html: emailHtml,
    };

    // Use only verified domain address
    const fromCandidates = ['Fuzen <convites@fuzen.online>'];

    let emailResponse = { data: null as any, error: null as any };
    for (const from of fromCandidates) {
      const attemptPayload = { ...payload, from };
      console.log('Attempting to send email with FROM:', from);
      emailResponse = await sendEmail(attemptPayload);
      if (!emailResponse.error) break;
      const err = emailResponse.error as any;
      const is403 = err && (err.statusCode === 403 || err.status === 403);
      const domainIssue = is403 && typeof err.message === 'string' && (
        err.message.toLowerCase().includes('domain is not verified') ||
        err.message.toLowerCase().includes('only send testing emails')
      );
      if (!domainIssue) break; // if it's not a domain/testing restriction, stop retrying
    }

    // Final error handling
    if (emailResponse.error) {
      console.error('[send-unified-email] ❌ Resend returned an error:', JSON.stringify(emailResponse.error, null, 2));
      return new Response(
        JSON.stringify({ 
          success: false, 
          emailed: false, 
          error: emailResponse.error,
          details: 'Failed to send email after trying all FROM addresses'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[send-unified-email] ✅ Email sent successfully:', JSON.stringify(emailResponse, null, 2));

    return new Response(JSON.stringify({ 
      success: true, 
      emailed: true, 
      messageId: emailResponse.data?.id,
      to: email,
      type: isDirectAccess ? 'existing_client_process' : isClientInvite ? 'client_welcome' : 'collaborator_invite'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[send-unified-email] ❌ Unexpected error:", error);
    console.error("[send-unified-email] Error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        emailed: false,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);