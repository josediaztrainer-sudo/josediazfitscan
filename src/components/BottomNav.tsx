import { useLocation, useNavigate } from "react-router-dom";
import { Home, ScanLine, MessageCircle, User } from "lucide-react";

const tabs = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/scan", icon: ScanLine, label: "Escanear" },
  { path: "/coach", icon: MessageCircle, label: "Coach" },
  { path: "/profile", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_hsl(48,100%,50%,0.6)]" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
