import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image as ImageIcon, Loader2, Save, RotateCcw, Drumstick, Wheat, Droplets, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import scanBg from "@/assets/scan-bg.jpg";

type FoodItem = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  originalGrams: number; // to calculate ratio for slider
};

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "🌅 Desayuno",
  lunch: "☀️ Almuerzo",
  dinner: "🌙 Cena",
  snack: "🍎 Snack",
};

const Scan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    setShowResults(false);
    setFoods([]);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImageBase64(base64);
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-food`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        throw new Error(err?.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      const foodsWithOriginal = data.foods.map((f: any) => ({
        ...f,
        originalGrams: f.grams,
      }));
      setFoods(foodsWithOriginal);
      setShowResults(true);
    } catch (err: any) {
      toast.error(err.message || "Error analizando la imagen");
    } finally {
      setAnalyzing(false);
    }
  };

  const updatePortion = (index: number, newGrams: number) => {
    setFoods((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f;
        const ratio = newGrams / f.originalGrams;
        return {
          ...f,
          grams: Math.round(newGrams),
          calories: Math.round((f.calories / (f.grams / f.originalGrams)) * ratio),
          protein: Math.round(((f.protein / (f.grams / f.originalGrams)) * ratio) * 10) / 10,
          carbs: Math.round(((f.carbs / (f.grams / f.originalGrams)) * ratio) * 10) / 10,
          fat: Math.round(((f.fat / (f.grams / f.originalGrams)) * ratio) * 10) / 10,
        };
      })
    );
  };

  const totals = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: Math.round((acc.protein + f.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + f.carbs) * 10) / 10,
      fat: Math.round((acc.fat + f.fat) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleSave = async () => {
    if (!user || foods.length === 0) return;
    setSaving(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Get or create daily log
      let { data: log } = await supabase
        .from("daily_logs" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (!log) {
        const { data: newLog, error: logErr } = await supabase
          .from("daily_logs" as any)
          .insert({ user_id: user.id, date: today } as any)
          .select()
          .single();
        if (logErr) throw logErr;
        log = newLog;
      }

      // Save meal scan
      const { error: scanErr } = await supabase
        .from("meal_scans" as any)
        .insert({
          user_id: user.id,
          daily_log_id: (log as any).id,
          meal_type: mealType,
          foods_json: foods,
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_carbs: totals.carbs,
          total_fat: totals.fat,
        } as any);
      if (scanErr) throw scanErr;

      // Update daily log totals
      const { error: updateErr } = await supabase
        .from("daily_logs" as any)
        .update({
          total_calories: Number((log as any).total_calories) + totals.calories,
          total_protein: Number((log as any).total_protein) + totals.protein,
          total_carbs: Number((log as any).total_carbs) + totals.carbs,
          total_fat: Number((log as any).total_fat) + totals.fat,
        } as any)
        .eq("id", (log as any).id);
      if (updateErr) throw updateErr;

      toast.success("¡Comida registrada! 💪");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Error guardando la comida");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setImageBase64(null);
    setFoods([]);
    setShowResults(false);
    setAnalyzing(false);
  };

  return (
    <div className="relative min-h-screen pb-24 pt-8">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${scanBg})` }}
      />
      <div className="fixed inset-0 bg-background/35" />
      <div className="fixed inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="relative z-10 px-4">
      <h1 className="mb-2 text-center font-display text-3xl tracking-wider text-primary text-glow">
        ESCANEA TU COMIDA
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {!preview ? "Toma una foto o sube desde galería" : showResults ? "Ajusta porciones y guarda" : "Analizando..."}
      </p>

      {/* Camera / Gallery buttons */}
      {!preview && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto flex w-full max-w-sm flex-col gap-4 mt-[45vh]"
        >
          <Button
            onClick={() => cameraRef.current?.click()}
            className="h-32 w-full font-display text-xl tracking-wider box-glow"
          >
            <Camera className="mr-2 h-6 w-6" />
            CÁMARA
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            className="h-16 w-full font-display text-lg tracking-wider"
          >
            <ImageIcon className="mr-2 h-5 w-5" />
            GALERÍA
          </Button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </motion.div>
      )}

      {/* Image preview + analysis */}
      {preview && (
        <div className="mx-auto w-full max-w-sm">
          <div className="relative mb-4 overflow-hidden rounded-lg border border-border">
            <img src={preview} alt="Comida" className="w-full object-cover" style={{ maxHeight: 250 }} />
            {analyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85">
                <Loader2 className="mb-2 h-10 w-10 animate-spin text-primary" />
                <span className="font-display text-lg tracking-wide text-primary animate-pulse-glow">ANALIZANDO CON IA...</span>
                <span className="mt-1 text-xs text-muted-foreground">Identificando alimentos peruanos</span>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showResults && foods.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Totals card */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-display text-lg tracking-wide text-foreground">TOTAL</span>
                    <span className="flex items-center gap-1 text-lg font-bold text-primary">
                      <Flame className="h-4 w-4" /> {totals.calories} kcal
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-protein"><Drumstick className="h-3 w-3" /> {totals.protein}g</span>
                    <span className="flex items-center gap-1 text-carbs"><Wheat className="h-3 w-3" /> {totals.carbs}g</span>
                    <span className="flex items-center gap-1 text-fat"><Droplets className="h-3 w-3" /> {totals.fat}g</span>
                  </div>
                </div>

                {/* Food items with sliders */}
                <div className="space-y-3">
                  {foods.map((food, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{food.name}</span>
                        <span className="text-xs text-muted-foreground">{food.calories} kcal</span>
                      </div>
                      <div className="mb-2 flex gap-3 text-xs text-muted-foreground">
                        <span className="text-protein">P: {food.protein}g</span>
                        <span className="text-carbs">C: {food.carbs}g</span>
                        <span className="text-fat">G: {food.fat}g</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-12 text-right text-xs font-medium text-primary">{food.grams}g</span>
                        <Slider
                          value={[food.grams]}
                          min={Math.round(food.originalGrams * 0.1)}
                          max={Math.round(food.originalGrams * 3)}
                          step={5}
                          onValueChange={([v]) => updatePortion(i, v)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meal type selector */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">TIPO DE COMIDA</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setMealType(key)}
                        className={`rounded-lg border p-2 text-center text-xs transition-all ${
                          mealType === key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={reset} className="flex-1">
                    <RotateCcw className="mr-1 h-4 w-4" /> Otra foto
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="flex-1 font-display tracking-wider box-glow">
                    <Save className="mr-1 h-4 w-4" />
                    {saving ? "GUARDANDO..." : "GUARDAR"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showResults && !analyzing && (
            <Button variant="secondary" className="mt-4 w-full" onClick={reset}>
              Escanear otra
            </Button>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default Scan;
