import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Receipt, 
  Check, 
  Clock, 
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Purchase {
  id: string;
  buyer_name: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  raffle_name: string;
}

const Pagamentos = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return;

      // Get user's raffles first
      const { data: raffles } = await supabase
        .from("raffles")
        .select("id, name")
        .eq("user_id", user.id);

      if (!raffles || raffles.length === 0) {
        setLoading(false);
        return;
      }

      const raffleIds = raffles.map(r => r.id);
      const raffleMap = Object.fromEntries(raffles.map(r => [r.id, r.name]));

      // Get purchases for user's raffles
      const { data: purchasesData } = await supabase
        .from("raffle_purchases")
        .select("*")
        .in("raffle_id", raffleIds)
        .order("created_at", { ascending: false });

      if (purchasesData) {
        setPurchases(purchasesData.map(p => ({
          ...p,
          raffle_name: raffleMap[p.raffle_id] || "Rifa"
        })));
      }

      setLoading(false);
    };

    fetchPurchases();
  }, [user]);

  const completedTotal = purchases
    .filter(p => p.payment_status === "completed" || p.payment_status === "approved")
    .reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

  const pendingTotal = purchases
    .filter(p => p.payment_status === "pending")
    .reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

  const stats = [
    { 
      label: "Total Recebido", 
      value: `R$ ${completedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 
      icon: Receipt, 
      color: "gradient-primary" 
    },
    { 
      label: "Pendente", 
      value: `R$ ${pendingTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 
      icon: Clock, 
      color: "bg-lavender" 
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-foreground">Pagamentos</h1>
          <p className="text-xs text-muted-foreground">Histórico de vendas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon size={18} className="text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-sm font-bold text-foreground truncate">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Purchases List */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Receipt size={16} />
              Histórico de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-4">Carregando...</p>
            ) : purchases.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhuma venda ainda</p>
            ) : (
              <div className="space-y-2">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          purchase.payment_status === "completed" || purchase.payment_status === "approved" 
                            ? "bg-mint" 
                            : "bg-lavender"
                        }`}
                      >
                        {purchase.payment_status === "completed" || purchase.payment_status === "approved" ? (
                          <Check size={14} className="text-foreground" />
                        ) : (
                          <Clock size={14} className="text-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">{purchase.buyer_name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar size={10} />
                          <span>{new Date(purchase.created_at).toLocaleDateString("pt-BR")}</span>
                          <span className="truncate">• {purchase.raffle_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-foreground">
                        R$ {Number(purchase.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          purchase.payment_status === "completed" || purchase.payment_status === "approved"
                            ? "bg-mint text-foreground"
                            : "bg-lavender text-foreground"
                        }`}
                      >
                        {purchase.payment_status === "completed" || purchase.payment_status === "approved" ? "Pago" : "Pendente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Pagamentos;