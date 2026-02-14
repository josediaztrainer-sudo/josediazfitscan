import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Drumstick, Wheat, Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { UserProfile, DailyLog, MealScan } from "@/lib/nutrition";

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
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
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
        <h3 className="mb-3 font-display text-lg tracking-wide text-foreground">COMIDAS DE HOY</h3>
        {meals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Escanea tu primera comida para comenzar a trackear 💪
          </p>
        ) : (
          <div className="space-y-2">
            {meals.map((meal) => (
              <div key={meal.id} className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                <div>
                  <p className="text-sm font-medium capitalize text-foreground">
                    {meal.meal_type === "breakfast" ? "Desayuno" : meal.meal_type === "lunch" ? "Almuerzo" : meal.meal_type === "dinner" ? "Cena" : "Snack"}
                  </p>
                  <p className="text-xs text-muted-foreground">{meal.total_calories} kcal</p>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="text-protein">{meal.total_protein}g P</span>
                  <span className="text-carbs">{meal.total_carbs}g C</span>
                  <span className="text-fat">{meal.total_fat}g G</span>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default Dashboard;
