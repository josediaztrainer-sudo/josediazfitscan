import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type SubStatus = "loading" | "trial" | "premium" | "expired";

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubStatus>("loading");
  const [daysLeft, setDaysLeft] = useState(0);

  const check = useCallback(async () => {
    if (!user) return;

    // First check Stripe subscription
    try {
      const { data } = await supabase.functions.invoke("check-subscription");
      if (data?.subscribed) {
        const end = data.subscription_end ? new Date(data.subscription_end) : null;
        const now = new Date();
        if (end) {
          const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setDaysLeft(diff);
        }
        setStatus("premium");
        return;
      }
    } catch {
      // Stripe check failed, fall back to DB check
    }

    // Fall back to DB-based check (Yape manual activation)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, trial_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      setStatus("expired");
      return;
    }

    if (profile.trial_ends_at) {
      const end = new Date(profile.trial_ends_at);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (profile.is_premium) {
        if (diff > 0) {
          setDaysLeft(diff);
          setStatus("premium");
        } else {
          setDaysLeft(0);
          setStatus("expired");
        }
      } else if (diff > 0) {
        setDaysLeft(diff);
        setStatus("trial");
      } else {
        setDaysLeft(0);
        setStatus("expired");
      }
    } else {
      setStatus("expired");
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setStatus("loading");
      return;
    }

    check();

    // Re-check every 60 seconds
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [user, check]);

  const hasAccess = status === "trial" || status === "premium";

  return { status, daysLeft, hasAccess, loading: status === "loading", refresh: check };
}
