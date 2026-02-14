import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import loginBg from "@/assets/login-bg.jpg";
import trainerPhoto from "@/assets/jose-trainer.jpeg";

const Login = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("¡Cuenta creada! Bienvenido 💪");
          navigate("/dashboard");
        } else {
          toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error("Error al iniciar con Google");
        console.error(error);
      }
    } catch (err: any) {
      toast.error(err.message || "Error con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        {/* Trainer photo */}
        <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
          <img
            src={trainerPhoto}
            alt="Jose Diaz - Personal Trainer"
            className="h-full w-full object-cover object-top"
          />
        </div>

        {/* Logo con laureles */}
        <div className="mb-6 text-center">
          <h1 className="font-display text-5xl tracking-wider text-primary text-glow leading-none">
            JOSE DIAZ
          </h1>
          <div className="mt-2 flex items-center justify-center gap-3">
            {/* Laurel izquierdo — corona de campeón */}
            <svg viewBox="0 0 40 80" className="h-14 w-7 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]" fill="currentColor">
              {/* Tallo */}
              <path d="M36 78 C34 60 30 40 28 20 C27 12 30 6 34 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Hojas - de abajo hacia arriba */}
              <ellipse cx="28" cy="68" rx="8" ry="4" transform="rotate(-30 28 68)" opacity="0.7"/>
              <ellipse cx="26" cy="60" rx="8" ry="4" transform="rotate(-40 26 60)" opacity="0.75"/>
              <ellipse cx="24" cy="52" rx="8" ry="3.5" transform="rotate(-45 24 52)" opacity="0.8"/>
              <ellipse cx="23" cy="44" rx="7" ry="3.5" transform="rotate(-50 23 44)" opacity="0.85"/>
              <ellipse cx="24" cy="36" rx="7" ry="3" transform="rotate(-55 24 36)" opacity="0.9"/>
              <ellipse cx="26" cy="28" rx="6" ry="3" transform="rotate(-50 26 28)" opacity="0.92"/>
              <ellipse cx="28" cy="21" rx="6" ry="2.5" transform="rotate(-40 28 21)" opacity="0.95"/>
              <ellipse cx="30" cy="14" rx="5" ry="2.5" transform="rotate(-25 30 14)" opacity="0.97"/>
              <ellipse cx="33" cy="8" rx="4" ry="2" transform="rotate(-10 33 8)"/>
            </svg>
            {/* Pesa / Dumbbell — más elaborada */}
            <div className="flex items-center">
              <div className="h-7 w-2.5 rounded-sm bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
              <div className="h-5 w-1.5 rounded-sm bg-primary/80" />
              <div className="h-2 w-5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.4)]" />
              <div className="h-5 w-1.5 rounded-sm bg-primary/80" />
              <div className="h-7 w-2.5 rounded-sm bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
            </div>
            {/* Laurel derecho (espejado) */}
            <svg viewBox="0 0 40 80" className="h-14 w-7 text-primary -scale-x-100 drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]" fill="currentColor">
              <path d="M36 78 C34 60 30 40 28 20 C27 12 30 6 34 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <ellipse cx="28" cy="68" rx="8" ry="4" transform="rotate(-30 28 68)" opacity="0.7"/>
              <ellipse cx="26" cy="60" rx="8" ry="4" transform="rotate(-40 26 60)" opacity="0.75"/>
              <ellipse cx="24" cy="52" rx="8" ry="3.5" transform="rotate(-45 24 52)" opacity="0.8"/>
              <ellipse cx="23" cy="44" rx="7" ry="3.5" transform="rotate(-50 23 44)" opacity="0.85"/>
              <ellipse cx="24" cy="36" rx="7" ry="3" transform="rotate(-55 24 36)" opacity="0.9"/>
              <ellipse cx="26" cy="28" rx="6" ry="3" transform="rotate(-50 26 28)" opacity="0.92"/>
              <ellipse cx="28" cy="21" rx="6" ry="2.5" transform="rotate(-40 28 21)" opacity="0.95"/>
              <ellipse cx="30" cy="14" rx="5" ry="2.5" transform="rotate(-25 30 14)" opacity="0.97"/>
              <ellipse cx="33" cy="8" rx="4" ry="2" transform="rotate(-10 33 8)"/>
            </svg>
          </div>
          <p className="mt-0.5 font-display text-2xl tracking-[0.35em] text-primary/90">
            FIT SCAN
          </p>
          <p className="mt-2 text-xs text-muted-foreground tracking-wide">
            {isSignup ? "Crea tu cuenta elite" : "Inicia sesión"}
          </p>
        </div>

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="mb-4 w-full gap-3 border-border bg-card/80 py-5 font-medium text-foreground backdrop-blur-sm hover:bg-card"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {googleLoading ? "Conectando..." : "Continuar con Google"}
        </Button>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o con email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border bg-card/80 pl-10 text-foreground placeholder:text-muted-foreground backdrop-blur-sm focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border bg-card/80 pl-10 pr-10 text-foreground placeholder:text-muted-foreground backdrop-blur-sm focus:ring-primary"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-display text-lg tracking-wider box-glow"
          >
            {loading ? "..." : isSignup ? "CREAR CUENTA" : "ENTRAR"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-primary underline-offset-4 hover:underline"
          >
            {isSignup ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
