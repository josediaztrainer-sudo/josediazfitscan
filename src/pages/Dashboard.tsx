import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Drumstick, Wheat, Droplets } from "lucide-react";

const PHRASES = [
  "ESCANEA. QUEMA. DOMINA.",
  "PROTEÍNA ALTA O NADA.",
  "LA GRASA NO NEGOCIA. TÚ TAMPOCO.",
  "DÉFICIT INTELIGENTE, RESULTADOS BRUTALES.",
  "TU CUERPO ES TU TEMPLO – TRÁTALO COMO ELITE.",
];

const Dashboard = () => {
  const [phrase, setPhrase] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 4000);
    return () => clearInterval(i);
  }, []);

  // Mock data - will be replaced with real data from DB
  const target = { calories: 2100, protein: 180, carbs: 200, fat: 65 };
  const consumed = { calories: 1340, protein: 95, carbs: 130, fat: 38 };
  const remaining = useMemo(() => ({
    calories: target.calories - consumed.calories,
    protein: target.protein - consumed.protein,
    carbs: target.carbs - consumed.carbs,
    fat: target.fat - consumed.fat,
  }), []);

  const calPercent = Math.round((consumed.calories / target.calories) * 100);

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      {/* Header */}
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
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${calPercent * 2.64} 264`}
              className="transition-all duration-1000"
              style={{ filter: "drop-shadow(0 0 6px hsl(48 100% 50% / 0.5))" }}
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
        <MacroCard icon={<Drumstick className="h-4 w-4" />} label="Proteína" current={consumed.protein} target={target.protein} unit="g" color="text-protein" bgColor="bg-protein/10" />
        <MacroCard icon={<Wheat className="h-4 w-4" />} label="Carbos" current={consumed.carbs} target={target.carbs} unit="g" color="text-carbs" bgColor="bg-carbs/10" />
        <MacroCard icon={<Droplets className="h-4 w-4" />} label="Grasas" current={consumed.fat} target={target.fat} unit="g" color="text-fat" bgColor="bg-fat/10" />
      </div>

      {/* Meals list placeholder */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-lg tracking-wide text-foreground">COMIDAS DE HOY</h3>
        <p className="text-sm text-muted-foreground">
          Escanea tu primera comida para comenzar a trackear 💪
        </p>
      </div>
    </div>
  );
};

const MacroCard = ({ icon, label, current, target, unit, color, bgColor }: {
  icon: React.ReactNode; label: string; current: number; target: number; unit: string; color: string; bgColor: string;
}) => {
  const percent = Math.min(100, Math.round((current / target) * 100));
  const over = current > target;
  return (
    <div className={`rounded-lg border border-border bg-card p-3 ${over ? "border-destructive/50" : ""}`}>
      <div className={`mb-1 flex items-center gap-1 ${color}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="font-sans text-lg font-bold text-foreground">
        {current}<span className="text-xs text-muted-foreground">/{target}{unit}</span>
      </p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-destructive" : ""}`}
          style={{
            width: `${percent}%`,
            backgroundColor: over ? undefined : `hsl(var(--${label === "Proteína" ? "protein" : label === "Carbos" ? "carbs" : "fat"}))`,
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
