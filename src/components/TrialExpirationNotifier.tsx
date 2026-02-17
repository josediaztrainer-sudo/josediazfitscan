import { useEffect, useRef } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "trial_notification_shown";

const TrialExpirationNotifier = () => {
  const { status, daysLeft } = useSubscription();
  const navigate = useNavigate();
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current || status === "loading" || status === "premium") return;

    // Only notify for trial users or expired
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;

    hasShown.current = true;
    localStorage.setItem(STORAGE_KEY, today);

    if (status === "expired") {
      toast.error("Tu prueba gratuita ha expirado", {
        description: "Hazte Premium para seguir usando todas las funciones 💪",
        duration: 8000,
        action: {
          label: "VER PLANES",
          onClick: () => navigate("/paywall"),
        },
      });
    } else if (daysLeft <= 1) {
      toast.warning("¡Tu prueba expira hoy!", {
        description: "Activa Premium ahora para no perder acceso 🔥",
        duration: 8000,
        action: {
          label: "ACTIVAR",
          onClick: () => navigate("/paywall"),
        },
      });
    } else if (daysLeft <= 3) {
      toast.info(`Te quedan ${daysLeft} días de prueba`, {
        description: "Aprovecha y hazte Premium antes de que expire ⏰",
        duration: 6000,
        action: {
          label: "VER PLANES",
          onClick: () => navigate("/paywall"),
        },
      });
    }
  }, [status, daysLeft, navigate]);

  return null;
};

export default TrialExpirationNotifier;
