import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface MercadoPagoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentToken: string;
  onSave: (token: string) => Promise<void>;
  connectionStatus: "idle" | "success" | "error";
}

export const MercadoPagoModal = ({
  open,
  onOpenChange,
  currentToken,
  onSave,
  connectionStatus: initialStatus,
}: MercadoPagoModalProps) => {
  const [token, setToken] = useState(currentToken);
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!token) {
      toast({
        title: "Token não informado",
        description: "Insira seu Access Token para testar.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setStatus("idle");

    try {
      const response = await fetch(
        "https://api.mercadopago.com/v1/payment_methods",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setStatus("success");
        toast({
          title: "Conexão estabelecida!",
          description: "Token válido e funcionando.",
        });
      } else {
        setStatus("error");
        toast({
          title: "Token inválido",
          description: "Verifique se o Access Token está correto.",
          variant: "destructive",
        });
      }
    } catch {
      setStatus("error");
      toast({
        title: "Erro na conexão",
        description: "Não foi possível testar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(token);
      onOpenChange(false);
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o token.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-left">Conectar Mercado Pago</DialogTitle>
              <DialogDescription className="text-left">
                Receba pagamentos direto na sua conta
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          {status === "success" && (
            <div className="flex items-center gap-2 p-3 bg-mint/30 rounded-lg text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Conta conectada com sucesso!</span>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">Token inválido</span>
            </div>
          )}

          {/* Token Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Access Token</label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="APP_USR-xxxxxxxxxx"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setStatus("idle");
                }}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Help Link */}
          <a
            href="https://www.mercadopago.com.br/developers/panel/app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink size={14} />
            Onde encontro meu Access Token?
          </a>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
            <p className="font-medium">Como obter:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Acesse o Painel de Desenvolvedores</li>
              <li>Crie ou selecione uma aplicação</li>
              <li>Vá em "Credenciais de produção"</li>
              <li>Copie o Access Token</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !token}
              className="flex-1"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {testing ? "Testando..." : "Testar"}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
