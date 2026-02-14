import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Drumstick, Wheat, Droplets, Crown, Clock, UtensilsCrossed, ChevronDown, ChevronUp, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { UserProfile, DailyLog, MealScan } from "@/lib/nutrition";
import { toast } from "sonner";
import dashboardBg from "@/assets/dashboard-bg.jpg";

const PHRASES = [
  "ESCANEA. QUEMA. DOMINA.",
  "PROTEÍNA ALTA O NADA.",
  "LA GRASA NO NEGOCIA. TÚ TAMPOCO.",
  "DÉFICIT INTELIGENTE, RESULTADOS BRUTALES.",
  "TU CUERPO ES TU TEMPLO – TRÁTALO COMO ELITE.",
];

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [phrase, setPhrase] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [meals, setMeals] = useState<MealScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const i = setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 4000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    const fetchData = async () => {
      // Fetch profile
      const { data: p } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (p && !(p as any).onboarding_completed) {
        navigate("/onboarding");
        return;
      }

      setProfile(p as any);

      // Fetch today's log
      const today = new Date().toISOString().split("T")[0];
      const { data: log } = await supabase
        .from("daily_logs" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      setDailyLog(log as any);

      // Fetch today's meals
      if (log) {
        const { data: m } = await supabase
          .from("meal_scans" as any)
          .select("*")
          .eq("daily_log_id", (log as any).id)
          .order("created_at", { ascending: true });
        setMeals((m as any) || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, navigate]);

  const target = useMemo(() => ({
    calories: profile?.target_calories || 2000,
    protein: profile?.target_protein || 150,
    carbs: profile?.target_carbs || 200,
    fat: profile?.target_fat || 60,
  }), [profile]);

  const consumed = useMemo(() => ({
    calories: Number(dailyLog?.total_calories || 0),
    protein: Number(dailyLog?.total_protein || 0),
    carbs: Number(dailyLog?.total_carbs || 0),
    fat: Number(dailyLog?.total_fat || 0),
  }), [dailyLog]);

  const remaining = useMemo(() => ({
    calories: Math.max(0, target.calories - consumed.calories),
    protein: Math.max(0, target.protein - consumed.protein),
    carbs: Math.max(0, target.carbs - consumed.carbs),
    fat: Math.max(0, target.fat - consumed.fat),
  }), [target, consumed]);

  const calPercent = Math.min(100, Math.round((consumed.calories / target.calories) * 100));

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24 pt-6">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      <div className="fixed inset-0 bg-background/90" />
      <div className="relative z-10 px-4">
      {/* Trial/Premium Banner */}
      <TrialBanner />

      <motion.p
        key={phrase}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 text-center font-display text-sm tracking-widest text-primary/70"
      >
        {PHRASES[phrase]}
      </motion.p>

      {/* Calorie Arc */}
      <div className="mx-auto mb-6 flex flex-col items-center">
        <div className="relative h-48 w-48">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={calPercent > 100 ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${Math.min(calPercent, 100) * 2.64} 264`}
              className="transition-all duration-1000"
              style={{ filter: `drop-shadow(0 0 6px ${calPercent > 100 ? "hsl(0 72% 51% / 0.5)" : "hsl(48 100% 50% / 0.5)"})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Flame className="mb-1 h-5 w-5 text-primary" />
            <span className="font-sans text-3xl font-bold text-foreground">{remaining.calories}</span>
            <span className="text-xs text-muted-foreground">kcal restantes</span>
          </div>
        </div>
      </div>

      {/* Macro Cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <MacroCard icon={<Drumstick className="h-4 w-4" />} label="Proteína" current={consumed.protein} target={target.protein} unit="g" varName="protein" />
        <MacroCard icon={<Wheat className="h-4 w-4" />} label="Carbos" current={consumed.carbs} target={target.carbs} unit="g" varName="carbs" />
        <MacroCard icon={<Droplets className="h-4 w-4" />} label="Grasas" current={consumed.fat} target={target.fat} unit="g" varName="fat" />
      </div>

      {/* Meals list */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg tracking-wide text-foreground">COMIDAS DE HOY</h3>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {meals.length}
          </span>
        </div>
        {meals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Escanea tu primera comida para comenzar a trackear 💪
          </p>
        ) : (
          <div className="space-y-2">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onDelete={async (id) => {
                const m = meals.find((x) => x.id === id);
                if (!m) return;
                const { error } = await supabase.from("meal_scans").delete().eq("id", id);
                if (error) { toast.error("Error eliminando comida"); return; }
                setMeals((prev) => prev.filter((x) => x.id !== id));
                // Update daily log
                if (dailyLog) {
                  const newCal = Number(dailyLog.total_calories) - Number(m.total_calories);
                  const newP = Number(dailyLog.total_protein) - Number(m.total_protein);
                  const newC = Number(dailyLog.total_carbs) - Number(m.total_carbs);
                  const newF = Number(dailyLog.total_fat) - Number(m.total_fat);
                  await supabase.from("daily_logs").update({
                    total_calories: Math.max(0, newCal),
                    total_protein: Math.max(0, newP),
                    total_carbs: Math.max(0, newC),
                    total_fat: Math.max(0, newF),
                  }).eq("id", dailyLog.id);
                  setDailyLog({ ...dailyLog, total_calories: Math.max(0, newCal), total_protein: Math.max(0, newP), total_carbs: Math.max(0, newC), total_fat: Math.max(0, newF) });
                }
                toast.success("Comida eliminada");
              }} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

const MacroCard = ({ icon, label, current, target, unit, varName }: {
  icon: React.ReactNode; label: string; current: number; target: number; unit: string; varName: string;
}) => {
  const percent = Math.min(100, Math.round((current / target) * 100));
  const over = current > target;
  return (
    <div className={`rounded-lg border bg-card p-3 ${over ? "border-destructive/50" : "border-border"}`}>
      <div className={`mb-1 flex items-center gap-1 text-${varName}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="font-sans text-lg font-bold text-foreground">
        {current}<span className="text-xs text-muted-foreground">/{target}{unit}</span>
      </p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-destructive" : `bg-${varName}`}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "🌅 Desayuno",
  lunch: "☀️ Almuerzo",
  dinner: "🌙 Cena",
  snack: "🍎 Snack",
};

const MealCard = ({ meal, onDelete }: { meal: MealScan; onDelete: (id: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const time = new Date(meal.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  const foods: any[] = Array.isArray(meal.foods_json) ? meal.foods_json : [];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div>
            <p className="text-sm font-medium text-foreground">
              {MEAL_LABELS[meal.meal_type || "snack"] || "Comida"}
            </p>
            <p className="text-xs text-muted-foreground">{time} · {meal.total_calories} kcal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2 text-xs">
            <span className="text-protein">{meal.total_protein}g P</span>
            <span className="text-carbs">{meal.total_carbs}g C</span>
            <span className="text-fat">{meal.total_fat}g G</span>
          </div>
          {foods.length > 0 && (
            open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          {foods.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {foods.map((food, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{food.name || food.nombre || `Alimento ${i + 1}`}</span>
                  <div className="flex gap-2 text-muted-foreground">
                    {food.calories && <span>{food.calories} kcal</span>}
                    {food.protein && <span className="text-protein">{food.protein}g P</span>}
                    {food.carbs && <span className="text-carbs">{food.carbs}g C</span>}
                    {food.fat && <span className="text-fat">{food.fat}g G</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-3 w-3" />
            {deleting ? "Eliminando..." : "Eliminar comida"}
          </button>

          {confirmOpen && (
            <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                ¿Eliminar esta comida?
              </div>
              <p className="mb-3 text-xs text-muted-foreground">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-md border border-border bg-background py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { setDeleting(true); setConfirmOpen(false); onDelete(meal.id); }}
                  className="flex-1 rounded-md bg-destructive py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TrialBanner = () => {
  const { status, daysLeft } = useSubscription();
  const navigate = useNavigate();

  if (status === "loading" || status === "premium") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 flex items-center justify-between rounded-lg border p-3 ${
        status === "expired"
          ? "border-destructive/50 bg-destructive/10"
          : "border-primary/30 bg-primary/5"
      }`}
    >
      <div className="flex items-center gap-2">
        {status === "expired" ? (
          <Crown className="h-4 w-4 text-destructive" />
        ) : (
          <Clock className="h-4 w-4 text-primary" />
        )}
        <span className="text-xs font-medium text-foreground">
          {status === "expired"
            ? "Tu prueba gratuita expiró"
            : `${daysLeft} días de prueba restantes`}
        </span>
      </div>
      <Button
        size="sm"
        variant={status === "expired" ? "default" : "outline"}
        onClick={() => navigate("/paywall")}
        className="h-7 text-xs font-display tracking-wider"
      >
        <Crown className="mr-1 h-3 w-3" />
        PREMIUM
      </Button>
    </motion.div>
  );
};

export default Dashboard;
