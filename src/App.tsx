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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/cadastro-cliente" element={<CadastroCliente />} />
              <Route path="/cadastro-via-convite" element={<CadastroViaConvite />} />
              
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
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CompanyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
