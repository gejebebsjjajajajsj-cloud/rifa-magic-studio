import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Menu,
  MessageCircle,
  Minus,
  Plus,
  Gift,
  Ticket,
  Trophy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Check,
  X,
  Star,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  button_color: string | null;
  pix_key: string | null;
  numbers_sold: number;
}

interface Purchase {
  numbers_purchased: number[];
}

// Opções de seleção rápida como nos sites de rifa profissionais
const quickOptions = [
  { quantity: 70, label: "+70" },
  { quantity: 100, label: "+100", popular: true },
  { quantity: 200, label: "+200" },
  { quantity: 300, label: "+300" },
  { quantity: 500, label: "+500" },
  { quantity: 700, label: "+700" },
];

// Números premiados simulados (em produção viria do banco)
const premiumNumbers = [
  { number: "3730220", prize: "R$ 500,00", status: "available" },
  { number: "3730221", prize: "R$ 300,00", status: "sold" },
  { number: "3730222", prize: "R$ 200,00", status: "available" },
  { number: "3730223", prize: "R$ 100,00", status: "sold" },
  { number: "3730224", prize: "R$ 50,00", status: "available" },
];

const RifaPublica = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(100);
  const [showDescription, setShowDescription] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [showMorePremium, setShowMorePremium] = useState(false);

  useEffect(() => {
    const fetchRaffle = async () => {
      if (!id) return;

      const { data: raffleData, error: raffleError } = await supabase
        .from("raffles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (raffleError || !raffleData) {
        setLoading(false);
        return;
      }

      setRaffle(raffleData);

      const { data: purchases } = await supabase
        .from("raffle_purchases")
        .select("numbers_purchased")
        .eq("raffle_id", id)
        .eq("payment_status", "confirmed");

      if (purchases) {
        const allSold = purchases.flatMap((p: Purchase) => p.numbers_purchased);
        setSoldNumbers(allSold);
      }

      setLoading(false);
    };

    fetchRaffle();

    const channel = supabase
      .channel(`raffle-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "raffle_purchases",
          filter: `raffle_id=eq.${id}`,
        },
        async () => {
          const { data: purchases } = await supabase
            .from("raffle_purchases")
            .select("numbers_purchased")
            .eq("raffle_id", id)
            .eq("payment_status", "confirmed");

          if (purchases) {
            const allSold = purchases.flatMap((p: Purchase) => p.numbers_purchased);
            setSoldNumbers(allSold);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const getAvailableNumbers = () => {
    if (!raffle) return [];
    const available: number[] = [];
    for (let i = 1; i <= raffle.total_numbers; i++) {
      if (!soldNumbers.includes(i)) {
        available.push(i);
      }
    }
    return available;
  };

  const handlePurchase = async () => {
    if (!raffle || !buyerName || !buyerEmail) {
      toast({
        title: "Preencha todos os campos",
        description: "Nome e email são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const available = getAvailableNumbers();
    if (quantity > available.length) {
      toast({
        title: "Quantidade indisponível",
        description: `Apenas ${available.length} números disponíveis`,
        variant: "destructive",
      });
      return;
    }

    setPurchasing(true);

    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const selectedNumbers = shuffled.slice(0, quantity);
    const totalAmount = quantity * raffle.price_per_number;

    const { error } = await supabase.from("raffle_purchases").insert({
      raffle_id: raffle.id,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      numbers_purchased: selectedNumbers,
      quantity,
      total_amount: totalAmount,
      payment_status: "pending",
    });

    if (error) {
      toast({
        title: "Erro ao reservar números",
        description: "Tente novamente",
        variant: "destructive",
      });
      setPurchasing(false);
      return;
    }

    toast({
      title: "Números reservados!",
      description: `Seus números: ${selectedNumbers.slice(0, 5).join(", ")}${selectedNumbers.length > 5 ? "..." : ""}`,
    });

    setShowPurchaseDialog(false);
    setBuyerName("");
    setBuyerEmail("");
    setBuyerPhone("");
    setQuantity(100);
    setPurchasing(false);
  };

  const primaryColor = raffle?.primary_color || "#10B981";
  const buttonColor = raffle?.button_color || "#10B981";
  const totalAmount = quantity * (raffle?.price_per_number || 0);
  const availableCount = raffle ? raffle.total_numbers - soldNumbers.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-pulse text-zinc-400">Carregando...</div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
        <Gift size={64} className="text-zinc-600 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Rifa não encontrada</h1>
        <p className="text-zinc-400 text-center">
          Esta rifa não existe ou não está disponível
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-zinc-900 border-zinc-800">
            <SheetHeader>
              <SheetTitle className="text-left text-white">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 space-y-2">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800">
                Início
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800">
                Meus títulos
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800">
                Regulamento
              </Button>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {raffle.name.charAt(0)}
          </div>
          <span className="font-semibold text-sm truncate max-w-[120px]">{raffle.name}</span>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-zinc-800 gap-1"
        >
          <MessageCircle size={18} />
          <span className="text-xs">Suporte</span>
        </Button>
      </header>

      {/* Banner Principal */}
      <div className="relative">
        {raffle.banner_url ? (
          <div className="relative h-52 sm:h-72 overflow-hidden">
            <img
              src={raffle.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>
        ) : (
          <div
            className="h-52 sm:h-72 flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}10 100%)`,
            }}
          >
            {raffle.image_url ? (
              <img
                src={raffle.image_url}
                alt={raffle.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Gift size={80} className="text-zinc-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>
        )}
        
        {/* Título sobre o banner */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg uppercase tracking-tight">
            {raffle.name}
          </h1>
          {raffle.category && (
            <span 
              className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {raffle.category}
            </span>
          )}
        </div>
      </div>

      <main className="px-4 pb-32 max-w-lg mx-auto">
        {/* Chamada para ação */}
        <div className="text-center py-6">
          <p className="text-zinc-400 text-sm mb-1">Adquira já seu bilhete!</p>
          <p className="text-lg font-medium text-white">Por apenas</p>
          <p 
            className="text-4xl sm:text-5xl font-black mt-1"
            style={{ color: primaryColor }}
          >
            R$ {raffle.price_per_number.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* Card motivacional */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="text-yellow-400" size={18} fill="currentColor" />
              <Star className="text-yellow-400" size={18} fill="currentColor" />
              <Star className="text-yellow-400" size={18} fill="currentColor" />
            </div>
            <p className="text-white font-semibold">
              Quanto mais títulos, mais chances de ganhar!
            </p>
          </CardContent>
        </Card>

        {/* Seleção rápida de quantidade - Grid estilo site profissional */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickOptions.map((option) => (
            <button
              key={option.quantity}
              onClick={() => setQuantity(Math.min(option.quantity, availableCount))}
              disabled={option.quantity > availableCount}
              className={`relative p-4 rounded-2xl text-center font-bold transition-all border-2 ${
                quantity === option.quantity
                  ? "border-transparent scale-[1.02]"
                  : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
              } ${option.quantity > availableCount ? "opacity-40 cursor-not-allowed" : ""}`}
              style={{
                backgroundColor: quantity === option.quantity ? primaryColor : undefined,
                borderColor: quantity === option.quantity ? primaryColor : undefined,
              }}
            >
              {option.popular && (
                <span 
                  className="absolute -top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                  style={{ backgroundColor: "#10B981" }}
                >
                  MAIS POPULAR
                </span>
              )}
              <span className="text-xl text-white block">{option.label}</span>
              <span className="text-xs text-zinc-400 block mt-1">Selecionar</span>
            </button>
          ))}
        </div>

        {/* Seletor manual de quantidade */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-4">
            <p className="text-center text-sm text-zinc-400 mb-3">Ou escolha a quantidade:</p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 10))}
                disabled={quantity <= 1}
                className="h-12 w-12 rounded-xl bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <Minus size={20} />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.min(Math.max(1, val), availableCount));
                }}
                className="w-28 h-12 text-center text-2xl font-bold bg-zinc-800 border-zinc-700 text-white"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(availableCount, quantity + 10))}
                disabled={quantity >= availableCount}
                className="h-12 w-12 rounded-xl bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <Plus size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Accordion Descrição */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-0">
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <span className="font-semibold text-white">Descrição / Regulamento</span>
              {showDescription ? (
                <ChevronUp size={20} className="text-zinc-400" />
              ) : (
                <ChevronDown size={20} className="text-zinc-400" />
              )}
            </button>
            {showDescription && (
              <div className="px-4 pb-4 text-sm text-zinc-400 whitespace-pre-wrap border-t border-zinc-800 pt-4">
                {raffle.description || "Sem descrição disponível."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Títulos Premiados */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-yellow-400" size={24} />
            <h3 className="text-lg font-bold text-white">Títulos premiados</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Veja a lista de prêmios</p>

          {/* Stats dos títulos */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 text-center">
                <Ticket size={18} className="mx-auto mb-1 text-zinc-400" />
                <p className="text-lg font-bold text-white">{raffle.total_numbers}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Total</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 text-center">
                <Check size={18} className="mx-auto mb-1 text-emerald-400" />
                <p className="text-lg font-bold text-emerald-400">{availableCount}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Disponíveis</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-3 text-center">
                <X size={18} className="mx-auto mb-1 text-red-400" />
                <p className="text-lg font-bold text-red-400">{soldNumbers.length}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Sorteados</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de números premiados */}
          <div className="space-y-2">
            {premiumNumbers.slice(0, showMorePremium ? undefined : 3).map((item, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-mono font-bold">{item.number}</p>
                    <p className="text-sm text-zinc-400">{item.prize}</p>
                  </div>
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === "available" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {item.status === "available" ? "Disponível" : "Sorteado"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botão ver mais */}
          {premiumNumbers.length > 3 && (
            <Button
              variant="outline"
              onClick={() => setShowMorePremium(!showMorePremium)}
              className="w-full mt-4 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
            >
              {showMorePremium ? "Ver menos" : "Ver mais"}
            </Button>
          )}
        </div>

        {/* Rodapé */}
        <div className="border-t border-zinc-800 pt-6 text-center">
          <p className="text-xs text-zinc-500">
            Ao participar, você concorda com os termos e regulamento da rifa.
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <button className="text-xs text-zinc-400 hover:text-white underline">
              Termos de Uso
            </button>
            <button className="text-xs text-zinc-400 hover:text-white underline">
              Regulamento
            </button>
          </div>
        </div>
      </main>

      {/* Botão fixo de participar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={() => setShowPurchaseDialog(true)}
            className="w-full h-14 text-lg font-bold rounded-2xl text-white shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: buttonColor }}
          >
            Participar – R$ {totalAmount.toFixed(2).replace(".", ",")}
            <ArrowRight size={20} />
          </Button>
        </div>
      </div>

      {/* Dialog de compra */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Finalizar compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-zinc-800 rounded-xl p-4 text-center">
              <p className="text-sm text-zinc-400">Você está adquirindo</p>
              <p className="text-2xl font-bold text-white">{quantity} títulos</p>
              <p className="text-lg font-bold" style={{ color: primaryColor }}>
                R$ {totalAmount.toFixed(2).replace(".", ",")}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Nome completo *</label>
                <Input
                  placeholder="Seu nome"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Email *</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Telefone (opcional)</label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={purchasing}
              className="w-full h-12 text-lg font-bold rounded-xl text-white"
              style={{ backgroundColor: buttonColor }}
            >
              {purchasing ? "Processando..." : "Confirmar e pagar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RifaPublica;
