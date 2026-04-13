import { useState, useEffect, useMemo } from "react";
import { Scale, Flame, Trophy, TrendingDown, TrendingUp, ChevronRight, Zap, Target, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── U.S. Navy Body Fat Formula ──────────────────────────
function calcBodyFatNavy(
  sex: "male" | "female",
  waistCm: number,
  neckCm: number,
  heightCm: number,
  hipCm?: number
): number {
  if (sex === "male") {
    // BF% = 86.010 × log10(waist − neck) − 70.041 × log10(height) + 36.76
    const bf = 86.01 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
    return Math.max(0, Math.round(bf * 10) / 10);
  } else {
    if (!hipCm) return 0;
    // BF% = 163.205 × log10(waist + hip − neck) − 97.684 × log10(height) − 78.387
    const bf = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
    return Math.max(0, Math.round(bf * 10) / 10);
  }
}

type CheckInRecord = {
  id: string;
  date: string;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  neck_cm: number | null;
  body_fat_percent: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
};

const MOTIVATIONAL_PHRASES = [
  "💪 ¡Cada semana cuenta! Tu constancia es tu superpoder.",
  "🔥 ¡Sigue así! Los resultados llegan para los disciplinados.",
  "🏆 ¡Registra y conquista! Tu futuro yo te lo agradecerá.",
  "⚡ ¡La transformación es un proceso, no un evento!",
  "🎯 ¡Mide, mejora, repite! Esa es la fórmula del éxito.",
];

export default function WeeklyCheckIn({ userId, sex, heightCm }: { userId: string; sex: "male" | "female"; heightCm: number }) {
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("body_measurements")
      .select("id, date, weight_kg, waist_cm, hip_cm, neck_cm, body_fat_percent, chest_cm, arm_cm, thigh_cm")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(52);
    setRecords((data as any[] || []) as CheckInRecord[]);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, [userId]);

  // ─── Streak calculation ──────────────────────────
  const streak = useMemo(() => {
    if (records.length === 0) return 0;
    let count = 0;
    const now = new Date();
    for (let i = 0; i < records.length; i++) {
      const recDate = new Date(records[i].date);
      const weekDiff = Math.floor((now.getTime() - recDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weekDiff === count) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [records]);

  // ─── Compute body fat from form ──────────────────
  const computedBF = useMemo(() => {
    const waist = Number(form.waist_cm);
    const neck = Number(form.neck_cm);
    const hip = Number(form.hip_cm);
    if (!waist || !neck || !heightCm) return null;
    if (sex === "female" && !hip) return null;
    return calcBodyFatNavy(sex, waist, neck, heightCm, hip || undefined);
  }, [form.waist_cm, form.neck_cm, form.hip_cm, sex, heightCm]);

  const handleSave = async () => {
    setSaving(true);
    const record: any = {
      user_id: userId,
      date: new Date().toISOString().split("T")[0],
    };
    if (form.weight_kg) record.weight_kg = parseFloat(form.weight_kg);
    if (form.waist_cm) record.waist_cm = parseFloat(form.waist_cm);
    if (form.hip_cm) record.hip_cm = parseFloat(form.hip_cm);
    if (form.neck_cm) record.neck_cm = parseFloat(form.neck_cm);
    if (form.chest_cm) record.chest_cm = parseFloat(form.chest_cm);
    if (form.arm_cm) record.arm_cm = parseFloat(form.arm_cm);
    if (form.thigh_cm) record.thigh_cm = parseFloat(form.thigh_cm);
    if (computedBF != null) record.body_fat_percent = computedBF;

    const { error } = await supabase.from("body_measurements").insert(record as any);
    if (error) {
      toast.error("Error guardando check-in");
    } else {
      const msgs = [
        "🔥 ¡Check-in semanal registrado!",
        "💪 ¡Otra semana conquistada!",
        "⚡ ¡Datos guardados! Sigue así.",
      ];
      toast.success(msgs[Math.floor(Math.random() * msgs.length)]);
      setForm({});
      setOpen(false);
      fetchRecords();
    }
    setSaving(false);
  };

  // ─── Deltas (latest vs previous) ──────────────────
  const latest = records[0];
  const previous = records[1];

  const weightDelta = latest?.weight_kg != null && previous?.weight_kg != null
    ? (Number(latest.weight_kg) - Number(previous.weight_kg)).toFixed(1) : null;

  const bfDelta = latest?.body_fat_percent != null && previous?.body_fat_percent != null
    ? (Number(latest.body_fat_percent) - Number(previous.body_fat_percent)).toFixed(1) : null;

  const phrase = MOTIVATIONAL_PHRASES[Math.floor(Date.now() / 86400000) % MOTIVATIONAL_PHRASES.length];

  // ─── Streak dots (last 8 weeks) ──────────────────
  const streakDots = useMemo(() => {
    const dots: boolean[] = [];
    const now = new Date();
    for (let w = 0; w < 8; w++) {
      const weekStart = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() - 6 * 24 * 60 * 60 * 1000);
      const has = records.some(r => {
        const d = new Date(r.date);
        return d <= weekStart && d >= weekEnd;
      });
      dots.push(has);
    }
    return dots.reverse();
  }, [records]);

  if (loading) return null;

  return (
    <>
      {/* ─── Main Card ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/90 to-card/80 backdrop-blur-sm p-4 space-y-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/40">
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-sm tracking-wider text-foreground">CHECK-IN SEMANAL</p>
              <p className="text-[10px] text-muted-foreground">Control de peso y composición</p>
            </div>
          </div>
          <Button
            onClick={() => setOpen(true)}
            size="sm"
            className="font-display tracking-wider gap-1 box-glow"
          >
            <Zap className="h-3.5 w-3.5" /> REGISTRAR
          </Button>
        </div>

        {/* Motivational phrase */}
        <p className="text-xs text-primary/80 italic text-center">{phrase}</p>

        {/* Streak bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className={`h-4 w-4 ${streak >= 3 ? "text-orange-400" : "text-muted-foreground"}`} />
            <span className="text-xs font-bold text-foreground">
              {streak} {streak === 1 ? "semana" : "semanas"} seguidas
            </span>
            {streak >= 4 && <Trophy className="h-4 w-4 text-yellow-400" />}
          </div>
          <div className="flex gap-1">
            {streakDots.map((active, i) => (
              <div
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  active ? "bg-primary ring-1 ring-primary/40 shadow-[0_0_6px_hsl(var(--primary)/0.5)]" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick stats */}
        {latest && (
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="Peso"
              value={latest.weight_kg != null ? `${Number(latest.weight_kg)}` : "—"}
              unit="kg"
              delta={weightDelta}
              inverse
            />
            <StatCard
              label="% Grasa"
              value={latest.body_fat_percent != null ? `${Number(latest.body_fat_percent)}` : "—"}
              unit="%"
              delta={bfDelta}
              inverse
            />
            <StatCard
              label="Cintura"
              value={latest.waist_cm != null ? `${Number(latest.waist_cm)}` : "—"}
              unit="cm"
              delta={null}
              inverse
            />
          </div>
        )}

        {!latest && (
          <div className="text-center py-2">
            <Scale className="mx-auto mb-1 h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Haz tu primer check-in semanal</p>
          </div>
        )}

        {/* View history link */}
        {records.length > 0 && (
          <button
            onClick={() => {
              const el = document.getElementById("checkin-history");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-1 text-[10px] text-primary hover:underline mx-auto"
          >
            Ver historial ({records.length} registros) <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </motion.div>

      {/* ─── Mini History ─────────────────────────── */}
      {records.length > 0 && (
        <div id="checkin-history" className="rounded-lg border border-border bg-card/80 backdrop-blur-sm p-3 space-y-2">
          <p className="text-xs font-display tracking-wider text-muted-foreground">HISTORIAL DE CHECK-INS</p>
          {records.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-border/50 pb-1.5 last:border-0">
              <span className="text-[11px] text-muted-foreground">
                {new Date(r.date).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
              </span>
              <div className="flex gap-3 text-[11px]">
                {r.weight_kg != null && <span className="text-foreground">⚖️ {Number(r.weight_kg)}kg</span>}
                {r.body_fat_percent != null && <span className="text-foreground">📊 {Number(r.body_fat_percent)}%</span>}
                {r.waist_cm != null && <span className="text-foreground">📏 {Number(r.waist_cm)}cm</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Check-in Dialog ─────────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider text-primary flex items-center gap-2">
              <Zap className="h-5 w-5" /> CHECK-IN SEMANAL
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Weight */}
            <div>
              <Label className="text-xs flex items-center gap-1"><Scale className="h-3 w-3" /> Peso actual (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ej: 75.5"
                value={form.weight_kg || ""}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Navy formula fields */}
            <div className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1">
                <Target className="h-3 w-3 text-primary" /> Cálculo % Grasa (Fórmula Navy)
              </p>
              <p className="text-[10px] text-muted-foreground">Ingresa las 3 medidas para calcular automáticamente tu % de grasa corporal.</p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Cintura (cm)</Label>
                  <Input type="number" step="0.1" placeholder="85" value={form.waist_cm || ""} onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-[10px]">Cuello (cm)</Label>
                  <Input type="number" step="0.1" placeholder="38" value={form.neck_cm || ""} onChange={(e) => setForm({ ...form, neck_cm: e.target.value })} className="h-8 text-sm" />
                </div>
              </div>

              {sex === "female" && (
                <div>
                  <Label className="text-[10px]">Cadera (cm)</Label>
                  <Input type="number" step="0.1" placeholder="95" value={form.hip_cm || ""} onChange={(e) => setForm({ ...form, hip_cm: e.target.value })} className="h-8 text-sm" />
                </div>
              )}

              {/* Computed BF result */}
              <AnimatePresence>
                {computedBF != null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-center"
                  >
                    <p className="text-[10px] text-muted-foreground">TU % DE GRASA CORPORAL</p>
                    <p className="text-3xl font-display font-bold text-primary">{computedBF}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {computedBF < 10 ? "🏆 Nivel competición" :
                       computedBF < 15 ? "💪 Atlético" :
                       computedBF < 20 ? "✅ Fitness" :
                       computedBF < 25 ? "📊 Promedio" :
                       "🎯 En progreso"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Extra measurements */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Medidas adicionales (opcional)</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px]">Pecho</Label>
                  <Input type="number" step="0.1" value={form.chest_cm || ""} onChange={(e) => setForm({ ...form, chest_cm: e.target.value })} className="h-8 text-sm" placeholder="cm" />
                </div>
                <div>
                  <Label className="text-[10px]">Brazo</Label>
                  <Input type="number" step="0.1" value={form.arm_cm || ""} onChange={(e) => setForm({ ...form, arm_cm: e.target.value })} className="h-8 text-sm" placeholder="cm" />
                </div>
                <div>
                  <Label className="text-[10px]">Muslo</Label>
                  <Input type="number" step="0.1" value={form.thigh_cm || ""} onChange={(e) => setForm({ ...form, thigh_cm: e.target.value })} className="h-8 text-sm" placeholder="cm" />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !form.weight_kg}
              className="w-full font-display tracking-wider box-glow"
            >
              {saving ? "GUARDANDO..." : "🔥 REGISTRAR CHECK-IN"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Stat Card ──────────────────────────────────
function StatCard({ label, value, unit, delta, inverse }: {
  label: string; value: string; unit: string; delta: string | null; inverse: boolean;
}) {
  const isPositive = delta ? Number(delta) > 0 : null;
  const isGood = delta ? (inverse ? Number(delta) < 0 : Number(delta) > 0) : null;

  return (
    <div className="rounded-lg border border-border bg-card/60 p-2 text-center">
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className="text-base font-bold text-foreground">{value}<span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span></p>
      {delta && (
        <div className={`flex items-center justify-center gap-0.5 text-[10px] font-bold ${
          isGood ? "text-green-400" : Number(delta) === 0 ? "text-muted-foreground" : "text-red-400"
        }`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? "+" : ""}{delta}{unit}
        </div>
      )}
    </div>
  );
}
