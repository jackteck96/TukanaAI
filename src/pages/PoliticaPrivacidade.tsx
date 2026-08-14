import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, User, FileText, Mail, Clock, AlertTriangle } from "lucide-react";

// TODO(i18n): this page is Portuguese-only and NOT wired into react-i18next like the
// rest of the site. Unreviewed EN/ES drafts of this content live in docs/legal/ —
// they need legal sign-off before being moved into src/locales/*/common.json and
// wired up with useTranslation(). See docs/legal/README.md for full context.
const PoliticaPrivacidade = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Política de Privacidade | Fuzen - LGPD e GDPR</title>
        <meta name="description" content="Política de privacidade da Fuzen em conformidade com LGPD e GDPR. Saiba como coletamos, usamos e protegemos seus dados pessoais." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
            <p className="text-muted-foreground">
              Versão 1.0 - Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018) 
              e o Regulamento Geral de Proteção de Dados (GDPR - Regulamento UE 2016/679)
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Controlador de Dados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  1. Controlador de Dados e Encarregado (DPO)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p><strong>Controlador:</strong> Fuzen Tecnologia Ltda.</p>
                <p><strong>CNPJ:</strong> [Inserir CNPJ]</p>
                <p><strong>Endereço:</strong> [Inserir endereço completo]</p>
                <div className="border-l-4 border-primary pl-4 bg-primary/5 p-4 rounded">
                  <p className="font-semibold mb-2">Encarregado de Dados (DPO):</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email: <a href="mailto:dpo@fuzen.app" className="text-primary hover:underline">dpo@fuzen.app</a>
                  </p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Para exercer seus direitos ou fazer perguntas sobre o tratamento de seus dados, 
                    entre em contato com nosso DPO.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Dados Coletados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  2. Dados Pessoais Coletados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Dados de Identificação:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Nome completo</li>
                    <li>CPF/CNPJ</li>
                    <li>Email</li>
                    <li>Telefone</li>
                    <li>Endereço completo</li>
                    <li>RG e documentos de identificação</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Dados de Uso:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Endereço IP</li>
                    <li>Informações de navegador e dispositivo</li>
                    <li>Logs de acesso e atividades</li>
                    <li>Dados de geolocalização (quando autorizado)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Documentos:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Documentos empresariais enviados</li>
                    <li>Contratos e termos assinados digitalmente</li>
                    <li>Comprovantes diversos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 3. Finalidade e Base Legal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  3. Finalidade do Tratamento e Base Legal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold mb-2">Execução de Contrato (LGPD Art. 7º, V)</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Prestação dos serviços de gestão de documentos</li>
                    <li>Comunicação relacionada aos serviços contratados</li>
                    <li>Suporte técnico e atendimento ao cliente</li>
                  </ul>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold mb-2">Cumprimento de Obrigação Legal (LGPD Art. 7º, II)</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Atendimento a requisitos legais e regulatórios</li>
                    <li>Resposta a ordens judiciais</li>
                    <li>Obrigações tributárias e contábeis</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold mb-2">Consentimento (LGPD Art. 7º, I)</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Envio de comunicações de marketing</li>
                    <li>Compartilhamento com parceiros (quando aplicável)</li>
                    <li>Análise de dados para melhorias (opcional)</li>
                  </ul>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold mb-2">Legítimo Interesse (LGPD Art. 7º, IX)</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Segurança da plataforma e prevenção de fraudes</li>
                    <li>Melhoria dos serviços oferecidos</li>
                    <li>Proteção ao crédito</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 4. Compartilhamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  4. Compartilhamento de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>Seus dados pessoais podem ser compartilhados com:</p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">Prestadores de Serviços:</h3>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Supabase (infraestrutura de banco de dados)</li>
                      <li>Resend (envio de emails)</li>
                      <li>Google (autenticação e calendário)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-1">
                      Todos os fornecedores são cuidadosamente selecionados e possuem compromissos 
                      contratuais de proteção de dados.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Autoridades Competentes:</h3>
                    <p className="text-muted-foreground">
                      Quando exigido por lei ou ordem judicial.
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Importante:
                    </p>
                    <p className="text-sm mt-1">
                      Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros 
                      para fins de marketing sem seu consentimento explícito.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  5. Medidas de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>Implementamos medidas técnicas e organizacionais robustas:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Criptografia de dados em trânsito (TLS/SSL) e em repouso</li>
                  <li>Controle de acesso baseado em funções (RBAC)</li>
                  <li>Row-Level Security (RLS) em todas as tabelas</li>
                  <li>Logs de auditoria de todos os acessos a dados pessoais</li>
                  <li>Backups regulares e plano de recuperação de desastres</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Autenticação multi-fator (MFA) disponível</li>
                </ul>
              </CardContent>
            </Card>

            {/* 6. Retenção */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  6. Retenção de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold">Dados de Cadastro e Contrato:</h3>
                  <p className="text-muted-foreground">
                    Mantidos durante a vigência do contrato e por 5 anos após o término, 
                    conforme exigido pela legislação contábil e fiscal brasileira.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Documentos Enviados:</h3>
                  <p className="text-muted-foreground">
                    Mantidos conforme acordo contratual ou exigência legal aplicável.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Logs de Acesso:</h3>
                  <p className="text-muted-foreground">
                    Mantidos por 6 meses para fins de segurança e auditoria, 
                    salvo necessidade legal de retenção maior.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Dados de Marketing:</h3>
                  <p className="text-muted-foreground">
                    Mantidos até a revogação do consentimento ou por 2 anos sem interação.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 7. Direitos do Titular */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  7. Seus Direitos (LGPD Art. 18)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>Como titular de dados pessoais, você tem os seguintes direitos:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Confirmação e Acesso:</strong> Confirmar a existência e acessar seus dados</li>
                  <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                  <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> Solicitar anonimização ou exclusão de dados desnecessários ou excessivos</li>
                  <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado e interoperável</li>
                  <li><strong>Eliminação de Dados:</strong> Solicitar exclusão de dados tratados com base em consentimento</li>
                  <li><strong>Informação sobre Compartilhamento:</strong> Saber com quem compartilhamos seus dados</li>
                  <li><strong>Informação sobre a Possibilidade de Não Fornecer Consentimento:</strong> E sobre as consequências</li>
                  <li><strong>Revogação do Consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
                </ul>
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 mt-4">
                  <p className="font-semibold mb-2">Para exercer seus direitos:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Acesse seu perfil e vá em "Meus Dados Pessoais"</li>
                    <li>Ou entre em contato com nosso DPO: <a href="mailto:dpo@fuzen.app" className="text-primary hover:underline">dpo@fuzen.app</a></li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-2">
                    Responderemos sua solicitação em até 15 dias conforme LGPD Art. 18 § 3º.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 8. Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>8. Cookies e Tecnologias Semelhantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>Utilizamos cookies essenciais para o funcionamento da plataforma:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Cookies de Sessão:</strong> Para manter você autenticado</li>
                  <li><strong>Cookies de Preferência:</strong> Para lembrar suas configurações</li>
                  <li><strong>Cookies de Segurança:</strong> Para proteção contra fraudes</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Você pode gerenciar cookies nas configurações do seu navegador, mas isso pode 
                  afetar a funcionalidade da plataforma.
                </p>
              </CardContent>
            </Card>

            {/* 9. Transferência Internacional */}
            <Card>
              <CardHeader>
                <CardTitle>9. Transferência Internacional de Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  Alguns de nossos prestadores de serviços (como Supabase) podem armazenar dados 
                  em servidores localizados fora do Brasil. Garantimos que:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Todos os fornecedores possuem certificações de segurança adequadas</li>
                  <li>Cláusulas contratuais padrão de proteção de dados estão em vigor</li>
                  <li>O nível de proteção é equivalente ao exigido pela LGPD</li>
                </ul>
              </CardContent>
            </Card>

            {/* 10. Incidentes de Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  10. Notificação de Incidentes de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  Em caso de incidente de segurança que possa acarretar risco ou dano relevante 
                  aos titulares, conforme LGPD Art. 48:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Notificaremos a ANPD em prazo razoável</li>
                  <li>Notificaremos você por email ou comunicação na plataforma</li>
                  <li>Informaremos a natureza do incidente e as medidas técnicas tomadas</li>
                  <li>Providenciaremos orientações sobre como proteger seus dados</li>
                </ul>
              </CardContent>
            </Card>

            {/* 11. Alterações */}
            <Card>
              <CardHeader>
                <CardTitle>11. Alterações nesta Política</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos 
                  alterações significativas:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Notificaremos você por email ou na plataforma</li>
                  <li>Manteremos versões anteriores disponíveis para consulta</li>
                  <li>Solicitaremos novo consentimento quando necessário</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Recomendamos que você revise esta política periodicamente.
                </p>
              </CardContent>
            </Card>

            {/* 12. Legislação Aplicável */}
            <Card>
              <CardHeader>
                <CardTitle>12. Legislação e Foro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  Esta Política de Privacidade é regida pela legislação brasileira, especialmente:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Lei Geral de Proteção de Dados (Lei 13.709/2018)</li>
                  <li>Marco Civil da Internet (Lei 12.965/2014)</li>
                  <li>Código de Defesa do Consumidor (Lei 8.078/1990)</li>
                </ul>
                <p className="mt-3">
                  Fica eleito o foro da Comarca de [Cidade], [Estado], para dirimir quaisquer 
                  questões relativas a esta Política.
                </p>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Dúvidas ou Solicitações?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">Entre em contato com nosso DPO:</p>
                  <p>Email: <a href="mailto:dpo@fuzen.app" className="text-primary hover:underline">dpo@fuzen.app</a></p>
                  <p>Ou acesse "Meus Dados Pessoais" no seu perfil para exercer seus direitos.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PoliticaPrivacidade;
