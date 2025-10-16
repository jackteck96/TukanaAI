import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import EmpresaDashboard from "./pages/EmpresaDashboard";
import AreaCliente from "./pages/AreaCliente";
import ModelosDocumentos from "./pages/ModelosDocumentos";
import GerenciarProcessos from "./pages/GerenciarProcessos";
import SignatureCallback from "./pages/SignatureCallback";
import TreinarIA from "./pages/TreinarIA";
import CadastroTiposDocumentos from "./pages/CadastroTiposDocumentos";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import DocumentManagement from "./pages/DocumentManagement";
import Relatorios from "./pages/Relatorios";
import CompanyDashboard from "@/components/CompanyDashboard";
import CadastroCliente from "./pages/CadastroCliente";
import CadastroViaConvite from "./pages/CadastroViaConvite";
import GestaoColaboradores from "./pages/GestaoColaboradores";
import GestaoClientes from "./pages/GestaoClientes";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import RelatoriosPonto from "./pages/RelatoriosPonto";
import ClientInfo from "./pages/ClientInfo";
import AuthHashHandler from "./components/AuthHashHandler";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalErrorLogger from "./components/GlobalErrorLogger";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AnaliseIA from "./pages/AnaliseIA";
import VerifySignature from "./pages/VerifySignature";
import ApproveAdmin from "./pages/ApproveAdmin";

const queryClient = new QueryClient();

const App = () => (
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
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/cadastro-cliente" element={<CadastroCliente />} />
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
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </CompanyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;