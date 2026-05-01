import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, Plus, Minus, GlassWater, Trophy, Flame, X, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface WaterLog {
  id: string;
  date: string;
  consumed_ml: number;
  goal_ml: number;
}

interface Profile {
  weight_kg: number | null;
  activity_level: string | null;
  sex: string | null;
}

const GLASS_ML = 250;
const QUICK_ADDS = [
  { label: "Vaso", ml: 250, icon: "🥛" },
  { label: "Botella", ml: 500, icon: "🍶" },
  { label: "Termo", ml: 750, icon: "🧴" },
];

function calculateGoal(profile: Profile | null): number {
  if (!profile?.weight_kg) return 2500;
  // Base: 35ml per kg
  let goal = profile.weight_kg * 35;
  // Activity adjustment
  if (profile.activity_level === "active" || profile.activity_level === "very_active") {
    goal += 500;
  } else if (profile.activity_level === "moderate") {
    goal += 250;
  }
  return Math.round(goal / 50) * 50;
}

export default function HydrationTracker() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [log, setLog] = useState<WaterLog | null>(null);
  const [unit, setUnit] = useState<"ml" | "glasses">("ml");
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("weight_kg, activity_level, sex")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(p as any);

      const { data: w } = await supabase
        .from("water_logs" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (w) {
        setLog(w as any);
      } else {
        const goal = calculateGoal(p as any);
        setLog({ id: "", date: today, consumed_ml: 0, goal_ml: goal });
      }
    };
    fetch();
  }, [user, today]);

  const consumed = log?.consumed_ml ?? 0;
  const goal = log?.goal_ml ?? 2500;
  const percent = Math.min(100, Math.round((consumed / goal) * 100));
  const remaining = Math.max(0, goal - consumed);
  const glasses = Math.floor(consumed / GLASS_ML);
  const goalGlasses = Math.round(goal / GLASS_ML);

  const addWater = async (ml: number) => {
    if (!user || !log) return;
    const newAmount = Math.max(0, consumed + ml);
    const optimistic = { ...log, consumed_ml: newAmount };
    setLog(optimistic);

    const { data, error } = await supabase
      .from("water_logs" as any)
      .upsert({
        user_id: user.id,
        date: today,
        consumed_ml: newAmount,
        goal_ml: goal,
      }, { onConflict: "user_id,date" })
      .select()
      .single();

    if (error) {
      toast.error("Error al guardar");
      return;
    }
    setLog(data as any);

    if (ml > 0) {
      if (newAmount >= goal && consumed < goal) {
        toast.success("🏆 ¡META DIARIA CONQUISTADA! Eres una bestia.", { duration: 3500 });
      } else {
        toast.success(`+${ml}ml 💧 ¡Sigue así!`, { duration: 1500 });
      }
    }
  };

  const updateGoal = async (newGoal: number) => {
    if (!user || !log) return;
    setLog({ ...log, goal_ml: newGoal });
    await supabase
      .from("water_logs" as any)
      .upsert({
        user_id: user.id,
        date: today,
        consumed_ml: consumed,
        goal_ml: newGoal,
      }, { onConflict: "user_id,date" });
    toast.success("🎯 Meta actualizada");
    setEditingGoal(false);
  };

  const recommendedGoal = useMemo(() => calculateGoal(profile), [profile]);

  const motivational = useMemo(() => {
    if (percent === 0) return "💧 Empieza con un vaso. AHORA.";
    if (percent < 25) return "🔥 Apenas calentando. Sigue.";
    if (percent < 50) return "💪 Vas bien. No aflojes.";
    if (percent < 75) return "⚡ Más de la mitad. ¡SIGUE!";
    if (percent < 100) return "🏁 Casi lo logras. ¡FINAL!";
    return "🏆 META CONQUISTADA. BESTIA.";
  }, [percent]);

  return (
    <>
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.96 }}
        className="relative mb-6 flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-blue-600/15 p-4 backdrop-blur-sm transition-all hover:border-blue-400/60"
      >
        {/* Animated water wave background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-500/30 to-cyan-400/10"
            animate={{ height: [`${percent}%`, `${percent + 2}%`, `${percent}%`] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/30 backdrop-blur">
          <Droplet className="h-6 w-6 fill-cyan-300 text-cyan-200" />
        </div>
        <div className="relative z-10 flex-1 text-left">
          <p className="font-display text-sm tracking-wider text-cyan-100">HIDRATACIÓN</p>
          <p className="text-xs text-cyan-200/80">
            {(consumed / 1000).toFixed(2)}L / {(goal / 1000).toFixed(2)}L · {percent}%
          </p>
        </div>
        <div className="relative z-10 flex h-10 items-center justify-center rounded-lg bg-cyan-400/20 px-3 font-bold text-cyan-100">
          +💧
        </div>
      </motion.button>

      {/* Tracker Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-blue-500/30 bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 p-0 sm:max-w-md">
          <DialogHeader className="border-b border-blue-500/20 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 font-display tracking-wider text-cyan-100">
              <Droplet className="h-5 w-5 fill-cyan-300 text-cyan-300" />
              HIDRATACIÓN DIARIA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5">
            {/* Bottle visualization */}
            <div className="flex items-center justify-center">
              <div className="relative h-56 w-32">
                {/* Bottle outline */}
                <div className="absolute inset-x-2 top-0 h-3 rounded-t-md bg-blue-500/40" />
                <div className="absolute inset-x-3 top-3 h-2 bg-blue-400/30" />
                <div className="absolute inset-x-0 top-5 h-[calc(100%-1.25rem)] overflow-hidden rounded-b-3xl rounded-t-lg border-2 border-cyan-400/40 bg-slate-900/60">
                  {/* Water fill */}
                  <motion.div
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-600 via-blue-400 to-cyan-300"
                    initial={false}
                    animate={{ height: `${percent}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 18 }}
                  >
                    {/* Wave effect */}
                    <motion.div
                      className="absolute -top-2 inset-x-0 h-4"
                      style={{
                        background: "radial-gradient(ellipse at center, rgba(165,243,252,0.8) 0%, transparent 70%)",
                      }}
                      animate={{ x: [-10, 10, -10] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Bubbles */}
                    {percent > 10 && [0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute h-2 w-2 rounded-full bg-white/40"
                        style={{ left: `${20 + i * 25}%`, bottom: "10%" }}
                        animate={{ y: [-5, -60, -5], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.7 }}
                      />
                    ))}
                  </motion.div>
                  {/* Percent overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {percent}%
                    </span>
                    <span className="text-xs font-medium text-cyan-100 drop-shadow">
                      {(consumed / 1000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational */}
            <motion.p
              key={motivational}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center font-display text-sm tracking-wide text-cyan-200"
            >
              {motivational}
            </motion.p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
                <p className="text-[10px] uppercase text-cyan-300/70">Consumido</p>
                <p className="font-bold text-cyan-100">{(consumed / 1000).toFixed(2)}L</p>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
                <p className="text-[10px] uppercase text-cyan-300/70">Restante</p>
                <p className="font-bold text-cyan-100">{(remaining / 1000).toFixed(2)}L</p>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
                <p className="text-[10px] uppercase text-cyan-300/70">Vasos</p>
                <p className="font-bold text-cyan-100">{glasses}/{goalGlasses}</p>
              </div>
            </div>

            {/* Glass dots */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: goalGlasses }).map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => addWater(i < glasses ? -GLASS_ML : GLASS_ML)}
                  whileTap={{ scale: 0.85 }}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all ${
                    i < glasses
                      ? "border-cyan-300 bg-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                      : "border-blue-500/30 bg-slate-800/50"
                  }`}
                >
                  <GlassWater className={`h-4 w-4 ${i < glasses ? "text-cyan-100" : "text-blue-500/40"}`} />
                </motion.button>
              ))}
            </div>

            {/* Quick add buttons */}
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ADDS.map((q) => (
                <motion.button
                  key={q.ml}
                  onClick={() => addWater(q.ml)}
                  whileTap={{ scale: 0.94 }}
                  className="flex flex-col items-center gap-1 rounded-xl border border-cyan-400/30 bg-gradient-to-b from-blue-500/20 to-blue-600/10 p-3 transition-all hover:border-cyan-400/60 hover:from-blue-500/30"
                >
                  <span className="text-2xl">{q.icon}</span>
                  <span className="text-xs font-medium text-cyan-100">{q.label}</span>
                  <span className="text-[10px] text-cyan-300/80">+{q.ml}ml</span>
                </motion.button>
              ))}
            </div>

            {/* Custom +/- */}
            <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => addWater(-100)}
                className="h-10 w-10 rounded-full text-cyan-200 hover:bg-blue-500/20"
              >
                <Minus className="h-5 w-5" />
              </Button>
              <span className="text-xs text-cyan-200/70">Ajuste fino · 100ml</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => addWater(100)}
                className="h-10 w-10 rounded-full text-cyan-200 hover:bg-blue-500/20"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Goal section */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-medium text-cyan-100">Meta diaria</span>
                </div>
                <button
                  onClick={() => { setTempGoal(String(goal)); setEditingGoal(!editingGoal); }}
                  className="text-cyan-300 hover:text-cyan-100"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {editingGoal ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-[11px] text-cyan-300/70">
                      Recomendado para ti: <span className="font-bold text-cyan-200">{(recommendedGoal / 1000).toFixed(2)}L</span> 
                      {profile?.weight_kg ? ` (35ml × ${profile.weight_kg}kg + actividad)` : ""}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={tempGoal}
                        onChange={(e) => setTempGoal(e.target.value)}
                        className="h-9 border-blue-500/30 bg-slate-900/50 text-cyan-100"
                        placeholder="ml"
                      />
                      <Button
                        size="sm"
                        onClick={() => updateGoal(parseInt(tempGoal) || recommendedGoal)}
                        className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      >
                        Guardar
                      </Button>
                    </div>
                    {profile?.weight_kg && Number(tempGoal) !== recommendedGoal && (
                      <button
                        onClick={() => updateGoal(recommendedGoal)}
                        className="text-[11px] text-cyan-400 underline"
                      >
                        Usar recomendado ({(recommendedGoal / 1000).toFixed(2)}L)
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <p className="text-sm font-bold text-cyan-100">
                    {(goal / 1000).toFixed(2)}L · {goalGlasses} vasos
                  </p>
                )}
              </AnimatePresence>
            </div>

            {!profile?.weight_kg && (
              <p className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 text-center text-[11px] text-yellow-200">
                💡 Completa tu peso en el perfil para una meta personalizada
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
