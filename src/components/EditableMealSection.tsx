import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

const MEAL_EMOJIS: Record<string, string> = {
  Desayuno: "🌅", Almuerzo: "☀️", Cena: "🌙", Snack: "🍎", "Snack AM": "🥜", "Snack PM": "🍌",
};

interface Props {
  meal: Meal;
  mealIndex: number;
  onMealUpdate: (mealIndex: number, updatedMeal: Meal) => void;
}

const EditableMealSection = ({ meal, mealIndex, onMealUpdate }: Props) => {
  const [openOption, setOpenOption] = useState<number | null>(0);
  const [editingFood, setEditingFood] = useState<{ optIdx: number; foodIdx: number } | null>(null);
  const [editForm, setEditForm] = useState<FoodItem | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [newFood, setNewFood] = useState<FoodItem>({ name: "", amount: "", calories: 0, protein: 0, carbs: 0, fat: 0 });

  const recalcOption = (foods: FoodItem[]): Omit<MealOption, "name"> => ({
    foods,
    totalCalories: foods.reduce((s, f) => s + f.calories, 0),
    totalProtein: foods.reduce((s, f) => s + f.protein, 0),
    totalCarbs: foods.reduce((s, f) => s + f.carbs, 0),
    totalFat: foods.reduce((s, f) => s + f.fat, 0),
  });

  const updateOption = (optIdx: number, foods: FoodItem[]) => {
    const updated = { ...meal };
    updated.options = [...meal.options];
    updated.options[optIdx] = { ...updated.options[optIdx], ...recalcOption(foods) };
    onMealUpdate(mealIndex, updated);
  };

  const startEdit = (optIdx: number, foodIdx: number) => {
    setEditingFood({ optIdx, foodIdx });
    setEditForm({ ...meal.options[optIdx].foods[foodIdx] });
  };

  const saveEdit = () => {
    if (!editingFood || !editForm) return;
    const { optIdx, foodIdx } = editingFood;
    const foods = [...meal.options[optIdx].foods];
    foods[foodIdx] = editForm;
    updateOption(optIdx, foods);
    setEditingFood(null);
    setEditForm(null);
  };

  const deleteFood = (optIdx: number, foodIdx: number) => {
    const foods = meal.options[optIdx].foods.filter((_, i) => i !== foodIdx);
    if (foods.length === 0) return;
    updateOption(optIdx, foods);
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
        {meal.options.map((option, optIdx) => (
          <div key={optIdx}>
            <button
              onClick={() => setOpenOption(openOption === optIdx ? null : optIdx)}
              className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-muted/50"
            >
              <span className="text-sm font-medium text-foreground">
                Opción {optIdx + 1}: {option.name}
              </span>
              {openOption === optIdx ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {openOption === optIdx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 px-3 pb-3">
                    {option.foods.map((food, fi) => (
                      <div key={fi}>
                        {editingFood?.optIdx === optIdx && editingFood.foodIdx === fi && editForm ? (
                          <div className="rounded-md border border-primary/30 bg-muted/30 p-2 space-y-1.5">
                            <div className="flex gap-1.5">
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Alimento"
                                className="h-7 text-xs flex-1"
                              />
                              <Input
                                value={editForm.amount}
                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                placeholder="Cantidad"
                                className="h-7 text-xs w-24"
                              />
                            </div>
                            <div className="flex gap-1.5">
                              <Input
                                type="number"
                                value={editForm.calories}
                                onChange={(e) => setEditForm({ ...editForm, calories: +e.target.value })}
                                placeholder="kcal"
                                className="h-7 text-xs w-16"
                              />
                              <Input
                                type="number"
                                value={editForm.protein}
                                onChange={(e) => setEditForm({ ...editForm, protein: +e.target.value })}
                                placeholder="P"
                                className="h-7 text-xs w-14"
                              />
                              <Input
                                type="number"
                                value={editForm.carbs}
                                onChange={(e) => setEditForm({ ...editForm, carbs: +e.target.value })}
                                placeholder="C"
                                className="h-7 text-xs w-14"
                              />
                              <Input
                                type="number"
                                value={editForm.fat}
                                onChange={(e) => setEditForm({ ...editForm, fat: +e.target.value })}
                                placeholder="G"
                                className="h-7 text-xs w-14"
                              />
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={saveEdit} className="h-6 text-xs px-2 gap-1">
                                <Check className="h-3 w-3" /> Guardar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingFood(null); setEditForm(null); }} className="h-6 text-xs px-2 gap-1">
                                <X className="h-3 w-3" /> Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between text-xs group">
                            <div className="flex-1">
                              <span className="text-foreground">{food.name}</span>
                              <span className="ml-1 text-muted-foreground">({food.amount})</span>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <div className="flex gap-1.5 text-muted-foreground whitespace-nowrap">
                                <span>{food.calories}kcal</span>
                                <span className="text-protein">{food.protein}P</span>
                                <span className="text-carbs">{food.carbs}C</span>
                                <span className="text-fat">{food.fat}G</span>
                              </div>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEdit(optIdx, fi)}
                                  className="p-0.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                {option.foods.length > 1 && (
                                  <button
                                    onClick={() => deleteFood(optIdx, fi)}
                                    className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add food form */}
                    {addingTo === optIdx ? (
                      <div className="rounded-md border border-dashed border-primary/30 p-2 space-y-1.5 mt-1">
                        <div className="flex gap-1.5">
                          <Input
                            value={newFood.name}
                            onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                            placeholder="Alimento"
                            className="h-7 text-xs flex-1"
                          />
                          <Input
                            value={newFood.amount}
                            onChange={(e) => setNewFood({ ...newFood, amount: e.target.value })}
                            placeholder="Cantidad"
                            className="h-7 text-xs w-24"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          <Input
                            type="number"
                            value={newFood.calories || ""}
                            onChange={(e) => setNewFood({ ...newFood, calories: +e.target.value })}
                            placeholder="kcal"
                            className="h-7 text-xs w-16"
                          />
                          <Input
                            type="number"
                            value={newFood.protein || ""}
                            onChange={(e) => setNewFood({ ...newFood, protein: +e.target.value })}
                            placeholder="P"
                            className="h-7 text-xs w-14"
                          />
                          <Input
                            type="number"
                            value={newFood.carbs || ""}
                            onChange={(e) => setNewFood({ ...newFood, carbs: +e.target.value })}
                            placeholder="C"
                            className="h-7 text-xs w-14"
                          />
                          <Input
                            type="number"
                            value={newFood.fat || ""}
                            onChange={(e) => setNewFood({ ...newFood, fat: +e.target.value })}
                            placeholder="G"
                            className="h-7 text-xs w-14"
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => addFood(optIdx)} className="h-6 text-xs px-2 gap-1">
                            <Check className="h-3 w-3" /> Agregar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddingTo(null)} className="h-6 text-xs px-2 gap-1">
                            <X className="h-3 w-3" /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingTo(optIdx)}
                        className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary mt-1 transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Agregar alimento
                      </button>
                    )}

                    {/* Totals */}
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

export default EditableMealSection;
