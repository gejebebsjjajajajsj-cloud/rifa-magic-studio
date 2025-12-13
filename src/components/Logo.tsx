import { Gift, Sparkles } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} gradient-primary rounded-xl flex items-center justify-center shadow-soft relative`}>
        <Gift className="text-primary-foreground" size={size === "lg" ? 28 : size === "md" ? 22 : 18} />
        <Sparkles 
          className="absolute -top-1 -right-1 text-accent animate-pulse-soft" 
          size={size === "lg" ? 16 : 12} 
        />
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-extrabold text-gradient`}>
          RifaFácil
        </span>
      )}
    </div>
  );
};
