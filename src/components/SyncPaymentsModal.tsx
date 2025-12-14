import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SyncPaymentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentClientId: string;
  currentClientSecret: string;
  onSave: (clientId: string, clientSecret: string) => Promise<void>;
  connectionStatus: 'idle' | 'success' | 'error';
}

export const SyncPaymentsModal = ({
  open,
  onOpenChange,
  currentClientId,
  currentClientSecret,
  onSave,
  connectionStatus,
}: SyncPaymentsModalProps) => {
  const [clientId, setClientId] = useState(currentClientId);
  const [clientSecret, setClientSecret] = useState(currentClientSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>(connectionStatus);

  useEffect(() => {
    setClientId(currentClientId);
    setClientSecret(currentClientSecret);
    setStatus(connectionStatus);
  }, [currentClientId, currentClientSecret, connectionStatus, open]);

  const handleTest = async () => {
    if (!clientId || !clientSecret) return;
    
    setTesting(true);
    setStatus('idle');
    
    try {
      const response = await fetch("https://api.syncpayments.com.br/api/partner/v1/auth-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(clientId, clientSecret);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">SP</span>
            </div>
            Conectar SyncPayments
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Conecte sua conta SyncPayments para receber pagamentos das vendas de rifas.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium">Client ID</label>
            <Input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Seu Client ID"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Client Secret</label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Seu Client Secret"
                className="h-9 text-sm pr-9"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {status !== 'idle' && (
            <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
              status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {status === 'success' ? (
                <>
                  <CheckCircle size={14} />
                  <span>Credenciais válidas!</span>
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  <span>Credenciais inválidas</span>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={!clientId || !clientSecret || testing}
              className="flex-1"
            >
              {testing ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Testar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!clientId || !clientSecret || saving}
              className="flex-1"
            >
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Encontre suas credenciais no painel da SyncPayments
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
