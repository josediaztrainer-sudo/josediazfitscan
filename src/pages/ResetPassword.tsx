import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import loginBg from "@/assets/login-bg.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check hash for recovery token
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("¡Contraseña actualizada! Redirigiendo...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${loginBg})` }} />
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm px-6 text-center">
          <Lock className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="font-display text-2xl text-foreground mb-2">Enlace inválido</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Este enlace de recuperación ha expirado o no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full">Volver al inicio de sesión</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${loginBg})` }} />
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-6">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h1 className="font-display text-2xl text-foreground">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-foreground">Nueva contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border bg-card/80 pl-10 pr-10 text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-foreground">Confirmar contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-border bg-card/80 pl-10 text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full font-display text-lg tracking-wider box-glow">
            {loading ? "..." : "ACTUALIZAR CONTRASEÑA"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
