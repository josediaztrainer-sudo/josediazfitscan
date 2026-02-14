import { Navigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";

const ProtectedFeature = ({ children }: { children: React.ReactNode }) => {
  const { hasAccess, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/paywall" replace />;
  }

  return <>{children}</>;
};

export default ProtectedFeature;
