import { useState, useEffect } from "react";
import { Ruler, Plus, Trash2, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Measurement = {
  id: string;
  date: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
  notes: string | null;
  created_at: string;
};

const FIELDS = [
  { key: "weight_kg", label: "Peso (kg)", icon: "⚖️" },
  { key: "body_fat_percent", label: "% Grasa", icon: "📊" },
  { key: "muscle_mass_kg", label: "Masa Muscular (kg)", icon: "💪" },
  { key: "chest_cm", label: "Pecho (cm)", icon: "📏" },
  { key: "waist_cm", label: "Cintura (cm)", icon: "📏" },
  { key: "hip_cm", label: "Cadera (cm)", icon: "📏" },
  { key: "arm_cm", label: "Brazo (cm)", icon: "💪" },
  { key: "thigh_cm", label: "Muslo (cm)", icon: "🦵" },
  { key: "calf_cm", label: "Pantorrilla (cm)", icon: "🦵" },
] as const;

export default function BodyMeasurementsTracker({ userId }: { userId: string }) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fetchMeasurements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50);
    setMeasurements((data as any[] || []) as Measurement[]);
    setLoading(false);
  };

  useEffect(() => { fetchMeasurements(); }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    const record: any = { user_id: userId, date: form.date || new Date().toISOString().split("T")[0] };
    FIELDS.forEach(f => {
      if (form[f.key]) record[f.key] = parseFloat(form[f.key]);
    });
    if (form.notes) record.notes = form.notes;

    const { error } = await supabase.from("body_measurements").insert(record as any);
    if (error) {
      toast.error("Error guardando medidas");
    } else {
      toast.success("📏 Medidas registradas!");
      setForm({});
      setShowForm(false);
      fetchMeasurements();
    }
    setSaving(false);
  };

  const deleteMeasurement = async (id: string) => {
    await supabase.from("body_measurements").delete().eq("id", id);
    toast.success("Registro eliminado");
    fetchMeasurements();
  };

  // Chart data for weight & muscle mass
  const chartData = [...measurements]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(m => ({
      date: new Date(m.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }),
      peso: m.weight_kg ? Number(m.weight_kg) : null,
      musculo: m.muscle_mass_kg ? Number(m.muscle_mass_kg) : null,
      grasa: m.body_fat_percent ? Number(m.body_fat_percent) : null,
    }));

  const getDelta = (key: keyof Measurement) => {
    if (measurements.length < 2) return null;
    const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0][key];
    const last = sorted[sorted.length - 1][key];
    if (first == null || last == null) return null;
    return (Number(last) - Number(first)).toFixed(1);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      {measurements.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Peso", key: "weight_kg" as keyof Measurement, unit: "kg", inverse: true },
            { label: "% Grasa", key: "body_fat_percent" as keyof Measurement, unit: "%", inverse: true },
            { label: "Músculo", key: "muscle_mass_kg" as keyof Measurement, unit: "kg", inverse: false },
          ].map(stat => {
            const latest = measurements[0]?.[stat.key];
            const delta = getDelta(stat.key);
            return (
              <div key={stat.key} className="rounded-lg border border-border bg-card/80 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">
                  {latest != null ? `${Number(latest)}${stat.unit}` : "—"}
                </p>
                {delta && (
                  <div className={`flex items-center justify-center gap-0.5 text-[10px] font-bold ${
                    (stat.inverse ? Number(delta) < 0 : Number(delta) > 0) ? "text-green-400" : Number(delta) === 0 ? "text-muted-foreground" : "text-red-400"
                  }`}>
                    {Number(delta) > 0 ? <TrendingUp className="h-3 w-3" /> : Number(delta) < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                    {Number(delta) > 0 ? "+" : ""}{delta}{stat.unit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="rounded-lg border border-border bg-card/80 p-3">
          <p className="mb-2 text-xs font-bold text-muted-foreground">EVOLUCIÓN</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: 11 }} />
                <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Peso (kg)" connectNulls />
                <Line type="monotone" dataKey="musculo" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Músculo (kg)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex justify-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary inline-block" />Peso</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" />Músculo</span>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full gap-2 font-display tracking-wider" size="sm">
          <Plus className="h-4 w-4" /> REGISTRAR MEDIDAS
        </Button>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-lg border border-primary/30 bg-card/90 p-4 space-y-3">
            <div>
              <Label className="text-xs">Fecha</Label>
              <Input type="date" value={form.date || new Date().toISOString().split("T")[0]} onChange={e => setForm({ ...form, date: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <Label className="text-[10px]">{f.icon} {f.label}</Label>
                  <Input type="number" step="0.1" placeholder="0" value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="h-8 text-sm" />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea placeholder="Observaciones..." value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} className="text-sm min-h-[60px]" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 font-display tracking-wider" size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "GUARDAR"}
              </Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setForm({}); }} size="sm" className="flex-1">
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {measurements.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">HISTORIAL</p>
          {measurements.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card/80 p-3">
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-xs font-bold text-foreground">
                  {new Date(m.date).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteMeasurement(m.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {m.weight_kg != null && <span className="text-[10px] text-muted-foreground">⚖️ {Number(m.weight_kg)}kg</span>}
                {m.body_fat_percent != null && <span className="text-[10px] text-muted-foreground">📊 {Number(m.body_fat_percent)}%</span>}
                {m.muscle_mass_kg != null && <span className="text-[10px] text-muted-foreground">💪 {Number(m.muscle_mass_kg)}kg</span>}
                {m.chest_cm != null && <span className="text-[10px] text-muted-foreground">Pecho {Number(m.chest_cm)}cm</span>}
                {m.waist_cm != null && <span className="text-[10px] text-muted-foreground">Cintura {Number(m.waist_cm)}cm</span>}
                {m.hip_cm != null && <span className="text-[10px] text-muted-foreground">Cadera {Number(m.hip_cm)}cm</span>}
                {m.arm_cm != null && <span className="text-[10px] text-muted-foreground">Brazo {Number(m.arm_cm)}cm</span>}
                {m.thigh_cm != null && <span className="text-[10px] text-muted-foreground">Muslo {Number(m.thigh_cm)}cm</span>}
                {m.calf_cm != null && <span className="text-[10px] text-muted-foreground">Pantorrilla {Number(m.calf_cm)}cm</span>}
              </div>
              {m.notes && <p className="mt-1 text-[10px] text-muted-foreground/70 italic">{m.notes}</p>}
            </motion.div>
          ))}
        </div>
      )}

      {measurements.length === 0 && !showForm && (
        <div className="flex flex-col items-center py-8">
          <Ruler className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aún no tienes medidas registradas</p>
          <p className="text-xs text-muted-foreground/60">Registra tus medidas para ver tu evolución</p>
        </div>
      )}
    </div>
  );
}
