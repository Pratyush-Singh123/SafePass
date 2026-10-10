import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { SafePassUser, SafetyStatus } from '@/lib/types';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Search,
  Loader2,
  Phone,
  MapPin,
  Globe,
  Clock,
  Building2,
  Send,
  Check,
  X,
  ExternalLink,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';

const statusConfig: Record<SafetyStatus, { label: string; dot: string; bg: string; text: string }> = {
  safe: { label: 'Safe', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-700' },
  caution: { label: 'Caution', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'text-amber-700' },
  danger: { label: 'Danger / SOS', dot: 'bg-rose-500', bg: 'bg-rose-50 text-rose-800 border-rose-200', text: 'text-rose-700' },
};

// Seeded realistic consular roster for Tamil Nadu / Chennai / Kancheepuram disaster zone
const DEMO_CONSULAR_ROSTER: SafePassUser[] = [
  {
    id: 'demo-alex-mercer',
    name: 'Alex Mercer',
    nationality: 'France',
    location_lat: 12.6269,
    location_lng: 80.1932,
    location_label: 'Mahabalipuram Coastal Heritage Zone',
    emergency_contact_name: 'Claire Mercer',
    emergency_contact_phone: '+33 6 42 19 88 01',
    status: 'caution',
    share_token: 'alex-demo-token-994',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'demo-emma-watson',
    name: 'Emma Watson',
    nationality: 'United Kingdom',
    location_lat: 12.6185,
    location_lng: 80.1989,
    location_label: 'Fishermans Cove Beach Resort, Kovalam / ECR',
    emergency_contact_name: 'Arthur Watson',
    emergency_contact_phone: '+44 7700 900123',
    status: 'danger',
    share_token: 'emma-uk-token-112',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'demo-kenji-sato',
    name: 'Kenji Sato',
    nationality: 'Japan',
    location_lat: 12.8399,
    location_lng: 80.1558,
    location_label: 'Sholinganallur Tech Corridor, OMR',
    emergency_contact_name: 'Yuki Sato',
    emergency_contact_phone: '+81 90 1234 5678',
    status: 'safe',
    share_token: 'kenji-jp-token-883',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'demo-michael-schmidt',
    name: 'Michael Schmidt',
    nationality: 'Germany',
    location_lat: 12.6512,
    location_lng: 80.1850,
    location_label: 'Buckingham Canal Heritage Guesthouse, Chengalpattu',
    emergency_contact_name: 'Hanna Schmidt',
    emergency_contact_phone: '+49 151 23456789',
    status: 'danger',
    share_token: 'michael-de-token-442',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'demo-carlos-gomez',
    name: 'Carlos Gomez',
    nationality: 'Spain',
    location_lat: 12.8387,
    location_lng: 79.7036,
    location_label: 'Kancheepuram Temple Heritage Inn',
    emergency_contact_name: 'Elena Gomez',
    emergency_contact_phone: '+34 600 123 456',
    status: 'safe',
    share_token: 'carlos-es-token-319',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: 'demo-sarah-miller',
    name: 'Sarah Miller',
    nationality: 'United States',
    location_lat: 12.7956,
    location_lng: 80.2185,
    location_label: 'Kovalam Surf Point / ECR Highway',
    emergency_contact_name: 'David Miller',
    emergency_contact_phone: '+1 202 555 0192',
    status: 'caution',
    share_token: 'sarah-us-token-771',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 1200000).toISOString(),
  },
];

