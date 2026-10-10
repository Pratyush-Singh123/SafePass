import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  MessageCircle,
  UserPlus,
  Eye,
  Building2,
  Radio,
  LogOut,
  Phone,
  ShieldAlert,
  X,
  AlertTriangle,
  User,
  LogIn,
  Navigation,
  Copy,
  Check,
  Download,
  WifiOff,
} from 'lucide-react';
import {
  isLoggedIn,
  getCurrentUser,
  logoutUser,
  getLastLocation,
} from '@/lib/auth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Monitor network connectivity status in real time
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Sync auth state when location changes or session updates
  useEffect(() => {
    setAuthenticated(isLoggedIn());
    setUser(getCurrentUser());
  }, [location.pathname]);

  const handleConfirmLogout = () => {
    logoutUser();
    setAuthenticated(false);
    setUser(null);
    setLogoutModalOpen(false);
    navigate('/login');
  };

  const lastLocation = getLastLocation();

  const getCompressedSmsText = () => {
    const lat = lastLocation.lat.toFixed(4);
    const lng = lastLocation.lng.toFixed(4);
    return `SAFEPASS-SOS: Emergency Assistance Needed | GPS:${lat}N,${lng}E | LOC:${lastLocation.label} | STATUS:DANGER | BATTERY:CRITICAL`;
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(getCompressedSmsText());
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2000);
  };

  const navItems = authenticated
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/chat', label: 'Calm Voice AI', icon: MessageCircle },
        { to: '/status', label: 'Family Status', icon: Eye },
        { to: '/admin', label: 'Consular Admin', icon: Building2 },
      ]
    : [
        { to: '/login', label: 'Log In', icon: LogIn },
        { to: '/onboarding', label: 'Register Pass', icon: UserPlus },
        { to: '/status', label: 'Family Status', icon: Eye },
        { to: '/admin', label: 'Consular Admin', icon: Building2 },
      ];

  return (
    // CHANGED: Pure black background (bg-black) and pure white text (text-white) for maximum contrast
    <div className="min-h-screen bg-black flex flex-col font-sans antialiased text-white">
      {/* CHANGED: Header is now black with a subtle neutral border */}
      <header className="bg-black text-white sticky top-0 z-50 shadow-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={authenticated ? '/dashboard' : '/login'} className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-tr from-cyan-600 to-sky-500 p-2 rounded-xl group-hover:scale-105 transition-transform shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight">SafePass</span>
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

            {/* Right Controls: User Session Badge or Emergency SOS */}
            <div className="flex items-center gap-2">
              {authenticated && user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-slate-200">{user.name.split(' ')[0]}</span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {user.nationality}
                    </span>
                  </div>

                  <button
                    onClick={() => setLogoutModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-xl transition-all"
                    title="Log Out of SafePass"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSosModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-white font-extrabold bg-rose-600 hover:bg-rose-700 border border-rose-500 px-3 py-1.5 rounded-xl shadow-sm transition-all"
                >
                  <Phone className="w-3.5 h-3.5 animate-pulse" />
                  <span>Emergency SOS</span>
                </button>
              )}

              {/* Install PWA Prompt Button */}
              {installPrompt && (
                <button
                  onClick={() => {
                    installPrompt.prompt();
                    setInstallPrompt(null);
                  }}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 px-2.5 py-1.5 rounded-xl font-bold transition-all shadow-sm"
                  title="Install SafePass as Offline Emergency App"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}

              <span className="hidden lg:flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-950/60 border border-rose-800/50 px-2.5 py-1 rounded-full">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                <span>Kancheepuram Red Alert</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
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

      {/* OFFLINE EMERGENCY STATUS BANNER */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 text-xs font-bold shadow-md sticky top-16 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-200 animate-pulse flex-shrink-0" />
              <span>
                <strong>CELLULAR / INTERNET OFFLINE:</strong> SafePass Offline Protocol active. Local Calm Voice AI, cached high-ground shelters, and 2G SMS strings are 100% operational without data.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] bg-amber-950/70 border border-amber-300/40 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider flex-shrink-0">
              Zero-Network Mode
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* CHANGED: Footer updated to match the black background */}
      <footer className="bg-black text-neutral-400 text-xs py-4 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <strong className="text-white">SafePass</strong>
            <span className="text-neutral-300">• Autonomous Tourist Crisis Triage & Consular Diplomatic Bridge</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            IIITDM Kancheepuram Hackathon 2026 • TravelTech Track
          </div>
        </div>
      </footer>

      {/* INTENTIONAL LOGOUT SAFETY CONFIRMATION MODAL */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-neutral-900 rounded-3xl max-w-sm w-full p-6 border border-neutral-800 shadow-2xl text-white">
            <div className="flex items-center gap-2.5 mb-3 text-amber-400">
              <div className="p-2 bg-amber-950/80 border border-amber-800/60 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-extrabold text-base text-white">Log Out of SafePass?</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-5">
              In an active crisis zone, remaining logged in gives you instant, 1-tap access to evacuation maps and consular safety broadcasts without needing network authentication.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
              >
                Log Out Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL ZERO-AUTH EMERGENCY SOS MODAL (For logged-out users) */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-neutral-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-neutral-800 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-950 text-rose-400 border border-rose-800/60 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Location-Aware Emergency Lifeline</h3>
                  <p className="text-[11px] text-neutral-400">1-Tap Direct Dial & 2G GSM SMS</p>
                </div>
              </div>
              <button
                onClick={() => setSosModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-950 text-white rounded-2xl p-4 mb-4 border border-neutral-800">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Navigation className="w-3.5 h-3.5" /> Last Known Location
              </div>
              <p className="font-bold text-xs sm:text-sm text-neutral-100 mb-1">
                {lastLocation.label}
              </p>
              <p className="font-mono text-[11px] text-neutral-400">
                GPS: {lastLocation.lat.toFixed(4)}° N, {lastLocation.lng.toFixed(4)}° E
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-2xl border border-rose-800/80 bg-rose-950/70 hover:bg-rose-900/80 text-white font-bold text-xs"
              >
                <span>National Emergency</span>
                <span className="font-mono text-rose-400 font-extrabold">112</span>
              </a>

              <a
                href="tel:1070"
                className="flex items-center justify-between p-3 rounded-2xl border border-sky-800/80 bg-sky-950/70 hover:bg-sky-900/80 text-white font-bold text-xs"
              >
                <span>State Disaster (TNSDMA)</span>
                <span className="font-mono text-sky-400 font-extrabold">1070</span>
              </a>

              <a
                href="tel:1077"
                className="flex items-center justify-between p-3 rounded-2xl border border-indigo-800/80 bg-indigo-950/70 hover:bg-indigo-900/80 text-white font-bold text-xs"
              >
                <span>District Collectorate</span>
                <span className="font-mono text-indigo-400 font-extrabold">1077</span>
              </a>

              <a
                href="tel:108"
                className="flex items-center justify-between p-3 rounded-2xl border border-emerald-800/80 bg-emerald-950/70 hover:bg-emerald-900/80 text-white font-bold text-xs"
              >
                <span>Medical Ambulance</span>
                <span className="font-mono text-emerald-400 font-extrabold">108</span>
              </a>

              <a
                href="tel:+914428461450"
                className="flex items-center justify-between p-3 rounded-2xl border border-amber-800/80 bg-amber-950/70 hover:bg-amber-900/80 text-white font-bold text-xs col-span-1 sm:col-span-2"
              >
                <span>Tourist Police Squad</span>
                <span className="font-mono text-amber-400 text-[11px]">+91 44 2846 1450</span>
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 mb-1.5">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>2G GSM Offline SMS String:</span>
              </div>
              <div className="bg-neutral-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] leading-relaxed break-all mb-3 select-all border border-neutral-800">
                {getCompressedSmsText()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopySms}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                  <span>{copiedSms ? 'Copied' : 'Copy SMS'}</span>
                </button>
                <a
                  href={`sms:112?body=${encodeURIComponent(getCompressedSmsText())}`}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  Launch SMS to 112
                </a>
              </div>
            </div>

            <button
              onClick={() => setSosModalOpen(false)}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 rounded-xl text-xs border border-neutral-700 cursor-pointer"
            >
              Close Lifeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}