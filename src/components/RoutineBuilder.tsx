import { useState } from "react";
import { Dumbbell, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const FREQUENCIES = [
  { value: 2, label: "2 días", desc: "Principiante / poco tiempo" },
  { value: 3, label: "3 días", desc: "Fullbody equilibrado" },
  { value: 4, label: "4 días", desc: "Upper / Lower split" },
  { value: 5, label: "5 días", desc: "Push / Pull / Legs" },
  { value: 6, label: "6 días", desc: "Avanzado intensivo" },
];

const MUSCLE_ZONES = [
  { id: "pecho", label: "Pecho", emoji: "🫁" },
  { id: "espalda", label: "Espalda", emoji: "🔙" },
  { id: "hombros", label: "Hombros", emoji: "💪" },
  { id: "brazos", label: "Brazos (bíceps/tríceps)", emoji: "💪" },
  { id: "piernas", label: "Piernas (cuádriceps/femoral)", emoji: "🦵" },
  { id: "gluteos", label: "Glúteos", emoji: "🍑" },
  { id: "core", label: "Core / Abdominales", emoji: "🎯" },
  { id: "fullbody", label: "Todo el cuerpo parejo", emoji: "🏋️" },
];

const LEVELS = [
  { value: "principiante", label: "Principiante", desc: "0-6 meses entrenando", emoji: "🌱" },
  { value: "intermedio", label: "Intermedio", desc: "6 meses - 2 años", emoji: "⚡" },
  { value: "avanzado", label: "Avanzado", desc: "Más de 2 años", emoji: "🔥" },
];

const RESTRICTIONS = [
  { id: "lesion_rodilla", label: "Lesión de rodilla" },
  { id: "lesion_hombro", label: "Lesión de hombro" },
  { id: "lesion_espalda", label: "Dolor lumbar / espalda" },
  { id: "cardiacos", label: "Antecedentes cardíacos" },
  { id: "diabetes", label: "Diabetes" },
  { id: "hipertension", label: "Hipertensión" },
  { id: "embarazo", label: "Embarazo / postparto" },
  { id: "ninguna", label: "Ninguna restricción" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (prompt: string) => void;
}

const RoutineBuilder = ({ open, onOpenChange, onSubmit }: Props) => {
  const [step, setStep] = useState(0);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [zones, setZones] = useState<string[]>([]);
  const [level, setLevel] = useState<string | null>(null);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [otherRestriction, setOtherRestriction] = useState("");

  const totalSteps = 4;

  const toggleZone = (id: string) => {
    if (id === "fullbody") {
      setZones(zones.includes("fullbody") ? [] : ["fullbody"]);
      return;
    }
    setZones((prev) =>
      prev.filter((z) => z !== "fullbody").includes(id)
        ? prev.filter((z) => z !== id)
        : [...prev.filter((z) => z !== "fullbody"), id]
    );
  };

  const toggleRestriction = (id: string) => {
    if (id === "ninguna") {
      setRestrictions(restrictions.includes("ninguna") ? [] : ["ninguna"]);
      return;
    }
    setRestrictions((prev) =>
      prev.filter((r) => r !== "ninguna").includes(id)
        ? prev.filter((r) => r !== id)
        : [...prev.filter((r) => r !== "ninguna"), id]
    );
  };

  const canNext = () => {
    if (step === 0) return frequency !== null;
    if (step === 1) return zones.length > 0;
    if (step === 2) return level !== null;
    if (step === 3) return restrictions.length > 0;
    return false;
  };

  const handleSubmit = () => {
    const zoneLabels = zones.map((z) => MUSCLE_ZONES.find((m) => m.id === z)?.label || z).join(", ");
    const levelLabel = LEVELS.find((l) => l.value === level)?.label || level;
    const restrictionLabels = restrictions
      .map((r) => {
        if (r === "ninguna") return "Ninguna";
        return RESTRICTIONS.find((x) => x.id === r)?.label || r;
      })
      .join(", ");
    const extra = otherRestriction.trim() ? ` | Otras: ${otherRestriction.trim()}` : "";

    const prompt = `Quiero que me armes mi rutina ideal personalizada con estos datos:

📅 **Frecuencia:** ${frequency} días a la semana
🎯 **Zonas a mejorar:** ${zoneLabels}
📊 **Nivel:** ${levelLabel}
⚠️ **Restricciones de salud:** ${restrictionLabels}${extra}

Por favor genera una rutina completa y detallada con tablas, series, repeticiones, descansos y tips. Ajusta el volumen e intensidad según mi nivel y restricciones para no poner en riesgo mi salud.`;

    onSubmit(prompt);
    onOpenChange(false);
    // Reset
    setStep(0);
    setFrequency(null);
    setZones([]);
    setLevel(null);
    setRestrictions([]);
    setOtherRestriction("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card text-foreground max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wider text-primary">
            <Dumbbell className="h-5 w-5" /> ARMEMOS TU RUTINA IDEAL
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Paso {step + 1} de {totalSteps}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 0: Frequency */}
        {step === 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              ¿Cuántos días a la semana piensas ir al gimnasio? 🏋️
            </Label>
            <div className="grid gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    frequency === f.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  <div>
                    <span className="font-semibold">{f.label}</span>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                  {frequency === f.value && <div className="h-3 w-3 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Muscle zones */}
        {step === 1 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              ¿Qué zonas musculares quieres mejorar? 🎯
            </Label>
            <p className="text-xs text-muted-foreground">Puedes seleccionar varias</p>
            <div className="grid grid-cols-2 gap-2">
              {MUSCLE_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => toggleZone(zone.id)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                    zones.includes(zone.id)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  <span>{zone.emoji}</span>
                  <span className="font-medium">{zone.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Level */}
        {step === 2 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              ¿Cuál es tu nivel de entrenamiento? 📊
            </Label>
            <div className="grid gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    level === l.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{l.emoji}</span>
                    <div>
                      <span className="font-semibold">{l.label}</span>
                      <p className="text-xs text-muted-foreground">{l.desc}</p>
                    </div>
                  </div>
                  {level === l.value && <div className="h-3 w-3 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Restrictions */}
        {step === 3 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ¿Tienes alguna restricción de salud?
            </Label>
            <p className="text-xs text-muted-foreground">
              Esto es importante para ajustar tu rutina y proteger tu salud
            </p>
            <div className="grid grid-cols-2 gap-2">
              {RESTRICTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleRestriction(r.id)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                    restrictions.includes(r.id)
                      ? r.id === "ninguna"
                        ? "border-green-500 bg-green-500/10 text-foreground"
                        : "border-yellow-500 bg-yellow-500/10 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={restrictions.includes(r.id)}
                    className="pointer-events-none"
                  />
                  <span className="font-medium">{r.label}</span>
                </button>
              ))}
            </div>
            {!restrictions.includes("ninguna") && (
              <div>
                <Label className="text-xs text-muted-foreground">Otras restricciones (opcional):</Label>
                <Textarea
                  value={otherRestriction}
                  onChange={(e) => setOtherRestriction(e.target.value)}
                  placeholder="Ej: tengo hernia discal L5-S1..."
                  className="mt-1 h-16 border-border bg-background text-foreground text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
          </Button>
          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="box-glow"
            >
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canNext()}
              className="box-glow"
            >
              <Dumbbell className="mr-1 h-4 w-4" /> Generar Rutina 🔥
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoutineBuilder;
