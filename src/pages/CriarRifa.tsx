import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Hash,
  Image,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Palette,
  Loader2,
  Trophy,
  Plus,
  Trash2,
} from "lucide-react";

const steps = [
  { id: 1, title: "Informações", icon: FileText },
  { id: 2, title: "Números", icon: Hash },
  { id: 3, title: "Prêmios", icon: Trophy },
  { id: 4, title: "Aparência", icon: Image },
  { id: 5, title: "Pagamento", icon: CreditCard },
  { id: 6, title: "Revisão", icon: CheckCircle },
];

const categories = [
  "Eletrônicos",
  "Beleza",
  "Moda",
  "Casa",
  "Experiências",
  "Outros",
];

const colors = [
  { name: "Rosa", value: "#EC4899" },
  { name: "Roxo", value: "#8B5CF6" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Verde", value: "#10B981" },
  { name: "Laranja", value: "#F97316" },
  { name: "Vermelho", value: "#EF4444" },
];

interface PrizeTier {
  prizeValue: number;
  quantity: number;
}

const CriarRifa = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [prizeTiers, setPrizeTiers] = useState<PrizeTier[]>([{ prizeValue: 50, quantity: 5 }]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    endDate: "",
    totalNumbers: 100,
    pricePerNumber: 10,
    primaryColor: "#EC4899",
    buttonColor: "#EC4899",
    imageUrl: "",
    bannerUrl: "",
  });

  const updateFormData = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addPrizeTier = () => {
    setPrizeTiers([...prizeTiers, { prizeValue: 50, quantity: 1 }]);
  };

  const removePrizeTier = (index: number) => {
    setPrizeTiers(prizeTiers.filter((_, i) => i !== index));
  };

  const updatePrizeTier = (index: number, key: keyof PrizeTier, value: number) => {
    const updated = [...prizeTiers];
    updated[index][key] = value;
    setPrizeTiers(updated);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.description || !formData.category || !formData.endDate) {
        toast({
          title: "Preencha todos os campos",
          description: "Nome, descrição, categoria e data são obrigatórios",
          variant: "destructive",
        });
        return;
      }
    }
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "banner") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const isImage = type === "image";
    if (isImage) setUploadingImage(true);
    else setUploadingBanner(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${type}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("raffle-images")
      .upload(fileName, file);

    if (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem",
        variant: "destructive",
      });
      if (isImage) setUploadingImage(false);
      else setUploadingBanner(false);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("raffle-images")
      .getPublicUrl(data.path);

    if (isImage) {
      updateFormData("imageUrl", publicUrl.publicUrl);
      setUploadingImage(false);
    } else {
      updateFormData("bannerUrl", publicUrl.publicUrl);
      setUploadingBanner(false);
    }

    toast({
      title: "Imagem enviada!",
      description: "Upload realizado com sucesso",
    });
  };

  const handlePublish = async () => {
    if (!user) return;

    setLoading(true);

    // Save raffle with pending_payment status
    const { data, error } = await supabase.from("raffles").insert({
      user_id: user.id,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      total_numbers: formData.totalNumbers,
      price_per_number: formData.pricePerNumber,
      primary_color: formData.primaryColor,
      button_color: formData.buttonColor,
      image_url: formData.imageUrl || null,
      banner_url: formData.bannerUrl || null,
      status: "pending_payment",
    }).select().single();

    if (error) {
      toast({
        title: "Erro ao criar rifa",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Insert prize numbers if configured
    if (prizeTiers.length > 0 && data) {
      const prizePromises = prizeTiers.map(tier => {
        // Generate random numbers for this prize tier
        const availableNumbers = Array.from({ length: formData.totalNumbers }, (_, i) => i + 1);
        const shuffled = availableNumbers.sort(() => 0.5 - Math.random());
        const prizeNums = shuffled.slice(0, tier.quantity);
        
        return supabase.from("prize_numbers").insert({
          raffle_id: data.id,
          prize_value: tier.prizeValue,
          quantity: tier.quantity,
          numbers: prizeNums,
        });
      });

      await Promise.all(prizePromises);
    }

    toast({
      title: "Rifa salva!",
      description: "Agora pague a taxa para publicar sua rifa.",
    });
    
    // Redirect to payment page with raffle ID
    navigate(`/pagamento-taxa?raffle_id=${data.id}`);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Informações Básicas
              </h2>
              <p className="text-muted-foreground">
                Preencha os dados principais da sua rifa
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nome da Rifa *
                </label>
                <Input
                  placeholder="Ex: Rifa do iPhone 15 Pro"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Descrição *
                </label>
                <Textarea
                  placeholder="Descreva o prêmio e as regras da rifa..."
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  rows={4}
                  className="rounded-xl border-2 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Categoria *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => updateFormData("category", cat)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        formData.category === cat
                          ? "gradient-primary text-primary-foreground shadow-soft"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Data de Término *
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormData("endDate", e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Configuração dos Números
              </h2>
              <p className="text-muted-foreground">
                Defina a quantidade e preço dos números
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Quantidade de Números *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 150, 200].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateFormData("totalNumbers", num)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        formData.totalNumbers === num
                          ? "gradient-primary text-primary-foreground shadow-soft"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Ou digite um valor personalizado"
                  value={formData.totalNumbers}
                  onChange={(e) =>
                    updateFormData("totalNumbers", parseInt(e.target.value) || 100)
                  }
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Preço por Número (R$) *
                </label>
                <Input
                  type="number"
                  placeholder="10.00"
                  value={formData.pricePerNumber}
                  onChange={(e) =>
                    updateFormData("pricePerNumber", parseFloat(e.target.value) || 10)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Preview dos Números
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-4 bg-muted/50 rounded-2xl">
                  {Array.from({ length: Math.min(20, formData.totalNumbers) }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg bg-card border-2 border-border flex items-center justify-center text-xs font-bold text-muted-foreground hover:border-primary transition-colors"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                    )
                  )}
                  {formData.totalNumbers > 20 && (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      +{formData.totalNumbers - 20}
                    </div>
                  )}
                </div>
              </div>

              <Card className="bg-secondary/30 border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Valor total da rifa:</span>
                    <span className="text-xl font-bold text-foreground">
                      R$ {(formData.totalNumbers * formData.pricePerNumber).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Números Premiados
              </h2>
              <p className="text-muted-foreground">
                Configure os prêmios para os números sorteados
              </p>
            </div>

            <div className="space-y-4">
              {prizeTiers.map((tier, index) => (
                <Card key={index} className="border-2 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Trophy size={16} className="text-yellow-500" />
                        Faixa de Prêmio #{index + 1}
                      </span>
                      {prizeTiers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePrizeTier(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Valor do Prêmio (R$)
                        </label>
                        <Input
                          type="number"
                          value={tier.prizeValue}
                          onChange={(e) => updatePrizeTier(index, "prizeValue", parseFloat(e.target.value) || 0)}
                          placeholder="50.00"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Quantidade de Números
                        </label>
                        <Input
                          type="number"
                          value={tier.quantity}
                          onChange={(e) => updatePrizeTier(index, "quantity", parseInt(e.target.value) || 1)}
                          placeholder="5"
                          min={1}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addPrizeTier}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Faixa de Prêmio
              </Button>

              <Card className="bg-secondary/30 border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total de números premiados:</span>
                    <span className="font-bold text-foreground">
                      {prizeTiers.reduce((acc, t) => acc + t.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Valor total em prêmios:</span>
                    <span className="font-bold text-foreground">
                      R$ {prizeTiers.reduce((acc, t) => acc + (t.prizeValue * t.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Mídia e Aparência
              </h2>
              <p className="text-muted-foreground">
                Personalize o visual da sua rifa
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Imagem Principal
                </label>
                <label className="block">
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    {uploadingImage ? (
                      <Loader2 size={32} className="mx-auto text-primary animate-spin mb-2" />
                    ) : formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-xl mx-auto mb-2" />
                    ) : (
                      <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formData.imageUrl ? "Clique para alterar" : "Clique ou arraste uma imagem"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG até 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "image")}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Banner (opcional)
                </label>
                <label className="block">
                  <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    {uploadingBanner ? (
                      <Loader2 size={24} className="mx-auto text-primary animate-spin mb-2" />
                    ) : formData.bannerUrl ? (
                      <img src={formData.bannerUrl} alt="Banner preview" className="w-full h-24 object-cover rounded-xl mb-2" />
                    ) : (
                      <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formData.bannerUrl ? "Clique para alterar" : "Adicionar banner"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "banner")}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Palette size={18} />
                  Cor Principal
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => updateFormData("primaryColor", color.value)}
                      className={`h-12 w-12 rounded-xl transition-all duration-200 ${
                        formData.primaryColor === color.value
                          ? "ring-4 ring-offset-2 ring-primary scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Cor dos Botões
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => updateFormData("buttonColor", color.value)}
                      className={`h-12 w-12 rounded-xl transition-all duration-200 ${
                        formData.buttonColor === color.value
                          ? "ring-4 ring-offset-2 ring-primary scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Meios de Pagamento
              </h2>
              <p className="text-muted-foreground">
                Os pagamentos serão processados automaticamente
              </p>
            </div>

            <Card className="border-2 border-primary/20 bg-secondary/30">
              <CardContent className="p-4 text-center space-y-3">
                <CreditCard size={32} className="mx-auto text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground">Pagamento Automático</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Conecte sua conta Mercado Pago ou SyncPayments nas <strong>Configurações</strong> para receber os pagamentos das suas rifas automaticamente.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open('/configuracoes', '_blank')}
                  className="mt-2"
                >
                  Ir para Configurações
                </Button>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground text-center p-3 bg-muted/50 rounded-xl">
              <p>✓ Pix instantâneo via SyncPayments</p>
              <p>✓ Cartão de crédito via Mercado Pago</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Revisão Final
              </h2>
              <p className="text-muted-foreground">
                Confira todas as informações antes de publicar
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                {formData.imageUrl && (
                  <div className="flex justify-center mb-4">
                    <img src={formData.imageUrl} alt="Rifa" className="w-32 h-32 object-cover rounded-xl" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold text-foreground">
                      {formData.name || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-semibold text-foreground">
                      {formData.category || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Números</p>
                    <p className="font-semibold text-foreground">
                      {formData.totalNumbers}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preço/número</p>
                    <p className="font-semibold text-foreground">
                      R$ {formData.pricePerNumber.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Término</p>
                    <p className="font-semibold text-foreground">
                      {formData.endDate ? new Date(formData.endDate).toLocaleDateString("pt-BR") : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor total</p>
                    <p className="font-semibold text-foreground">
                      R$ {(formData.totalNumbers * formData.pricePerNumber).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-foreground">
                    {formData.description || "Não informado"}
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Números Premiados</p>
                  <div className="space-y-1 mt-1">
                    {prizeTiers.map((tier, i) => (
                      <p key={i} className="text-foreground text-sm">
                        {tier.quantity}x números de R$ {tier.prizeValue.toFixed(2)}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Pagamento</p>
                  <p className="text-foreground">
                    Automático via Mercado Pago / SyncPayments
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-accent/10 border-accent/30">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  💰 Taxa de Publicação:
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {formData.totalNumbers <= 10000 && (
                    <p className="text-lg font-bold text-primary">R$ 97,00</p>
                  )}
                  {formData.totalNumbers > 10000 && formData.totalNumbers <= 50000 && (
                    <p className="text-lg font-bold text-primary">R$ 149,00</p>
                  )}
                  {formData.totalNumbers > 50000 && formData.totalNumbers <= 100000 && (
                    <p className="text-lg font-bold text-primary">R$ 197,00</p>
                  )}
                  {formData.totalNumbers > 100000 && (
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ Acima de 100.000 números requer plano avançado. Entre em contato com o suporte.
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sua rifa só será publicada após o pagamento da taxa.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 sm:top-5 left-0 right-0 h-0.5 sm:h-1 bg-muted rounded-full -z-10">
              <div
                className="h-full gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step) => (
              <div
                key={step.id}
                className="flex flex-col items-center gap-1 sm:gap-2"
              >
                <div
                  className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step.id <= currentStep
                      ? "gradient-primary text-primary-foreground shadow-soft"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check size={14} className="sm:hidden" />
                  ) : (
                    <step.icon size={14} className="sm:hidden" />
                  )}
                  {step.id < currentStep ? (
                    <Check size={18} className="hidden sm:block" />
                  ) : (
                    <step.icon size={18} className="hidden sm:block" />
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-medium text-center ${
                    step.id <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            size="sm"
            className="sm:size-default"
          >
            <ArrowLeft size={16} className="sm:hidden" />
            <ArrowLeft size={18} className="hidden sm:block" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>

          {currentStep < 6 ? (
            <Button onClick={nextStep} size="sm" className="sm:size-default">
              <span>Próximo</span>
              <ArrowRight size={16} className="sm:hidden" />
              <ArrowRight size={18} className="hidden sm:block" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={loading} size="sm" className="sm:size-default text-xs sm:text-sm">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processando...
                </>
              ) : (
                "Publicar e pagar"
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CriarRifa;
