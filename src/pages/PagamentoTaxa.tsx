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
      <div className="max-w-lg mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft size={18} />
          Voltar
        </Button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="h-20 w-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce-soft">
            <CreditCard size={36} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Pagamento da Taxa
          </h1>
          <p className="text-muted-foreground">
            Finalize o pagamento para publicar sua rifa
          </p>
        </div>

        <Card className="mb-6 animate-fade-in stagger-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-muted-foreground">Taxa de publicação</span>
              <span className="text-3xl font-bold text-gradient">{taxaValue}</span>
            </div>

            <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center mb-6">
              <QrCode size={120} className="mx-auto text-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Escaneie o QR Code com seu app de banco
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Ou copie o código Pix:</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted rounded-xl p-3 text-sm text-muted-foreground font-mono truncate">
                  {pixCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPix}
                  className="flex-shrink-0"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-soft border-0 mb-6 animate-fade-in stagger-2">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium">
                Pagamento rápido e seguro
              </p>
              <p className="text-xs text-muted-foreground">
                Após o pagamento, sua rifa será publicada automaticamente em até 5 minutos.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          size="xl"
          className="w-full animate-fade-in stagger-3"
          onClick={handleConfirmPayment}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Verificando pagamento...
            </>
          ) : (
            <>
              <Check size={20} />
              Já paguei
            </>
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default PagamentoTaxa;
