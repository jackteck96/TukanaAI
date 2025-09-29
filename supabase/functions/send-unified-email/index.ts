import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Mock implementation for email sending - logs instead of sending real emails
const mockEmailSender = {
  emails: {
    send: async (emailData: any) => {
      console.log("📧 Email que seria enviado:", {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        timestamp: new Date().toISOString()
      });
      
      return {
        data: { id: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}` },
        error: null
      };
    }
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UnifiedEmailRequest {
  email: string;
  full_name: string;
  processId?: string;
  processName?: string;
  companyId: string;
  inviteLink: string;
  inviterName: string;
  role?: string;
  isCollaborator?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      full_name, 
      processId, 
      processName, 
      companyId, 
      inviteLink, 
      inviterName,
      role,
      isCollaborator = false
    }: UnifiedEmailRequest = await req.json();

    const isClientInvite = !isCollaborator && processId;
    const companyName = "Fuzen - Sistema de Gestão Documental";
    
    const subject = isClientInvite 
      ? `🎉 Bem-vindo! Acesse seu processo: ${processName}`
      : `🤝 Convite para fazer parte da equipe - ${companyName}`;

    const fromEmail = Deno.env.get("RESEND_FROM") || "noreply@resend.dev";

    const emailHtml = `
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
            <h1>${isClientInvite ? '🎉 Bem-vindo!' : '🤝 Você foi convidado!'}</h1>
            <p>${isClientInvite ? 'Seu processo foi criado com sucesso' : 'Para fazer parte da nossa equipe'}</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Olá <strong>${full_name}</strong>,
            </div>
            
            ${isClientInvite ? `
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
              <a href="${inviteLink}" class="cta-button">
                ${isClientInvite ? '🔗 Acessar Minha Área' : '✅ Aceitar Convite'}
              </a>
            </div>
            
            <div class="steps">
              <h3>📝 Próximos passos:</h3>
              <ol>
                ${isClientInvite ? `
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
              🔒 <strong>Segurança:</strong> Este link é único e pessoal. Não compartilhe com terceiros. 
              ${isClientInvite ? 'Ele expira em 7 dias.' : 'Válido por 7 dias.'}
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

    console.log("Sending unified email to:", email, "Type:", isClientInvite ? "client" : "collaborator");

    const emailResponse = await mockEmailSender.emails.send({
      from: `Fuzen <${fromEmail}>`,
      to: [email],
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailed: true, 
      messageId: emailResponse.data?.id,
      to: email,
      type: isClientInvite ? "client_welcome" : "collaborator_invite"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-unified-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        emailed: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);