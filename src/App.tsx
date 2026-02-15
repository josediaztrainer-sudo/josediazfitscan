import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Coach from "./pages/Coach";
import Profile from "./pages/Profile";
import Paywall from "./pages/Paywall";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Progress from "./pages/Progress";
import Install from "./pages/Install";
import BottomNav from "./components/BottomNav";
import ProtectedFeature from "./components/ProtectedFeature";

const queryClient = new QueryClient();

const TABS = ["/dashboard", "/scan", "/coach", "/progress", "/profile"];

const AppLayout = () => {
  const location = useLocation();
  const showNav = TABS.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scan" element={<ProtectedFeature><Scan /></ProtectedFeature>} />
        <Route path="/coach" element={<ProtectedFeature><Coach /></ProtectedFeature>} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/paywall" element={<Paywall />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/install" element={<Install />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
