import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MercadoPagoModal } from "@/components/MercadoPagoModal";
import { 
  User, 
  Mail, 
  CreditCard, 
  Save,
  MessageCircle,
  CheckCircle,
  Loader2
} from "lucide-react";

const Configuracoes = () => {
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mercadoPagoModalOpen, setMercadoPagoModalOpen] = useState(false);
  const [mpConnectionStatus, setMpConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    supportPhone: "",
    mercadoPagoToken: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          setProfile({
            name: data.name || user.user_metadata?.name || "",
            email: data.email || user.email || "",
            supportPhone: data.support_phone || "",
            mercadoPagoToken: data.mercado_pago_access_token || "",
          });
          if (data.mercado_pago_access_token) {
            setMpConnectionStatus('success');
          }
        } else {
          setProfile({
            name: user.user_metadata?.name || "",
            email: user.email || "",
            supportPhone: "",
            mercadoPagoToken: "",
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: profile.name,
          email: profile.email,
          support_phone: profile.supportPhone,
          mercado_pago_access_token: profile.mercadoPagoToken,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMercadoPagoToken = async (token: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        mercado_pago_access_token: token,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    setProfile({ ...profile, mercadoPagoToken: token });
    setMpConnectionStatus(token ? 'success' : 'idle');
    
    toast({
      title: "Token salvo!",
      description: "Mercado Pago conectado com sucesso.",
    });
  };

  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-lg">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-foreground">Configurações</h1>
          <p className="text-xs text-muted-foreground">Gerencie sua conta</p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User size={16} />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 gradient-primary rounded-xl flex items-center justify-center text-lg font-bold text-primary-foreground">
                {profile.name.charAt(0) || "?"}
              </div>
              <div>
                <h3 className="font-medium text-sm text-foreground">{profile.name || "Seu nome"}</h3>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">WhatsApp de Suporte</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={profile.supportPhone}
                    onChange={(e) => setProfile({ ...profile, supportPhone: e.target.value })}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={loading} size="sm" className="w-full">
                <Save size={14} />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Integrations */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-1">Integrações de Pagamento</p>
          
          {/* Mercado Pago */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#00A1E4] rounded-xl flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground">Mercado Pago</h3>
                    <p className="text-xs text-muted-foreground">
                      {mpConnectionStatus === 'success' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={12} /> Conectado
                        </span>
                      ) : (
                        "Receba pagamentos via PIX"
                      )}
                    </p>
                  </div>
                </div>
                <Button 
                  variant={mpConnectionStatus === 'success' ? "outline" : "default"}
                  size="sm"
                  onClick={() => setMercadoPagoModalOpen(true)}
                >
                  {mpConnectionStatus === 'success' ? "Gerenciar" : "Conectar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <MercadoPagoModal
          open={mercadoPagoModalOpen}
          onOpenChange={setMercadoPagoModalOpen}
          currentToken={profile.mercadoPagoToken}
          onSave={handleSaveMercadoPagoToken}
          connectionStatus={mpConnectionStatus}
        />
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
