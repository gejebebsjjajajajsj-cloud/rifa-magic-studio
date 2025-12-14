import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, CreditCard, Copy, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const PagamentoTaxa = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pixCode, setPixCode] = useState("");
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

      if (raffle.status === "published") {
        toast({
          title: "Rifa já publicada",
          description: "Esta rifa já está ativa!",
        });
        navigate("/rifas");
        return;
      }

      setRaffleName(raffle.name);

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
      } catch (err) {
        console.error("Error generating payment:", err);
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
        <div className="w-full max-w-xs mx-auto px-4 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 size={28} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Gerando pagamento...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-xs mx-auto px-2 pb-6 overflow-x-hidden">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-3 h-8 px-2 text-sm"
          size="sm"
        >
          <ArrowLeft size={14} />
          Voltar
        </Button>

        <div className="text-center mb-4">
          <div className="h-12 w-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-2">
            <CreditCard size={20} className="text-primary-foreground" />
          </div>
          <h1 className="text-base font-bold text-foreground mb-0.5">
            Pagamento da Taxa
          </h1>
          <p className="text-xs text-muted-foreground">
            Pague para publicar: <span className="font-medium">{raffleName}</span>
          </p>
        </div>

        <Card className="mb-3">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">Taxa de publicação</span>
              <span className="text-xl font-bold text-gradient">{taxaValue}</span>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-3 text-center mb-3">
              {pixCode ? (
                <>
                  <div className="flex justify-center mb-2">
                    <QRCodeSVG
                      value={pixCode}
                      size={140}
                      level="M"
                      includeMargin={false}
                      className="rounded"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Escaneie o QR Code com seu app de banco
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground py-8">
                  Gerando QR Code...
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-foreground">Ou copie o código Pix:</p>
              <div className="flex gap-1.5">
                <div className="flex-1 bg-muted rounded-md p-2 text-[10px] text-muted-foreground font-mono truncate overflow-hidden">
                  {pixCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPix}
                  className="flex-shrink-0 h-8 w-8"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-soft border-0 mb-3">
          <CardContent className="p-2.5 flex items-start gap-2">
            <Sparkles size={14} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-foreground font-medium">
                Pagamento rápido e seguro
              </p>
              <p className="text-[10px] text-muted-foreground">
                Após o pagamento, sua rifa será publicada.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          size="default"
          className="w-full h-10 text-sm"
          onClick={handleConfirmPayment}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Check size={16} />
              Já paguei
            </>
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default PagamentoTaxa;
