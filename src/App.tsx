import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import EmpresaDashboard from "./pages/EmpresaDashboard";
import AreaCliente from "./pages/AreaCliente";
import ModelosDocumentos from "./pages/ModelosDocumentos";
import GerenciarProcessos from "./pages/GerenciarProcessos";
import TreinarIA from "./pages/TreinarIA";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/empresa" element={<EmpresaDashboard />} />
          <Route path="/cliente" element={<AreaCliente />} />
          <Route path="/modelos-documentos" element={<ModelosDocumentos />} />
          <Route path="/gerenciar-processos" element={<GerenciarProcessos />} />
          <Route path="/treinar-ia" element={<TreinarIA />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
