import { User, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-8">
      <h1 className="mb-6 font-display text-3xl tracking-wider text-primary text-glow">
        MI PERFIL
      </h1>

      {/* Avatar placeholder */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-sans text-lg font-semibold text-foreground">Usuario</p>
          <p className="text-sm text-muted-foreground">Completa el onboarding para ver tus datos</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2">
        {[
          { label: "Datos personales", desc: "Edad, peso, altura, objetivo" },
          { label: "Mi plan nutricional", desc: "TDEE, macros, calorías" },
          { label: "Suscripción", desc: "JOSE DIAZ SCAN PRO" },
        ].map((item) => (
          <button
            key={item.label}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <Button
        variant="destructive"
        onClick={handleLogout}
        className="mt-8 w-full"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar sesión
      </Button>
    </div>
  );
};

export default Profile;
