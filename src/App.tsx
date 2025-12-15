import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import CriarRifa from "./pages/CriarRifa";
import EditarRifa from "./pages/EditarRifa";
import MinhasRifas from "./pages/MinhasRifas";
import Pagamentos from "./pages/Pagamentos";
import PagamentoTaxa from "./pages/PagamentoTaxa";
import Configuracoes from "./pages/Configuracoes";
import Suporte from "./pages/Suporte";
import RifaPublica from "./pages/RifaPublica";
import RifasPublicas from "./pages/RifasPublicas";
import MeusNumeros from "./pages/MeusNumeros";
import Clientes from "./pages/Clientes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/explorar" element={<RifasPublicas />} />
            <Route path="/rifa/:id" element={<RifaPublica />} />
            <Route path="/meus-numeros" element={<MeusNumeros />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/criar-rifa" element={<ProtectedRoute><CriarRifa /></ProtectedRoute>} />
            <Route path="/editar-rifa/:id" element={<ProtectedRoute><EditarRifa /></ProtectedRoute>} />
            <Route path="/rifas" element={<ProtectedRoute><MinhasRifas /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/pagamentos" element={<ProtectedRoute><Pagamentos /></ProtectedRoute>} />
            <Route path="/pagamento-taxa" element={<ProtectedRoute><PagamentoTaxa /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
