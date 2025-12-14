import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Ticket, 
  Check, 
  Clock, 
  TrendingUp, 
  PlusCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Raffle {
  id: string;
  name: string;
  status: string;
  numbers_sold: number;
  total_numbers: number;
  total_earned: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.name) {
        setUserName(profile.name);
      } else if (user.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      } else {
        setUserName(user.email?.split("@")[0] || "");
      }

      const { data: rafflesData } = await supabase
        .from("raffles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (rafflesData) {
        setRaffles(rafflesData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const totalRaffles = raffles.length;
  const publishedRaffles = raffles.filter(r => r.status === "published").length;
  const pendingRaffles = raffles.filter(r => r.status === "draft" || r.status === "pending_payment").length;
  const totalEarned = raffles.reduce((sum, r) => sum + Number(r.total_earned || 0), 0);

  const stats = [
    { 
      icon: Ticket, 
      label: "Total de Rifas", 
      value: totalRaffles.toString(), 
      color: "gradient-primary",
      iconColor: "text-primary-foreground"
    },
    { 
      icon: Check, 
      label: "Publicadas", 
      value: publishedRaffles.toString(), 
      color: "bg-mint",
      iconColor: "text-foreground"
    },
    { 
      icon: Clock, 
      label: "Pendentes", 
      value: pendingRaffles.toString(), 
      color: "bg-lavender",
      iconColor: "text-foreground"
    },
    { 
      icon: TrendingUp, 
      label: "Faturamento", 
      value: `R$ ${totalEarned.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 
      color: "bg-peach",
      iconColor: "text-foreground"
    },
  ];

  const recentRaffles = raffles.slice(0, 3);

  const getFirstName = () => {
    if (!userName) return "";
    return userName.split(" ")[0];
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Welcome */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">
            Olá{getFirstName() ? `, ${getFirstName()}` : ""}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {totalRaffles > 0 ? "Resumo das suas rifas" : "Crie sua primeira rifa!"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-sm sm:text-base font-bold text-foreground truncate">{stat.value}</p>
                  </div>
                  <div className={`h-8 w-8 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <stat.icon size={14} className={stat.iconColor} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Button */}
        <Link to="/criar-rifa" className="block">
          <Card className="gradient-primary border-0 shadow-glow hover:scale-[1.01] transition-all cursor-pointer">
            <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <PlusCircle size={18} className="text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-primary-foreground">
                    Criar nova rifa
                  </h3>
                  <p className="text-xs text-primary-foreground/80 truncate">
                    Configure em poucos minutos
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-primary-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        {/* Recent Raffles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm sm:text-base font-bold text-foreground">Rifas Recentes</h2>
            <Link to="/rifas">
              <Button variant="ghost" size="sm" className="text-xs px-2 h-7">
                Ver todas
                <ArrowRight size={12} />
              </Button>
            </Link>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                Carregando...
              </CardContent>
            </Card>
          ) : recentRaffles.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma rifa ainda. Crie a primeira!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentRaffles.map((raffle) => (
                <Card key={raffle.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        raffle.status === "published" ? "bg-mint" : "bg-lavender"
                      }`}>
                        {raffle.status === "published" ? (
                          <Check size={16} className="text-foreground" />
                        ) : (
                          <Clock size={16} className="text-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm text-foreground truncate">{raffle.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {raffle.numbers_sold}/{raffle.total_numbers} vendidos
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                      raffle.status === "published" 
                        ? "bg-mint text-foreground" 
                        : raffle.status === "pending_payment"
                        ? "bg-peach text-foreground"
                        : "bg-lavender text-foreground"
                    }`}>
                      {raffle.status === "published" 
                        ? "Publicada" 
                        : raffle.status === "pending_payment"
                        ? "Aguardando"
                        : "Rascunho"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <Card className="gradient-soft border-0">
          <CardContent className="p-3 flex items-start gap-3">
            <div className="h-9 w-9 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-sm">Dica do dia</h3>
              <p className="text-muted-foreground text-xs">
                Rifas com imagens atrativas vendem até 3x mais!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
