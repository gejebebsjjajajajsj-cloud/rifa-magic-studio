import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Menu,
  MessageCircle,
  Gift,
  Search,
  Ticket,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Raffle {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  end_date: string | null;
  total_numbers: number;
  price_per_number: number;
  image_url: string | null;
  banner_url: string | null;
  primary_color: string | null;
  numbers_sold: number;
}

const RifasPublicas = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRaffles = async () => {
      const { data, error } = await supabase
        .from("raffles")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (data) {
        setRaffles(data);
      }
      setLoading(false);
    };

    fetchRaffles();
  }, []);

  const filteredRaffles = raffles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 px-3 py-2 flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800 h-8 w-8">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-zinc-900 border-zinc-800">
            <SheetHeader>
              <SheetTitle className="text-left text-white text-base">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800 text-sm h-9">
                Início
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800 text-sm h-9">
                Meus títulos
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800 text-sm h-9">
                Como funciona
              </Button>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-1">
          <Gift size={18} className="text-emerald-400" />
          <span className="font-bold text-sm">RifasPro</span>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-zinc-800 gap-1 h-8 px-2"
        >
          <MessageCircle size={16} />
          <span className="text-xs hidden xs:inline">Suporte</span>
        </Button>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-emerald-900/30 to-zinc-950 px-3 py-6">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-xl font-black mb-1">
            🎉 Rifas Disponíveis
          </h1>
          <p className="text-zinc-400 text-xs mb-4">
            Escolha sua rifa e concorra a prêmios incríveis!
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input
              placeholder="Buscar rifas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-3 pb-20 max-w-lg mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-2 text-center">
              <Ticket size={16} className="mx-auto mb-0.5 text-emerald-400" />
              <p className="text-base font-bold text-white">{raffles.length}</p>
              <p className="text-[9px] text-zinc-500 uppercase">Rifas Ativas</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-2 text-center">
              <Gift size={16} className="mx-auto mb-0.5 text-purple-400" />
              <p className="text-base font-bold text-white">
                {raffles.reduce((acc, r) => acc + r.total_numbers - r.numbers_sold, 0)}
              </p>
              <p className="text-[9px] text-zinc-500 uppercase">Números Livres</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-2 text-center">
              <TrendingUp size={16} className="mx-auto mb-0.5 text-yellow-400" />
              <p className="text-base font-bold text-white">
                {raffles.reduce((acc, r) => acc + r.numbers_sold, 0)}
              </p>
              <p className="text-[9px] text-zinc-500 uppercase">Vendidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Raffles List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-zinc-400 text-sm">Carregando rifas...</div>
          </div>
        ) : filteredRaffles.length === 0 ? (
          <div className="text-center py-8">
            <Gift size={40} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm">
              {search ? "Nenhuma rifa encontrada" : "Nenhuma rifa disponível no momento"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRaffles.map((raffle) => {
              const progress = (raffle.numbers_sold / raffle.total_numbers) * 100;
              const available = raffle.total_numbers - raffle.numbers_sold;

              return (
                <Link key={raffle.id} to={`/rifa/${raffle.id}`}>
                  <Card className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-zinc-600 transition-colors">
                    <div className="flex">
                      {/* Image */}
                      <div
                        className="w-24 h-24 flex-shrink-0 flex items-center justify-center"
                        style={{
                          backgroundColor: raffle.primary_color || "#10B981",
                        }}
                      >
                        {raffle.image_url ? (
                          <img
                            src={raffle.image_url}
                            alt={raffle.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Gift size={28} className="text-white/80" />
                        )}
                      </div>

                      {/* Content */}
                      <CardContent className="flex-1 p-2.5">
                        <h3 className="font-bold text-white text-sm line-clamp-1 mb-0.5">
                          {raffle.name}
                        </h3>
                        
                        {raffle.category && (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold text-white mb-1"
                            style={{ backgroundColor: raffle.primary_color || "#10B981" }}
                          >
                            {raffle.category}
                          </span>
                        )}

                        <p
                          className="text-base font-black mb-1"
                          style={{ color: raffle.primary_color || "#10B981" }}
                        >
                          R$ {raffle.price_per_number.toFixed(2).replace(".", ",")}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>{available} disponíveis</span>
                          {raffle.end_date && (
                            <span className="flex items-center gap-0.5">
                              <Calendar size={10} />
                              {new Date(raffle.end_date).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="mt-1.5 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: raffle.primary_color || "#10B981",
                            }}
                          />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default RifasPublicas;