import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Ticket, 
  Check, 
  Clock, 
  Eye, 
  Edit, 
  Trash2, 
  PlusCircle,
  Search,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Raffle {
  id: string;
  name: string;
  status: string;
  numbers_sold: number;
  total_numbers: number;
  price_per_number: number;
  end_date: string | null;
  total_earned: number;
}

const MinhasRifas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "pending_payment" | "draft">("all");
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRaffles = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("raffles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setRaffles(data);
      }
      setLoading(false);
    };

    fetchRaffles();
  }, [user]);

  const handleDelete = async (raffleId: string) => {
    const { error } = await supabase
      .from("raffles")
      .delete()
      .eq("id", raffleId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a rifa",
        variant: "destructive",
      });
      return;
    }

    setRaffles(raffles.filter(r => r.id !== raffleId));
    toast({
      title: "Rifa excluída",
      description: "A rifa foi removida com sucesso",
    });
  };

  const copyLink = (raffleId: string) => {
    const url = `${window.location.origin}/rifa/${raffleId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus clientes",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      published: "bg-mint text-foreground",
      pending_payment: "bg-peach text-foreground",
      draft: "bg-muted text-muted-foreground",
    };
    const labels: Record<string, string> = {
      published: "Publicada",
      pending_payment: "Aguardando pagamento",
      draft: "Rascunho",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || "Rascunho"}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <Check size={20} className="text-foreground" />;
      case "pending_payment":
        return <Clock size={20} className="text-foreground" />;
      default:
        return <Edit size={20} className="text-muted-foreground" />;
    }
  };

  const filteredRaffles = raffles.filter((raffle) => {
    const matchesSearch = raffle.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || raffle.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-fade-in">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Minhas Rifas</h1>
            <p className="text-sm text-muted-foreground">Gerencie todas as suas rifas</p>
          </div>
          <Link to="/criar-rifa">
            <Button size="sm" className="sm:size-default">
              <PlusCircle size={16} className="sm:hidden" />
              <PlusCircle size={18} className="hidden sm:block" />
              Nova Rifa
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-3 animate-fade-in stagger-1">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar rifas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-12 text-sm"
            />
          </div>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {[
              { key: "all", label: "Todas" },
              { key: "published", label: "Publicadas" },
              { key: "pending_payment", label: "Pendentes" },
              { key: "draft", label: "Rascunhos" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key as typeof filter)}
                className="text-xs sm:text-sm whitespace-nowrap px-2.5 sm:px-3"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Raffles List */}
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <Card className="animate-fade-in">
              <CardContent className="p-8 text-center text-muted-foreground">
                Carregando...
              </CardContent>
            </Card>
          ) : filteredRaffles.length === 0 ? (
            <Card className="animate-fade-in">
              <CardContent className="p-8 sm:p-12 text-center">
                <Ticket size={36} className="mx-auto text-muted-foreground mb-3 sm:mb-4 sm:hidden" />
                <Ticket size={48} className="mx-auto text-muted-foreground mb-3 sm:mb-4 hidden sm:block" />
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  Nenhuma rifa encontrada
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm ? "Tente buscar por outro termo." : "Crie sua primeira rifa agora!"}
                </p>
                <Link to="/criar-rifa">
                  <Button size="sm" className="sm:size-default">
                    <PlusCircle size={16} />
                    Criar Rifa
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredRaffles.map((raffle, index) => (
              <Card
                key={raffle.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {/* Icon */}
                    <div
                      className={`h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        raffle.status === "published"
                          ? "bg-mint"
                          : raffle.status === "pending_payment"
                          ? "bg-peach"
                          : "bg-muted"
                      }`}
                    >
                      {getStatusIcon(raffle.status)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">
                          {raffle.name}
                        </h3>
                        {getStatusBadge(raffle.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>
                          {raffle.numbers_sold}/{raffle.total_numbers} vendidos
                        </span>
                        <span>R$ {Number(raffle.price_per_number).toFixed(2)}/nº</span>
                        {raffle.end_date && (
                          <span className="hidden sm:inline">
                            Encerra: {new Date(raffle.end_date).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                      {raffle.status === "published" && (
                        <div className="mt-2 w-full max-w-xs">
                          <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-primary transition-all duration-500"
                              style={{ width: `${(raffle.numbers_sold / raffle.total_numbers) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                      {raffle.status === "published" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyLink(raffle.id)}
                            className="flex-1 sm:flex-none h-8 sm:h-9 px-2 sm:px-3"
                          >
                            <Copy size={14} className="sm:hidden" />
                            <Copy size={16} className="hidden sm:block" />
                            <span className="ml-1 text-xs sm:text-sm">Copiar link</span>
                          </Button>
                          <Link to={`/rifa/${raffle.id}`} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                              <ExternalLink size={14} className="sm:hidden" />
                              <ExternalLink size={16} className="hidden sm:block" />
                            </Button>
                          </Link>
                        </>
                      )}
                      {raffle.status === "pending_payment" && (
                        <Link to="/pagamento-taxa">
                          <Button size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                            Pagar taxa
                          </Button>
                        </Link>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-9 sm:w-9"
                          >
                            <Trash2 size={14} className="sm:hidden" />
                            <Trash2 size={18} className="hidden sm:block" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir rifa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A rifa "{raffle.name}" será permanentemente removida.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(raffle.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MinhasRifas;
