import { useState, useEffect } from "react";
import { User, LogOut, Save, Loader2, Flame, Drumstick, Wheat, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { calculateTDEE, calculateMacros, type ActivityLevel } from "@/lib/nutrition";
import { motion } from "framer-motion";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; emoji: string }[] = [
  { value: "sedentary", label: "Sedentario", emoji: "🪑" },
  { value: "light", label: "Ligero", emoji: "🚶" },
  { value: "moderate", label: "Moderado", emoji: "🏃" },
  { value: "active", label: "Activo", emoji: "💪" },
  { value: "very_active", label: "Muy activo", emoji: "🔥" },
];

const SEX_OPTIONS = [
  { value: "male", label: "Masculino", emoji: "♂️" },
  { value: "female", label: "Femenino", emoji: "♀️" },
];

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [email, setEmail] = useState("");

  // Computed values
  const [tdee, setTdee] = useState(0);
  const [macros, setMacros] = useState({ targetCalories: 0, proteinG: 0, carbsG: 0, fatG: 0 });

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        if (data.age) setAge(String(data.age));
        if (data.sex) setSex(data.sex as "male" | "female");
        if (data.weight_kg) setWeight(String(data.weight_kg));
        if (data.height_cm) setHeight(String(data.height_cm));
        if (data.activity_level) setActivity(data.activity_level as ActivityLevel);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Recalculate TDEE whenever inputs change
  useEffect(() => {
    const a = Number(age);
    const w = Number(weight);
    const h = Number(height);
    if (a > 0 && w > 0 && h > 0) {
      const t = calculateTDEE(sex, w, h, a, activity);
      setTdee(t);
      setMacros(calculateMacros(t, w));
    }
  }, [age, sex, weight, height, activity]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age: Number(age),
          sex,
          weight_kg: Number(weight),
          height_cm: Number(height),
          activity_level: activity,
          target_calories: macros.targetCalories,
          target_protein: macros.proteinG,
          target_carbs: macros.carbsG,
          target_fat: macros.fatG,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("¡Perfil actualizado! 💪");
    } catch (err: any) {
      toast.error(err.message || "Error guardando perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasValidData = Number(age) > 0 && Number(weight) > 0 && Number(height) > 0;

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-8">
      <h1 className="mb-6 font-display text-3xl tracking-wider text-primary text-glow">
        MI PERFIL
      </h1>

      {/* Avatar + email */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/40">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{email}</p>
          <p className="text-xs text-muted-foreground">Cuenta activa</p>
        </div>
      </div>

      {/* Biometrics form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 font-display text-lg tracking-wide text-foreground">DATOS PERSONALES</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Edad</label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="bg-background"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Sexo</label>
              <div className="flex gap-2">
                {SEX_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSex(s.value as "male" | "female")}
                    className={`flex-1 rounded-lg border p-2 text-center text-xs transition-all ${
                      sex === s.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Peso (kg)</label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75"
                className="bg-background"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Altura (cm)</label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="bg-background"
              />
            </div>
          </div>
        </div>

        {/* Activity level */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 font-display text-lg tracking-wide text-foreground">NIVEL DE ACTIVIDAD</p>
          <div className="grid grid-cols-5 gap-1">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActivity(opt.value)}
                className={`rounded-lg border p-2 text-center transition-all ${
                  activity === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <span className="block text-lg">{opt.emoji}</span>
                <span className="block text-[10px] leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calculated plan */}
        {hasValidData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-primary/30 bg-primary/5 p-4"
          >
            <p className="mb-3 font-display text-lg tracking-wide text-foreground">TU PLAN NUTRICIONAL</p>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">TDEE (mantenimiento)</span>
              <span className="font-medium text-foreground">{tdee} kcal</span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Objetivo diario (−22.5%)</span>
              <span className="flex items-center gap-1 text-lg font-bold text-primary">
                <Flame className="h-4 w-4" /> {macros.targetCalories} kcal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-background p-3 text-center">
                <Drumstick className="mx-auto mb-1 h-4 w-4 text-protein" />
                <p className="text-lg font-bold text-protein">{macros.proteinG}g</p>
                <p className="text-[10px] text-muted-foreground">Proteína</p>
              </div>
              <div className="rounded-lg bg-background p-3 text-center">
                <Wheat className="mx-auto mb-1 h-4 w-4 text-carbs" />
                <p className="text-lg font-bold text-carbs">{macros.carbsG}g</p>
                <p className="text-[10px] text-muted-foreground">Carbos</p>
              </div>
              <div className="rounded-lg bg-background p-3 text-center">
                <Droplets className="mx-auto mb-1 h-4 w-4 text-fat" />
                <p className="text-lg font-bold text-fat">{macros.fatG}g</p>
                <p className="text-[10px] text-muted-foreground">Grasas</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saving || !hasValidData}
          className="w-full font-display text-lg tracking-wider box-glow"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </Button>

        {/* Logout */}
        <Button variant="destructive" onClick={handleLogout} className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </motion.div>
    </div>
  );
};

export default Profile;
