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

      // Get user name from profile
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

      // Get raffles
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
      label: "Rifas Publicadas", 
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
      label: "Faturamento Total", 
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
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
            Olá{getFirstName() ? `, ${getFirstName()}` : ""}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {totalRaffles > 0 
              ? "Aqui está um resumo das suas rifas"
              : "Crie sua primeira rifa e comece a vender!"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 truncate">{stat.label}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">{stat.value}</p>
                  </div>
                  <div className={`h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 ${stat.color} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <stat.icon size={16} className={`${stat.iconColor} sm:hidden`} />
                    <stat.icon size={20} className={`${stat.iconColor} hidden sm:block`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Button */}
        <Link to="/criar-rifa" className="block">
          <Card className="gradient-primary border-0 shadow-glow hover:scale-[1.02] transition-all duration-300 cursor-pointer animate-fade-in">
            <CardContent className="p-4 sm:p-6 lg:p-8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-primary-foreground/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <PlusCircle size={20} className="text-primary-foreground sm:hidden" />
                  <PlusCircle size={24} className="text-primary-foreground hidden sm:block lg:hidden" />
                  <PlusCircle size={28} className="text-primary-foreground hidden lg:block" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-primary-foreground mb-0.5 sm:mb-1">
                    Criar nova rifa
                  </h3>
                  <p className="text-xs sm:text-sm text-primary-foreground/80 truncate">
                    Configure sua rifa em poucos minutos
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-primary-foreground hidden sm:block flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>

        {/* Recent Raffles */}
        <div className="animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">Rifas Recentes</h2>
            <Link to="/rifas">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                Ver todas
                <ArrowRight size={14} className="sm:hidden" />
                <ArrowRight size={16} className="hidden sm:block" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
                Carregando...
              </CardContent>
            </Card>
          ) : recentRaffles.length === 0 ? (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
                Você ainda não criou nenhuma rifa. Que tal criar a primeira?
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentRaffles.map((raffle, index) => (
                <Card 
                  key={raffle.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${(index + 4) * 0.1}s` }}
                >
                  <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                        raffle.status === "published" ? "bg-mint" : "bg-lavender"
                      }`}>
                        {raffle.status === "published" ? (
                          <Check size={18} className="text-foreground sm:hidden" />
                        ) : (
                          <Clock size={18} className="text-foreground sm:hidden" />
                        )}
                        {raffle.status === "published" ? (
                          <Check size={22} className="text-foreground hidden sm:block" />
                        ) : (
                          <Clock size={22} className="text-foreground hidden sm:block" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{raffle.name}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {raffle.numbers_sold}/{raffle.total_numbers} vendidos
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                      raffle.status === "published" 
                        ? "bg-mint text-foreground" 
                        : raffle.status === "pending_payment"
                        ? "bg-peach text-foreground"
                        : "bg-lavender text-foreground"
                    }`}>
                      {raffle.status === "published" 
                        ? "Publicada" 
                        : raffle.status === "pending_payment"
                        ? "Aguardando pagamento"
                        : "Rascunho"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <Card className="gradient-soft border-0 animate-fade-in stagger-4">
          <CardContent className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-primary-foreground sm:hidden" />
              <Sparkles size={22} className="text-primary-foreground hidden sm:block" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-sm sm:text-base mb-0.5 sm:mb-1">Dica do dia</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Rifas com imagens atrativas vendem até 3x mais! 
                Adicione fotos de alta qualidade do prêmio.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
