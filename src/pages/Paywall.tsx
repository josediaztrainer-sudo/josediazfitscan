import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Shield, Zap, Star, Clock, CheckCircle, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import yapeQr from "@/assets/yape-qr.jpeg";

const FEATURES = [
  { icon: Zap, text: "Escaneo ilimitado de comidas con IA" },
  { icon: Star, text: "Coach Jose Diaz personalizado 24/7" },
  { icon: Shield, text: "Rutinas semanales según tu género y nivel" },
  { icon: CheckCircle, text: "Seguimiento de macros y calorías diario" },
];

const PLANS = [
  { id: "mensual", months: 1, label: "Mensual", price: 9.9, badge: null },
  { id: "trimestral", months: 3, label: "Trimestral", price: 24.9, badge: "Ahorra 16%" },
  { id: "semestral", months: 6, label: "Semestral", price: 44.9, badge: "Ahorra 24%" },
  { id: "anual", months: 12, label: "Anual", price: 79.9, badge: "Ahorra 33%" },
];

type PayMethod = "card" | "yape";

const Paywall = () => {
  const { status, daysLeft } = useSubscription();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PayMethod>("card");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("mensual");

  const currentPlan = PLANS.find((p) => p.id === selectedPlan)!;

  const handleStripeCheckout = async () => {
    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió la URL de pago");
      }
    } catch (e: any) {
      console.error("Checkout error:", e);
      toast.error("Error al iniciar el pago. Intenta de nuevo.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const buildWhatsAppUrl = () => {
    const planLabel = currentPlan.label;
    const price = `S/${currentPlan.price.toFixed(2)}`;
    const msg = `Hola Jose, quiero activar mi plan *${planLabel}* (${price}) de JOSE DIAZ SCAN.%0A%0AMi correo: (escribe tu correo aquí)%0A%0AAdjunto mi comprobante de pago 🧾`;
    return `https://wa.me/51941193092?text=${encodeURIComponent(msg).replace(/%250A/g, '%0A')}`;
  };

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

      {/* Plan Selection */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className="mb-6 space-y-2"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground text-center mb-3">Elige tu plan</p>
        <div className="grid grid-cols-2 gap-2">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                selectedPlan === plan.id
                  ? "border-primary bg-primary/10 box-glow"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <p className="font-display text-sm tracking-wider text-foreground mt-1">{plan.label}</p>
              <p className="font-display text-2xl tracking-wide text-primary">S/{plan.price.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">
                {plan.months === 1 ? "/mes" : `/${plan.months} meses`}
              </p>
              {plan.months > 1 && (
                <p className="text-[10px] text-primary/70">
                  S/{(plan.price / plan.months).toFixed(2)}/mes
                </p>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Payment Method Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-4"
      >
        <div className="flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setMethod("card")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
              method === "card"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Tarjeta
          </button>
          <button
            onClick={() => setMethod("yape")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${
              method === "yape"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Yape
          </button>
        </div>
      </motion.div>

      {/* Card Payment */}
      {method === "card" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-5"
        >
          <h3 className="mb-3 text-center font-display text-xl tracking-wider text-foreground">
            PAGO CON TARJETA 💳
          </h3>
          <p className="mb-4 text-center text-xs text-muted-foreground">
            Débito o crédito · Cobro automático mensual · Cancelación inmediata
          </p>

          <div className="space-y-2 rounded-lg bg-primary/5 p-3 mb-4">
            <p className="text-center text-xs font-medium text-primary">✅ Ventajas:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary">•</span> Activación instantánea al pagar</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Renovación automática sin preocupaciones</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Cancela desde tu perfil en cualquier momento</li>
            </ul>
          </div>

          <Button
            onClick={handleStripeCheckout}
            disabled={loadingCheckout}
            className="w-full font-display text-lg tracking-wider box-glow"
            size="lg"
          >
            {loadingCheckout ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                PROCESANDO...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                SUSCRIBIRSE — S/{currentPlan.price.toFixed(2)}
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Yape Payment */}
      {method === "yape" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-border bg-card p-5"
        >
          <h3 className="mb-3 text-center font-display text-xl tracking-wider text-foreground">
            PAGA CON YAPE 📱
          </h3>

          <div className="mx-auto mb-4 overflow-hidden rounded-xl" style={{ width: "fit-content" }}>
            <img
              src={yapeQr}
              alt="QR de Yape - Jose Diaz 960300099"
              className="h-52 w-52 object-contain"
            />
          </div>
          <p className="mb-1 text-center font-display text-lg tracking-wider text-foreground">960300099</p>
          <p className="mb-4 text-center text-xs text-muted-foreground">Jose Diaz · Yape</p>

          <div className="space-y-2 rounded-lg bg-primary/5 p-3 mb-4">
            <p className="text-center text-xs font-medium text-primary">📋 Instrucciones:</p>
            <ol className="space-y-1 text-xs text-muted-foreground">
              <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Abre Yape y busca el número <span className="font-bold text-foreground">960300099</span></li>
              <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Envía <span className="font-bold text-foreground">S/{currentPlan.price.toFixed(2)}</span> ({currentPlan.label})</li>
              <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Envía tu comprobante + correo por WhatsApp</li>
              <li className="flex gap-2"><span className="font-bold text-primary">4.</span> Tu cuenta se activará en menos de 24 horas</li>
            </ol>
          </div>

          <Button
            onClick={() => window.open(buildWhatsAppUrl(), "_blank")}
            className="w-full font-display text-lg tracking-wider box-glow"
            size="lg"
          >
            ENVIAR COMPROBANTE POR WHATSAPP 💬
          </Button>
        </motion.div>
      )}

      {/* Back button for trial users */}
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
  );
};

export default Paywall;
