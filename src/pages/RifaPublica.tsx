import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  Copy,
  Loader2,
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
import { QRCodeSVG } from "qrcode.react";

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
  numbers_sold: number;
  user_id: string;
}

interface Purchase {
  numbers_purchased: number[];
  buyer_name: string;
}

interface PrizeNumber {
  id: string;
  prize_value: number;
  quantity: number;
  numbers: number[];
}

type CheckoutStep = "form" | "payment" | "success";

const quickOptions = [
  { quantity: 10, label: "+10" },
  { quantity: 25, label: "+25", popular: true },
  { quantity: 50, label: "+50" },
  { quantity: 100, label: "+100" },
];

const RifaPublica = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [confirmedPurchases, setConfirmedPurchases] = useState<Purchase[]>([]);
  const [quantity, setQuantity] = useState(25);
  const [showDescription, setShowDescription] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [showMorePremium, setShowMorePremium] = useState(false);
  const [prizeNumbers, setPrizeNumbers] = useState<PrizeNumber[]>([]);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  // Checkout state
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("form");
  const [pixCode, setPixCode] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [currentPurchaseId, setCurrentPurchaseId] = useState("");
  const [copied, setCopied] = useState(false);

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

      // Check if owner has payment method configured
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("mercado_pago_access_token, syncpayments_client_id, syncpayments_client_secret")
        .eq("user_id", raffleData.user_id)
        .single();

      if (ownerProfile) {
        const hasMp = !!ownerProfile.mercado_pago_access_token;
        const hasSp = !!(ownerProfile as any).syncpayments_client_id && !!(ownerProfile as any).syncpayments_client_secret;
        setHasPaymentMethod(hasMp || hasSp);
      }

      // Fetch purchases
      const { data: purchases } = await supabase
        .from("raffle_purchases")
        .select("numbers_purchased, buyer_name")
        .eq("raffle_id", id)
        .eq("payment_status", "confirmed");

      if (purchases) {
        setConfirmedPurchases(purchases as Purchase[]);
        const allSold = purchases.flatMap((p: Purchase) => p.numbers_purchased);
        setSoldNumbers(allSold);
      }

      // Fetch prize numbers
      const { data: prizes } = await supabase
        .from("prize_numbers")
        .select("*")
        .eq("raffle_id", id);

      if (prizes) {
        setPrizeNumbers(prizes.map(p => ({
          id: p.id,
          prize_value: Number(p.prize_value),
          quantity: p.quantity,
          numbers: p.numbers || [],
        })));
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
            .select("numbers_purchased, buyer_name")
            .eq("raffle_id", id)
            .eq("payment_status", "confirmed");

          if (purchases) {
            setConfirmedPurchases(purchases as Purchase[]);
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

    if (!hasPaymentMethod) {
      toast({
        title: "Pagamento indisponível",
        description: "O organizador ainda não configurou um meio de pagamento",
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

    // Create purchase record
    const { data: purchaseData, error } = await supabase.from("raffle_purchases").insert({
      raffle_id: raffle.id,
      buyer_name: buyerName,
      buyer_email: buyerEmail.toLowerCase().trim(),
      buyer_phone: buyerPhone,
      numbers_purchased: selectedNumbers,
      quantity,
      total_amount: totalAmount,
      payment_status: "pending",
    }).select().single();

    if (error || !purchaseData) {
      toast({
        title: "Erro ao reservar números",
        description: "Tente novamente",
        variant: "destructive",
      });
      setPurchasing(false);
      return;
    }

    setCurrentPurchaseId(purchaseData.id);

    // Generate real payment
    try {
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "create-raffle-payment",
        { body: { purchase_id: purchaseData.id } }
      );

      if (paymentError) throw paymentError;

      if (paymentData?.success && paymentData?.payment) {
        setPixCode(paymentData.payment.pix_code || "");
        setQrCodeImage(paymentData.payment.qr_code || "");
        setCheckoutStep("payment");
      } else {
        throw new Error(paymentData?.error || "Erro ao gerar pagamento");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: "Erro ao gerar pagamento",
        description: err.message || "Tente novamente",
        variant: "destructive",
      });
      // Delete the pending purchase
      await supabase.from("raffle_purchases").delete().eq("id", purchaseData.id);
    }

    setPurchasing(false);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({ title: "Código copiado!", description: "Cole no seu app de banco" });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCloseDialog = () => {
    setShowPurchaseDialog(false);
    setCheckoutStep("form");
    setPixCode("");
    setQrCodeImage("");
    setCurrentPurchaseId("");
    setBuyerName("");
    setBuyerEmail("");
    setBuyerPhone("");
    setQuantity(25);
  };

  const primaryColor = raffle?.primary_color || "#10B981";
  const buttonColor = raffle?.button_color || "#10B981";
  const totalAmount = quantity * (raffle?.price_per_number || 0);
  const availableCount = raffle ? raffle.total_numbers - soldNumbers.length : 0;

  // Generate prize number display from database
  const buyerByNumber: Record<number, string> = {};
  confirmedPurchases.forEach((purchase) => {
    purchase.numbers_purchased.forEach((num) => {
      if (!buyerByNumber[num]) {
        buyerByNumber[num] = purchase.buyer_name;
      }
    });
  });

  const allPrizeItems = prizeNumbers.flatMap(pn => {
    const items = [];
    for (let i = 0; i < pn.quantity; i++) {
      const prizeNum = pn.numbers[i];
      const isSold = prizeNum ? soldNumbers.includes(prizeNum) : false;
      const winnerName = prizeNum ? buyerByNumber[prizeNum] : undefined;
      items.push({
        number: prizeNum ? String(prizeNum).padStart(3, "0") : "---",
        prize: `R$ ${pn.prize_value.toFixed(2).replace(".", ",")}`,
        status: isSold ? "sold" : "available",
        winnerName,
      });
    }
    return items;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-pulse text-zinc-400 text-sm">Carregando...</div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
        <Gift size={48} className="text-zinc-600 mb-3" />
        <h1 className="text-lg font-bold text-white mb-1">Rifa não encontrada</h1>
        <p className="text-zinc-400 text-center text-sm">
          Esta rifa não existe ou não está disponível
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 px-3 py-2 flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800 h-8 w-8">
              <Menu size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-zinc-900 border-zinc-800">
            <SheetHeader>
              <SheetTitle className="text-left text-white text-sm">Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800 text-sm h-8">
                Início
              </Button>
              <Link to="/meus-numeros">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800 text-sm h-8">
                  Meus títulos
                </Button>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-1.5">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: primaryColor }}
          >
            {raffle.name.charAt(0)}
          </div>
          <span className="font-semibold text-xs truncate max-w-[100px]">{raffle.name}</span>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-zinc-800 gap-1 h-8 px-2"
        >
          <MessageCircle size={14} />
          <span className="text-[10px]">Suporte</span>
        </Button>
      </header>

      {/* Banner */}
      <div className="relative">
        {raffle.banner_url ? (
          <div className="relative h-36 overflow-hidden">
            <img src={raffle.banner_url} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>
        ) : (
          <div
            className="h-36 flex items-center justify-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}10 100%)` }}
          >
            {raffle.image_url ? (
              <img src={raffle.image_url} alt={raffle.name} className="w-full h-full object-cover" />
            ) : (
              <Gift size={48} className="text-zinc-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          </div>
        )}
        
        <div className="absolute bottom-2 left-3 right-3">
          <h1 className="text-lg font-black text-white drop-shadow-lg uppercase tracking-tight">
            {raffle.name}
          </h1>
          {raffle.category && (
            <span 
              className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {raffle.category}
            </span>
          )}
        </div>
      </div>

      <main className="px-3 pb-24 max-w-md mx-auto">
        {/* Price */}
        <div className="text-center py-4">
          <p className="text-zinc-400 text-xs">Adquira já seu bilhete por apenas</p>
          <p 
            className="text-3xl font-black mt-0.5"
            style={{ color: primaryColor }}
          >
            R$ {raffle.price_per_number.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* Motivational */}
        <Card className="bg-zinc-900 border-zinc-800 mb-4">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="text-yellow-400" size={14} fill="currentColor" />
              <Star className="text-yellow-400" size={14} fill="currentColor" />
              <Star className="text-yellow-400" size={14} fill="currentColor" />
            </div>
            <p className="text-white font-semibold text-sm">
              Quanto mais títulos, mais chances de ganhar!
            </p>
          </CardContent>
        </Card>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {quickOptions.map((option) => (
            <button
              key={option.quantity}
              onClick={() => setQuantity(Math.min(quantity + option.quantity, availableCount))}
              disabled={quantity + option.quantity > availableCount}
              className={`relative p-2.5 rounded-xl text-center font-bold transition-all border-2 bg-zinc-900 border-zinc-700 hover:border-zinc-600 ${quantity + option.quantity > availableCount ? "opacity-40 cursor-not-allowed" : ""}`}
              style={{
                borderColor: primaryColor,
              }}
            >
              {option.popular && (
                <span 
                  className="absolute -top-1.5 right-0.5 text-[8px] px-1 py-0.5 rounded-full font-bold text-white"
                  style={{ backgroundColor: "#10B981" }}
                >
                  TOP
                </span>
              )}
              <span className="text-base text-white block">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Manual Selector */}
        <Card className="bg-zinc-900 border-zinc-800 mb-4">
          <CardContent className="p-3">
            <p className="text-center text-xs text-zinc-400 mb-2">Ou escolha a quantidade:</p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 5))}
                disabled={quantity <= 1}
                className="h-9 w-9 rounded-lg bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <Minus size={16} />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.min(Math.max(1, val), availableCount));
                }}
                className="w-20 h-9 text-center text-lg font-bold bg-zinc-800 border-zinc-700 text-white"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(availableCount, quantity + 5))}
                disabled={quantity >= availableCount}
                className="h-9 w-9 rounded-lg bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                <Plus size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Description Accordion */}
        <Card className="bg-zinc-900 border-zinc-800 mb-4">
          <CardContent className="p-0">
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="w-full p-3 flex items-center justify-between text-left"
            >
              <span className="font-semibold text-white text-sm">Descrição / Regulamento</span>
              {showDescription ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
            </button>
            {showDescription && (
              <div className="px-3 pb-3 text-xs text-zinc-400 whitespace-pre-wrap border-t border-zinc-800 pt-3">
                {raffle.description || "Sem descrição disponível."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prize Numbers Section */}
        {prizeNumbers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Trophy className="text-yellow-400" size={18} />
              <h3 className="text-sm font-bold text-white">Títulos premiados</h3>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-2 text-center">
                  <Ticket size={14} className="mx-auto mb-0.5 text-zinc-400" />
                  <p className="text-sm font-bold text-white">{raffle.total_numbers}</p>
                  <p className="text-[8px] text-zinc-500 uppercase">Total</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-2 text-center">
                  <Check size={14} className="mx-auto mb-0.5 text-emerald-400" />
                  <p className="text-sm font-bold text-emerald-400">{availableCount}</p>
                  <p className="text-[8px] text-zinc-500 uppercase">Disponíveis</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-2 text-center">
                  <X size={14} className="mx-auto mb-0.5 text-red-400" />
                  <p className="text-sm font-bold text-red-400">{soldNumbers.length}</p>
                  <p className="text-[8px] text-zinc-500 uppercase">Vendidos</p>
                </CardContent>
              </Card>
            </div>

            {/* Prize List */}
            {allPrizeItems.length > 0 ? (
              <div className="space-y-1.5">
                {allPrizeItems.slice(0, showMorePremium ? undefined : 3).map((item, index) => (
                  <Card key={index} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-2 flex items-center justify-between">
                      <div>
                        <p className="text-white font-mono font-bold text-xs">{item.number}</p>
                        <p className="text-[10px] text-zinc-400">{item.prize}</p>
                        {item.winnerName && (
                          <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                            {item.winnerName}
                          </p>
                        )}
                      </div>
                      <span 
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                
                {allPrizeItems.length > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMorePremium(!showMorePremium)}
                    className="w-full mt-2 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-8 text-xs"
                  >
                    {showMorePremium ? "Ver menos" : `Ver mais (${allPrizeItems.length - 3})`}
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-3">
                Nenhum número premiado configurado
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-4 text-center">
          <p className="text-[10px] text-zinc-500">
            Ao participar, você concorda com os termos e regulamento.
          </p>
          <div className="flex justify-center gap-3 mt-2">
            <button className="text-[10px] text-zinc-400 hover:text-white underline">Termos</button>
            <button className="text-[10px] text-zinc-400 hover:text-white underline">Regulamento</button>
          </div>
        </div>
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-zinc-950/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-md mx-auto">
          {hasPaymentMethod ? (
            <Button
              onClick={() => setShowPurchaseDialog(true)}
              className="w-full h-11 text-base font-bold rounded-xl text-white shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
              style={{ backgroundColor: buttonColor }}
            >
              Participar – R$ {totalAmount.toFixed(2).replace(".", ",")}
              <ArrowRight size={16} />
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-xs text-red-400 mb-1">Pagamento não configurado</p>
              <Button
                disabled
                className="w-full h-11 text-base font-bold rounded-xl opacity-50"
              >
                Indisponível
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-sm bg-zinc-900 border-zinc-800 text-white p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-sm sm:text-base">
              {checkoutStep === "form" && "Finalizar compra"}
              {checkoutStep === "payment" && "Pague via PIX"}
              {checkoutStep === "success" && "Pagamento confirmado!"}
            </DialogTitle>
          </DialogHeader>

          {checkoutStep === "form" && (
            <div className="space-y-3 pt-2">
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-400">Você está adquirindo</p>
                <p className="text-xl font-bold text-white">{quantity} títulos</p>
                <p className="text-base font-bold" style={{ color: primaryColor }}>
                  R$ {totalAmount.toFixed(2).replace(".", ",")}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Nome completo *</label>
                  <Input
                    placeholder="Seu nome"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="h-9 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Email *</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="h-9 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Telefone (opcional)</label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="h-9 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full h-10 text-sm font-bold rounded-lg text-white"
                style={{ backgroundColor: buttonColor }}
              >
                {purchasing ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Gerando pagamento...
                  </>
                ) : (
                  "Confirmar e pagar"
                )}
              </Button>
            </div>
          )}

          {checkoutStep === "payment" && (
            <div className="space-y-3 pt-2">
              <div className="bg-zinc-800 rounded-lg p-2 sm:p-3 text-center">
                <p className="text-[10px] sm:text-xs text-zinc-400 mb-0.5">Valor a pagar</p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: primaryColor }}>
                  R$ {totalAmount.toFixed(2).replace(".", ",")}
                </p>
              </div>

              {/* QR Code - sempre gera via SVG se tiver pixCode */}
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-3 text-center">
                {pixCode ? (
                  <>
                    {qrCodeImage ? (
                      <img src={qrCodeImage} alt="QR Code PIX" className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded" />
                    ) : (
                      <QRCodeSVG value={pixCode} size={140} level="M" className="mx-auto" />
                    )}
                  </>
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-zinc-800 rounded flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-500" />
                  </div>
                )}
                <p className="text-[9px] sm:text-[10px] text-zinc-500 mt-2">
                  Escaneie o QR Code com o app do seu banco
                </p>
              </div>

              {/* PIX Code Copy */}
              <div className="space-y-1">
                <p className="text-[9px] sm:text-[10px] font-medium text-zinc-400">Ou copie o código PIX:</p>
                <div className="flex gap-1.5">
                  <div className="flex-1 bg-zinc-800 rounded-md p-1.5 sm:p-2 text-[8px] sm:text-[10px] text-zinc-400 font-mono truncate overflow-hidden max-w-[calc(100%-40px)]">
                    {pixCode}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPix}
                    className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 bg-zinc-800 border-zinc-700"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </Button>
                </div>
              </div>

              <p className="text-[9px] sm:text-[10px] text-zinc-500 text-center">
                Após o pagamento, seus números serão confirmados automaticamente.
                <br />
                <Link to="/meus-numeros" className="text-emerald-400 underline">
                  Consulte seus números aqui
                </Link>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RifaPublica;
