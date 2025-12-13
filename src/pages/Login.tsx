import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      let message = "Erro ao fazer login. Tente novamente.";
      
      if (error.message.includes("Invalid login credentials")) {
        message = "Email ou senha incorretos.";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Por favor, confirme seu email antes de fazer login.";
      }
      
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setLoading(false);
    toast({
      title: "Login realizado!",
      description: "Bem-vinda de volta! 🎉",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col p-6 lg:p-12">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md animate-fade-in">
            <div className="text-center mb-8">
              <Logo size="lg" />
              <h1 className="text-2xl font-bold text-foreground mt-6 mb-2">
                Bem-vinda de volta! 👋
              </h1>
              <p className="text-muted-foreground">
                Entre na sua conta para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <Link to="/esqueci-senha" className="text-sm text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <p className="text-center text-muted-foreground mt-6">
              Não tem uma conta?{" "}
              <Link to="/cadastro" className="text-primary font-medium hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 gradient-soft items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <div className="relative mb-8">
            <div className="h-48 w-48 mx-auto bg-card rounded-3xl shadow-card flex items-center justify-center animate-float">
              <div className="h-20 w-20 gradient-primary rounded-2xl flex items-center justify-center">
                <Lock size={40} className="text-primary-foreground" />
              </div>
            </div>
            <div className="absolute top-0 right-1/4 h-12 w-12 bg-accent/30 rounded-xl animate-float stagger-2" />
            <div className="absolute bottom-4 left-1/4 h-10 w-10 bg-lavender rounded-lg animate-float stagger-3" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Gerencie suas rifas com facilidade
          </h2>
          <p className="text-muted-foreground">
            Acesse seu painel e acompanhe todas as suas rifas em um só lugar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
