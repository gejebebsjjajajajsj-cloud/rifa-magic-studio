import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Mail, 
  Lock, 
  CreditCard, 
  Bell, 
  Save,
  Eye,
  EyeOff,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Configuracoes = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showMercadoPagoToken, setShowMercadoPagoToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    supportPhone: "",
    mercadoPagoToken: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sales: true,
    marketing: false,
  });

  // Load profile data
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
            setConnectionStatus('success');
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

  const handleTestConnection = async () => {
    if (!profile.mercadoPagoToken) {
      toast({
        title: "Token não informado",
        description: "Por favor, insira seu Access Token do Mercado Pago.",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Test the token by making a simple API call to Mercado Pago
      const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
        headers: {
          'Authorization': `Bearer ${profile.mercadoPagoToken}`,
        },
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast({
          title: "Conexão estabelecida!",
          description: "Seu token do Mercado Pago está funcionando corretamente.",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Token inválido",
          description: "Verifique se o Access Token está correto.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Erro na conexão",
        description: "Não foi possível testar a conexão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

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
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas informações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie sua conta e preferências</p>
        </div>

        {/* Profile Section */}
        <Card className="animate-fade-in stagger-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-20 w-20 gradient-primary rounded-2xl flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {profile.name.charAt(0) || "?"}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{profile.name || "Seu nome"}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">WhatsApp de Suporte</label>
                <p className="text-xs text-muted-foreground">Número que aparecerá no botão de suporte das suas rifas</p>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={profile.supportPhone}
                    onChange={(e) => setProfile({ ...profile, supportPhone: e.target.value })}
                    className="pl-12"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={loading}>
                <Save size={18} />
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mercado Pago Integration Section */}
        <Card className="animate-fade-in stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Integração Mercado Pago
              {connectionStatus === 'success' && (
                <span className="flex items-center gap-1 text-sm font-normal text-green-600">
                  <CheckCircle size={16} />
                  Conectado
                </span>
              )}
              {connectionStatus === 'error' && (
                <span className="flex items-center gap-1 text-sm font-normal text-destructive">
                  <AlertCircle size={16} />
                  Erro na conexão
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-xl space-y-4">
              <div>
                <p className="font-medium text-foreground mb-1">Access Token</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Para receber pagamentos, conecte sua conta do Mercado Pago inserindo seu Access Token.
                  <a 
                    href="https://www.mercadopago.com.br/developers/panel/app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    Obter meu token →
                  </a>
                </p>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type={showMercadoPagoToken ? "text" : "password"}
                    placeholder="APP_USR-xxxxxxxxxxxxxxxxx"
                    value={profile.mercadoPagoToken}
                    onChange={(e) => {
                      setProfile({ ...profile, mercadoPagoToken: e.target.value });
                      setConnectionStatus('idle');
                    }}
                    className="pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMercadoPagoToken(!showMercadoPagoToken)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showMercadoPagoToken ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={testingConnection || !profile.mercadoPagoToken}
                >
                  {testingConnection ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Testar Conexão
                    </>
                  )}
                </Button>
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save size={18} />
                  Salvar Token
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-accent/20 p-3 rounded-lg">
              <p className="font-medium mb-1">💡 Como obter seu Access Token:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Acesse o <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Painel de Desenvolvedores</a></li>
                <li>Crie uma nova aplicação ou selecione uma existente</li>
                <li>Vá em "Credenciais de produção"</li>
                <li>Copie o "Access Token" e cole aqui</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card className="animate-fade-in stagger-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Senha atual</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirmar nova senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12"
                />
              </div>
            </div>

            <Button variant="outline">
              <Lock size={18} />
              Alterar senha
            </Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="animate-fade-in stagger-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium text-foreground">Notificações por email</p>
                <p className="text-sm text-muted-foreground">Receber atualizações por email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium text-foreground">Alertas de vendas</p>
                <p className="text-sm text-muted-foreground">Receber notificação a cada venda</p>
              </div>
              <Switch
                checked={notifications.sales}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, sales: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium text-foreground">Novidades e promoções</p>
                <p className="text-sm text-muted-foreground">Receber dicas e novidades</p>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, marketing: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
