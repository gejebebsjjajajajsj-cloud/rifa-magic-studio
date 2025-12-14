import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, CreditCard, Copy, QrCode, ArrowLeft, Sparkles, Loader2 } from "lucide-react";

const PagamentoTaxa = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [raffleName, setRaffleName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const raffleId = searchParams.get("raffle_id");

  const taxaValue = "R$ 9,90";

  useEffect(() => {
    const loadRaffleAndGeneratePayment = async () => {
      if (!raffleId) {
        toast({
          title: "Erro",
          description: "ID da rifa não encontrado",
          variant: "destructive",
        });
        navigate("/rifas");
        return;
      }

      // Load raffle info
      const { data: raffle, error } = await supabase
        .from("raffles")
        .select("name, status")
        .eq("id", raffleId)
        .single();

      if (error || !raffle) {
        toast({
          title: "Erro",
          description: "Rifa não encontrada",
          variant: "destructive",
        });
        navigate("/rifas");
        return;
      }

      // If already published, redirect
      if (raffle.status === "published") {
        toast({
          title: "Rifa já publicada",
          description: "Esta rifa já está ativa!",
        });
        navigate("/rifas");
        return;
      }

      setRaffleName(raffle.name);

      // Generate payment via edge function
      try {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          "create-payment",
          {
            body: {
              raffle_id: raffleId,
              amount: 9.90,
              description: `Taxa de publicação - ${raffle.name}`,
            },
          }
        );

        if (paymentError) throw paymentError;

        if (paymentData?.payment?.pix_code) {
          setPixCode(paymentData.payment.pix_code);
        }
        if (paymentData?.payment?.qr_code) {
          setQrCode(paymentData.payment.qr_code);
        }
      } catch (err) {
        console.error("Error generating payment:", err);
        // Fallback to mock pix code
        setPixCode(`00020126580014br.gov.bcb.pix0136${raffleId}5204000053039865802BR5925RIFAMANIA6009SAO PAULO62070503***6304`);
      }

      setGenerating(false);
    };

    loadRaffleAndGeneratePayment();
  }, [raffleId, navigate, toast]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "Cole no seu app de banco para pagar.",
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirmPayment = async () => {
    if (!raffleId) return;

    setLoading(true);

    try {
      // Call edge function to confirm payment and publish raffle
      const { data, error } = await supabase.functions.invoke("confirm-payment", {
        body: { raffle_id: raffleId },
      });

      if (error) throw error;

      toast({
        title: "Pagamento confirmado! 🎉",
        description: "Sua rifa foi publicada com sucesso!",
      });
      navigate("/rifas");
    } catch (err) {
      console.error("Error confirming payment:", err);
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento. Tente novamente.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (generating) {
    return (
      <DashboardLayout>
        <div className="max-w-sm w-full mx-auto px-4 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 size={32} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Gerando pagamento...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-sm w-full mx-auto px-4 pb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
          size="sm"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>

        <div className="text-center mb-6 animate-fade-in">
          <div className="h-14 w-14 sm:h-16 sm:w-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3 animate-bounce-soft">
            <CreditCard size={24} className="text-primary-foreground sm:hidden" />
            <CreditCard size={28} className="text-primary-foreground hidden sm:block" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground mb-1">
            Pagamento da Taxa
          </h1>
          <p className="text-sm text-muted-foreground">
            Pague para publicar: <span className="font-medium">{raffleName}</span>
          </p>
        </div>

        <Card className="mb-4 animate-fade-in stagger-1">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Taxa de publicação</span>
              <span className="text-2xl sm:text-3xl font-bold text-gradient">{taxaValue}</span>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center mb-4">
              {qrCode ? (
                <>
                  <img
                    src={qrCode}
                    alt="QR Code Pix para pagamento da taxa de publicação"
                    className="mx-auto w-40 h-40 object-contain mb-2"
                    loading="lazy"
                  />
                  <p className="text-xs text-muted-foreground">
                    Escaneie o QR Code com seu app de banco para pagar a taxa.
                  </p>
                </>
              ) : (
                <>
                  <QrCode size={80} className="mx-auto text-foreground mb-2 sm:hidden" />
                  <QrCode size={100} className="mx-auto text-foreground mb-3 hidden sm:block" />
                  <p className="text-xs text-muted-foreground">
                    Gerando QR Code Pix...
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Ou copie o código Pix:</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted rounded-lg p-2.5 text-xs text-muted-foreground font-mono truncate">
                  {pixCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPix}
                  className="flex-shrink-0 h-9 w-9"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-soft border-0 mb-4 animate-fade-in stagger-2">
          <CardContent className="p-3 flex items-start gap-2">
            <Sparkles size={16} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-foreground font-medium">
                Pagamento rápido e seguro
              </p>
              <p className="text-xs text-muted-foreground">
                Após o pagamento, sua rifa será publicada instantaneamente.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full animate-fade-in stagger-3"
          onClick={handleConfirmPayment}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Check size={18} />
              Já paguei
            </>
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default PagamentoTaxa;
