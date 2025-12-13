import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import CriarRifa from "./pages/CriarRifa";
import MinhasRifas from "./pages/MinhasRifas";
import Pagamentos from "./pages/Pagamentos";
import PagamentoTaxa from "./pages/PagamentoTaxa";
import Configuracoes from "./pages/Configuracoes";
import Suporte from "./pages/Suporte";
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
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/criar-rifa" element={<CriarRifa />} />
          <Route path="/rifas" element={<MinhasRifas />} />
          <Route path="/pagamentos" element={<Pagamentos />} />
          <Route path="/pagamento-taxa" element={<PagamentoTaxa />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/suporte" element={<Suporte />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
