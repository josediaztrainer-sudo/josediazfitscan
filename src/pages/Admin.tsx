import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Crown, CheckCircle, Loader2, Lock, Users, RefreshCw, XCircle, AlertTriangle, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface PremiumUser {
  user_id: string;
  email: string;
  is_premium: boolean;
  trial_ends_at: string | null;
  status: string;
  created_at: string;
}

interface Transaction {
  id: string;
  user_email: string;
  action: string;
  plan_months: number;
  amount: number;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  premium: { label: "Premium", className: "bg-primary/20 text-primary border-primary/30" },
  trial: { label: "Prueba", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  expired: { label: "Expirado", className: "bg-destructive/20 text-destructive border-destructive/30" },
  free: { label: "Free", className: "bg-muted text-muted-foreground border-border" },
};

const ACTION_CONFIG: Record<string, { label: string; className: string }> = {
  activate: { label: "Activación", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  deactivate: { label: "Desactivación", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

const MONTH_OPTIONS = [
  { value: "1", label: "1 MES" },
  { value: "3", label: "3 MESES" },
  { value: "6", label: "6 MESES" },
  { value: "12", label: "12 MESES" },
];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "history">("users");

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) { setCheckingAdmin(false); setIsAdmin(false); return; }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) { setIsAdmin(false); setCheckingAdmin(false); return; }
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-premium-users`,
          { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
        );
        if (resp.ok) {
          setIsAdmin(true);
          const data = await resp.json();
          setUsers(data.users || []);
          fetchTransactions();
        } else {
          setIsAdmin(false);
        }
      } catch { setIsAdmin(false); }
      finally { setCheckingAdmin(false); }
    };
    if (!authLoading) checkAdminRole();
  }, [user, authLoading]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-premium-users`,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      const data = await resp.json();
      if (resp.ok) setUsers(data.users || []);
      else toast.error(data.error || "Error cargando usuarios");
    } catch { toast.error("Error de conexión"); }
    finally { setLoadingUsers(false); }
  };

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const { data, error } = await supabase
        .from("payment_transactions" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data) setTransactions(data as any as Transaction[]);
    } catch { /* silent */ }
    finally { setLoadingTx(false); }
  };

  const handleActivate = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !months) { toast.error("Completa todos los campos"); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/activate-premium`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        fetchUsers();
        fetchTransactions();
      }
    } catch (err: any) {
      toast.error("Error de conexión");
      setResult({ success: false, message: err.message });
    } finally { setLoading(false); }
  };

  const handleDeleteUser = async (userEmail: string, userId: string) => {
    setDeletingId(userId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_email: userEmail }),
        }
      );
      const data = await resp.json();
      if (resp.ok) { toast.success(data.message); fetchUsers(); }
      else toast.error(data.error || "Error eliminando usuario");
    } catch { toast.error("Error de conexión"); }
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  };

  if (authLoading || checkingAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-display text-3xl tracking-wider text-foreground">ACCESO DENEGADO</h1>
          <p className="text-sm text-muted-foreground">
            {!user ? "Debes iniciar sesión para acceder." : "No tienes permisos de administrador."}
          </p>
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
        <p className="mt-1 text-xs text-muted-foreground">Gestión de usuarios y suscripciones</p>
      </motion.div>

      <div className="mx-auto w-full max-w-md space-y-5">
        {/* Activate Premium Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Crown className="h-5 w-5" />
            <h2 className="font-display text-lg tracking-wider">ACTIVAR PREMIUM</h2>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Email del usuario</Label>
            <Input type="email" placeholder="usuario@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="border-border bg-background text-foreground" maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Plan a activar</Label>
            <div className="grid grid-cols-2 gap-2">
              {MONTH_OPTIONS.map((m) => (
                <button key={m.value} onClick={() => setMonths(m.value)}
                  className={`rounded-lg border p-3 text-center font-display text-sm transition-all ${months === m.value ? "border-primary bg-primary/10 text-primary box-glow" : "border-border bg-background text-muted-foreground hover:border-primary/50"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
            <p><span className="font-bold text-primary">Monto:</span> S/{(9.9 * Number(months)).toFixed(2)}</p>
          </div>
          <Button onClick={handleActivate} disabled={loading || !email.trim()} className="w-full font-display text-lg tracking-wider box-glow" size="lg">
            {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> PROCESANDO...</>) : (<><Crown className="mr-2 h-4 w-4" /> ACTIVAR PREMIUM</>)}
          </Button>
        </motion.div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${result.success ? "border-green-500/50 bg-green-500/10" : "border-destructive/50 bg-destructive/10"}`}>
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Shield className="h-5 w-5 text-destructive" />}
              <p className={`text-sm font-medium ${result.success ? "text-green-400" : "text-destructive"}`}>{result.message}</p>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex rounded-lg border border-border bg-card p-1">
          <button onClick={() => setActiveTab("users")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${activeTab === "users" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Users className="h-4 w-4" /> Usuarios
          </button>
          <button onClick={() => setActiveTab("history")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all ${activeTab === "history" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <History className="h-4 w-4" /> Historial
          </button>
        </div>

        {/* Users List */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <h2 className="font-display text-lg tracking-wider">USUARIOS</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{users.length}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchUsers} disabled={loadingUsers} className="h-8 w-8">
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {loadingUsers && users.length === 0 ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : users.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No hay usuarios registrados</p>
            ) : (
              <div className="space-y-2">
                {users.map((u) => {
                  const cfg = STATUS_CONFIG[u.status] || STATUS_CONFIG.free;
                  const expiresAt = u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

                  const handleDeactivate = async () => {
                    setDeactivatingId(u.user_id);
                    try {
                      const { data: sessionData } = await supabase.auth.getSession();
                      const token = sessionData.session?.access_token;
                      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deactivate-premium`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ user_email: u.email }),
                      });
                      const data = await resp.json();
                      if (resp.ok) { toast.success(data.message); fetchUsers(); fetchTransactions(); }
                      else toast.error(data.error || "Error desactivando");
                    } catch { toast.error("Error de conexión"); }
                    finally { setDeactivatingId(null); }
                  };

                  return (
                    <div key={u.user_id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{u.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.status === "premium" || u.status === "trial" ? `Vence: ${expiresAt}` : u.status === "expired" ? `Venció: ${expiresAt}` : `Registrado`}
                          </p>
                        </div>
                        <Badge variant="outline" className={`ml-2 shrink-0 text-[10px] ${cfg.className}`}>{cfg.label}</Badge>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {(u.status === "premium" || u.status === "trial") && (
                          <button onClick={() => setConfirmDeactivateId(u.user_id)} disabled={deactivatingId === u.user_id}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50">
                            {deactivatingId === u.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                            {deactivatingId === u.user_id ? "..." : "Desactivar"}
                          </button>
                        )}
                        <button onClick={() => setConfirmDeleteId(u.user_id)} disabled={deletingId === u.user_id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-600/30 bg-red-600/10 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-600/20 disabled:opacity-50">
                          {deletingId === u.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          {deletingId === u.user_id ? "..." : "Eliminar"}
                        </button>
                      </div>

                      {confirmDeactivateId === u.user_id && (
                        <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5" /> ¿Desactivar premium de {u.email}?
                          </div>
                          <p className="mb-3 text-xs text-muted-foreground">El usuario perderá acceso a funciones premium.</p>
                          <div className="flex gap-2">
                            <button onClick={() => setConfirmDeactivateId(null)} className="flex-1 rounded-md border border-border bg-background py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">Cancelar</button>
                            <button onClick={() => { setConfirmDeactivateId(null); handleDeactivate(); }} className="flex-1 rounded-md bg-destructive py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90">Sí, desactivar</button>
                          </div>
                        </div>
                      )}

                      {confirmDeleteId === u.user_id && (
                        <div className="mt-2 rounded-lg border border-red-600/30 bg-red-600/5 p-3">
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-red-500">
                            <AlertTriangle className="h-3.5 w-3.5" /> ¿ELIMINAR a {u.email}?
                          </div>
                          <p className="mb-3 text-xs text-muted-foreground">Esta acción es irreversible. Se borrarán todos los datos del usuario.</p>
                          <div className="flex gap-2">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-md border border-border bg-background py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">Cancelar</button>
                            <button onClick={() => handleDeleteUser(u.email, u.user_id)} className="flex-1 rounded-md bg-red-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700">Sí, eliminar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Transaction History */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <History className="h-5 w-5" />
                <h2 className="font-display text-lg tracking-wider">HISTORIAL</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{transactions.length}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchTransactions} disabled={loadingTx} className="h-8 w-8">
                <RefreshCw className={`h-4 w-4 ${loadingTx ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {loadingTx && transactions.length === 0 ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No hay transacciones registradas</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const acfg = ACTION_CONFIG[tx.action] || { label: tx.action, className: "bg-muted text-muted-foreground border-border" };
                  const date = new Date(tx.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={tx.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="truncate text-sm font-medium text-foreground">{tx.user_email}</p>
                        <Badge variant="outline" className={`ml-2 shrink-0 text-[10px] ${acfg.className}`}>{acfg.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{date}</span>
                        <div className="flex items-center gap-2">
                          {tx.plan_months > 0 && <span>{tx.plan_months} mes{tx.plan_months > 1 ? "es" : ""}</span>}
                          {tx.amount > 0 && <span className="font-medium text-primary">S/{tx.amount.toFixed(2)}</span>}
                        </div>
                      </div>
                      {tx.notes && <p className="mt-1 text-[10px] text-muted-foreground/70">{tx.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Admin;
