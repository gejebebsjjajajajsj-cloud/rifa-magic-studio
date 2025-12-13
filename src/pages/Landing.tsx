import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Gift, Sparkles, Star, Heart, Zap, ArrowRight } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="sm:hidden"><Logo size="sm" /></div>
          <div className="hidden sm:block"><Logo size="md" /></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3">Criar conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-20">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-secondary/50 text-secondary-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 animate-fade-in">
              <Sparkles size={14} className="text-primary sm:hidden" />
              <Sparkles size={16} className="text-primary hidden sm:block" />
              <span className="text-xs sm:text-sm font-medium">Sistema simples e poderoso</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-extrabold text-foreground leading-tight mb-4 sm:mb-6 animate-fade-in stagger-1">
              Crie suas{" "}
              <span className="text-gradient">rifas online</span>{" "}
              em minutos!
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in stagger-2">
              A maneira mais fácil e bonita de criar, personalizar e gerenciar suas rifas. 
              Pague apenas quando publicar, sem mensalidades.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start animate-fade-in stagger-3">
              <Link to="/cadastro">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar agora
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Já tenho conta
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-10 justify-center lg:justify-start animate-fade-in stagger-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                <Heart size={14} className="text-primary sm:hidden" />
                <Heart size={18} className="text-primary hidden sm:block" />
                <span className="text-xs sm:text-sm font-medium">+1.000 criadoras</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                <Star size={14} className="text-accent sm:hidden" />
                <Star size={18} className="text-accent hidden sm:block" />
                <span className="text-xs sm:text-sm font-medium">4.9/5 avaliação</span>
              </div>
            </div>
          </div>

          {/* Illustration - Hidden on small mobile */}
          <div className="flex-1 relative animate-fade-in stagger-3 hidden sm:block">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-card border-2 border-border/50 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Gift size={20} className="text-primary-foreground sm:hidden" />
                    <Gift size={24} className="text-primary-foreground hidden sm:block lg:hidden" />
                    <Gift size={28} className="text-primary-foreground hidden lg:block" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm sm:text-base">Rifa de Exemplo</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">100 números disponíveis</p>
                  </div>
                </div>
                
                {/* Numbers Grid Preview */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <div 
                      key={num}
                      className={`h-8 sm:h-10 rounded-md sm:rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                        num <= 3 
                          ? "gradient-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      {String(num).padStart(2, "0")}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Preço por número</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">R$ 10,00</p>
                  </div>
                  <Button size="sm" className="text-xs sm:text-sm">Ver rifa</Button>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 h-10 w-10 sm:h-14 sm:w-14 lg:h-16 lg:w-16 bg-accent/20 rounded-xl sm:rounded-2xl flex items-center justify-center animate-float">
                <Sparkles size={18} className="text-accent sm:hidden" />
                <Sparkles size={24} className="text-accent hidden sm:block lg:hidden" />
                <Sparkles size={28} className="text-accent hidden lg:block" />
              </div>
              <div className="absolute -bottom-2 sm:-bottom-4 -left-2 sm:-left-4 h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 bg-secondary rounded-xl sm:rounded-2xl flex items-center justify-center animate-float stagger-2">
                <Star size={16} className="text-primary sm:hidden" />
                <Star size={20} className="text-primary hidden sm:block lg:hidden" />
                <Star size={24} className="text-primary hidden lg:block" />
              </div>
              <div className="absolute top-1/2 -right-4 sm:-right-6 lg:-right-8 h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-lavender rounded-lg sm:rounded-xl flex items-center justify-center animate-float stagger-3">
                <Zap size={14} className="text-primary sm:hidden" />
                <Zap size={16} className="text-primary hidden sm:block lg:hidden" />
                <Zap size={20} className="text-primary hidden lg:block" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 sm:mt-24 lg:mt-32">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-foreground mb-8 sm:mb-12">
            Por que escolher o <span className="text-gradient">RifaFácil</span>?
          </h2>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Sparkles,
                title: "Visual Personalizado",
                description: "Escolha cores, imagens e deixe sua rifa com a sua cara."
              },
              {
                icon: Zap,
                title: "Rápido e Fácil",
                description: "Crie sua rifa em poucos minutos com nosso assistente."
              },
              {
                icon: Heart,
                title: "Pague por Uso",
                description: "Sem mensalidades. Pague apenas quando publicar."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-border/50 shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon size={18} className="text-primary-foreground sm:hidden" />
                  <feature.icon size={24} className="text-primary-foreground hidden sm:block" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 mt-8 sm:mt-12 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <Logo size="sm" />
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            © 2024 RifaFácil. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
