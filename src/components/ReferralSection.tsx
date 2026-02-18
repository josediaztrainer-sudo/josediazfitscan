import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Copy, Gift, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ReferralSection = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const [{ data: profile }, { data: referrals }] = await Promise.all([
        supabase
          .from("profiles")
          .select("referral_code")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("referrals")
          .select("id")
          .eq("referrer_id", user.id),
      ]);

      if (profile?.referral_code) setReferralCode(profile.referral_code);
      setReferralCount(referrals?.length || 0);
      setLoading(false);
    };

    fetch();
  }, [user]);

  const handleCopy = async () => {
    const link = `${window.location.origin}/login?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("¡Link copiado! 🔗");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/login?ref=${referralCode}`;
    const text = `¡Únete a Jose Diaz Fit Scan y transforma tu cuerpo! Usa mi código: ${referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Jose Diaz Fit Scan", text, url: link });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-primary/30 bg-card/90 backdrop-blur-sm p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <p className="font-display text-lg tracking-wide text-foreground">INVITA Y GANA</p>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Invita amigos y gana <span className="font-bold text-primary">7 días premium</span> por cada uno que se registre.
      </p>

      {/* Referral code */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-center">
          <span className="font-display text-lg tracking-[0.3em] text-primary">{referralCode}</span>
        </div>
        <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {/* Share button */}
      <Button onClick={handleShare} className="mb-3 w-full font-display tracking-wider">
        <Share2 className="mr-2 h-4 w-4" />
        COMPARTIR INVITACIÓN
      </Button>

      {/* Stats */}
      <div className="flex items-center justify-between rounded-lg bg-background/80 p-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Amigos invitados</span>
        </div>
        <span className="font-display text-lg text-primary">{referralCount}</span>
      </div>
      {referralCount > 0 && (
        <p className="mt-2 text-center text-xs text-primary">
          🎉 ¡Has ganado {referralCount * 7} días premium extra!
        </p>
      )}
    </motion.div>
  );
};

export default ReferralSection;
