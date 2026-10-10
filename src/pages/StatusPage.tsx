import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { SafePassUser, SafetyStatus } from '@/lib/types';
import { FRESH_TEN_RECORDS } from '@/lib/auth';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Phone,
  MapPin,
  Globe,
  Clock,
  Copy,
  Loader2,
  User,
  Search,
  Building2,
  ShieldAlert,
  ArrowRight,
  MessageCircle,
  LifeBuoy,
} from 'lucide-react';

const statusConfig: Record<SafetyStatus, { label: string; bg: string; text: string; ring: string; banner: string; icon: typeof CheckCircle2 }> = {
  safe: {
    label: 'Safe & Accounted For',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    ring: 'ring-4 ring-emerald-200',
    banner: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  caution: {
    label: 'Caution / Sheltering in Place',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    ring: 'ring-4 ring-amber-200',
    banner: 'bg-amber-500',
    icon: AlertTriangle,
  },
  danger: {
    label: 'Needs Immediate Assistance / SOS',
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    ring: 'ring-4 ring-rose-200 animate-pulse',
    banner: 'bg-rose-600',
    icon: ShieldAlert,
  },
};

// Rescue progress is saved by the Admin page in localStorage. This page only reads it.
type RescueState = 'searching' | 'rescued' | 'deceased';

interface RescueRecord {
  state: RescueState;
  at: string;
  rescueId: string;
  shelter?: string;
  hospital?: string;
  medical?: boolean;
}

const RESCUE_KEY = 'safepass_rescue_records';

const getRescueRecord = (userId: string): RescueRecord | null => {
  try {
    const raw = localStorage.getItem(RESCUE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, RescueRecord>;
    return all[userId] ?? null;
  } catch {
    return null;
  }
};

const rescueLabel = (state: RescueState) =>
  state === 'searching' ? 'Search Ongoing' : state === 'rescued' ? 'Rescued' : 'Deceased';

interface TimelineEvent {
  time: string;
  title: string;
  detail: string;
  tone: 'info' | 'safe' | 'caution' | 'danger' | 'dark';
}

const toneDot: Record<TimelineEvent['tone'], string> = {
  info: 'bg-cyan-500',
  safe: 'bg-emerald-500',
  caution: 'bg-amber-500',
  danger: 'bg-rose-500',
  dark: 'bg-slate-400',
};

// Simulated check-in history built from the traveler's own dates, newest first
const buildTimeline = (u: SafePassUser, rescue: RescueRecord | null): TimelineEvent[] => {
  const start = new Date(u.created_at).getTime();
  const end = new Date(u.updated_at).getTime();
  const span = Math.max(end - start, 3600000);
  const at = (fraction: number) => new Date(start + span * fraction).toISOString();
  const place = u.location_label || 'Tamil Nadu coastal zone';

  const events: TimelineEvent[] = [
    { time: u.created_at, title: 'Registered with SafePass', detail: `Mobile verified. Location: ${place}`, tone: 'info' },
    { time: at(0.3), title: 'Check-in: Safe', detail: 'Reached accommodation. Weather advisory received.', tone: 'safe' },
    { time: at(0.65), title: 'Check-in: Caution', detail: 'Cyclone alert issued. Sheltering in place.', tone: 'caution' },
    {
      time: u.updated_at,
      title: `Latest check-in: ${statusConfig[u.status].label}`,
      detail: `Last reported from ${place}`,
      tone: u.status,
    },
  ];

  if (rescue) {
    if (rescue.state === 'searching') {
      events.push({
        time: rescue.at,
        title: 'Rescue team dispatched',
        detail: `Search ongoing. Rescue ID: ${rescue.rescueId}`,
        tone: 'danger',
      });
    } else if (rescue.state === 'rescued') {
      events.push({
        time: rescue.at,
        title: 'Rescued',
        detail: `Now at: ${rescue.shelter || 'relief shelter'}. Rescue ID: ${rescue.rescueId}`,
        tone: 'dark',
      });
    } else {
      events.push({
        time: rescue.at,
        title: 'Update from rescue team',
        detail: `Hospital: ${rescue.hospital || 'not recorded'}. Rescue ID: ${rescue.rescueId}`,
        tone: 'dark',
      });
    }
  }

  return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

export default function StatusPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const [user, setUser] = useState<SafePassUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const effectiveToken = tokenFromUrl || localStorage.getItem('safepass_share_token') || FRESH_TEN_RECORDS[0].share_token;

  const findMatchingPerson = (query: string): SafePassUser | null => {
    const q = query.trim().toLowerCase();
    return (
      FRESH_TEN_RECORDS.find(
        (p) =>
          p.share_token.toLowerCase() === q ||
          p.id.toLowerCase() === q ||
          p.name.toLowerCase() === q ||
          (q === 'alex-demo-token-994' && p.id === FRESH_TEN_RECORDS[0].id)
      ) || null
    );
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const match = findMatchingPerson(effectiveToken);

      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('share_token', effectiveToken)
          .maybeSingle();

        if (data) {
          setUser(data as SafePassUser);
          setSearched(true);
        } else {
          setUser(match || FRESH_TEN_RECORDS[0]);
          setSearched(true);
        }
      } catch {
        setUser(match || FRESH_TEN_RECORDS[0]);
        setSearched(true);
      }
      setLoading(false);
    })();
  }, [effectiveToken]);

  const searchByToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = tokenInput.trim();
    if (!query) return;
    setLoading(true);

    const match = findMatchingPerson(query);
    if (match) {
      setUser(match);
      setSearched(true);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('share_token', query)
        .maybeSingle();

      if (data) {
        setUser(data as SafePassUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    setSearched(true);
    setLoading(false);
  };

  const copyShareLink = () => {
    const token = user?.share_token || effectiveToken;
    const link = `${window.location.origin}/status?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Opens WhatsApp with a ready message: name, status and the tracking link
  const shareViaWhatsApp = () => {
    if (!user) return;
    const token = user.share_token || effectiveToken;
    const link = `${window.location.origin}/status?token=${token}`;
    const rescue = getRescueRecord(user.id);
    const rescueLine = rescue ? `\nRescue update: ${rescueLabel(rescue.state)}` : '';
    const text =
      `SafePass safety update for ${user.name}: ${statusConfig[user.status].label}.` +
      `\nLast location: ${user.location_label || 'Tamil Nadu coastal zone'}.` +
      rescueLine +
      `\nTrack live status: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (!user && searched) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fade-in bg-neutral-900 text-white p-8 rounded-2xl border border-neutral-800 shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-950 text-rose-400 border border-rose-800/60 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Token Not Found</h2>
        <p className="text-neutral-300 text-sm mb-6">
          No traveler profile found for the entered share token. You can test with our demo token.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setUser(FRESH_TEN_RECORDS[0])}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-sm"
          >
            Load Demo Profile (Alex Mercer)
          </button>
          <button
            onClick={() => { setSearched(false); setTokenInput(''); }}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold py-2.5 rounded-xl text-sm transition-all border border-neutral-700"
          >
            Search Another Token
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto animate-fade-in py-8 text-white">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded-full mb-4">
            <Search className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Family Safety Portal</h1>
          <p className="text-neutral-300 text-sm">
            Enter the unique SafePass token sent to you to view live crisis location and status.
          </p>
        </div>
        <form onSubmit={searchByToken} className="bg-neutral-900 rounded-2xl shadow-xl border border-neutral-800 p-6 space-y-4">
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="e.g. alex-demo-token-994"
            className="w-full px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-white placeholder-neutral-400 font-mono text-base sm:text-sm"
            style={{
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              caretColor: '#22d3ee',
              backgroundColor: '#262626',
              fontSize: '16px',
            }}
          />
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            Verify Traveler Status
          </button>
          <button
            type="button"
            onClick={() => setUser(FRESH_TEN_RECORDS[0])}
            className="w-full bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-medium py-2.5 rounded-xl text-xs transition-all border border-neutral-700 cursor-pointer"
          >
            View Sample Traveler Status (Alex Mercer)
          </button>
        </form>
      </div>
    );
  }

  const statusInfo = statusConfig[user.status];
  const StatusIcon = statusInfo.icon;

  const rescue = getRescueRecord(user.id);
  const timeline = buildTimeline(user, rescue);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-12 text-white">
      {/* Share / Verification Top Strip */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-cyan-950/70 border border-cyan-800/80 rounded-2xl p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Public Read-Only Family Verification Link</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={shareViaWhatsApp}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Share via WhatsApp
          </button>
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-800 bg-white hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-200 transition-all shadow-sm"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Link Copied!' : 'Copy Permanent Share Link'}
          </button>
        </div>
      </div>

      {/* Main Status Container */}
      <div className="bg-neutral-900 rounded-3xl shadow-xl border border-neutral-800 overflow-hidden text-white">
        {/* Top Colored Status Ribbon */}
        <div className={`h-3 w-full ${statusInfo.banner}`} />

        <div className="p-6 sm:p-8">
          {/* Status Badge Hero */}
          <div className="flex flex-col items-center text-center mb-8 pb-6 border-b border-neutral-800">
            <div className={`w-20 h-20 rounded-full ${statusInfo.bg} ${statusInfo.ring} flex items-center justify-center mb-3.5 shadow-sm`}>
              <StatusIcon className={`w-10 h-10 ${statusInfo.text}`} />
            </div>
            <span className={`text-xl sm:text-2xl font-extrabold ${statusInfo.text}`}>
              {statusInfo.label}
            </span>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> Last Verified Update: {formatDate(user.updated_at)}
            </p>
          </div>

          {/* Rescue Status (set by the consular admin) */}
          {rescue && (
            <div
              className={`mb-6 rounded-2xl p-4 sm:p-5 border ${
                rescue.state === 'searching'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-100 border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <LifeBuoy
                  className={`w-4 h-4 ${rescue.state === 'searching' ? 'text-amber-700' : 'text-slate-700'}`}
                />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rescue Status</span>
              </div>
              <p
                className={`text-lg font-extrabold ${
                  rescue.state === 'searching' ? 'text-amber-800' : 'text-slate-900'
                }`}
              >
                {rescue.state === 'searching'
                  ? 'Rescue team dispatched. Search ongoing'
                  : rescue.state === 'rescued'
                  ? 'Rescued'
                  : 'Deceased'}
              </p>
              <div className="mt-2 space-y-0.5 text-xs text-slate-700">
                <p>
                  Rescue ID: <span className="font-mono font-bold">{rescue.rescueId}</span>
                </p>
                <p>Updated: {formatDate(rescue.at)}</p>
                {rescue.state === 'rescued' && (
                  <>
                    <p>
                      Current shelter: <strong>{rescue.shelter || 'Relief shelter'}</strong>
                    </p>
                    <p>
                      Medical assistance: <strong>{rescue.medical ? 'Needed' : 'Not needed'}</strong>
                    </p>
                  </>
                )}
                {rescue.state === 'deceased' && (
                  <p>
                    Current hospital: <strong>{rescue.hospital || 'Not recorded'}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Traveler Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            <div className="flex items-center gap-3 bg-neutral-800/80 rounded-2xl p-3.5 border border-neutral-700/80">
              <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-700 shadow-2xs">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Traveler</p>
                <p className="text-sm font-extrabold text-white truncate">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-neutral-800/80 rounded-2xl p-3.5 border border-neutral-700/80">
              <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-700 shadow-2xs">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Nationality</p>
                <p className="text-sm font-extrabold text-white">{user.nationality}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-neutral-800/80 rounded-2xl p-3.5 border border-neutral-700/80 sm:col-span-2">
              <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-700 shadow-2xs">
                <MapPin className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Last Reported Location</p>
                <p className="text-sm font-bold text-white truncate">
                  {user.location_label || 'Mahabalipuram Coastal Zone, Tamil Nadu'}
                </p>
                {user.location_lat && user.location_lng && (
                  <p className="text-xs font-mono text-neutral-400 mt-0.5">
                    Coordinates: {user.location_lat.toFixed(4)}° N, {user.location_lng.toFixed(4)}° E
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact & Consular Hotlines */}
          <div className="bg-neutral-800/80 rounded-2xl p-4 sm:p-5 border border-neutral-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Emergency Contact On File
                </span>
                <p className="text-sm font-extrabold text-white mt-0.5">{user.emergency_contact_name}</p>
                <p className="text-xs text-neutral-300 font-mono">{user.emergency_contact_phone}</p>
              </div>
              <a
                href={`tel:${user.emergency_contact_phone}`}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" /> Call Contact
              </a>
            </div>

            <div className="pt-3 border-t border-neutral-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Consular Liaison Helpline: <strong className="text-white">+91 44 2857 4000</strong></span>
              </div>
              <a
                href="tel:112"
                className="text-xs font-bold text-rose-300 bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                Dial Local 112
              </a>
            </div>
          </div>

          {/* Safety Check-in Timeline */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Safety Check-in Timeline</h3>
            </div>
            <ol className="relative ml-2 border-l-2 border-neutral-700 space-y-5">
              {timeline.map((ev, i) => (
                <li key={i} className="ml-5 relative">
                  <span
                    className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-neutral-900 ${toneDot[ev.tone]}`}
                  />
                  <p className="text-sm font-bold text-white">{ev.title}</p>
                  <p className="text-xs text-neutral-300">{ev.detail}</p>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{formatDate(ev.time)}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <Link to="/dashboard" className="hover:text-cyan-400 font-semibold flex items-center gap-1 text-white">
              Back to Tourist Dashboard <ArrowRight className="w-3 h-3 text-cyan-400" />
            </Link>
            <span className="font-mono text-neutral-400">Token: {effectiveToken}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
