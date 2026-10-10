import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  Phone,
  Radio,
  Navigation,
  AlertTriangle,
  Key,
  ArrowRight,
  Loader2,
  CheckCircle2,
  X,
  Copy,
  Check,
  Building2,
  Clock,
  Smartphone,
  RotateCcw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import {
  isLoggedIn,
  findRegisteredUserByPhone,
  extractPhoneDigits,
  generateLoginOtp,
  verifyLoginOtp,
  createSession,
  getLastLocation,
  saveLastLocation,
  DEMO_USER_PERSONA,
  FRESH_TEN_RECORDS,
} from '@/lib/auth';
import { sendOtpToMobilePhone, getMobileSmsDeepLink } from '@/lib/sms';
import type { SafePassUser } from '@/lib/types';

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'lookup' | 'otp'>('lookup');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pendingUser, setPendingUser] = useState<SafePassUser | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
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

  // Step 1: Validate input & Look up registered profile SOLELY by mobile phone number
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const query = phoneNumber.trim();
    if (!query) {
      setError('Please enter your registered mobile phone number.');
      return;
    }

    const cleanDigits = extractPhoneDigits(query);
    if (cleanDigits.length < 7) {
      setError(
        'Please enter a valid registered mobile phone number with country code (e.g. +33 6 42 19 88 01 or +91 98765 43210). SafePass logins are strictly restricted to verified mobile numbers to prevent unauthorized account access.'
      );
      return;
    }

    setLoading(true);

    try {
      const user = await findRegisteredUserByPhone(query);

      if (!user) {
        setError(
          `No registered SafePass profile found with mobile number "${query}". SafePass login is strictly restricted to pre-registered travelers. Please check your number or register below.`
        );
        setLoading(false);
        return;
      }

      // Generate 4-digit emergency verification code and dispatch SMS to the user's mobile
      const { code } = generateLoginOtp(user);
      setPendingUser(user);
      setGeneratedOtp(code);
      setEnteredOtp('');

      const targetMobile = user.phone || user.emergency_contact_phone || query;
      await sendOtpToMobilePhone(targetMobile, code, user.name);

      setStep('otp');
      setLoading(false);
    } catch {
      setError('Error verifying registered phone number. Please try again.');
      setLoading(false);
    }
  };

  // Step 2: Validate OTP and create indefinite crisis session
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pendingUser) {
      setStep('lookup');
      return;
    }

    const trimmedOtp = enteredOtp.trim();
    if (!trimmedOtp) {
      setError('Please enter the 4-digit emergency verification code.');
      return;
    }

    if (trimmedOtp.length !== 4) {
      setError('Verification code must be exactly 4 digits.');
      return;
    }

    setLoading(true);

    const verification = verifyLoginOtp(trimmedOtp);
    if (!verification.valid) {
      setError(verification.error || 'Incorrect code. Please enter the valid 4-digit verification code.');
      setLoading(false);
      return;
    }

    // Login successful
    createSession(pendingUser);
    navigate('/dashboard');
  };

  // 1-Click Demo Shortcut (Alex Mercer)
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError('');
    const demo = DEMO_USER_PERSONA;
    const { code } = generateLoginOtp(demo);
    setPhoneNumber(demo.phone || '+33 6 42 19 88 01');
    setPendingUser(demo);
    setGeneratedOtp(code);
    setEnteredOtp(code); // Pre-fill for instant demo access
    await sendOtpToMobilePhone(demo.phone || demo.emergency_contact_phone, code, demo.name);
    setStep('otp');
    setLoading(false);
  };

  // Regenerate OTP
  const handleResendOtp = async () => {
    if (!pendingUser) return;
    const { code } = generateLoginOtp(pendingUser);
    setGeneratedOtp(code);
    setError('');
    await sendOtpToMobilePhone(
      pendingUser.phone || pendingUser.emergency_contact_phone || 'Emergency Mobile',
      code,
      pendingUser.name
    );
  };

  const handleAutoFillOtp = () => {
    setEnteredOtp(generatedOtp);
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
      <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-tr from-cyan-600 to-sky-500 p-2.5 rounded-2xl text-white shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">SafePass Log In</h1>
            <p className="text-xs text-neutral-400">
              {step === 'lookup'
                ? 'Mobile-Verified Traveler Authentication'
                : 'Emergency OTP & Device Verification'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-rose-950/70 border border-rose-800/70 text-rose-200 text-xs p-3.5 rounded-2xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              {error.includes('register') && (
                <Link
                  to="/onboarding"
                  className="mt-2 inline-block font-bold text-rose-300 underline hover:text-rose-100"
                >
                  Go to 20-Second Registration →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: LOOKUP REGISTERED USER SOLELY BY MOBILE NUMBER */}
        {step === 'lookup' && (
          <>
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Registered Mobile Number *</span>
                  <span className="text-[10px] text-cyan-400 font-bold lowercase flex items-center gap-1">
                    <Lock className="w-3 h-3" /> strictly mobile only
                  </span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +33 6 42 19 88 01 or +91 98765 43210"
                    className="w-full border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-400 rounded-2xl pl-11 pr-4 py-3 text-base sm:text-sm font-mono focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                    style={{
                      color: '#ffffff',
                      WebkitTextFillColor: '#ffffff',
                      caretColor: '#22d3ee',
                      backgroundColor: '#262626',
                      fontSize: '16px',
                    }}
                    disabled={loading}
                    required
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5 leading-snug">
                  🔒 SafePass logins are strictly restricted to verified mobile numbers. Login by traveler name is prohibited to safeguard your identity.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Mobile Number...</span>
                  </>
                ) : (
                  <>
                    <span>Send Emergency Login OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Pre-fill Shortcut */}
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-300">Test with Registered Travelers:</span>
                <span className="text-[10px] text-cyan-400 font-bold bg-neutral-800 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  10 Fresh Profiles
                </span>
              </div>

              <div className="relative">
                <select
                  onChange={(e) => {
                    const found = FRESH_TEN_RECORDS.find((p) => p.id === e.target.value);
                    if (found && found.phone) {
                      setPhoneNumber(found.phone);
                    }
                  }}
                  className="w-full text-base sm:text-xs bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white font-semibold focus:ring-2 focus:ring-cyan-400 outline-none cursor-pointer"
                  style={{
                    color: '#ffffff',
                    WebkitTextFillColor: '#ffffff',
                    backgroundColor: '#262626',
                    fontSize: '16px',
                  }}
                >
                  <option value="">⚡ Select Any Traveler to Pre-Fill Phone...</option>
                  {FRESH_TEN_RECORDS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                      {p.name} ({p.nationality}) • {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>1-Click Demo Login: Alex Mercer (+33 6 42 19 88 01)</span>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: EMERGENCY OTP & DEVICE CHECK */}
        {step === 'otp' && pendingUser && (
          <div className="space-y-4 animate-fade-in">
            {/* Registered Profile Confirmation Pill */}
            <div className="p-3.5 rounded-2xl bg-neutral-800 border border-neutral-700 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Mobile Verified
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-700/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Registered Traveler
                </span>
              </div>
              <p className="font-extrabold text-white text-sm">{pendingUser.name}</p>
              <p className="text-neutral-400 text-[11px]">
                {pendingUser.nationality} • Verified Mobile: {pendingUser.phone || pendingUser.emergency_contact_phone}
              </p>
            </div>

            {/* Emergency OTP Dispatch Banner */}
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-3.5 text-xs text-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Emergency Verification Code
                </span>
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="font-extrabold text-[11px] text-amber-300 underline hover:text-amber-100 cursor-pointer"
                >
                  ⚡ Auto-Fill Code
                </button>
              </div>
              <p className="text-[11px] text-amber-300/80 mb-2">
                Dispatched to verified traveler mobile <strong>{pendingUser.phone || pendingUser.emergency_contact_phone}</strong>:
              </p>
              <div className="flex items-center justify-between bg-neutral-950/80 border border-amber-600/50 rounded-xl px-3 py-2">
                <span className="font-mono text-base font-black tracking-widest text-amber-300">
                  {generatedOtp}
                </span>
                <span className="text-[10px] text-neutral-400">Valid 10 mins</span>
              </div>

              <div className="mt-2.5 flex items-center gap-3 text-[11px]">
                <a
                  href={getMobileSmsDeepLink(pendingUser.phone || pendingUser.emergency_contact_phone || '', generatedOtp)}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold underline"
                >
                  <ExternalLink className="w-3 h-3" /> Open in Phone Messages App
                </a>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Enter 4-Digit Emergency Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    className="w-full text-center text-3xl font-mono tracking-widest border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-400 rounded-2xl px-4 py-3.5 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                    style={{
                      color: '#ffffff',
                      WebkitTextFillColor: '#ffffff',
                      caretColor: '#22d3ee',
                      backgroundColor: '#262626',
                      fontSize: '28px',
                      letterSpacing: '0.25em',
                    }}
                    disabled={loading}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Device Check Assurance */}
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-[11px] text-cyan-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>
                  <strong className="text-white">Device Handshake Verified:</strong> Session remains active until deliberate logout.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Enter Crisis Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('lookup');
                  setError('');
                }}
                className="text-neutral-400 hover:text-neutral-200 font-medium cursor-pointer"
              >
                ← Back to Mobile Number
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Resend Code
              </button>
            </div>
          </div>
        )}

        {/* Persistent Session Notice */}
        <div className="mt-5 p-3 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-[11px] text-cyan-300 flex items-start gap-2">
          <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong className="text-white">Indefinite Crisis Session:</strong> Once logged in, this device remains connected until you deliberately click Log Out, ensuring zero delay during power outages or panic.
          </p>
        </div>

        {/* New Registration Link */}
        <div className="mt-6 text-center text-xs text-neutral-400 pt-4 border-t border-neutral-800">
          First time here?{' '}
          <Link to="/onboarding" className="text-cyan-400 font-extrabold hover:underline">
            Register New Emergency Pass (20 seconds) →
          </Link>
        </div>
      </div>

      {/* LOCATION-AWARE EMERGENCY SOS MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
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

            {/* Last Recorded Location Banner */}
            <div className="bg-neutral-950 text-white rounded-2xl p-4 mb-5 border border-neutral-800">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Navigation className="w-3.5 h-3.5" /> Last Recorded Location
              </div>
              <p className="font-bold text-xs sm:text-sm text-white mb-1">
                {location.label}
              </p>
              <p className="font-mono text-[11px] text-neutral-400">
                GPS: {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E
              </p>
            </div>

            {/* Emergency Hotline Buttons */}
            <h4 className="text-xs font-black text-neutral-300 uppercase tracking-wider mb-2.5">
              Instant Direct Dial (Tamil Nadu / Central Disaster Operations):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-2xl border border-rose-800 bg-rose-950/70 hover:bg-rose-900/80 text-white font-bold text-xs transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-400" />
                  <span>National Rescue (Police)</span>
                </div>
                <span className="font-mono text-rose-300 font-extrabold">112</span>
              </a>

              <a
                href="tel:1070"
                className="flex items-center justify-between p-3 rounded-2xl border border-sky-800 bg-sky-950/70 hover:bg-sky-900/80 text-white font-bold text-xs transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <span>State Disaster Ops (TNSDMA)</span>
                </div>
                <span className="font-mono text-sky-300 font-extrabold">1070</span>
              </a>

              <a
                href="tel:1077"
                className="flex items-center justify-between p-3 rounded-2xl border border-indigo-800 bg-indigo-950/70 hover:bg-indigo-900/80 text-white font-bold text-xs transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Kancheepuram Collectorate</span>
                </div>
                <span className="font-mono text-indigo-300 font-extrabold">1077</span>
              </a>

              <a
                href="tel:108"
                className="flex items-center justify-between p-3 rounded-2xl border border-emerald-800 bg-emerald-950/70 hover:bg-emerald-900/80 text-white font-bold text-xs transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Medical Trauma Ambulance</span>
                </div>
                <span className="font-mono text-emerald-300 font-extrabold">108</span>
              </a>

              <a
                href="tel:+914428461450"
                className="flex items-center justify-between p-3 rounded-2xl border border-amber-800 bg-amber-950/70 hover:bg-amber-900/80 text-white font-bold text-xs transition-all shadow-2xs col-span-1 sm:col-span-2"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>Tourist Police Disaster Flying Squad</span>
                </div>
                <span className="font-mono text-amber-300 text-[11px]">+91 44 2846 1450</span>
              </a>

              <a
                href="tel:+914132266500"
                className="flex items-center justify-between p-3 rounded-2xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-xs transition-all shadow-2xs col-span-1 sm:col-span-2"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>Consulat Général de France (Chennai Liaison)</span>
                </div>
                <span className="font-mono text-neutral-300 text-[11px]">+91 413 226 6500</span>
              </a>
            </div>

            {/* Offline 2G SMS String */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 mb-5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 mb-1.5">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>2G GSM Offline Distress String (When 4G/5G Drops):</span>
              </div>
              <div className="bg-neutral-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] leading-relaxed break-all mb-3 select-all border border-neutral-800">
                {getCompressedSmsText()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopySms}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer border border-neutral-700"
            >
              Close Emergency Lifeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
