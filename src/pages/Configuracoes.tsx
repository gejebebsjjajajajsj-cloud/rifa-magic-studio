import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Lock, 
  CreditCard, 
  Bell, 
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Configuracoes = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    name: "Maria Silva",
    email: "maria@email.com",
    supportPhone: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sales: true,
    marketing: false,
  });

  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    }, 1000);
  };

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
                {profile.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{profile.name}</h3>
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

              <Button onClick={handleSaveProfile} disabled={loading}>
                <Save size={18} />
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card className="animate-fade-in stagger-2">
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
        <Card className="animate-fade-in stagger-3">
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

        {/* Payment Data Section */}
        <Card className="animate-fade-in stagger-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Dados de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 gradient-primary rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">PIX</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Chave Pix</p>
                  <p className="text-sm text-muted-foreground">CPF: ***.***.***-00</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  Editar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
