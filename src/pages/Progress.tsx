import { useState, useEffect, useCallback } from "react";
import { Camera, Trash2, Loader2, TrendingUp, ImagePlus, ChevronLeft, ChevronRight, ArrowLeftRight, Percent, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import profileBg from "@/assets/profile-bg.jpg";

type ProgressPhoto = {
  id: string;
  photo_url: string;
  week_number: number;
  notes: string | null;
  weight_kg: number | null;
  created_at: string;
};

type DayLog = { date: string; total_calories: number };

type BodyFatResult = {
  bodyFatPercent: number;
  category: string;
  analysis: string;
  tips: string;
};

const ESTIMATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-bodyfat`;

const Progress = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; calories: number }[]>([]);
  const [targetCalories, setTargetCalories] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [userProfile, setUserProfile] = useState<{ sex?: string; weight_kg?: number; height_cm?: number } | null>(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareLeft, setCompareLeft] = useState<ProgressPhoto | null>(null);
  const [compareRight, setCompareRight] = useState<ProgressPhoto | null>(null);

  // Body fat estimation
  const [estimating, setEstimating] = useState(false);
  const [bodyFatResult, setBodyFatResult] = useState<BodyFatResult | null>(null);
  const [estimatingPhotoId, setEstimatingPhotoId] = useState<string | null>(null);

  const getWeekRange = (offset: number) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
      start: startOfWeek.toISOString().split("T")[0],
      end: endOfWeek.toISOString().split("T")[0],
      label: `${startOfWeek.toLocaleDateString("es-PE", { day: "numeric", month: "short" })} - ${endOfWeek.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}`,
    };
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const week = getWeekRange(weekOffset);

    const [profileRes, logsRes, photosRes] = await Promise.all([
      supabase.from("profiles").select("target_calories, sex, weight_kg, height_cm").eq("user_id", user.id).maybeSingle(),
      supabase.from("daily_logs").select("date, total_calories").eq("user_id", user.id).gte("date", week.start).lte("date", week.end).order("date", { ascending: true }),
      supabase.from("progress_photos" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) {
      setTargetCalories(profileRes.data.target_calories || 0);
      setUserProfile({ sex: profileRes.data.sex ?? undefined, weight_kg: profileRes.data.weight_kg ? Number(profileRes.data.weight_kg) : undefined, height_cm: profileRes.data.height_cm ? Number(profileRes.data.height_cm) : undefined });
    }

    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const startDate = new Date(week.start);
    const chartData = days.map((day, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const log = (logsRes.data as DayLog[] || []).find((l) => l.date === dateStr);
      return { day, calories: log ? Number(log.total_calories) : 0 };
    });
    setWeeklyData(chartData);
    setPhotos((photosRes.data as any[] || []) as ProgressPhoto[]);
    setLoading(false);
  }, [user, weekOffset]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("La foto debe ser menor a 5MB"); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("progress-photos").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("progress-photos").getPublicUrl(fileName);
      const weekNumber = photos.length + 1;
      const { error: insertError } = await supabase.from("progress_photos" as any).insert({ user_id: user.id, photo_url: urlData.publicUrl, week_number: weekNumber } as any);
      if (insertError) throw insertError;
      toast.success(`📸 Foto semana ${weekNumber} guardada!`);
      fetchData();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Error subiendo la foto");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo: ProgressPhoto) => {
    if (!user) return;
    try {
      const urlParts = photo.photo_url.split("/progress-photos/");
      if (urlParts[1]) await supabase.storage.from("progress-photos").remove([urlParts[1]]);
      await supabase.from("progress_photos" as any).delete().eq("id", photo.id);
      toast.success("Foto eliminada");
      setSelectedPhoto(null);
      fetchData();
    } catch { toast.error("Error eliminando foto"); }
  };

  const estimateBodyFat = async (photo: ProgressPhoto) => {
    setEstimating(true);
    setEstimatingPhotoId(photo.id);
    setBodyFatResult(null);
    try {
      const resp = await fetch(ESTIMATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          imageUrl: photo.photo_url,
          sex: userProfile?.sex,
          weight: userProfile?.weight_kg,
          height: userProfile?.height_cm,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        toast.error(err?.error || "Error analizando foto");
        return;
      }
      const result = await resp.json();
      setBodyFatResult(result);
    } catch {
      toast.error("Error conectando con el análisis");
    } finally {
      setEstimating(false);
    }
  };

  const handlePhotoClick = (photo: ProgressPhoto) => {
    if (compareMode) {
      if (!compareLeft) {
        setCompareLeft(photo);
        toast.info("Selecciona la segunda foto para comparar");
      } else if (!compareRight && photo.id !== compareLeft.id) {
        setCompareRight(photo);
      } else {
        // Reset
        setCompareLeft(photo);
        setCompareRight(null);
      }
    } else {
      setSelectedPhoto(photo);
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareLeft(null);
    setCompareRight(null);
  };

  const week = getWeekRange(weekOffset);
  // Sort photos ascending for compare display
  const sortedPhotos = [...photos].sort((a, b) => a.week_number - b.week_number);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Esencial": case "Atlético": return "text-green-400";
      case "Fitness": return "text-primary";
      case "Aceptable": return "text-yellow-400";
      case "Sobrepeso": return "text-orange-400";
      case "Obesidad": return "text-red-400";
      default: return "text-foreground";
    }
  };

  return (
    <div className="relative min-h-screen pb-24">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${profileBg})` }} />
      <div className="fixed inset-0 bg-background/80" />

      <div className="relative z-10 px-4 pt-8">
        <h1 className="mb-2 font-display text-3xl tracking-wider text-primary text-glow">MI PROGRESO</h1>
        <p className="mb-6 text-sm text-muted-foreground">Tu transformación semana a semana 💪</p>

        {/* Weekly Calories Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-lg border border-border bg-card/90 backdrop-blur-sm p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="font-display text-lg tracking-wide text-foreground">CALORÍAS SEMANAL</p>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(weekOffset - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">{week.label}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(Math.min(weekOffset + 1, 0))} disabled={weekOffset >= 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: 12 }} formatter={(value: number) => [`${value} kcal`, "Consumido"]} />
                <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                {targetCalories > 0 && <ReferenceLine y={targetCalories} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `Meta: ${targetCalories}`, position: "right", fill: "hsl(var(--destructive))", fontSize: 10 }} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-primary" />Consumido</div>
            {targetCalories > 0 && <div className="flex items-center gap-1"><div className="h-0.5 w-4 border-t-2 border-dashed border-destructive" />Meta diaria</div>}
          </div>
        </motion.div>

        {/* Compare Side by Side */}
        {compareMode && compareLeft && compareRight && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-lg border border-primary/30 bg-card/90 backdrop-blur-sm p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <p className="font-display text-lg tracking-wide text-foreground">ANTES vs DESPUÉS</p>
              </div>
              <Button variant="ghost" size="sm" onClick={exitCompareMode} className="text-xs text-muted-foreground">
                Cerrar
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="overflow-hidden rounded-lg border border-border">
                <img src={compareLeft.photo_url} alt="Antes" className="aspect-[3/4] w-full object-cover" />
                <div className="bg-background/80 px-2 py-1.5 text-center">
                  <p className="text-xs font-bold text-muted-foreground">ANTES</p>
                  <p className="text-[10px] text-primary">Semana {compareLeft.week_number}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-primary/30">
                <img src={compareRight.photo_url} alt="Después" className="aspect-[3/4] w-full object-cover" />
                <div className="bg-primary/10 px-2 py-1.5 text-center">
                  <p className="text-xs font-bold text-primary">DESPUÉS</p>
                  <p className="text-[10px] text-foreground">Semana {compareRight.week_number}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Progress Photos */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 rounded-lg border border-border bg-card/90 backdrop-blur-sm p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <p className="font-display text-lg tracking-wide text-foreground">FOTOS DE AVANCE</p>
            </div>
            <div className="flex items-center gap-1.5">
              {photos.length >= 2 && (
                <Button
                  variant={compareMode ? "default" : "secondary"}
                  size="sm"
                  onClick={() => compareMode ? exitCompareMode() : (setCompareMode(true), setCompareLeft(null), setCompareRight(null), toast.info("Selecciona 2 fotos para comparar"))}
                  className="text-[10px] h-7 px-2"
                >
                  <ArrowLeftRight className="mr-1 h-3 w-3" />
                  {compareMode ? "Cancelar" : "Comparar"}
                </Button>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                <div className={`flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold text-primary transition-all hover:bg-primary/20 ${uploading ? "opacity-50" : ""}`}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                  {uploading ? "..." : "Subir"}
                </div>
              </label>
            </div>
          </div>

          {compareMode && (
            <p className="mb-3 text-center text-xs text-primary animate-pulse">
              {!compareLeft ? "👆 Toca la foto del ANTES" : !compareRight ? "👆 Ahora toca la foto del DESPUÉS" : "✅ Comparación lista"}
            </p>
          )}

          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-10">
              <Camera className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sube tu primera foto de avance</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Documenta tu transformación desde el día 1</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => {
                const isSelected = compareLeft?.id === photo.id || compareRight?.id === photo.id;
                return (
                  <motion.div
                    key={photo.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handlePhotoClick(photo)}
                    className={`group relative cursor-pointer overflow-hidden rounded-lg border aspect-square ${
                      isSelected ? "border-primary ring-2 ring-primary/50" : "border-border"
                    }`}
                  >
                    <img src={photo.photo_url} alt={`Semana ${photo.week_number}`} className="h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-6">
                      <p className="text-[10px] font-bold text-white">Semana {photo.week_number}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                          {compareLeft?.id === photo.id ? "ANTES" : "DESPUÉS"}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Photo detail modal with body fat estimation */}
      <AnimatePresence>
        {selectedPhoto && !compareMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => { setSelectedPhoto(null); setBodyFatResult(null); setEstimatingPhotoId(null); }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-h-[85vh] max-w-sm w-full overflow-y-auto rounded-xl border border-border bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedPhoto.photo_url} alt={`Semana ${selectedPhoto.week_number}`} className="w-full max-h-[45vh] object-contain bg-black" />
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-display text-lg text-primary tracking-wider">SEMANA {selectedPhoto.week_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedPhoto.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>

                {/* Body Fat Estimation */}
                <Button
                  onClick={() => estimateBodyFat(selectedPhoto)}
                  disabled={estimating}
                  className="w-full font-display tracking-wider box-glow"
                  size="sm"
                >
                  {estimating && estimatingPhotoId === selectedPhoto.id ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> ANALIZANDO...</>
                  ) : (
                    <><Sparkles className="mr-2 h-3.5 w-3.5" /> ESTIMAR % GRASA CORPORAL</>
                  )}
                </Button>

                {bodyFatResult && estimatingPhotoId === selectedPhoto.id && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary" />
                        <span className="font-display text-sm tracking-wider text-foreground">GRASA CORPORAL</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{bodyFatResult.bodyFatPercent}%</span>
                    </div>
                    <div className={`text-xs font-bold ${getCategoryColor(bodyFatResult.category)}`}>
                      Categoría: {bodyFatResult.category}
                    </div>
                    <p className="text-xs text-muted-foreground">{bodyFatResult.analysis}</p>
                    <p className="text-xs text-primary/80 italic">💪 {bodyFatResult.tips}</p>

                    {/* Visual bar */}
                    <div className="mt-1">
                      <div className="h-2 w-full rounded-full bg-background overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-500 via-primary to-red-500 transition-all"
                          style={{ width: `${Math.min(bodyFatResult.bodyFatPercent / (userProfile?.sex === "female" ? 45 : 40) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="mt-0.5 flex justify-between text-[8px] text-muted-foreground">
                        <span>Esencial</span>
                        <span>Atlético</span>
                        <span>Fitness</span>
                        <span>Sobrepeso</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => deletePhoto(selectedPhoto)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setSelectedPhoto(null); setBodyFatResult(null); }}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Progress;
