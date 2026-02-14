import { motion } from "framer-motion";
import { Crown, Shield, Zap, Star, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: Zap, text: "Escaneo ilimitado de comidas con IA" },
  { icon: Star, text: "Coach Jose Diaz personalizado 24/7" },
  { icon: Shield, text: "Rutinas semanales según tu género y nivel" },
  { icon: CheckCircle, text: "Seguimiento de macros y calorías diario" },
];

const Paywall = () => {
  const { status, daysLeft } = useSubscription();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 pb-8 pt-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 box-glow-strong">
          <Crown className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-display text-4xl tracking-wider text-foreground">
          JOSE DIAZ <span className="gradient-gold-text">PREMIUM</span>
        </h1>
        {status === "expired" ? (
          <p className="mt-2 text-sm text-destructive font-medium">
            Tu prueba gratuita ha expirado
          </p>
        ) : status === "trial" ? (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-primary">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">Te quedan {daysLeft} días de prueba</span>
          </div>
        ) : null}
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 space-y-3"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <f.icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">{f.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Price Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-6 rounded-xl border-2 border-primary/50 bg-card p-5 text-center box-glow"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Suscripción mensual</p>
        <div className="my-2 flex items-baseline justify-center gap-1">
          <span className="font-display text-5xl tracking-wide text-primary">S/9.90</span>
          <span className="text-sm text-muted-foreground">/mes</span>
        </div>
        <p className="text-xs text-muted-foreground">Cancela cuando quieras · Sin compromisos</p>
      </motion.div>

      {/* Yape QR Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6 rounded-xl border border-border bg-card p-5"
      >
        <h3 className="mb-3 text-center font-display text-xl tracking-wider text-foreground">
          PAGA CON YAPE 📱
        </h3>

        {/* QR placeholder - purple Yape style */}
        <div className="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-primary/30 bg-background">
          <div className="text-center">
            <p className="font-display text-lg text-primary">YAPE</p>
            <p className="mt-1 text-2xl font-bold text-foreground">960300099</p>
            <p className="mt-1 text-xs text-muted-foreground">Jose Diaz</p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg bg-primary/5 p-3">
          <p className="text-center text-xs font-medium text-primary">📋 Instrucciones:</p>
          <ol className="space-y-1 text-xs text-muted-foreground">
            <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Abre Yape y busca el número <span className="font-bold text-foreground">960300099</span></li>
            <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Envía <span className="font-bold text-foreground">S/9.90</span> con tu email como mensaje</li>
            <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Tu cuenta se activará en menos de 24 horas</li>
          </ol>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="mt-auto space-y-3">
        <Button
          onClick={() => window.open("https://wa.me/51960300099?text=Hola%20Jose,%20quiero%20activar%20mi%20Premium%20de%20JOSE%20DIAZ%20SCAN", "_blank")}
          className="w-full font-display text-lg tracking-wider box-glow"
          size="lg"
        >
          ENVIAR COMPROBANTE POR WHATSAPP 💬
        </Button>

        {status === "trial" && (
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="w-full text-muted-foreground"
          >
            Continuar con prueba gratuita ({daysLeft} días restantes)
          </Button>
        )}
      </div>
    </div>
  );
};

export default Paywall;
