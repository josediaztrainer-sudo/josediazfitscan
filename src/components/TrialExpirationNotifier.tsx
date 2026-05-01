import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppPremiumUrl } from "@/lib/whatsapp";
import { toast } from "sonner";

const STORAGE_KEY = "trial_notification_shown";

const TrialExpirationNotifier = () => {
  const { user } = useAuth();
  const { status, daysLeft } = useSubscription();
  const [fullName, setFullName] = useState<string | null>(null);
  const hasShown = useRef(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? null));
  }, [user]);

  useEffect(() => {
    if (hasShown.current || status === "loading" || status === "premium") return;

    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;

    hasShown.current = true;
    localStorage.setItem(STORAGE_KEY, today);

    const url = buildWhatsAppPremiumUrl({
      name: fullName ?? user?.email?.split("@")[0] ?? null,
      status,
      daysLeft,
    });
    const openWhatsApp = () => window.open(url, "_blank", "noopener,noreferrer");

    if (status === "expired") {
      toast.error("Tu prueba gratuita ha expirado", {
        description: "Adquiere tu plan mensual por WhatsApp para seguir usando la app 💪",
        duration: 10000,
        action: { label: "WHATSAPP", onClick: openWhatsApp },
      });
    } else if (daysLeft <= 1) {
      toast.warning("¡Tu prueba expira hoy!", {
        description: "Activa tu plan Premium por WhatsApp ahora 🔥",
        duration: 10000,
        action: { label: "WHATSAPP", onClick: openWhatsApp },
      });
    } else if (daysLeft <= 3) {
      toast.info(`Te quedan ${daysLeft} días de prueba`, {
        description: "Adquiere tu plan mensual por WhatsApp antes de que expire ⏰",
        duration: 8000,
        action: { label: "WHATSAPP", onClick: openWhatsApp },
      });
    }
  }, [status, daysLeft, fullName, user]);

  return null;
};

export default TrialExpirationNotifier;
