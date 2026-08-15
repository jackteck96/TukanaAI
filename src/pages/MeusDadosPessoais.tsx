import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataSubjectRightsPortal } from "@/components/privacy/DataSubjectRightsPortal";
import { ConsentManagement } from "@/components/privacy/ConsentManagement";
import { Shield, UserCheck, FileText, Info, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

const MeusDadosPessoais = () => {
  const navigate = useNavigate();
  const { primaryRole, companyId } = useUserRole();

  const getDashboardRoute = () => {
    if (primaryRole === 'company_admin' || primaryRole === 'company_collaborator') {
      return '/empresa';
    }
    if (primaryRole === 'client' || primaryRole === 'client_collaborator') {
      return '/cliente';
    }
    if (primaryRole === 'platform_admin' && !companyId) {
      return '/admin';
    }
    return '/empresa';
  };

  return (
    <>
      <Helmet>
        <title>Meus Dados Pessoais | Tukana AI - LGPD</title>
        <meta name="description" content="Gerencie seus dados pessoais, consentimentos e exerça seus direitos conforme LGPD." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(getDashboardRoute())}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-3xl font-bold mb-2">Meus Dados Pessoais</h1>
            <p className="text-muted-foreground">
              Gerencie seus dados, consentimentos e exerça seus direitos conforme LGPD
            </p>
          </div>

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Seus direitos sob a LGPD</AlertTitle>
            <AlertDescription>
              A Lei Geral de Proteção de Dados garante que você tenha controle sobre seus dados pessoais. 
              Use esta página para exercer seus direitos de acesso, correção, exclusão e portabilidade.
              {" "}
              <Link to="/politica-privacidade" className="text-primary hover:underline">
                Leia nossa Política de Privacidade completa
              </Link>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="rights" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
              <TabsTrigger value="rights" className="flex items-center gap-2 py-3">
                <Shield className="h-4 w-4" />
                <span>Meus Direitos</span>
              </TabsTrigger>
              <TabsTrigger value="consents" className="flex items-center gap-2 py-3">
                <UserCheck className="h-4 w-4" />
                <span>Consentimentos</span>
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span>Informações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rights">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Portal de Direitos do Titular
                  </CardTitle>
                  <CardDescription>
                    Exerça seus direitos conforme LGPD Art. 18: acesso, correção, exclusão, 
                    portabilidade e outros direitos sobre seus dados pessoais.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataSubjectRightsPortal />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Gerenciar Consentimentos
                  </CardTitle>
                  <CardDescription>
                    Visualize e gerencie seus consentimentos para diferentes tipos de processamento de dados.
                    Você pode revogar consentimentos opcionais a qualquer momento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConsentManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Como seus dados são protegidos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">🔒 Segurança Técnica</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Criptografia de dados em trânsito (TLS/SSL)</li>
                        <li>Criptografia de dados em repouso</li>
                        <li>Controle de acesso baseado em funções (RBAC)</li>
                        <li>Row-Level Security (RLS) em todas as tabelas</li>
                        <li>Autenticação multi-fator (MFA) disponível</li>
                        <li>Logs de auditoria de todos os acessos</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">📋 Compliance e Governança</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Conformidade com LGPD (Lei 13.709/2018)</li>
                        <li>Conformidade com GDPR (Regulamento UE 2016/679)</li>
                        <li>Políticas de retenção de dados bem definidas</li>
                        <li>Processo de notificação de incidentes</li>
                        <li>DPO (Encarregado de Dados) designado</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">⏱️ Prazos de Resposta</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Solicitações de dados: até 15 dias (LGPD Art. 18 § 3º)</li>
                        <li>Exclusão de dados: até 30 dias</li>
                        <li>Correção de dados: imediato a 5 dias úteis</li>
                        <li>Portabilidade: até 15 dias</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dados que coletamos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Dados de Cadastro:</h4>
                      <p className="text-sm text-muted-foreground">
                        Nome, email, telefone, CPF/CNPJ, endereço
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Dados de Uso:</h4>
                      <p className="text-sm text-muted-foreground">
                        Logs de acesso, endereço IP, informações de dispositivo
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Documentos:</h4>
                      <p className="text-sm text-muted-foreground">
                        Documentos empresariais enviados para gestão
                      </p>
                    </div>
                    <div className="pt-4 border-t">
                      <Link to="/politica-privacidade">
                        <Button variant="outline" className="w-full">
                          Ver Política de Privacidade Completa
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>Precisa de ajuda?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">
                      Entre em contato com nosso Encarregado de Dados (DPO):
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong>{" "}
                      <a href="mailto:dpo@fuzen.app" className="text-primary hover:underline">
                        dpo@fuzen.app
                      </a>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Respondemos em até 48 horas úteis.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default MeusDadosPessoais;
