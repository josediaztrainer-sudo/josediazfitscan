import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Utensils, Heart, AlertTriangle, Stethoscope, Clock, Activity, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface DietQuestionnaireData {
  lifestyle: string;
  mealsPerDay: number;
  mealTimes: string;
  foodPreferences: string[];
  otherPreference: string;
  allergies: string[];
  otherAllergy: string;
  digestiveIssues: string[];
  otherDigestive: string;
  diseases: string[];
  otherDisease: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DietQuestionnaireData) => void;
}

const STEPS = [
  { icon: Activity, title: "RITMO DE VIDA", emoji: "🏃" },
  { icon: Utensils, title: "COMIDAS AL DÍA", emoji: "🍽️" },
  { icon: Clock, title: "HORARIOS", emoji: "⏰" },
  { icon: Heart, title: "PREFERENCIAS ALIMENTICIAS", emoji: "🥗" },
  { icon: AlertTriangle, title: "ALERGIAS ALIMENTARIAS", emoji: "⚠️" },
  { icon: Stethoscope, title: "SALUD DIGESTIVA", emoji: "🩺" },
  { icon: Heart, title: "CONDICIONES DE SALUD", emoji: "❤️‍🩹" },
];

const LIFESTYLE_OPTIONS = [
  { value: "sedentary", label: "Sedentario", desc: "Trabajo de oficina, poco movimiento", emoji: "🪑" },
  { value: "light", label: "Ligeramente activo", desc: "Camino algo, trabajo semi-activo", emoji: "🚶" },
  { value: "moderate", label: "Moderadamente activo", desc: "Ejercicio 3-4 veces/semana", emoji: "🏋️" },
  { value: "active", label: "Muy activo", desc: "Ejercicio diario, trabajo físico", emoji: "💪" },
  { value: "athlete", label: "Atleta/Deportista", desc: "Doble turno, competición", emoji: "🏆" },
];

const MEAL_OPTIONS = [
  { value: 2, label: "2 comidas", desc: "Almuerzo + Cena" },
  { value: 3, label: "3 comidas", desc: "Desayuno + Almuerzo + Cena" },
  { value: 4, label: "4 comidas", desc: "Desayuno + Almuerzo + Cena + Snack" },
  { value: 5, label: "5 comidas", desc: "Desayuno + Snack AM + Almuerzo + Snack PM + Cena" },
];

const ALLERGY_OPTIONS = [
  { id: "lactose", label: "Lácteos / Intolerancia a la lactosa", emoji: "🥛" },
  { id: "gluten", label: "Gluten / Celiaquía", emoji: "🌾" },
  { id: "eggs", label: "Huevos", emoji: "🥚" },
  { id: "nuts", label: "Frutos secos / Maní", emoji: "🥜" },
  { id: "shellfish", label: "Mariscos", emoji: "🦐" },
  { id: "fish", label: "Pescado", emoji: "🐟" },
  { id: "soy", label: "Soya", emoji: "🫘" },
  { id: "none", label: "No tengo alergias alimentarias", emoji: "✅" },
];

const DIGESTIVE_OPTIONS = [
  { id: "ibs", label: "Síndrome de colon irritable (SCI)", emoji: "😣" },
  { id: "gastritis", label: "Gastritis / Reflujo", emoji: "🔥" },
  { id: "bloating", label: "Hinchazón / Distensión abdominal", emoji: "🎈" },
  { id: "crohn", label: "Enfermedad de Crohn", emoji: "⚕️" },
  { id: "celiac", label: "Enfermedad celíaca", emoji: "🌾" },
  { id: "constipation", label: "Estreñimiento crónico", emoji: "🚫" },
  { id: "none", label: "No tengo patologías digestivas", emoji: "✅" },
];

const DISEASE_OPTIONS = [
  { id: "insulin_resistance", label: "Resistencia a la insulina", emoji: "💉" },
  { id: "diabetes_2", label: "Diabetes tipo 2", emoji: "🩸" },
  { id: "hypertension", label: "Hipertensión arterial", emoji: "❤️" },
  { id: "hypothyroid", label: "Hipotiroidismo", emoji: "🦋" },
  { id: "pcos", label: "SOP (Síndrome de ovario poliquístico)", emoji: "♀️" },
  { id: "fatty_liver", label: "Hígado graso", emoji: "🫁" },
  { id: "high_cholesterol", label: "Colesterol / Triglicéridos altos", emoji: "📊" },
  { id: "anemia", label: "Anemia", emoji: "🩸" },
  { id: "none", label: "No tengo ninguna enfermedad", emoji: "✅" },
];

