import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Ticket, Gift, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PurchaseWithRaffle {
  id: string;
  buyer_name: string;
  buyer_email: string;
  numbers_purchased: number[];
  quantity: number;
  total_amount: number;
  payment_status: string;
  created_at: string;
  raffles: {
    id: string;
    name: string;
    image_url: string | null;
    primary_color: string | null;
  } | null;
}

const MeusNumeros = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseWithRaffle[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido para buscar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from("raffle_purchases")
      .select("*, raffles(id, name, image_url, primary_color)")
      .eq("buyer_email", email.toLowerCase().trim())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchases:", error);
      toast({
        title: "Erro ao buscar",
        description: "Não foi possível buscar suas compras",
        variant: "destructive",
      });
      setPurchases([]);
    } else {
      setPurchases((data as PurchaseWithRaffle[]) || []);
    }

    setLoading(false);
  };

  const confirmedPurchases = purchases.filter(p => p.payment_status === "confirmed");
  const pendingPurchases = purchases.filter(p => p.payment_status === "pending");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800 h-8 w-8">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Ticket size={20} className="text-emerald-400" />
            <h1 className="font-bold text-base">Meus Números</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Search Section */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400 mb-3">
              Digite o email usado na compra para ver seus números
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <Search size={18} />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <div className="space-y-4">
            {purchases.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 text-center">
                  <Gift size={40} className="mx-auto mb-3 text-zinc-600" />
                  <p className="text-zinc-400 text-sm">
                    Nenhuma compra encontrada para este email
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Confirmed purchases */}
                {confirmedPurchases.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={16} className="text-emerald-400" />
                      <h2 className="text-sm font-semibold text-white">
                        Compras confirmadas ({confirmedPurchases.length})
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {confirmedPurchases.map((purchase) => (
                        <PurchaseCard key={purchase.id} purchase={purchase} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending purchases */}
                {pendingPurchases.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} className="text-yellow-400" />
                      <h2 className="text-sm font-semibold text-white">
                        Aguardando pagamento ({pendingPurchases.length})
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {pendingPurchases.map((purchase) => (
                        <PurchaseCard key={purchase.id} purchase={purchase} isPending />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const PurchaseCard = ({ purchase, isPending = false }: { purchase: PurchaseWithRaffle; isPending?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const raffle = purchase.raffles;
  const primaryColor = raffle?.primary_color || "#10B981";

  return (
    <Card className={`bg-zinc-900 border-zinc-800 ${isPending ? "opacity-70" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {raffle?.image_url ? (
            <img
              src={raffle.image_url}
              alt={raffle.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor + "30" }}
            >
              <Gift size={20} style={{ color: primaryColor }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">
              {raffle?.name || "Rifa"}
            </h3>
            <p className="text-xs text-zinc-400">
              {purchase.quantity} números • R$ {Number(purchase.total_amount).toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {new Date(purchase.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isPending
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {isPending ? "Pendente" : "Confirmado"}
            </span>
          </div>
        </div>

        {/* Numbers */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          {expanded ? "Ocultar números" : "Ver meus números"}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <div className="flex flex-wrap gap-1.5">
              {purchase.numbers_purchased.map((num) => (
                <span
                  key={num}
                  className="w-9 h-7 flex items-center justify-center rounded text-xs font-mono font-bold bg-zinc-800 text-white"
                >
                  {String(num).padStart(3, "0")}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeusNumeros;
