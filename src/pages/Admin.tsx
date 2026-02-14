import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Crown, CheckCircle, Loader2, Lock, Users, RefreshCw, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const ADMIN_PIN = "JD2026PRO";

interface PremiumUser {
  user_id: string;
  email: string;
  is_premium: boolean;
  trial_ends_at: string | null;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  premium: { label: "Premium", className: "bg-primary/20 text-primary border-primary/30" },
  trial: { label: "Prueba", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  expired: { label: "Expirado", className: "bg-destructive/20 text-destructive border-destructive/30" },
  free: { label: "Free", className: "bg-muted text-muted-foreground border-border" },
};

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
    } else {
      toast.error("PIN incorrecto");
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-premium-users`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const data = await resp.json();
      if (resp.ok) {
        setUsers(data.users || []);
      } else {
        toast.error(data.error || "Error cargando usuarios");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (authenticated) fetchUsers();
  }, [authenticated]);

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
        fetchUsers(); // Refresh list
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

      <div className="mx-auto w-full max-w-md space-y-5">
        {/* Activate Premium Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5 space-y-4"
        >
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
        </motion.div>

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

        {/* Users List Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              <h2 className="font-display text-lg tracking-wider">USUARIOS</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {users.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {loadingUsers && users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No hay usuarios registrados</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => {
                const cfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.free;
                const expiresAt = u.trial_ends_at
                  ? new Date(u.trial_ends_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                const handleDeactivate = async () => {
                  setDeactivatingId(u.user_id);
                  try {
                    const { data: sessionData } = await supabase.auth.getSession();
                    const token = sessionData.session?.access_token;
                    const resp = await fetch(
                      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deactivate-premium`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                        },
                        body: JSON.stringify({ user_email: u.email }),
                      }
                    );
                    const data = await resp.json();
                    if (resp.ok) {
                      toast.success(data.message);
                      fetchUsers();
                    } else {
                      toast.error(data.error || "Error desactivando");
                    }
                  } catch {
                    toast.error("Error de conexión");
                  } finally {
                    setDeactivatingId(null);
                  }
                };

                return (
                  <div
                    key={u.user_id}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.status === "premium" || u.status === "trial"
                            ? `Vence: ${expiresAt}`
                            : u.status === "expired"
                            ? `Venció: ${expiresAt}`
                            : `Registrado`}
                        </p>
                      </div>
                      <Badge variant="outline" className={`ml-2 shrink-0 text-[10px] ${cfg.className}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    {(u.status === "premium" || u.status === "trial") && (
                      <>
                        <button
                          onClick={() => setConfirmDeactivateId(u.user_id)}
                          disabled={deactivatingId === u.user_id}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                        >
                          {deactivatingId === u.user_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {deactivatingId === u.user_id ? "Desactivando..." : "Desactivar Premium"}
                        </button>
                        {confirmDeactivateId === u.user_id && (
                          <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              ¿Desactivar premium de {u.email}?
                            </div>
                            <p className="mb-3 text-xs text-muted-foreground">El usuario perderá acceso a funciones premium.</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmDeactivateId(null)}
                                className="flex-1 rounded-md border border-border bg-background py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => { setConfirmDeactivateId(null); handleDeactivate(); }}
                                className="flex-1 rounded-md bg-destructive py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                              >
                                Sí, desactivar
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