const DietQuestionnaire = ({ open, onOpenChange, onSubmit }: Props) => {
  const [step, setStep] = useState(0);
  const [lifestyle, setLifestyle] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState(0);
  const [mealTimes, setMealTimes] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [otherAllergy, setOtherAllergy] = useState("");
  const [digestiveIssues, setDigestiveIssues] = useState<string[]>([]);
  const [otherDigestive, setOtherDigestive] = useState("");
  const [diseases, setDiseases] = useState<string[]>([]);
  const [otherDisease, setOtherDisease] = useState("");

  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string, noneId = "none") => {
    if (id === noneId) {
      setList([noneId]);
      return;
    }
    const without = list.filter((i) => i !== noneId);
    setList(without.includes(id) ? without.filter((i) => i !== id) : [...without, id]);
  };

  const canNext = () => {
    switch (step) {
      case 0: return lifestyle !== "";
      case 1: return mealsPerDay > 0;
      case 2: return mealTimes.trim() !== "";
      case 3: return allergies.length > 0;
      case 4: return digestiveIssues.length > 0;
      case 5: return diseases.length > 0;
      default: return false;
    }
  };

  const handleSubmit = () => {
    onSubmit({ lifestyle, mealsPerDay, mealTimes, allergies, otherAllergy, digestiveIssues, otherDigestive, diseases, otherDisease });
    resetForm();
  };

  const resetForm = () => {
    setStep(0);
    setLifestyle("");
    setMealsPerDay(0);
    setMealTimes("");
    setAllergies([]);
    setOtherAllergy("");
    setDigestiveIssues([]);
    setOtherDigestive("");
    setDiseases([]);
    setOtherDisease("");
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const currentStep = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide text-center text-base">
            {currentStep.emoji} {currentStep.title}
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute left-0 top-0 h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-center text-muted-foreground -mt-1">
          Paso {step + 1} de {STEPS.length}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 0: Lifestyle */}
            {step === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  ¿Cómo describirías tu ritmo de vida diario?
                </p>
                {LIFESTYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLifestyle(opt.value)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      lifestyle === opt.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    {lifestyle === opt.value && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}

            {/* Step 1: Meals per day */}
            {step === 1 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  ¿Cuántas comidas puedes hacer al día?
                </p>
                {MEAL_OPTIONS.map((mc) => (
                  <button
                    key={mc.value}
                    onClick={() => setMealsPerDay(mc.value)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                      mealsPerDay === mc.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{mc.label}</p>
                      <p className="text-xs text-muted-foreground">{mc.desc}</p>
                    </div>
                    {mealsPerDay === mc.value ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Utensils className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Meal times */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Descríbeme tus horarios de comida y disponibilidad para preparar alimentos
                </p>
                <Textarea
                  value={mealTimes}
                  onChange={(e) => setMealTimes(e.target.value)}
                  placeholder="Ej: Desayuno 7am antes del trabajo, almuerzo 1pm en oficina (tupper), cena 8pm en casa. Tengo poco tiempo para cocinar entre semana..."
                  className="min-h-[120px] text-sm"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{mealTimes.length}/500</p>
              </div>
            )}

            {/* Step 3: Allergies */}
            {step === 3 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  ¿Tienes alguna alergia o intolerancia alimentaria?
                </p>
                {ALLERGY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleItem(allergies, setAllergies, opt.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                      allergies.includes(opt.id)
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="flex-1 text-sm text-foreground">{opt.label}</span>
                    {allergies.includes(opt.id) && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
                {!allergies.includes("none") && (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Otra alergia (opcional)</Label>
                    <Input
                      value={otherAllergy}
                      onChange={(e) => setOtherAllergy(e.target.value)}
                      placeholder="Escribe aquí si tienes otra alergia..."
                      className="text-sm mt-1"
                      maxLength={200}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Digestive issues */}
            {step === 4 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  ¿Padeces alguna patología digestiva?
                </p>
                {DIGESTIVE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleItem(digestiveIssues, setDigestiveIssues, opt.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                      digestiveIssues.includes(opt.id)
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="flex-1 text-sm text-foreground">{opt.label}</span>
                    {digestiveIssues.includes(opt.id) && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
                {!digestiveIssues.includes("none") && (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Otra patología (opcional)</Label>
                    <Input
                      value={otherDigestive}
                      onChange={(e) => setOtherDigestive(e.target.value)}
                      placeholder="Escribe aquí si tienes otra condición..."
                      className="text-sm mt-1"
                      maxLength={200}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Diseases */}
            {step === 5 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  ¿Tienes alguna condición de salud que debamos considerar?
                </p>
                {DISEASE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleItem(diseases, setDiseases, opt.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                      diseases.includes(opt.id)
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="flex-1 text-sm text-foreground">{opt.label}</span>
                    {diseases.includes(opt.id) && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
                {!diseases.includes("none") && (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Otra condición (opcional)</Label>
                    <Input
                      value={otherDisease}
                      onChange={(e) => setOtherDisease(e.target.value)}
                      placeholder="Escribe aquí si tienes otra condición..."
                      className="text-sm mt-1"
                      maxLength={200}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-2 mt-2">
          {step > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(step - 1)}
              className="gap-1 font-display tracking-wider text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              ATRÁS
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="gap-1 font-display tracking-wider text-xs"
            >
              SIGUIENTE
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canNext()}
              className="gap-1 font-display tracking-wider text-xs"
            >
              🔥 GENERAR MI DIETA
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DietQuestionnaire;
