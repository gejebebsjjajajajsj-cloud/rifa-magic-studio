import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, CreditCard, Copy, QrCode, ArrowLeft, Sparkles } from "lucide-react";

const PagamentoTaxa = () => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const taxaValue = "R$ 9,90";
  const pixCode = "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "Cole no seu app de banco para pagar.",
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirmPayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Pagamento confirmado! 🎉",
        description: "Sua rifa foi publicada com sucesso!",
      });
      navigate("/rifas");
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto px-1">
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
            Finalize o pagamento para publicar sua rifa
          </p>
        </div>

        <Card className="mb-4 animate-fade-in stagger-1">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Taxa de publicação</span>
              <span className="text-2xl sm:text-3xl font-bold text-gradient">{taxaValue}</span>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center mb-4">
              <QrCode size={80} className="mx-auto text-foreground mb-2 sm:hidden" />
              <QrCode size={100} className="mx-auto text-foreground mb-3 hidden sm:block" />
              <p className="text-xs text-muted-foreground">
                Escaneie o QR Code com seu app de banco
              </p>
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
                Após o pagamento, sua rifa será publicada em até 5 minutos.
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
              <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
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
