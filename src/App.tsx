import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Coach from "./pages/Coach";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const TABS = ["/dashboard", "/scan", "/coach", "/profile"];

const AppLayout = () => {
  const location = useLocation();
  const showNav = TABS.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/profile" element={<Profile />} />
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
