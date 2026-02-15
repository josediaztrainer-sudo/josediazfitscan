import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, Share, ChevronRight, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30">
          <Smartphone className="h-10 w-10 text-primary" />
        </div>

        <h1 className="font-display text-3xl tracking-wider text-primary text-glow mb-2">
          INSTALA JD SCAN
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Agrega la app a tu pantalla de inicio para acceso rápido, sin descargas de tienda.
        </p>

        {isInstalled ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-4">
            <Check className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">¡App ya instalada!</span>
          </div>
        ) : isIOS ? (
          <div className="space-y-4 text-left">
            <p className="text-sm font-medium text-foreground text-center mb-4">
              Sigue estos pasos en Safari:
            </p>
            <Step n={1} text='Toca el botón de "Compartir"' icon={<Share className="h-4 w-4" />} />
            <Step n={2} text='Selecciona "Agregar a pantalla de inicio"' icon={<Download className="h-4 w-4" />} />
            <Step n={3} text='Toca "Agregar" para confirmar' icon={<Check className="h-4 w-4" />} />
          </div>
        ) : deferredPrompt ? (
          <Button
            onClick={handleInstall}
            className="w-full font-display tracking-wider text-lg py-6 box-glow"
          >
            <Download className="mr-2 h-5 w-5" />
            INSTALAR APP
          </Button>
        ) : (
          <div className="space-y-4 text-left">
            <p className="text-sm font-medium text-foreground text-center mb-4">
              Desde el menú de tu navegador:
            </p>
            <Step n={1} text='Abre el menú (⋮) del navegador' icon={<ChevronRight className="h-4 w-4" />} />
            <Step n={2} text='Selecciona "Instalar app" o "Agregar a pantalla de inicio"' icon={<Download className="h-4 w-4" />} />
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          Funciona sin conexión · Carga rápida · Sin tiendas de apps
        </p>
      </motion.div>
    </div>
  );
};

const Step = ({ n, text, icon }: { n: number; text: string; icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-display text-sm">
      {n}
    </div>
    <span className="text-sm text-foreground">{text}</span>
    <div className="ml-auto text-muted-foreground">{icon}</div>
  </div>
);

export default Install;
