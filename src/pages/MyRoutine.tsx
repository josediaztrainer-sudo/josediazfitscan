import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Home as HomeIcon,
  Building2,
  Camera,
  Upload,
  Loader2,
  Sparkles,
  Trash2,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type PhotoKey = "front" | "back" | "right" | "left";

const PHOTO_META: { key: PhotoKey; label: string; emoji: string }[] = [
  { key: "front", label: "Frente", emoji: "🧍" },
  { key: "back", label: "Espalda", emoji: "🔙" },
  { key: "right", label: "Perfil derecho", emoji: "➡️" },
  { key: "left", label: "Perfil izquierdo", emoji: "⬅️" },
];

const LEVELS = [
  { value: "principiante", label: "Principiante", desc: "0-6 meses", emoji: "🌱" },
  { value: "intermedio", label: "Intermedio", desc: "6m - 2 años", emoji: "⚡" },
  { value: "avanzado", label: "Avanzado", desc: "+ 2 años", emoji: "🔥" },
];

interface SavedRoutine {
  id: string;
  title: string;
  routine_content: string;
  level: string | null;
  frequency_days: number | null;
  created_at: string;
}

const MyRoutine = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [viewing, setViewing] = useState<SavedRoutine | null>(null);

  // Form state
  const [location, setLocation] = useState<"casa" | "gimnasio" | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  const [sessionMinutes, setSessionMinutes] = useState<number>(60);
  const [objectives, setObjectives] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [photos, setPhotos] = useState<Partial<Record<PhotoKey, { url: string; b64: string }>>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: prof }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("saved_routines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setProfile(prof);
    setRoutines((rs as SavedRoutine[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handlePhoto = async (key: PhotoKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("La foto debe pesar menos de 8MB");
      return;
    }
    try {
      const b64 = await fileToBase64(file);
      const path = `${user.id}/${key}_${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("physique-photos")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      setPhotos((p) => ({ ...p, [key]: { url: path, b64 } }));
      toast.success(`Foto ${key} cargada`);
    } catch (err: any) {
      toast.error(err.message || "Error al subir foto");
    }
    e.target.value = "";
  };

  const removePhoto = (key: PhotoKey) =>
    setPhotos((p) => {
      const { [key]: _, ...rest } = p;
      return rest;
    });

  const canGenerate = location && level && daysPerWeek > 0 && Object.keys(photos).length === 4;

  const generateRoutine = async () => {
    if (!user || !canGenerate) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-routine-from-photos",
        {
          body: {
            location,
            level,
            daysPerWeek,
            sessionMinutes,
            objectives,
            restrictions,
            photos: {
              front: photos.front?.b64,
              back: photos.back?.b64,
              right: photos.right?.b64,
              left: photos.left?.b64,
            },
            userMeta: {
              sex: profile?.sex,
              age: profile?.age,
              weight: profile?.weight_kg,
              height: profile?.height_cm,
            },
          },
        }
      );
      if (error) throw error;
      const routineText = (data as any)?.routine;
      if (!routineText) throw new Error("Respuesta vacía del coach");

      // Save automatically
      const title = `Rutina ${location === "casa" ? "Casa" : "Gym"} · ${daysPerWeek}d · ${level}`;
      const { data: saved, error: sErr } = await supabase
        .from("saved_routines")
        .insert({
          user_id: user.id,
          title,
          routine_content: routineText,
          level,
          frequency_days: daysPerWeek,
        })
        .select()
        .single();
      if (sErr) throw sErr;

      toast.success("🔥 Rutina generada y guardada");
      setRoutines((r) => [saved as SavedRoutine, ...r]);
      setViewing(saved as SavedRoutine);
      // reset photos to allow new generation later
      setPhotos({});
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "No se pudo generar la rutina");
    } finally {
      setGenerating(false);
    }
  };

  const deleteRoutine = async (id: string) => {
    if (!confirm("¿Eliminar esta rutina?")) return;
    const { error } = await supabase.from("saved_routines").delete().eq("id", id);
    if (error) return toast.error("Error al eliminar");
    setRoutines((r) => r.filter((x) => x.id !== id));
    if (viewing?.id === id) setViewing(null);
    toast.success("Rutina eliminada");
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ---- Routine viewer ----
  if (viewing) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
          <Button variant="ghost" size="icon" onClick={() => setViewing(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg tracking-wider text-primary truncate">
            {viewing.title}
          </h1>
        </header>
        <div className="mx-auto max-w-2xl p-4">
          <Card className="border-border bg-card p-4 text-foreground">
            <article className="prose prose-sm prose-invert max-w-none break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {viewing.routine_content}
              </ReactMarkdown>
            </article>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <h1 className="font-display text-xl tracking-wider text-primary">MI RUTINA</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 p-4">
        {/* Hero */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
          <h2 className="font-display text-lg tracking-wide text-foreground">
            🎯 RUTINA PERSONALIZADA POR EL COACH
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completa tu anamnesis y sube 4 fotos de tu físico. El coach analizará lo que
            debes mejorar y diseñará tu rutina exacta.
          </p>
        </Card>

        {/* 1. Lugar */}
        <Card className="border-border bg-card p-4">
          <Label className="text-sm font-semibold text-foreground">
            📍 ¿Dónde entrenarás?
          </Label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setLocation("casa")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-4 transition-colors ${
                location === "casa"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <HomeIcon className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">Casa</span>
              <span className="text-[10px] text-muted-foreground">Sin equipo o mínimo</span>
            </button>
            <button
              onClick={() => setLocation("gimnasio")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-4 transition-colors ${
                location === "gimnasio"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">Gimnasio</span>
              <span className="text-[10px] text-muted-foreground">Equipo completo</span>
            </button>
          </div>
        </Card>

        {/* 2. Nivel */}
        <Card className="border-border bg-card p-4">
          <Label className="text-sm font-semibold text-foreground">📊 Nivel de entrenamiento</Label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={`flex flex-col items-center gap-0.5 rounded-lg border p-3 text-center transition-colors ${
                  level === l.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <span className="text-xl">{l.emoji}</span>
                <span className="text-xs font-semibold text-foreground">{l.label}</span>
                <span className="text-[10px] text-muted-foreground">{l.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 3. Días + duración */}
        <Card className="border-border bg-card p-4 space-y-3">
          <div>
            <Label className="text-sm font-semibold text-foreground">
              📅 Días disponibles a la semana
            </Label>
            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysPerWeek(d)}
                  className={`rounded-lg border py-2 font-bold transition-colors ${
                    daysPerWeek === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-foreground">
              ⏱️ Minutos por sesión
            </Label>
            <Input
              type="number"
              min={20}
              max={180}
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(parseInt(e.target.value) || 60)}
              className="mt-2 border-border bg-background text-foreground"
            />
          </div>
        </Card>

        {/* 4. Objetivos */}
        <Card className="border-border bg-card p-4">
          <Label className="text-sm font-semibold text-foreground">
            🎯 Objetivos (opcional pero recomendado)
          </Label>
          <Textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="Ej: aumentar masa en hombros y espalda, bajar grasa abdominal, mejorar postura..."
            className="mt-2 h-20 border-border bg-background text-foreground"
          />
        </Card>

        {/* 5. Restricciones */}
        <Card className="border-yellow-500/30 bg-yellow-500/5 p-4">
          <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Restricciones físicas / lesiones / condiciones médicas
          </Label>
          <Textarea
            value={restrictions}
            onChange={(e) => setRestrictions(e.target.value)}
            placeholder="Ej: dolor lumbar, lesión en hombro derecho, hipertensión, hernia discal L5-S1, ninguna..."
            className="mt-2 h-20 border-border bg-background text-foreground"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Crucial para que el coach adapte la rutina y proteja tu salud.
          </p>
        </Card>

        {/* 6. Fotos */}
        <Card className="border-border bg-card p-4">
          <Label className="text-sm font-semibold text-foreground">
            📸 Fotos del físico (las 4 son obligatorias)
          </Label>
          <p className="mt-1 text-[11px] text-muted-foreground">
            El coach analizará tu físico real para detectar zonas a priorizar.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {PHOTO_META.map((p) => {
              const has = photos[p.key];
              return (
                <div key={p.key} className="relative">
                  <label
                    className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ${
                      has
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    {has ? (
                      <>
                        <img
                          src={has.b64}
                          alt={p.label}
                          className="absolute inset-0 h-full w-full rounded-lg object-cover opacity-90"
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-background/90 to-transparent" />
                        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                          <CheckCircle2 className="h-3 w-3" /> {p.label}
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="h-7 w-7 text-muted-foreground" />
                        <span className="mt-1 text-xs font-semibold text-foreground">
                          {p.emoji} {p.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Tocar para subir</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePhoto(p.key, e)}
                    />
                  </label>
                  {has && (
                    <button
                      onClick={() => removePhoto(p.key)}
                      className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                      aria-label="Quitar foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Generate button */}
        <Button
          onClick={generateRoutine}
          disabled={!canGenerate || generating}
          className="h-14 w-full text-base font-bold"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              El coach está analizando tu físico...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              GENERAR MI RUTINA PERSONALIZADA 🔥
            </>
          )}
        </Button>
        {!canGenerate && !generating && (
          <p className="text-center text-xs text-muted-foreground">
            Completa lugar, nivel, días y las 4 fotos para activar el botón.
          </p>
        )}

        {/* Saved routines */}
        <div className="pt-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg tracking-wider text-primary">
            <Dumbbell className="h-5 w-5" /> MIS RUTINAS GUARDADAS
          </h3>
          {routines.length === 0 ? (
            <Card className="border-dashed border-border bg-card/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no tienes rutinas guardadas. Genera tu primera arriba.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {routines.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card
                      onClick={() => setViewing(r)}
                      className="group flex cursor-pointer items-center justify-between border-border bg-card p-3 transition-colors hover:border-primary/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoutine(r.id);
                        }}
                        className="ml-2 rounded p-2 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRoutine;
