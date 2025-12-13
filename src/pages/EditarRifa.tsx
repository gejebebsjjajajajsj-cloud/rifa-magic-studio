import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Save,
  Upload,
  Palette,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";

interface PrizeNumber {
  id?: string;
  prize_value: number;
  quantity: number;
}

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

const EditarRifa = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [prizeNumbers, setPrizeNumbers] = useState<PrizeNumber[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    endDate: "",
    totalNumbers: 100,
    pricePerNumber: 10,
    primaryColor: "#EC4899",
    buttonColor: "#EC4899",
    pixKey: "",
    imageUrl: "",
    bannerUrl: "",
  });

  useEffect(() => {
    const fetchRaffle = async () => {
      if (!id || !user) return;

      const { data: raffle, error } = await supabase
        .from("raffles")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !raffle) {
        toast({
          title: "Rifa não encontrada",
          variant: "destructive",
        });
        navigate("/rifas");
        return;
      }

      setFormData({
        name: raffle.name,
        description: raffle.description || "",
        category: raffle.category || "",
        endDate: raffle.end_date ? raffle.end_date.split("T")[0] : "",
        totalNumbers: raffle.total_numbers,
        pricePerNumber: raffle.price_per_number,
        primaryColor: raffle.primary_color || "#EC4899",
        buttonColor: raffle.button_color || "#EC4899",
        pixKey: raffle.pix_key || "",
        imageUrl: raffle.image_url || "",
        bannerUrl: raffle.banner_url || "",
      });

      // Fetch prize numbers
      const { data: prizes } = await supabase
        .from("prize_numbers")
        .select("*")
        .eq("raffle_id", id);

      if (prizes) {
        setPrizeNumbers(prizes.map(p => ({
          id: p.id,
          prize_value: Number(p.prize_value),
          quantity: p.quantity,
        })));
      }

      setLoading(false);
    };

    fetchRaffle();
  }, [id, user, navigate, toast]);

  const updateFormData = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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

    toast({ title: "Imagem enviada!" });
  };

  const addPrizeNumber = () => {
    setPrizeNumbers([...prizeNumbers, { prize_value: 50, quantity: 1 }]);
  };

  const removePrizeNumber = (index: number) => {
    setPrizeNumbers(prizeNumbers.filter((_, i) => i !== index));
  };

  const updatePrizeNumber = (index: number, field: "prize_value" | "quantity", value: number) => {
    const updated = [...prizeNumbers];
    updated[index][field] = value;
    setPrizeNumbers(updated);
  };

  const handleSave = async () => {
    if (!id || !user) return;

    setSaving(true);

    const { error } = await supabase
      .from("raffles")
      .update({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        total_numbers: formData.totalNumbers,
        price_per_number: formData.pricePerNumber,
        primary_color: formData.primaryColor,
        button_color: formData.buttonColor,
        pix_key: formData.pixKey,
        image_url: formData.imageUrl || null,
        banner_url: formData.bannerUrl || null,
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    // Update prize numbers
    // Delete existing
    await supabase.from("prize_numbers").delete().eq("raffle_id", id);
    
    // Insert new ones
    if (prizeNumbers.length > 0) {
      await supabase.from("prize_numbers").insert(
        prizeNumbers.map(pn => ({
          raffle_id: id,
          prize_value: pn.prize_value,
          quantity: pn.quantity,
        }))
      );
    }

    toast({ title: "Rifa atualizada!" });
    navigate("/rifas");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/rifas")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Editar Rifa</h1>
            <p className="text-xs text-muted-foreground">Atualize os dados da sua rifa</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Informações Básicas</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Nome da Rifa</label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Categoria</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => updateFormData("category", cat)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        formData.category === cat
                          ? "gradient-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Data de Término</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormData("endDate", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Numbers */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Números</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Total de Números</label>
                  <Input
                    type="number"
                    value={formData.totalNumbers}
                    onChange={(e) => updateFormData("totalNumbers", parseInt(e.target.value) || 100)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Preço (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.pricePerNumber}
                    onChange={(e) => updateFormData("pricePerNumber", parseFloat(e.target.value) || 10)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prize Numbers */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Números Premiados</h3>
                <Button size="sm" variant="outline" onClick={addPrizeNumber} className="h-7 text-xs">
                  <Plus size={14} className="mr-1" />
                  Adicionar
                </Button>
              </div>

              {prizeNumbers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum número premiado configurado. Clique em "Adicionar" para criar prêmios.
                </p>
              ) : (
                <div className="space-y-2">
                  {prizeNumbers.map((pn, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Quantidade</label>
                          <Input
                            type="number"
                            value={pn.quantity}
                            onChange={(e) => updatePrizeNumber(index, "quantity", parseInt(e.target.value) || 1)}
                            className="h-8 text-xs"
                            min={1}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Valor (R$)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={pn.prize_value}
                            onChange={(e) => updatePrizeNumber(index, "prize_value", parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs"
                            min={0}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrizeNumber(index)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Aparência</h3>

              <div className="grid grid-cols-2 gap-3">
                <label className="block cursor-pointer">
                  <span className="text-xs font-medium block mb-1.5">Imagem Principal</span>
                  <div className="border-2 border-dashed border-border rounded-xl p-3 text-center hover:border-primary/50 transition-colors">
                    {uploadingImage ? (
                      <Loader2 size={20} className="mx-auto text-primary animate-spin" />
                    ) : formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg mx-auto" />
                    ) : (
                      <Upload size={20} className="mx-auto text-muted-foreground" />
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">Clique para enviar</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "image")} />
                </label>

                <label className="block cursor-pointer">
                  <span className="text-xs font-medium block mb-1.5">Banner</span>
                  <div className="border-2 border-dashed border-border rounded-xl p-3 text-center hover:border-primary/50 transition-colors">
                    {uploadingBanner ? (
                      <Loader2 size={20} className="mx-auto text-primary animate-spin" />
                    ) : formData.bannerUrl ? (
                      <img src={formData.bannerUrl} alt="Banner" className="w-full h-12 object-cover rounded-lg" />
                    ) : (
                      <Upload size={20} className="mx-auto text-muted-foreground" />
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">Clique para enviar</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "banner")} />
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center gap-1">
                  <Palette size={12} />
                  Cor Principal
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => updateFormData("primaryColor", color.value)}
                      className={`h-8 w-8 rounded-lg transition-all ${
                        formData.primaryColor === color.value
                          ? "ring-2 ring-offset-1 ring-primary scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Cor dos Botões</label>
                <div className="flex gap-1.5 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => updateFormData("buttonColor", color.value)}
                      className={`h-8 w-8 rounded-lg transition-all ${
                        formData.buttonColor === color.value
                          ? "ring-2 ring-offset-1 ring-primary scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Pagamento</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Chave PIX</label>
                <Input
                  value={formData.pixKey}
                  onChange={(e) => updateFormData("pixKey", e.target.value)}
                  placeholder="CPF, email ou telefone"
                  className="h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-10" onClick={() => navigate("/rifas")}>
              Cancelar
            </Button>
            <Button className="flex-1 h-10" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 size={16} className="animate-spin mr-1" />
              ) : (
                <Save size={16} className="mr-1" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditarRifa;