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
  Check,
  X,
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
  DialogTrigger,
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

const quickOptions = [
  { quantity: 50, label: "+50" },
  { quantity: 100, label: "+100", popular: true },
  { quantity: 200, label: "+200" },
  { quantity: 300, label: "+300" },
  { quantity: 500, label: "+500" },
];

const RifaPublica = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showDescription, setShowDescription] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const fetchRaffle = async () => {
      if (!id) return;

      const { data: raffleData, error: raffleError } = await supabase
        .from("raffles")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();

      if (raffleError || !raffleData) {
        setLoading(false);
        return;
      }

      setRaffle(raffleData);

      // Fetch sold numbers
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

    // Subscribe to realtime updates
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
          // Refetch sold numbers on any change
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

    // Select random available numbers
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
      description: `Seus números: ${selectedNumbers.join(", ")}`,
    });

    setShowPurchaseDialog(false);
    setBuyerName("");
    setBuyerEmail("");
    setBuyerPhone("");
    setQuantity(1);
    setPurchasing(false);
  };

  const primaryColor = raffle?.primary_color || "#EC4899";
  const buttonColor = raffle?.button_color || "#EC4899";
  const totalAmount = quantity * (raffle?.price_per_number || 0);
  const availableCount = raffle ? raffle.total_numbers - soldNumbers.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Gift size={64} className="text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Rifa não encontrada</h1>
        <p className="text-muted-foreground text-center">
          Esta rifa não existe ou não está disponível
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => setShowDescription(true)}>
                Descrição / Regulamento
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Títulos premiados
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Meus títulos
              </Button>
            </nav>
          </SheetContent>
        </Sheet>

        <h1 className="text-white font-bold text-lg truncate max-w-[200px]">{raffle.name}</h1>

        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
          <MessageCircle size={24} />
        </Button>
      </header>

      {/* Banner */}
      {raffle.banner_url ? (
        <div className="relative h-48 sm:h-64 bg-muted">
          <img
            src={raffle.banner_url}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 50%, ${primaryColor}40 100%)`,
            }}
          />
        </div>
      ) : (
        <div
          className="h-32 sm:h-48 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}20 100%)`,
          }}
        >
          <Gift size={48} className="text-muted-foreground" />
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 pb-32">
        {/* Prize Card */}
        <Card className="-mt-8 relative z-10 overflow-hidden shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              {raffle.image_url ? (
                <img
                  src={raffle.image_url}
                  alt={raffle.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Gift size={32} style={{ color: primaryColor }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 line-clamp-2">
                  {raffle.name}
                </h2>
                {raffle.category && (
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white mb-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {raffle.category}
                  </span>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {raffle.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Section */}
        <div className="text-center my-6">
          <p className="text-muted-foreground text-sm mb-1">Por apenas</p>
          <p className="text-3xl sm:text-4xl font-bold" style={{ color: primaryColor }}>
            R$ {raffle.price_per_number.toFixed(2)}
          </p>
          <p className="text-muted-foreground text-sm">por número</p>
        </div>

        {/* Quick Selection */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
          {quickOptions.map((option) => (
            <button
              key={option.quantity}
              onClick={() => setQuantity(Math.min(option.quantity, availableCount))}
              disabled={option.quantity > availableCount}
              className={`relative p-3 rounded-xl text-center font-bold transition-all ${
                quantity === option.quantity
                  ? "text-white scale-105 shadow-lg"
                  : "bg-muted text-foreground hover:scale-102"
              } ${option.quantity > availableCount ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{
                backgroundColor: quantity === option.quantity ? buttonColor : undefined,
              }}
            >
              {option.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-medium">
                  POPULAR
                </span>
              )}
              {option.label}
            </button>
          ))}
        </div>

        {/* Manual Quantity */}
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-12 w-12 rounded-xl"
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
              className="w-24 h-12 text-center text-xl font-bold"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.min(availableCount, quantity + 1))}
              disabled={quantity >= availableCount}
              className="h-12 w-12 rounded-xl"
            >
              <Plus size={20} />
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <Ticket size={20} className="mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-bold text-foreground">{raffle.total_numbers}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Check size={20} className="mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold text-foreground">{availableCount}</p>
              <p className="text-xs text-muted-foreground">Disponíveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Trophy size={20} className="mx-auto mb-1 text-yellow-500" />
              <p className="text-lg font-bold text-foreground">{soldNumbers.length}</p>
              <p className="text-xs text-muted-foreground">Vendidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Description Accordion */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <span className="font-semibold text-foreground">Descrição / Regulamento</span>
              {showDescription ? (
                <ChevronUp size={20} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={20} className="text-muted-foreground" />
              )}
            </button>
            {showDescription && (
              <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-wrap">
                {raffle.description || "Sem descrição disponível."}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Fixed CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
        <div className="max-w-2xl mx-auto">
          <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
            <DialogTrigger asChild>
              <Button
                className="w-full h-14 text-lg font-bold rounded-2xl text-white shadow-lg hover:scale-[1.02] transition-transform"
                style={{ backgroundColor: buttonColor }}
              >
                Participar – R$ {totalAmount.toFixed(2)}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Finalizar compra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome completo *</label>
                  <Input
                    placeholder="Seu nome"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone (opcional)</label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                  />
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Quantidade</span>
                      <span className="font-semibold">{quantity} números</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-xl font-bold" style={{ color: primaryColor }}>
                        R$ {totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full h-12 text-white font-bold"
                  style={{ backgroundColor: buttonColor }}
                >
                  {purchasing ? "Processando..." : "Confirmar e pagar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default RifaPublica;
