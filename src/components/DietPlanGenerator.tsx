import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Loader2, ChevronDown, ChevronUp, Salad, Save, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import DietQuestionnaire, { type DietQuestionnaireData } from "./DietQuestionnaire";
import EditableMealSection from "./EditableMealSection";

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

// Keep for backward compat but no longer used in the main flow

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

  const handleQuestionnaireSubmit = async (data: DietQuestionnaireData) => {
    setShowMealPicker(false);
    setGenerating(true);
    setCurrentMealsPerDay(data.mealsPerDay);

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-diet", {
        body: {
          targetCalories, targetProtein, targetCarbs, targetFat,
          mealsPerDay: data.mealsPerDay, sex, weightKg,
          questionnaire: data,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setDietPlan(result);
      setShowPlan(true);

      // Auto-save
      if (user) {
        try {
          await supabase.from("saved_diets" as any).insert({
            user_id: user.id,
            diet_plan: result as any,
            meals_per_day: data.mealsPerDay,
            target_calories: targetCalories,
            target_protein: targetProtein,
            target_carbs: targetCarbs,
            target_fat: targetFat,
          } as any);
          fetchSavedDiets();
          toast.success("¡Dieta generada y guardada! 💪");
        } catch { /* silent */ }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error generando dieta");
    } finally {
      setGenerating(false);
    }
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

      {/* Diet questionnaire wizard */}
      <DietQuestionnaire
        open={showMealPicker}
        onOpenChange={setShowMealPicker}
        onSubmit={handleQuestionnaireSubmit}
      />

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
                <EditableMealSection
                  key={i}
                  meal={meal}
                  mealIndex={i}
                  onMealUpdate={(idx, updatedMeal) => {
                    const updated = { ...dietPlan };
                    updated.meals = [...dietPlan.meals];
                    updated.meals[idx] = updatedMeal;
                    setDietPlan(updated);
                  }}
                />
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

export default DietPlanGenerator;