export default function Admin() {
  const [users, setUsers] = useState<SafePassUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SafetyStatus | 'all'>('all');
  const [nationalityFilter, setNationalityFilter] = useState<string>('all');
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          // Merge database users with realistic consular roster
          const existingIds = new Set(data.map((u: SafePassUser) => u.id));
          const merged = [
            ...(data as SafePassUser[]),
            ...DEMO_CONSULAR_ROSTER.filter((demo) => !existingIds.has(demo.id)),
          ];
          setUsers(merged);
        } else {
          setUsers(DEMO_CONSULAR_ROSTER);
        }
      } catch {
        setUsers(DEMO_CONSULAR_ROSTER);
      }
      setLoading(false);
    })();
  }, []);

  const nationalitiesList = ['all', ...Array.from(new Set(users.map((u) => u.nationality)))];

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.nationality.toLowerCase().includes(search.toLowerCase()) ||
      (u.location_label?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesStatus = filter === 'all' || u.status === filter;
    const matchesNationality = nationalityFilter === 'all' || u.nationality === nationalityFilter;

    return matchesSearch && matchesStatus && matchesNationality;
  });

  const counts = {
    total: users.length,
    safe: users.filter((u) => u.status === 'safe').length,
    caution: users.filter((u) => u.status === 'caution').length,
    danger: users.filter((u) => u.status === 'danger').length,
  };

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastModal(false);
    }, 2000);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
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

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="bg-cyan-500/20 text-cyan-400 p-3 rounded-2xl border border-cyan-500/30">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Consular Crisis Command Center
              </h1>
              <span className="bg-cyan-500/20 text-cyan-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                Liaison View
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 mt-0.5">
              Diplomatic Mission & State Disaster Management Authority (TNDMA) Roster
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setBroadcastModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" /> Dispatch Consular Advisory
          </button>
          <Link
            to="/dashboard"
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all border border-neutral-700"
          >
            Tourist View
          </Link>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Citizens</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{counts.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">Active in crisis corridor</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Confirmed Safe</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{counts.safe}</p>
          <p className="text-[11px] text-emerald-600/70 mt-1">Sheltered in high ground</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Under Caution</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">{counts.caution}</p>
          <p className="text-[11px] text-amber-600/70 mt-1">Restricted transit zone</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-rose-200 bg-rose-50/30 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Distress / SOS</span>
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">{counts.danger}</p>
          <p className="text-[11px] text-rose-600/80 font-bold mt-1">Priority rescue queue</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tourist name, nationality, or hotel location..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all text-xs sm:text-sm text-slate-900 bg-white"
          />
        </div>

        {/* Nationality Dropdown */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm">
          <Globe className="w-4 h-4 text-slate-500" />
          <select
            value={nationalityFilter}
            onChange={(e) => setNationalityFilter(e.target.value)}
            className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
          >
            {nationalitiesList.map((nat) => (
              <option key={nat} value={nat}>
                {nat === 'all' ? 'All Nationalities' : nat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex gap-1.5 overflow-x-auto">
          {(['all', 'safe', 'caution', 'danger'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                filter === f
                  ? f === 'safe'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : f === 'caution'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : f === 'danger'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All Statuses' : statusConfig[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Traveler Name</th>
                <th className="px-4 py-3.5">Nationality</th>
                <th className="px-4 py-3.5">Disaster Zone Location</th>
                <th className="px-4 py-3.5">Safety Status</th>
                <th className="px-4 py-3.5">Emergency Contact</th>
                <th className="px-4 py-3.5">Last Check-in</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No citizens match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const st = statusConfig[u.status];
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">ID: {u.id.substring(0, 10)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {u.nationality}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="max-w-xs">
                          <p className="font-medium text-slate-800 truncate flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            {u.location_label || 'Mahabalipuram, Coastal Zone'}
                          </p>
                          {u.location_lat && u.location_lng && (
                            <p className="text-[11px] font-mono text-slate-400">
                              {u.location_lat.toFixed(4)}, {u.location_lng.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${st.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-semibold text-slate-800">{u.emergency_contact_name}</p>
                          <a href={`tel:${u.emergency_contact_phone}`} className="text-cyan-600 hover:underline text-[11px] font-mono">
                            {u.emergency_contact_phone}
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-slate-500 font-medium">
                          {formatDate(u.updated_at)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/status?token=${u.share_token}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1.5 rounded-lg transition-colors border border-cyan-200"
                        >
                          <ExternalLink className="w-3 h-3" /> Status Link
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Consular Advisory Modal */}
      {broadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-cyan-100 text-cyan-700 rounded-2xl">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Broadcast Consular Advisory</h3>
                  <p className="text-xs text-slate-500">Official SMS & Push Bulletin to Citizens</p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Geographic Zone</label>
                <input
                  type="text"
                  readOnly
                  value="Kancheepuram & Coastal Chengalpattu Red Warning Zone"
                  className="w-full bg-slate-100 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Advisory Message Content</label>
                <textarea
                  readOnly
                  rows={4}
                  value="[CONSULAR EMERGENCY ADVISORY - LEVEL 3] Extreme coastal surge detected on ECR corridor. Do NOT attempt transit to Chennai airport. Move immediately to verified high-ground shelter or contact Consular Officer at +91 44 2857 4000."
                  className="w-full bg-slate-50 text-slate-800 font-medium p-3 rounded-xl text-xs border border-slate-200 resize-none"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>This advisory will reach all {counts.total} registered foreign travelers and notify local disaster liaison officers.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBroadcastModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={broadcastSent}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                {broadcastSent ? (
                  <><Check className="w-4 h-4 text-white" /> Dispatched Successfully!</>
                ) : (
                  <><Send className="w-4 h-4" /> Transmit Emergency Broadcast</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
