import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Loader2, ChevronDown, ChevronUp, Salad, Save, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FoodItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealOption {
  name: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface Meal {
  name: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  options: MealOption[];
}

interface DietPlan {
  meals: Meal[];
}

interface SavedDiet {
  id: string;
  diet_plan: DietPlan;
  meals_per_day: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  created_at: string;
}

interface Props {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  sex: string | null;
  weightKg: number | null;
}

const MEAL_COUNTS = [
  { value: 2, label: "2 comidas", desc: "Almuerzo + Cena" },
  { value: 3, label: "3 comidas", desc: "Desayuno + Almuerzo + Cena" },
  { value: 4, label: "4 comidas", desc: "Desayuno + Almuerzo + Cena + Snack" },
  { value: 5, label: "5 comidas", desc: "Desayuno + Snack AM + Almuerzo + Snack PM + Cena" },
];

const DietPlanGenerator = ({ targetCalories, targetProtein, targetCarbs, targetFat, sex, weightKg }: Props) => {
  const { user } = useAuth();
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [savedDiets, setSavedDiets] = useState<SavedDiet[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMealsPerDay, setCurrentMealsPerDay] = useState(3);

  useEffect(() => {
    if (user) fetchSavedDiets();
  }, [user]);

  const fetchSavedDiets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_diets" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setSavedDiets(data as any);
  };

  const handleGenerate = async (mealsPerDay: number) => {
    setShowMealPicker(false);
    setGenerating(true);
    setCurrentMealsPerDay(mealsPerDay);

    try {
      const { data, error } = await supabase.functions.invoke("generate-diet", {
        body: { targetCalories, targetProtein, targetCarbs, targetFat, mealsPerDay, sex, weightKg },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDietPlan(data);
      setShowPlan(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error generando dieta");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !dietPlan) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("saved_diets" as any).insert({
        user_id: user.id,
        diet_plan: dietPlan as any,
        meals_per_day: currentMealsPerDay,
        target_calories: targetCalories,
        target_protein: targetProtein,
        target_carbs: targetCarbs,
        target_fat: targetFat,
      } as any);
      if (error) throw error;
      toast.success("¡Dieta guardada! 💪");
      fetchSavedDiets();
    } catch (e: any) {
      toast.error("Error guardando dieta");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    const { error } = await supabase.from("saved_diets" as any).delete().eq("id", id);
    if (error) { toast.error("Error eliminando"); return; }
    setSavedDiets((prev) => prev.filter((d) => d.id !== id));
    toast.success("Dieta eliminada");
  };

  const handleLoadSaved = (diet: SavedDiet) => {
    setDietPlan(diet.diet_plan);
    setCurrentMealsPerDay(diet.meals_per_day);
    setShowSaved(false);
    setShowPlan(true);
  };

  return (
    <>
      <div className="mb-6 flex gap-2">
        <Button
          onClick={() => setShowMealPicker(true)}
          disabled={generating}
          className="flex-1 gap-2 font-display tracking-wider"
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              GENERANDO...
            </>
          ) : (
            <>
              <Salad className="h-4 w-4" />
              GENERAR MI DIETA
            </>
          )}
        </Button>
        {savedDiets.length > 0 && (
          <Button
            onClick={() => setShowSaved(true)}
            variant="outline"
            size="sm"
            className="gap-1.5 font-display tracking-wider"
          >
            <BookOpen className="h-4 w-4" />
            MIS DIETAS ({savedDiets.length})
          </Button>
        )}
      </div>

      {/* Meal count picker */}
      <Dialog open={showMealPicker} onOpenChange={setShowMealPicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-center">
              ¿CUÁNTAS COMIDAS HACES AL DÍA?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center mb-2">
            Esto nos ayuda a distribuir tus macros de forma óptima
          </p>
          <div className="space-y-2">
            {MEAL_COUNTS.map((mc) => (
              <button
                key={mc.value}
                onClick={() => handleGenerate(mc.value)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div>
                  <p className="font-medium text-foreground">{mc.label}</p>
                  <p className="text-xs text-muted-foreground">{mc.desc}</p>
                </div>
                <Utensils className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diet plan display */}
      <Dialog open={showPlan} onOpenChange={setShowPlan}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-center">
              🍽️ TU DIETA PERSONALIZADA
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-center text-muted-foreground mb-3">
            {targetCalories} kcal · {targetProtein}g P · {targetCarbs}g C · {targetFat}g G
          </p>
          {dietPlan && (
            <div className="space-y-4">
              {dietPlan.meals.map((meal, i) => (
                <MealSection key={i} meal={meal} />
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gap-1.5 font-display tracking-wider text-xs"
              size="sm"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "GUARDANDO..." : "GUARDAR DIETA"}
            </Button>
            <Button
              onClick={() => { setShowPlan(false); setShowMealPicker(true); }}
              variant="outline"
              className="flex-1 font-display tracking-wider text-xs"
              size="sm"
            >
              🔄 REGENERAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved diets list */}
      <Dialog open={showSaved} onOpenChange={setShowSaved}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-center">
              📋 MIS DIETAS GUARDADAS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {savedDiets.map((diet) => (
              <div
                key={diet.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
              >
                <button
                  onClick={() => handleLoadSaved(diet)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-medium text-foreground">
                    {diet.meals_per_day} comidas · {diet.target_calories} kcal
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(diet.created_at).toLocaleDateString("es-PE", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </button>
                <button
                  onClick={() => handleDeleteSaved(diet.id)}
                  className="ml-2 rounded-md p-1.5 text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const MealSection = ({ meal }: { meal: Meal }) => {
  const [openOption, setOpenOption] = useState<number | null>(0);

  const MEAL_EMOJIS: Record<string, string> = {
    Desayuno: "🌅", Almuerzo: "☀️", Cena: "🌙", Snack: "🍎", "Snack AM": "🥜", "Snack PM": "🍌",
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-primary/10 px-3 py-2">
        <p className="font-display text-sm tracking-wide text-foreground">
          {MEAL_EMOJIS[meal.name] || "🍽️"} {meal.name.toUpperCase()}
        </p>
        <p className="text-xs text-muted-foreground">
          ~{meal.targetCalories} kcal · {meal.targetProtein}g P · {meal.targetCarbs}g C · {meal.targetFat}g G
        </p>
      </div>
      <div className="divide-y divide-border">
        {meal.options.map((option, idx) => (
          <div key={idx}>
            <button
              onClick={() => setOpenOption(openOption === idx ? null : idx)}
              className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-muted/50"
            >
              <span className="text-sm font-medium text-foreground">
                Opción {idx + 1}: {option.name}
              </span>
              {openOption === idx ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {openOption === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 px-3 pb-3">
                    {option.foods.map((food, fi) => (
                      <div key={fi} className="flex items-start justify-between text-xs">
                        <div className="flex-1">
                          <span className="text-foreground">{food.name}</span>
                          <span className="ml-1 text-muted-foreground">({food.amount})</span>
                        </div>
                        <div className="flex gap-1.5 text-muted-foreground whitespace-nowrap ml-2">
                          <span>{food.calories}kcal</span>
                          <span className="text-protein">{food.protein}P</span>
                          <span className="text-carbs">{food.carbs}C</span>
                          <span className="text-fat">{food.fat}G</span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 flex gap-2 border-t border-border pt-2 text-xs font-medium">
                      <span className="text-foreground">{option.totalCalories} kcal</span>
                      <span className="text-protein">{option.totalProtein}g P</span>
                      <span className="text-carbs">{option.totalCarbs}g C</span>
                      <span className="text-fat">{option.totalFat}g G</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DietPlanGenerator;
