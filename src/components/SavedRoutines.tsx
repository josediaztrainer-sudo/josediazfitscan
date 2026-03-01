import { useState, useEffect, useCallback } from "react";
import { Dumbbell, Trash2, Loader2, X, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SavedRoutine {
  id: string;
  title: string;
  routine_content: string;
  frequency_days: number | null;
  level: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SavedRoutines = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingRoutine, setViewingRoutine] = useState<SavedRoutine | null>(null);

  const fetchRoutines = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("saved_routines" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRoutines((data as any[] || []) as SavedRoutine[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open) fetchRoutines();
  }, [open, fetchRoutines]);

  const deleteRoutine = async (id: string) => {
    await supabase.from("saved_routines" as any).delete().eq("id", id);
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    if (viewingRoutine?.id === id) setViewingRoutine(null);
    toast.success("Rutina eliminada");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-card text-foreground max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wider text-primary">
            <Dumbbell className="h-5 w-5" /> MIS RUTINAS GUARDADAS
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {viewingRoutine ? "Detalle de tu rutina" : `${routines.length} rutina(s) guardada(s)`}
          </DialogDescription>
        </DialogHeader>

        {viewingRoutine ? (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewingRoutine(null)}
              className="text-muted-foreground"
            >
              ← Volver a la lista
            </Button>
            <h3 className="font-display text-base tracking-wider text-primary">{viewingRoutine.title}</h3>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {viewingRoutine.frequency_days && (
                <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                  {viewingRoutine.frequency_days} días/sem
                </span>
              )}
              {viewingRoutine.level && (
                <span className="rounded bg-primary/10 px-2 py-0.5 text-primary capitalize">
                  {viewingRoutine.level}
                </span>
              )}
            </div>
            <div className="prose prose-sm prose-invert max-w-none rounded-lg border border-border bg-background p-3 [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:bg-primary/20 [&_th]:text-primary [&_th]:px-2 [&_th]:py-1 [&_th]:border [&_th]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:border [&_td]:border-border [&_h3]:text-primary [&_strong]:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewingRoutine.routine_content}</ReactMarkdown>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : routines.length === 0 ? (
          <div className="py-12 text-center">
            <Dumbbell className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              Aún no tienes rutinas guardadas.
            </p>
            <p className="text-xs text-muted-foreground">
              Genera una rutina con el coach y guárdala con el botón 💾
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {routines.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/50 cursor-pointer"
                onClick={() => setViewingRoutine(r)}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">{r.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {r.frequency_days && (
                      <span className="text-xs text-primary">{r.frequency_days}d/sem</span>
                    )}
                    {r.level && (
                      <span className="text-xs text-primary capitalize">{r.level}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteRoutine(r.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SavedRoutines;
