import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";

// Critical routes - loaded immediately
import Home from "./pages/Home";
import TestIshlash from "./pages/TestIshlash";

// Non-critical routes - lazy loaded
const Belgilar = lazy(() => import("./pages/Belgilar"));
const Contact = lazy(() => import("./pages/Contact"));
const Darslik = lazy(() => import("./pages/Darslik"));
const Qoshimcha = lazy(() => import("./pages/Qoshimcha"));
const Variant = lazy(() => import("./pages/Variant"));
const MavzuliTestlar = lazy(() => import("./pages/MavzuliTestlar"));
const Pro = lazy(() => import("./pages/Pro"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/auth/callback"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:'40px',height:'40px',border:'3px solid #e5e7eb',borderTopColor:'#1e3a8a',borderRadius:'50%',animation:'spin 0.6s linear infinite'}}></div></div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/test-ishlash" element={<TestIshlash />} />
                <Route path="/belgilar" element={<Belgilar />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/darslik" element={<Darslik />} />
                <Route path="/qoshimcha" element={<Qoshimcha />} />
                <Route path="/variant" element={<Variant />} />
                <Route path="/mavzuli" element={<MavzuliTestlar />} />
                <Route path="/pro" element={<Pro />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
