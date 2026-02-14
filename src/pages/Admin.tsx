import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Crown, CheckCircle, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_PIN = "JD2026PRO";

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
    } else {
      toast.error("PIN incorrecto");
    }
  };

  const handleActivate = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !months) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/activate-premium`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ user_email: trimmedEmail, months: Number(months) }),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        setResult({ success: false, message: data.error || "Error desconocido" });
        toast.error(data.error || "Error activando premium");
      } else {
        setResult({ success: true, message: data.message });
        toast.success(data.message);
        setEmail("");
      }
    } catch (err: any) {
      toast.error("Error de conexión");
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl tracking-wider text-foreground">ADMIN</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ingresa el PIN de administrador</p>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="PIN de acceso"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="border-border bg-card text-center text-lg tracking-widest text-foreground"
            />
            <Button onClick={handleLogin} className="w-full font-display tracking-wider box-glow">
              INGRESAR
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 pb-8 pt-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 box-glow">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl tracking-wider text-foreground">PANEL ADMIN</h1>
        <p className="mt-1 text-xs text-muted-foreground">Activar suscripciones Premium</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto w-full max-w-md space-y-5"
      >
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Crown className="h-5 w-5" />
            <h2 className="font-display text-lg tracking-wider">ACTIVAR PREMIUM</h2>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Email del usuario</Label>
            <Input
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-border bg-background text-foreground"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Meses a activar</Label>
            <div className="grid grid-cols-3 gap-2">
              {["1", "3", "6"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`rounded-lg border p-3 text-center font-display text-lg transition-all ${
                    months === m
                      ? "border-primary bg-primary/10 text-primary box-glow"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {m} {m === "1" ? "MES" : "MESES"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
            <p>
              <span className="font-bold text-primary">Monto:</span>{" "}
              S/{(9.9 * Number(months)).toFixed(2)}
            </p>
          </div>

          <Button
            onClick={handleActivate}
            disabled={loading || !email.trim()}
            className="w-full font-display text-lg tracking-wider box-glow"
            size="lg"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> PROCESANDO...</>
            ) : (
              <><Crown className="mr-2 h-4 w-4" /> ACTIVAR PREMIUM</>
            )}
          </Button>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${
              result.success
                ? "border-green-500/50 bg-green-500/10"
                : "border-destructive/50 bg-destructive/10"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Shield className="h-5 w-5 text-destructive" />
              )}
              <p className={`text-sm font-medium ${result.success ? "text-green-400" : "text-destructive"}`}>
                {result.message}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Admin;
