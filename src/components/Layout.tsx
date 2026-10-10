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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={authenticated ? '/dashboard' : '/login'} className="flex items-center gap-2.5 group">
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
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
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

              <span className="hidden lg:flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-950/60 border border-rose-800/50 px-2.5 py-1 rounded-full">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                <span>Kancheepuram Red Alert</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-slate-950 border-t border-slate-800/80 scrollbar-none">
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
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
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

      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SafePass</span>
            <span>• Disaster Tourism Crisis Communication</span>
          </div>
          <div className="text-[11px] text-slate-500">
            IIITDM Kancheepuram Hackathon 2026 • TravelTech Track
          </div>
        </div>
      </footer>

      {/* INTENTIONAL LOGOUT SAFETY CONFIRMATION MODAL */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl text-slate-900">
            <div className="flex items-center gap-2.5 mb-3 text-amber-700">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Log Out of SafePass?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              In an active crisis zone, remaining logged in gives you instant, 1-tap access to evacuation maps and consular safety broadcasts without needing network authentication.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                Log Out Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL ZERO-AUTH EMERGENCY SOS MODAL (For logged-out users) */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Location-Aware Emergency Lifeline</h3>
                  <p className="text-[11px] text-slate-500">1-Tap Direct Dial & 2G GSM SMS</p>
                </div>
              </div>
              <button
                onClick={() => setSosModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 mb-4 border border-slate-800">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Navigation className="w-3.5 h-3.5" /> Last Known Location
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-100 mb-1">
                {lastLocation.label}
              </p>
              <p className="font-mono text-[11px] text-slate-400">
                GPS: {lastLocation.lat.toFixed(4)}° N, {lastLocation.lng.toFixed(4)}° E
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-2xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-950 font-bold text-xs"
              >
                <span>National Emergency</span>
                <span className="font-mono text-rose-700 font-extrabold">112</span>
              </a>

              <a
                href="tel:1070"
                className="flex items-center justify-between p-3 rounded-2xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-950 font-bold text-xs"
              >
                <span>State Disaster (TNSDMA)</span>
                <span className="font-mono text-sky-700 font-extrabold">1070</span>
              </a>

              <a
                href="tel:1077"
                className="flex items-center justify-between p-3 rounded-2xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-bold text-xs"
              >
                <span>District Collectorate</span>
                <span className="font-mono text-indigo-700 font-extrabold">1077</span>
              </a>

              <a
                href="tel:108"
                className="flex items-center justify-between p-3 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-xs"
              >
                <span>Medical Ambulance</span>
                <span className="font-mono text-emerald-700 font-extrabold">108</span>
              </a>

              <a
                href="tel:+914428461450"
                className="flex items-center justify-between p-3 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs col-span-1 sm:col-span-2"
              >
                <span>Tourist Police Squad</span>
                <span className="font-mono text-amber-800 text-[11px]">+91 44 2846 1450</span>
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <Radio className="w-4 h-4 text-amber-600" />
                <span>2G GSM Offline SMS String:</span>
              </div>
              <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] leading-relaxed break-all mb-3 select-all">
                {getCompressedSmsText()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopySms}
                  className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSms ? 'Copied' : 'Copy SMS'}</span>
                </button>
                <a
                  href={`sms:112?body=${encodeURIComponent(getCompressedSmsText())}`}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  Launch SMS to 112
                </a>
              </div>
            </div>

            <button
              onClick={() => setSosModalOpen(false)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Close Lifeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
