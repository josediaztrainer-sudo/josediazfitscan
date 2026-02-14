import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Scan = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    // TODO: send to AI edge function
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 2000); // mock
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 pb-24 pt-8">
      <h1 className="mb-2 font-display text-3xl tracking-wider text-primary text-glow">
        ESCANEA TU COMIDA
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Toma una foto o sube desde galería
      </p>

      {!preview ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full max-w-sm flex-col gap-4"
        >
          <Button
            onClick={() => cameraRef.current?.click()}
            className="h-32 w-full font-display text-xl tracking-wider box-glow"
          >
            <Camera className="mr-2 h-6 w-6" />
            CÁMARA
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            className="h-16 w-full font-display text-lg tracking-wider"
          >
            <ImageIcon className="mr-2 h-5 w-5" />
            GALERÍA
          </Button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </motion.div>
      ) : (
        <div className="w-full max-w-sm">
          <div className="relative mb-4 overflow-hidden rounded-lg border border-border">
            <img src={preview} alt="Comida" className="w-full object-cover" style={{ maxHeight: 300 }} />
            {analyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 font-display text-lg text-primary">ANALIZANDO...</span>
              </div>
            )}
          </div>
          {!analyzing && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Resultados de IA aparecerán aquí. Conecta el backend para activar el escaneo.
              </p>
            </div>
          )}
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => { setPreview(null); setAnalyzing(false); }}
          >
            Escanear otra
          </Button>
        </div>
      )}
    </div>
  );
};

export default Scan;
