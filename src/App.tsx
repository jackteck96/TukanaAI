import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import EmpresaDashboard from "./pages/EmpresaDashboard";
import AreaCliente from "./pages/AreaCliente";
import ModelosDocumentos from "./pages/ModelosDocumentos";
import GerenciarProcessos from "./pages/GerenciarProcessos";
import TreinarIA from "./pages/TreinarIA";
import CadastroTiposDocumentos from "./pages/CadastroTiposDocumentos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/empresa" element={
              <ProtectedRoute requiredRole="admin">
                <EmpresaDashboard />
              </ProtectedRoute>
            } />
            <Route path="/cliente" element={
              <ProtectedRoute requiredRole="client">
                <AreaCliente />
              </ProtectedRoute>
            } />
            <Route path="/modelos-documentos" element={
              <ProtectedRoute requiredRole="admin">
                <ModelosDocumentos />
              </ProtectedRoute>
            } />
            <Route path="/gerenciar-processos" element={
              <ProtectedRoute requiredRole="admin">
                <GerenciarProcessos />
              </ProtectedRoute>
            } />
            <Route path="/treinar-ia" element={
              <ProtectedRoute requiredRole="admin">
                <TreinarIA />
              </ProtectedRoute>
            } />
            <Route path="/cadastro-tipos-documentos" element={
              <ProtectedRoute requiredRole="admin">
                <CadastroTiposDocumentos />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
