import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type SubStatus = "loading" | "trial" | "premium" | "expired";

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubStatus>("loading");
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!user) {
      setStatus("loading");
      return;
    }

    const check = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium, trial_ends_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) {
        setStatus("expired");
        return;
      }

      if (profile.is_premium) {
        setStatus("premium");
        return;
      }

      if (profile.trial_ends_at) {
        const end = new Date(profile.trial_ends_at);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) {
          setDaysLeft(diff);
          setStatus("trial");
        } else {
          setDaysLeft(0);
          setStatus("expired");
        }
      } else {
        setStatus("expired");
      }
    };

    check();
  }, [user]);

  const hasAccess = status === "trial" || status === "premium";

  return { status, daysLeft, hasAccess, loading: status === "loading" };
}
