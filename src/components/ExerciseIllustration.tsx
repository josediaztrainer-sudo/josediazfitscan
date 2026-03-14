import { useState } from "react";
import { Eye, Loader2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-exercise-image`;

interface Props {
  exerciseName: string;
}

const ExerciseIllustration = ({ exerciseName }: Props) => {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const generate = async () => {
    setOpen(true);
    if (imageUrl) return; // Already generated
    setLoading(true);
    setError(false);

    try {
      const resp = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ exerciseName }),
      });

      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={generate}
        className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/25 active:scale-95"
        title={`Ver técnica: ${exerciseName}`}
      >
        <Eye className="h-3 w-3" />
        Ver técnica
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border-border bg-card p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-display text-sm tracking-wider text-primary truncate pr-4">
              {exerciseName.toUpperCase()}
            </h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-center min-h-[300px] p-4">
            {loading && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Generando ilustración de técnica...</p>
                <p className="text-xs text-muted-foreground/60">Esto puede tomar unos segundos</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <p className="text-sm">No se pudo generar la ilustración</p>
                <button
                  onClick={() => { setError(false); generate(); }}
                  className="text-xs text-primary underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {imageUrl && !loading && (
              <img
                src={imageUrl}
                alt={`Técnica correcta: ${exerciseName}`}
                className="w-full rounded-lg"
                loading="lazy"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExerciseIllustration;
