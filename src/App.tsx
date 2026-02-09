import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Belgilar from "./pages/Belgilar";
import Contact from "./pages/Contact";
import Darslik from "./pages/Darslik";
import Qoshimcha from "./pages/Qoshimcha";
import Variant from "./pages/Variant";
import MavzuliTestlar from "./pages/MavzuliTestlar";
import TestIshlash from "./pages/TestIshlash";
import Pro from "./pages/Pro";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/belgilar" element={<Belgilar />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/darslik" element={<Darslik />} />
              <Route path="/qoshimcha" element={<Qoshimcha />} />
              <Route path="/variant" element={<Variant />} />
              <Route path="/mavzuli" element={<MavzuliTestlar />} />
              <Route path="/test-ishlash" element={<TestIshlash />} />
              <Route path="/pro" element={<Pro />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
