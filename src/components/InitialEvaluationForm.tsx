import { useState, useEffect } from "react";
import { ClipboardList, Loader2, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Evaluation = {
  id: string;
  objectives: string | null;
  medical_restrictions: string | null;
  injuries: string | null;
  food_allergies: string | null;
  medications: string | null;
  experience_level: string | null;
  sleep_hours: number | null;
  stress_level: string | null;
  daily_water_liters: number | null;
  sports_history: string | null;
  additional_notes: string | null;
  updated_at: string;
};

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Principiante (0-6 meses)" },
  { value: "intermediate", label: "Intermedio (6-24 meses)" },
  { value: "advanced", label: "Avanzado (2+ años)" },
  { value: "athlete", label: "Atleta / Competidor" },
];

const STRESS_OPTIONS = [
  { value: "low", label: "Bajo" },
  { value: "medium", label: "Moderado" },
  { value: "high", label: "Alto" },
  { value: "very_high", label: "Muy alto" },
];

export default function InitialEvaluationForm({ userId }: { userId: string }) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const fetchEvaluation = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("initial_evaluations")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const eval_ = data as any as Evaluation | null;
    setEvaluation(eval_);
    if (eval_) {
      setForm({
        objectives: eval_.objectives || "",
        medical_restrictions: eval_.medical_restrictions || "",
        injuries: eval_.injuries || "",
        food_allergies: eval_.food_allergies || "",
        medications: eval_.medications || "",
        experience_level: eval_.experience_level || "beginner",
        sleep_hours: eval_.sleep_hours != null ? String(eval_.sleep_hours) : "",
        stress_level: eval_.stress_level || "medium",
        daily_water_liters: eval_.daily_water_liters != null ? String(eval_.daily_water_liters) : "",
        sports_history: eval_.sports_history || "",
        additional_notes: eval_.additional_notes || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvaluation(); }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    const record: any = {
      user_id: userId,
      objectives: form.objectives || null,
      medical_restrictions: form.medical_restrictions || null,
      injuries: form.injuries || null,
      food_allergies: form.food_allergies || null,
      medications: form.medications || null,
      experience_level: form.experience_level || "beginner",
      sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
      stress_level: form.stress_level || "medium",
      daily_water_liters: form.daily_water_liters ? parseFloat(form.daily_water_liters) : null,
      sports_history: form.sports_history || null,
      additional_notes: form.additional_notes || null,
    };

    let error;
    if (evaluation) {
      const res = await supabase.from("initial_evaluations").update(record as any).eq("id", evaluation.id);
      error = res.error;
    } else {
      const res = await supabase.from("initial_evaluations").insert(record as any);
      error = res.error;
    }

    if (error) {
      toast.error("Error guardando evaluación");
    } else {
      toast.success("✅ Evaluación guardada!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      fetchEvaluation();
    }
    setSaving(false);
  };

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {evaluation && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <p className="text-xs text-green-400">
            Evaluación completada · Última actualización: {new Date(evaluation.updated_at).toLocaleDateString("es-PE")}
          </p>
        </div>
      )}

      {/* Objectives */}
      <div className="rounded-lg border border-border bg-card/80 p-3 space-y-3">
        <p className="text-xs font-bold text-primary flex items-center gap-1.5">🎯 OBJETIVOS</p>
        <div>
          <Label className="text-[10px] text-muted-foreground">¿Cuáles son tus objetivos principales?</Label>
          <Textarea placeholder="Ej: Bajar grasa corporal, ganar masa muscular, mejorar resistencia..." value={form.objectives || ""} onChange={e => set("objectives", e.target.value)} className="text-sm min-h-[70px]" />
        </div>
      </div>

      {/* Medical */}
      <div className="rounded-lg border border-border bg-card/80 p-3 space-y-3">
        <p className="text-xs font-bold text-primary flex items-center gap-1.5">🏥 HISTORIAL MÉDICO</p>
        <div>
          <Label className="text-[10px] text-muted-foreground">Restricciones médicas</Label>
          <Textarea placeholder="Ej: Hipertensión, diabetes, problemas cardíacos..." value={form.medical_restrictions || ""} onChange={e => set("medical_restrictions", e.target.value)} className="text-sm min-h-[60px]" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Lesiones previas o actuales</Label>
          <Textarea placeholder="Ej: Lesión de rodilla, dolor lumbar, tendinitis..." value={form.injuries || ""} onChange={e => set("injuries", e.target.value)} className="text-sm min-h-[60px]" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Medicamentos actuales</Label>
          <Input placeholder="Ej: Metformina, Ibuprofeno..." value={form.medications || ""} onChange={e => set("medications", e.target.value)} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Alergias alimentarias</Label>
          <Input placeholder="Ej: Lactosa, gluten, maní..." value={form.food_allergies || ""} onChange={e => set("food_allergies", e.target.value)} className="h-9 text-sm" />
        </div>
      </div>

      {/* Lifestyle */}
      <div className="rounded-lg border border-border bg-card/80 p-3 space-y-3">
        <p className="text-xs font-bold text-primary flex items-center gap-1.5">🧬 ESTILO DE VIDA</p>
        <div>
          <Label className="text-[10px] text-muted-foreground">Nivel de experiencia</Label>
          <Select value={form.experience_level || "beginner"} onValueChange={v => set("experience_level", v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPERIENCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">😴 Horas de sueño/día</Label>
            <Input type="number" step="0.5" placeholder="7" value={form.sleep_hours || ""} onChange={e => set("sleep_hours", e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">💧 Litros de agua/día</Label>
            <Input type="number" step="0.5" placeholder="2" value={form.daily_water_liters || ""} onChange={e => set("daily_water_liters", e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">🧠 Nivel de estrés</Label>
          <Select value={form.stress_level || "medium"} onValueChange={v => set("stress_level", v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STRESS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">🏅 Historial deportivo</Label>
          <Textarea placeholder="Ej: 2 años de gimnasio, corría maratones, natación competitiva..." value={form.sports_history || ""} onChange={e => set("sports_history", e.target.value)} className="text-sm min-h-[60px]" />
        </div>
      </div>

      {/* Additional */}
      <div className="rounded-lg border border-border bg-card/80 p-3">
        <Label className="text-[10px] text-muted-foreground">📝 Notas adicionales</Label>
        <Textarea placeholder="Cualquier información adicional relevante..." value={form.additional_notes || ""} onChange={e => set("additional_notes", e.target.value)} className="text-sm min-h-[60px]" />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2 font-display tracking-wider box-glow">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saving ? "GUARDANDO..." : saved ? "¡GUARDADO!" : evaluation ? "ACTUALIZAR EVALUACIÓN" : "GUARDAR EVALUACIÓN"}
      </Button>
    </motion.div>
  );
}
