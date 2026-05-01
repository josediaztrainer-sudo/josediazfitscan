import { useEffect, useRef } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const STORAGE_KEY = "trial_notification_shown";
const WHATSAPP_URL = "https://wa.me/message/M5LVYI64RN2GD1";

const openWhatsApp = () => {
  window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
};

const TrialExpirationNotifier = () => {
  const { status, daysLeft } = useSubscription();
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current || status === "loading" || status === "premium") return;

    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;

    hasShown.current = true;
    localStorage.setItem(STORAGE_KEY, today);

    if (status === "expired") {
      toast.error("Tu prueba gratuita ha expirado", {
        description: "Adquiere tu plan mensual por WhatsApp para seguir usando la app 💪",
        duration: 10000,
        action: {
          label: "WHATSAPP",
          onClick: openWhatsApp,
        },
      });
    } else if (daysLeft <= 1) {
      toast.warning("¡Tu prueba expira hoy!", {
        description: "Activa tu plan Premium por WhatsApp ahora 🔥",
        duration: 10000,
        action: {
          label: "WHATSAPP",
          onClick: openWhatsApp,
        },
      });
    } else if (daysLeft <= 3) {
      toast.info(`Te quedan ${daysLeft} días de prueba`, {
        description: "Adquiere tu plan mensual por WhatsApp antes de que expire ⏰",
        duration: 8000,
        action: {
          label: "WHATSAPP",
          onClick: openWhatsApp,
        },
      });
    }
  }, [status, daysLeft]);

  return null;
};

export default TrialExpirationNotifier;
