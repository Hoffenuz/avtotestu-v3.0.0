import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Car, MapPin, User, LogIn, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { path: "/", label: "Bosh sahifa" },
  { path: "/contact", label: "Aloqa" },
  { path: "/darslik", label: "Darslik" },
  { path: "/qoshimcha", label: "Qo'shimcha" },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // If we're inside the "mavzuli" section, render a clean full-bleed layout
  // without the main navbar/footer so it behaves like an isolated subdomain.
  const isMavzuliSection =
    location.pathname === '/mavzuli' || location.pathname.startsWith('/mavzuli/');
  if (isMavzuliSection) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/logo.ico" 
                alt="AvtoExclusive Logo" 
                className="w-10 h-10 rounded-xl shadow-md object-contain"
              />
              <span className="text-primary-foreground font-bold text-xl hidden sm:block tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                AVTOTESTU.UZ
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 font-medium transition-all duration-200 ${
                      isActive
                        ? "text-[hsl(var(--cta-green))]"
                        : "text-primary-foreground/80 hover:text-primary-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Pro Button */}
              <Link to="/pro">
                <Button className="ml-2 bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))] text-white font-semibold px-5">
                  <Crown className="w-4 h-4 mr-1" />
                  Pro olish
                </Button>
              </Link>

              {/* User Profile / Login */}
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/profile')}
                  className="ml-2 flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Avatar className="h-8 w-8 bg-[hsl(var(--cta-orange))]">
                    <AvatarFallback className="bg-[hsl(var(--cta-orange))] text-white text-sm font-semibold">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden xl:block font-medium">
                    {profile?.full_name || profile?.username || 'Foydalanuvchi'}
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/auth')}
                  className="ml-2 bg-[hsl(var(--cta-orange))] hover:bg-[hsl(var(--cta-orange-hover))] text-white font-semibold"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Kirish
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Pro Button - Mobile */}
              <Link to="/pro">
                <Button 
                  size="sm"
                  className="bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))] text-white font-semibold px-3"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Pro
                </Button>
              </Link>
              
              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile')}
                  className="text-primary-foreground"
                >
                  <Avatar className="h-8 w-8 bg-[hsl(var(--cta-orange))]">
                    <AvatarFallback className="bg-[hsl(var(--cta-orange))] text-white text-sm font-semibold">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="bg-[hsl(var(--cta-orange))] hover:bg-[hsl(var(--cta-orange-hover))] text-white"
                >
                  <LogIn className="w-4 h-4" />
                </Button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-primary/95 backdrop-blur-lg border-t border-primary-foreground/10">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? "text-[hsl(var(--cta-green))]"
                        : "text-primary-foreground/80 hover:text-primary-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/pro"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-[hsl(var(--cta-green))]"
              >
                <Crown className="w-5 h-5" />
                Pro olish
              </Link>
              <a
                href="https://maps.app.goo.gl/3vy3i4WX77W7WvLj7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-primary-foreground/80 hover:text-primary-foreground transition-all duration-200"
              >
                <MapPin className="w-5 h-5" />
                Xarita
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo.ico" 
                  alt="AvtoExclusive Logo" 
                  className="w-10 h-10 rounded-xl object-contain"
                />
                <span className="font-bold text-xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>AVTOTESTU.UZ</span>
              </div>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                Professional haydovchilik guvohnomasini olish uchun zamonaviy onlayn platforma. 
                Yo'l harakati qoidalari bo'yicha test savollari.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Tezkor havolalar</h3>
              <div className="space-y-2">
                {navLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Bog'lanish</h3>
              <div className="space-y-2 text-sm text-primary-foreground/70">
                <p>Telegram: @avtotestu_ad</p>
                <p>Bot: @Avtotesturganchbot</p>
                <p>Ish vaqti: Dush - Shan: 09:00 - 18:00</p>
              </div>
            </div>
          </div>

          <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center text-primary-foreground/50 text-sm">
            © 2025 AvtoExclusive. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>
    </div>
  );
}
