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

const Dashboard = () => {
  const stats = [
    { 
      icon: Ticket, 
      label: "Total de Rifas", 
      value: "24", 
      color: "gradient-primary",
      iconColor: "text-primary-foreground"
    },
    { 
      icon: Check, 
      label: "Rifas Publicadas", 
      value: "18", 
      color: "bg-mint",
      iconColor: "text-foreground"
    },
    { 
      icon: Clock, 
      label: "Pendentes", 
      value: "6", 
      color: "bg-lavender",
      iconColor: "text-foreground"
    },
    { 
      icon: TrendingUp, 
      label: "Faturamento Hoje", 
      value: "R$ 4.300", 
      color: "bg-peach",
      iconColor: "text-foreground"
    },
  ];

  const recentRaffles = [
    { id: 1, name: "Rifa do iPhone 15 Pro Max", status: "published", sold: 97, total: 100 },
    { id: 2, name: "Kit Maquiagem Importada", status: "published", sold: 48, total: 50 },
    { id: 3, name: "Vale Compras R$1.000", status: "published", sold: 100, total: 100 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Olá, Criadora! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo das suas rifas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`h-10 w-10 lg:h-12 lg:w-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon size={22} className={stat.iconColor} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Button */}
        <Link to="/criar-rifa" className="block">
          <Card className="gradient-primary border-0 shadow-glow hover:scale-[1.02] transition-all duration-300 cursor-pointer animate-fade-in">
            <CardContent className="p-6 lg:p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
                  <PlusCircle size={28} className="text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary-foreground mb-1">
                    Criar nova rifa
                  </h3>
                  <p className="text-primary-foreground/80">
                    Configure sua rifa em poucos minutos
                  </p>
                </div>
              </div>
              <ArrowRight size={24} className="text-primary-foreground hidden sm:block" />
            </CardContent>
          </Card>
        </Link>

        {/* Recent Raffles */}
        <div className="animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Rifas Recentes</h2>
            <Link to="/rifas">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentRaffles.map((raffle, index) => (
              <Card 
                key={raffle.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${(index + 4) * 0.1}s` }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      raffle.status === "published" ? "bg-mint" : "bg-lavender"
                    }`}>
                      {raffle.status === "published" ? (
                        <Check size={22} className="text-foreground" />
                      ) : (
                        <Clock size={22} className="text-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{raffle.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {raffle.sold}/{raffle.total} números vendidos
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    raffle.status === "published" 
                      ? "bg-mint text-foreground" 
                      : "bg-lavender text-foreground"
                  }`}>
                    {raffle.status === "published" ? "Publicada" : "Pendente"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <Card className="gradient-soft border-0 animate-fade-in stagger-4">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-12 w-12 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} className="text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">Dica do dia</h3>
              <p className="text-muted-foreground text-sm">
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
