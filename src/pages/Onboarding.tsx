import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { calculateTDEE, calculateMacros, type ActivityLevel } from "@/lib/nutrition";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Zap } from "lucide-react";

const STEPS = ["Datos básicos", "Medidas", "Actividad", "Tu plan"];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "sedentary", label: "Sedentario", desc: "Trabajo de escritorio, poco ejercicio" },
  { value: "light", label: "Ligero", desc: "Ejercicio 1-3 días/semana" },
  { value: "moderate", label: "Moderado", desc: "Ejercicio 3-5 días/semana" },
  { value: "active", label: "Activo", desc: "Ejercicio 6-7 días/semana" },
  { value: "very_active", label: "Muy activo", desc: "Ejercicio intenso diario + trabajo físico" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState<ActivityLevel | "">("");

  const canNext = () => {
    if (step === 0) return age && sex;
    if (step === 1) return weight && height;
    if (step === 2) return activity;
    return true;
  };

  const tdee = sex && weight && height && age && activity
    ? calculateTDEE(sex, Number(weight), Number(height), Number(age), activity as ActivityLevel)
    : 0;
  const macros = tdee && weight ? calculateMacros(tdee, Number(weight)) : null;

  const handleFinish = async () => {
    if (!user || !macros) return;
    setSaving(true);
    try {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const { error } = await supabase
        .from("profiles" as any)
        .update({
          age: Number(age),
          sex,
          weight_kg: Number(weight),
          height_cm: Number(height),
          activity_level: activity,
          goal: "fat_loss",
          target_calories: macros.targetCalories,
          target_protein: macros.proteinG,
          target_carbs: macros.carbsG,
          target_fat: macros.fatG,
          onboarding_completed: true,
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("¡Plan creado! A dominar 💪");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Error guardando datos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pb-8 pt-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? "text-primary font-medium" : ""}>{s}</span>
          ))}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="font-display text-3xl tracking-wide text-foreground">¿QUIÉN ERES, MÁQUINA?</h2>
              <div className="space-y-2">
                <Label className="text-foreground">Edad</Label>
                <Input
                  type="number"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="border-border bg-card text-foreground text-lg"
                  min={14}
                  max={99}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Sexo</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["male", "female"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={`rounded-lg border p-4 text-center font-display text-lg tracking-wide transition-all ${
                        sex === s
                          ? "border-primary bg-primary/10 text-primary box-glow"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {s === "male" ? "HOMBRE" : "MUJER"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-display text-3xl tracking-wide text-foreground">TUS MEDIDAS</h2>
              <div className="space-y-2">
                <Label className="text-foreground">Peso (kg)</Label>
                <Input
                  type="number"
                  placeholder="75"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="border-border bg-card text-foreground text-lg"
                  min={30}
                  max={300}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Altura (cm)</Label>
                <Input
                  type="number"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="border-border bg-card text-foreground text-lg"
                  min={100}
                  max={250}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-3xl tracking-wide text-foreground">NIVEL DE ACTIVIDAD</h2>
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActivity(opt.value)}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    activity === opt.value
                      ? "border-primary bg-primary/10 box-glow"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <p className={`font-medium ${activity === opt.value ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 3 && macros && (
            <div className="space-y-6">
              <h2 className="font-display text-3xl tracking-wide text-foreground">TU PLAN ELITE 🔥</h2>
              <p className="text-sm text-muted-foreground">
                TDEE: {tdee} kcal → Déficit 22.5% → <span className="text-primary font-bold">{macros.targetCalories} kcal/día</span>
              </p>
              <div className="grid grid-cols-1 gap-3">
                <ResultCard label="CALORÍAS" value={`${macros.targetCalories}`} unit="kcal/día" color="text-primary" />
                <ResultCard label="PROTEÍNA" value={`${macros.proteinG}`} unit={`g/día (${(Number(weight) * 2.4).toFixed(0)}g = 2.4g/kg)`} color="text-protein" />
                <ResultCard label="CARBOHIDRATOS" value={`${macros.carbsG}`} unit="g/día" color="text-carbs" />
                <ResultCard label="GRASAS" value={`${macros.fatG}`} unit="g/día" color="text-fat" />
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs text-primary">
                  <Zap className="mr-1 inline h-3 w-3" />
                  Proteína alta = preservas músculo mientras quemas grasa. ¡Ese es el camino, causa! 💪
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">
            <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
          </Button>
        )}
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex-1 font-display tracking-wider box-glow"
          >
            Siguiente <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={saving}
            className="flex-1 font-display tracking-wider box-glow"
          >
            {saving ? "GUARDANDO..." : "¡COMENZAR A DOMINAR! 🔥"}
          </Button>
        )}
      </div>
    </div>
  );
};

const ResultCard = ({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-sans text-2xl font-bold ${color}`}>
      {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
    </p>
  </div>
);

export default Onboarding;
