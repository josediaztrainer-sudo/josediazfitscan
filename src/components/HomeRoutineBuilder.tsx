import { useState } from "react";
import { Home, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const FREQUENCIES = [
  { value: 2, label: "2 días", desc: "Inicio suave / poco tiempo" },
  { value: 3, label: "3 días", desc: "Fullbody equilibrado" },
  { value: 4, label: "4 días", desc: "Alternando grupos musculares" },
  { value: 5, label: "5 días", desc: "Alta frecuencia en casa" },
  { value: 6, label: "6 días", desc: "Intensivo con 1 día descanso" },
];

const FOCUS_AREAS = [
  { id: "tonificar", label: "Tonificar todo el cuerpo", emoji: "✨" },
  { id: "piernas_gluteos", label: "Piernas y glúteos", emoji: "🍑" },
  { id: "core", label: "Core / Abdominales", emoji: "🎯" },
  { id: "brazos_pecho", label: "Brazos y pecho", emoji: "💪" },
  { id: "espalda", label: "Espalda y postura", emoji: "🔙" },
  { id: "cardio_grasa", label: "Cardio / Quemar grasa", emoji: "🔥" },
  { id: "flexibilidad", label: "Flexibilidad y movilidad", emoji: "🧘" },
  { id: "fullbody", label: "Todo el cuerpo parejo", emoji: "🏋️" },
];

const LEVELS = [
  { value: "principiante", label: "Principiante", desc: "Recién empezando", emoji: "🌱" },
  { value: "intermedio", label: "Intermedio", desc: "Llevo algunos meses", emoji: "⚡" },
  { value: "avanzado", label: "Avanzado", desc: "Entreno regularmente", emoji: "🔥" },
];

const EQUIPMENT = [
  { id: "nada", label: "Sin equipamiento (solo cuerpo)" },
  { id: "mancuernas", label: "Mancuernas o botellas con agua" },
  { id: "bandas", label: "Bandas elásticas" },
  { id: "silla", label: "Silla o banco" },
  { id: "barra", label: "Barra de dominadas" },
  { id: "mochila", label: "Mochila con peso (libros)" },
  { id: "colchoneta", label: "Colchoneta / mat" },
];

const RESTRICTIONS = [
  { id: "lesion_rodilla", label: "Lesión de rodilla" },
  { id: "lesion_hombro", label: "Lesión de hombro" },
  { id: "lesion_espalda", label: "Dolor lumbar / espalda" },
  { id: "cardiacos", label: "Antecedentes cardíacos" },
  { id: "embarazo", label: "Embarazo / postparto" },
  { id: "ninguna", label: "Ninguna restricción" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (prompt: string) => void;
}

const HomeRoutineBuilder = ({ open, onOpenChange, onSubmit }: Props) => {
  const [step, setStep] = useState(0);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [level, setLevel] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [otherRestriction, setOtherRestriction] = useState("");

  const totalSteps = 5;

  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    id: string,
    exclusiveId?: string
  ) => {
    if (exclusiveId && id === exclusiveId) {
      setList(list.includes(exclusiveId) ? [] : [exclusiveId]);
      return;
    }
    setList((prev) =>
      (exclusiveId ? prev.filter((x) => x !== exclusiveId) : prev).includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev.filter((x) => (exclusiveId ? x !== exclusiveId : true)), id]
    );
  };

  const canNext = () => {
    if (step === 0) return frequency !== null;
    if (step === 1) return areas.length > 0;
    if (step === 2) return level !== null;
    if (step === 3) return equipment.length > 0;
    if (step === 4) return restrictions.length > 0;
    return false;
  };

  const handleSubmit = () => {
    const areaLabels = areas.map((a) => FOCUS_AREAS.find((f) => f.id === a)?.label || a).join(", ");
    const levelLabel = LEVELS.find((l) => l.value === level)?.label || level;
    const equipLabels = equipment.map((e) => EQUIPMENT.find((eq) => eq.id === e)?.label || e).join(", ");
    const restrictionLabels = restrictions
      .map((r) => (r === "ninguna" ? "Ninguna" : RESTRICTIONS.find((x) => x.id === r)?.label || r))
      .join(", ");
    const extra = otherRestriction.trim() ? ` | Otras: ${otherRestriction.trim()}` : "";

    const prompt = `Quiero que me armes una RUTINA PARA ENTRENAR EN CASA con estos datos:

🏠 **Lugar:** EN CASA (sin gimnasio)
📅 **Frecuencia:** ${frequency} días a la semana
🎯 **Enfoque:** ${areaLabels}
📊 **Nivel:** ${levelLabel}
🧰 **Equipamiento disponible:** ${equipLabels}
⚠️ **Restricciones de salud:** ${restrictionLabels}${extra}

Por favor genera una rutina COMPLETA EN CASA con ejercicios bodyweight y/o con el equipamiento que tengo. Incluye tablas con series, repeticiones, descansos, progresiones por nivel y tips. Incluye variantes más fáciles y más difíciles para cada ejercicio. Todos los ejercicios deben tener enlace de video de YouTube EN ESPAÑOL. Si tengo restricciones, adapta los ejercicios para no poner en riesgo mi salud.`;

    onSubmit(prompt);
    onOpenChange(false);
    setStep(0);
    setFrequency(null);
    setAreas([]);
    setLevel(null);
    setEquipment([]);
    setRestrictions([]);
    setOtherRestriction("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card text-foreground max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wider text-primary">
            <Home className="h-5 w-5" /> RUTINA EN CASA 🏠
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
              ¿Cuántos días a la semana quieres entrenar en casa? 🏠
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

        {/* Step 1: Focus areas */}
        {step === 1 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              ¿Qué quieres trabajar? 🎯
            </Label>
            <p className="text-xs text-muted-foreground">Puedes seleccionar varias opciones</p>
            <div className="grid grid-cols-2 gap-2">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area.id}
                  onClick={() => toggleItem(areas, setAreas, area.id, "fullbody")}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                    areas.includes(area.id)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  <span>{area.emoji}</span>
                  <span className="font-medium">{area.label}</span>
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

        {/* Step 3: Equipment */}
        {step === 3 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">
              ¿Qué equipamiento tienes en casa? 🧰
            </Label>
            <p className="text-xs text-muted-foreground">Selecciona todo lo que tengas disponible</p>
            <div className="grid gap-2">
              {EQUIPMENT.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => toggleItem(equipment, setEquipment, eq.id, "nada")}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                    equipment.includes(eq.id)
                      ? eq.id === "nada"
                        ? "border-green-500 bg-green-500/10 text-foreground"
                        : "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  <Checkbox checked={equipment.includes(eq.id)} className="pointer-events-none" />
                  <span className="font-medium">{eq.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Restrictions */}
        {step === 4 && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ¿Tienes alguna restricción de salud?
            </Label>
            <p className="text-xs text-muted-foreground">
              Importante para adaptar los ejercicios y proteger tu salud
            </p>
            <div className="grid grid-cols-2 gap-2">
              {RESTRICTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleItem(restrictions, setRestrictions, r.id, "ninguna")}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                    restrictions.includes(r.id)
                      ? r.id === "ninguna"
                        ? "border-green-500 bg-green-500/10 text-foreground"
                        : "border-yellow-500 bg-yellow-500/10 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  <Checkbox checked={restrictions.includes(r.id)} className="pointer-events-none" />
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
              <Home className="mr-1 h-4 w-4" /> Generar Rutina 🏠🔥
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HomeRoutineBuilder;
