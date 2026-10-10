import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  MessageCircle,
  UserPlus,
  Eye,
  Building2,
  Radio,
  MapPin,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Onboarding', icon: UserPlus },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'Calm Voice AI', icon: MessageCircle },
  { to: '/status', label: 'Family Status', icon: Eye },
  { to: '/admin', label: 'Embassy Admin', icon: Building2 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    // CHANGED: Pure black background (bg-black) and pure white text (text-white) for maximum contrast
    <div className="min-h-screen bg-black flex flex-col font-sans antialiased text-white">
      {/* CHANGED: Header is now black with a subtle neutral border */}
      <header className="bg-black text-white sticky top-0 z-50 shadow-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-tr from-cyan-600 to-sky-500 p-2 rounded-xl group-hover:scale-105 transition-transform shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight">SafePass</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-700/50">
                  TravelTech
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-950/60 border border-rose-800/50 px-2.5 py-1 rounded-full">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                <span className="hidden sm:inline">Kancheepuram Red Warning</span>
                <span className="sm:hidden">Red Alert</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-black border-t border-neutral-800 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* CHANGED: Footer updated to match the black background */}
      <footer className="bg-black text-neutral-400 text-xs py-4 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            <strong className="text-neutral-200">SafePass</strong> — Autonomous Tourist Crisis Triage & Consular Diplomatic Bridge
          </p>
          <p className="text-neutral-500">
            IIITDM Kancheepuram Hackathon 2026 • TravelTech Track
          </p>
        </div>
      </footer>
    </div>
  );
}