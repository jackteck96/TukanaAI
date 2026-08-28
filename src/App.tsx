import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import AuthHashHandler from "./components/auth/AuthHashHandler";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import GlobalErrorLogger from "./components/shared/GlobalErrorLogger";
import AdminRoute from "./components/auth/AdminRoute";

const Auth = lazy(() => import("./pages/Auth"));
const EmpresaDashboard = lazy(() => import("./pages/EmpresaDashboard"));
const AreaCliente = lazy(() => import("./pages/AreaCliente"));
const ModelosDocumentos = lazy(() => import("./pages/ModelosDocumentos"));
const GerenciarProcessos = lazy(() => import("./pages/GerenciarProcessos"));
const SignatureCallback = lazy(() => import("./pages/SignatureCallback"));
const TreinarIA = lazy(() => import("./pages/TreinarIA"));
const CadastroTiposDocumentos = lazy(() => import("./pages/CadastroTiposDocumentos"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DocumentManagement = lazy(() => import("./pages/DocumentManagement"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const CompanyDashboard = lazy(() => import("@/components/company/CompanyDashboard"));
const CadastroCliente = lazy(() => import("./pages/CadastroCliente"));
const CadastroViaConvite = lazy(() => import("./pages/CadastroViaConvite"));
const GestaoColaboradores = lazy(() => import("./pages/GestaoColaboradores"));
const GestaoClientes = lazy(() => import("./pages/GestaoClientes"));
const GestaoUsuarios = lazy(() => import("./pages/GestaoUsuarios"));
const RelatoriosPonto = lazy(() => import("./pages/RelatoriosPonto"));
const ClientInfo = lazy(() => import("./pages/ClientInfo"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AnaliseIA = lazy(() => import("./pages/AnaliseIA"));
const VerifySignature = lazy(() => import("./pages/VerifySignature"));
const ApproveAdmin = lazy(() => import("./pages/ApproveAdmin"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const GestaoPermissoes = lazy(() => import("./pages/GestaoPermissoes"));
const GestaoClientesQualificacao = lazy(() => import("./pages/GestaoClientesQualificacao"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const MeusDadosPessoais = lazy(() => import("./pages/MeusDadosPessoais"));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <GlobalErrorLogger />
            <Toaster />
            <Sonner />
            {/* Processa hash de autenticação do Supabase e limpa a URL */}
            <AuthHashHandler />
            <BrowserRouter>
              <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/cadastro-cliente" element={<CadastroCliente />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/termos-de-uso" element={<TermsOfService />} />
                <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/verify-signature/:signatureHash" element={<VerifySignature />} />
              <Route path="/gestao-colaboradores" element={
                <ProtectedRoute>
                  <GestaoColaboradores />
                </ProtectedRoute>
              } />
              <Route path="/gestao-clientes" element={
                <ProtectedRoute>
                  <GestaoClientes />
                </ProtectedRoute>
              } />
              <Route path="/gestao-clientes-qualificacao" element={
                <ProtectedRoute>
                  <GestaoClientesQualificacao />
                </ProtectedRoute>
              } />
              <Route path="/gestao-usuarios" element={<ProtectedRoute><GestaoUsuarios /></ProtectedRoute>} />
              <Route path="/cadastro-via-convite" element={<ErrorBoundary><CadastroViaConvite /></ErrorBoundary>} />
                
                {/* Protected routes */}
                <Route path="/onboarding" element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                } />
                <Route path="/empresa" element={
                  <ProtectedRoute>
                    <EmpresaDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <CompanyDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/cliente" element={
                  <ProtectedRoute>
                    <AreaCliente />
                  </ProtectedRoute>
                } />
                <Route path="/cliente/assinaturas" element={
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/area-cliente" element={
                  <ProtectedRoute>
                    <AreaCliente />
                  </ProtectedRoute>
                } />
                <Route path="/modelos-documentos" element={
                  <ProtectedRoute>
                    <ModelosDocumentos />
                  </ProtectedRoute>
                } />
                <Route path="/gerenciar-processos" element={
                  <ProtectedRoute>
                    <GerenciarProcessos />
                  </ProtectedRoute>
                 } />
                 <Route path="/assinatura-callback" element={<SignatureCallback />} />
                 <Route path="/treinar-ia" element={
                   <ProtectedRoute>
                     <TreinarIA />
                   </ProtectedRoute>
                } />
                <Route path="/cadastro-tipos-documentos" element={
                  <ProtectedRoute>
                    <CadastroTiposDocumentos />
                  </ProtectedRoute>
                } />
                <Route path="/documentos" element={
                  <ProtectedRoute>
                    <DocumentManagement />
                  </ProtectedRoute>
                } />
                <Route path="/relatorios" element={
                  <ProtectedRoute>
                    <Relatorios />
                  </ProtectedRoute>
                } />
                <Route path="/relatorios-ponto" element={
                  <ProtectedRoute>
                    <RelatoriosPonto />
                  </ProtectedRoute>
                } />
                <Route path="/cliente/:email" element={
                  <ProtectedRoute>
                    <ClientInfo />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/analise-ia" element={
                  <ProtectedRoute>
                    <AnaliseIA />
                  </ProtectedRoute>
                } />
                <Route path="/treinar-ia" element={
                  <AdminRoute>
                    <TreinarIA />
                  </AdminRoute>
                } />
              <Route path="/approve-admin" element={<ApproveAdmin />} />
              <Route path="/gestao-permissoes" element={
                <ProtectedRoute>
                  <GestaoPermissoes />
                </ProtectedRoute>
              } />
              <Route path="/meus-dados-pessoais" element={
                <ProtectedRoute>
                  <MeusDadosPessoais />
                </ProtectedRoute>
              } />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;