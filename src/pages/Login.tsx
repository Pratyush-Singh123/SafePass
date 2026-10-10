import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  Phone,
  Radio,
  Navigation,
  AlertTriangle,
  User,
  Key,
  ArrowRight,
  Loader2,
  CheckCircle2,
  X,
  Copy,
  Check,
  Building2,
  Clock,
} from 'lucide-react';
import {
  isLoggedIn,
  loginWithIdentifier,
  getLastLocation,
  saveLastLocation,
  DEMO_USER_PERSONA,
} from '@/lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);

  // Retrieve last recorded location
  const [location, setLocation] = useState(getLastLocation());

  // If already logged in, redirect straight to the crisis dashboard
  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Refresh device geolocation silently if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          saveLastLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            'Detected Live Coordinates (Tamil Nadu / Coastal Belt)'
          );
          setLocation(getLastLocation());
        },
        () => {
          // ignore error, keep last known location
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginWithIdentifier(identifier);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Failed to authenticate. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    await loginWithIdentifier('demo');
    navigate('/dashboard');
  };

  const getCompressedSmsText = () => {
    const lat = location.lat.toFixed(4);
    const lng = location.lng.toFixed(4);
    return `SAFEPASS-SOS: Emergency Assistance Needed | GPS:${lat}N,${lng}E | LOC:${location.label} | STATUS:DANGER | BATTERY:CRITICAL`;
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(getCompressedSmsText());
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in py-4 sm:py-8">
      {/* ZERO-AUTH EMERGENCY BANNER */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 text-white rounded-3xl p-5 mb-6 shadow-lg border border-rose-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-15">
          <ShieldAlert className="w-36 h-36" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 bg-rose-950/80 text-rose-200 text-[11px] font-black uppercase px-2.5 py-1 rounded-full border border-rose-600/50">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              Immediate Lifeline
            </span>
            <span className="text-xs text-rose-200/80 font-mono">Zero-Auth Access</span>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight mb-1">
            In Immediate Danger?
          </h2>
          <p className="text-xs text-rose-100/90 leading-relaxed mb-4">
            If you are locked out or using another device, do not waste time logging in. Call location-based emergency dispatch right now.
          </p>

          <button
            onClick={() => setSosModalOpen(true)}
            className="w-full bg-white hover:bg-rose-50 text-rose-900 font-extrabold py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-rose-700 animate-bounce" />
            <span>Emergency SOS Helplines & SMS</span>
          </button>
        </div>
      </div>

      {/* LOGIN PORTAL CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-tr from-cyan-600 to-sky-500 p-2.5 rounded-2xl text-white shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">SafePass Log In</h1>
            <p className="text-xs text-slate-500">
              Access your emergency crisis cockpit & consular pass
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Name, Phone, or SafePass Token
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. Pratyush, +33 6 42 19 88 01, or token"
                className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none"
                disabled={loading}
              />
              <User className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating SafePass...</span>
              </>
            ) : (
              <>
                <span>Log In to Emergency Pass</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Persona Shortcut */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
          >
            <Key className="w-3.5 h-3.5 text-cyan-600" />
            <span>Quick 1-Tap Login as Alex Mercer (France Demo)</span>
          </button>
        </div>

        {/* Persistent Session Notice */}
        <div className="mt-5 p-3 rounded-2xl bg-cyan-50/70 border border-cyan-100 text-[11px] text-cyan-900 flex items-start gap-2">
          <Clock className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Indefinite Crisis Session:</strong> Once logged in, this device remains connected until you deliberately click Log Out, ensuring zero delay during power outages or panic.
          </p>
        </div>

        {/* New Registration Link */}
        <div className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
          First time here?{' '}
          <Link to="/onboarding" className="text-cyan-700 font-extrabold hover:underline">
            Register New Emergency Pass (20 seconds) →
          </Link>
        </div>
      </div>

      {/* LOCATION-AWARE EMERGENCY SOS MODAL */}
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

            {/* Last Recorded Location Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 mb-5 border border-slate-800">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Navigation className="w-3.5 h-3.5" /> Last Recorded Location
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-100 mb-1">
                {location.label}
              </p>
              <p className="font-mono text-[11px] text-slate-400">
                GPS: {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E
              </p>
            </div>

            {/* Emergency Hotline Buttons */}
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5">
              Instant Direct Dial (Tamil Nadu / Central Disaster Operations):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-2xl border border-rose-300 bg-rose-50/90 hover:bg-rose-100 text-rose-950 font-bold text-xs transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-600" />
                  <span>National Rescue (Police)</span>
                </div>
                <span className="font-mono text-rose-700 font-extrabold">112</span>
              </a>

              <a
                href="tel:1070"
                className="flex items-center justify-between p-3 rounded-2xl border border-sky-300 bg-sky-50/90 hover:bg-sky-100 text-sky-950 font-bold text-xs transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>State Disaster Ops (TNSDMA)</span>
                </div>
                <span className="font-mono text-sky-700 font-extrabold">1070</span>
              </a>

              <a
                href="tel:1077"
                className="flex items-center justify-between p-3 rounded-2xl border border-indigo-300 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-950 font-bold text-xs transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Kancheepuram Collectorate</span>
                </div>
                <span className="font-mono text-indigo-700 font-extrabold">1077</span>
              </a>

              <a
                href="tel:108"
                className="flex items-center justify-between p-3 rounded-2xl border border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 font-bold text-xs transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Medical Trauma Ambulance</span>
                </div>
                <span className="font-mono text-emerald-700 font-extrabold">108</span>
              </a>

              <a
                href="tel:+914428461450"
                className="flex items-center justify-between p-3 rounded-2xl border border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-950 font-bold text-xs transition-all shadow-2xs col-span-1 sm:col-span-2"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-600" />
                  <span>Tourist Police Disaster Flying Squad</span>
                </div>
                <span className="font-mono text-amber-800 text-[11px]">+91 44 2846 1450</span>
              </a>

              <a
                href="tel:+914132266500"
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-2xs col-span-1 sm:col-span-2"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-700" />
                  <span>Consulat Général de France (Chennai Liaison)</span>
                </div>
                <span className="font-mono text-slate-700 text-[11px]">+91 413 226 6500</span>
              </a>
            </div>

            {/* Offline 2G SMS String */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <Radio className="w-4 h-4 text-amber-600" />
                <span>2G GSM Offline Distress String (When 4G/5G Drops):</span>
              </div>
              <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] leading-relaxed break-all mb-3 select-all">
                {getCompressedSmsText()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopySms}
                  className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSms ? 'Copied' : 'Copy SMS'}</span>
                </button>
                <a
                  href={`sms:112?body=${encodeURIComponent(getCompressedSmsText())}`}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Launch Native SMS to 112
                </a>
              </div>
            </div>

            <button
              onClick={() => setSosModalOpen(false)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Close Emergency Lifeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
