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
  MapPin,
  Globe,
  Building2,
  Send,
  Check,
  X,
  Radio,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';

const statusConfig: Record<SafetyStatus, { label: string; dot: string; bg: string; text: string }> = {
  safe: { label: 'Safe', dot: 'bg-emerald-400', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60', text: 'text-emerald-400' },
  caution: { label: 'Caution', dot: 'bg-amber-400', bg: 'bg-amber-950/60 text-amber-300 border-amber-800/60', text: 'text-amber-400' },
  danger: { label: 'Danger / SOS', dot: 'bg-rose-400', bg: 'bg-rose-950/60 text-rose-300 border-rose-800/60', text: 'text-rose-400' },
};

// Rescue progress is saved in the browser (localStorage) so it works with no database.
// The family StatusPage reads the same key.
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

const loadRecords = (): Record<string, RescueRecord> => {
  try {
    const raw = localStorage.getItem(RESCUE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// Built-in place list (no internet needed). Used to work out each citizen's state and city.
interface KnownPlace {
  state: string;
  city: string;
  lat: number;
  lng: number;
  keys: string[];
}

const KNOWN_PLACES: KnownPlace[] = [
  { state: 'Tamil Nadu', city: 'Mahabalipuram', lat: 12.6269, lng: 80.1932, keys: ['mahabalipuram', 'mamallapuram'] },
  { state: 'Tamil Nadu', city: 'Kovalam', lat: 12.7956, lng: 80.2185, keys: ['kovalam'] },
  { state: 'Tamil Nadu', city: 'Kancheepuram', lat: 12.8342, lng: 79.7036, keys: ['kancheepuram', 'kanchipuram'] },
  { state: 'Tamil Nadu', city: 'Chengalpattu', lat: 12.6819, lng: 79.9888, keys: ['chengalpattu'] },
  { state: 'Tamil Nadu', city: 'Chennai', lat: 13.0827, lng: 80.2707, keys: ['chennai', 'sholinganallur'] },
  { state: 'Tamil Nadu', city: 'Madurai', lat: 9.9252, lng: 78.1198, keys: ['madurai'] },
  { state: 'Tamil Nadu', city: 'Coimbatore', lat: 11.0168, lng: 76.9558, keys: ['coimbatore'] },
  { state: 'Tamil Nadu', city: 'Ooty', lat: 11.4102, lng: 76.695, keys: ['ooty', 'udhagamandalam'] },
  { state: 'Tamil Nadu', city: 'Kodaikanal', lat: 10.2381, lng: 77.4892, keys: ['kodaikanal'] },
  { state: 'Tamil Nadu', city: 'Rameswaram', lat: 9.2876, lng: 79.3129, keys: ['rameswaram'] },
  { state: 'Tamil Nadu', city: 'Kanyakumari', lat: 8.0883, lng: 77.5385, keys: ['kanyakumari'] },
  { state: 'Tamil Nadu', city: 'Thanjavur', lat: 10.787, lng: 79.1378, keys: ['thanjavur'] },
  { state: 'Tamil Nadu', city: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047, keys: ['tiruchirappalli', 'trichy'] },
  { state: 'Puducherry', city: 'Puducherry', lat: 11.9416, lng: 79.8083, keys: ['puducherry', 'pondicherry'] },
  { state: 'Kerala', city: 'Kochi', lat: 9.9312, lng: 76.2673, keys: ['kochi', 'cochin'] },
  { state: 'Kerala', city: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, keys: ['thiruvananthapuram', 'trivandrum'] },
  { state: 'Karnataka', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, keys: ['bengaluru', 'bangalore'] },
  { state: 'Andhra Pradesh', city: 'Tirupati', lat: 13.6288, lng: 79.4192, keys: ['tirupati'] },
  { state: 'Maharashtra', city: 'Mumbai', lat: 19.076, lng: 72.8777, keys: ['mumbai'] },
  { state: 'Delhi', city: 'New Delhi', lat: 28.6139, lng: 77.209, keys: ['delhi'] },
];

const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.pow(Math.sin(dLng / 2), 2);
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

// 1) match a place name in the location text, 2) otherwise use the nearest known place (within 60 km)
const getPlace = (u: SafePassUser): { state: string; city: string } => {
  const label = (u.location_label || '').toLowerCase();
  const byName = KNOWN_PLACES.find((pl) => pl.keys.some((k) => label.includes(k)));
  if (byName) return { state: byName.state, city: byName.city };

  if (u.location_lat != null && u.location_lng != null) {
    let best: KnownPlace | null = null;
    let bestDist = Infinity;
    for (const pl of KNOWN_PLACES) {
      const d = distanceKm(u.location_lat, u.location_lng, pl.lat, pl.lng);
      if (d < bestDist) {
        best = pl;
        bestDist = d;
      }
    }
    if (best && bestDist <= 60) return { state: best.state, city: best.city };
  }
  return { state: 'Other', city: 'Other' };
};

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [users, setUsers] = useState<SafePassUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SafetyStatus | 'all'>('all');
  const [nationalityFilter, setNationalityFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [redZoneOnly, setRedZoneOnly] = useState(false);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  const [records, setRecords] = useState<Record<string, RescueRecord>>(loadRecords);
  const [pending, setPending] = useState<{ user: SafePassUser; kind: 'rescued' | 'deceased' } | null>(null);
  const [shelterInput, setShelterInput] = useState('');
  const [hospitalInput, setHospitalInput] = useState('');
  const [medicalNeeded, setMedicalNeeded] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setUsers(data as SafePassUser[]);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isClosed = (u: SafePassUser) => {
    const s = records[u.id]?.state;
    return s === 'rescued' || s === 'deceased';
  };

  const getStatusBadge = (u: SafePassUser): { label: string; dot: string; bg: string } => {
    const rec = records[u.id];
    if (rec?.state === 'rescued') {
      return { label: 'Rescued', dot: 'bg-emerald-400', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' };
    }
    if (rec?.state === 'deceased') {
      return { label: 'Deceased', dot: 'bg-neutral-400', bg: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
    }
    return statusConfig[u.status];
  };

  const nationalitiesList = ['all', ...Array.from(new Set(users.map((u) => u.nationality)))];
  const statesList = ['all', ...Array.from(new Set(users.map((u) => getPlace(u).state))).sort()];
  const citiesList = [
    'all',
    ...Array.from(
      new Set(
        users
          .filter((u) => stateFilter === 'all' || getPlace(u).state === stateFilter)
          .map((u) => getPlace(u).city),
      ),
    ).sort(),
  ];

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.nationality.toLowerCase().includes(search.toLowerCase()) ||
      (u.location_label?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesStatus = filter === 'all' || (u.status === filter && !isClosed(u));
    const matchesNationality = nationalityFilter === 'all' || u.nationality === nationalityFilter;
    const matchesRedZone = !redZoneOnly || (u.status === 'danger' && !isClosed(u));
    const place = getPlace(u);
    const matchesState = stateFilter === 'all' || place.state === stateFilter;
    const matchesCity = cityFilter === 'all' || place.city === cityFilter;

    return matchesSearch && matchesStatus && matchesNationality && matchesRedZone && matchesState && matchesCity;
  });

  const openCases = users.filter((u) => !isClosed(u));
  const counts = {
    total: users.length,
    safe: openCases.filter((u) => u.status === 'safe').length,
    caution: openCases.filter((u) => u.status === 'caution').length,
    danger: openCases.filter((u) => u.status === 'danger').length,
  };

  const hasActiveFilters = redZoneOnly || filter !== 'all' || nationalityFilter !== 'all' || stateFilter !== 'all' || cityFilter !== 'all' || search !== '';

  const clearFilters = () => {
    setRedZoneOnly(false);
    setFilter('all');
    setNationalityFilter('all');
    setStateFilter('all');
    setCityFilter('all');
    setSearch('');
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

  const saveRecords = (next: Record<string, RescueRecord>) => {
    setRecords(next);
    try {
      localStorage.setItem(RESCUE_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the page still works for this session
    }
  };

  // Launch Rescue button: start the rescue (the row button becomes "Search Ongoing")
  const handleLaunchRescue = (u: SafePassUser) => {
    const rec: RescueRecord = {
      state: 'searching',
      at: new Date().toISOString(),
      rescueId: `RSC-${Date.now().toString().slice(-6)}`,
    };
    saveRecords({ ...records, [u.id]: rec });
  };

  // Clicking "Search Ongoing" opens a popup where the officer picks the final result
  const openOutcome = (u: SafePassUser) => {
    setShelterInput('Chengalpattu Government Cyclone Relief Shelter');
    setHospitalInput('Chengalpattu Medical College Hospital');
    setMedicalNeeded(false);
    setPending({ user: u, kind: 'rescued' });
  };

  // Final result: Rescued or Deceased. After this the row is locked.
  const confirmOutcome = () => {
    if (!pending) return;
    const { user, kind } = pending;
    const nowIso = new Date().toISOString();
    const prev = records[user.id];
    const rescueId = prev?.rescueId ?? `RSC-${Date.now().toString().slice(-6)}`;

    const rec: RescueRecord =
      kind === 'rescued'
        ? { state: 'rescued', at: nowIso, rescueId, shelter: shelterInput.trim(), medical: medicalNeeded }
        : { state: 'deceased', at: nowIso, rescueId, hospital: hospitalInput.trim() };

    saveRecords({ ...records, [user.id]: rec });
    setPending(null);
  };

  // Keeps long numbers / phone numbers as text in Excel and escapes quotes
  const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const csvText = (value: string) => `="${value.replace(/"/g, '')}"`;

  const pad = (n: number) => String(n).padStart(2, '0');
  const csvDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Downloads the citizens currently shown in the table
  const handleExportCsv = () => {
    const now = new Date();
    const countBy = (state: RescueState) => filtered.filter((u) => records[u.id]?.state === state).length;

    const header = [
      'No.',
      'Traveler Name',
      'Nationality',
      'Location',
      'State',
      'City',
      'Latitude',
      'Longitude',
      'Safety Status',
      'Rescue Status',
      'Rescue ID',
      'Shelter / Hospital',
      'Medical Assistance',
      'Emergency Contact',
      'Emergency Phone',
      'Last Check-in',
    ];

    const rows = filtered.map((u, i) => {
      const rec = records[u.id];
      const rescueLabel =
        rec?.state === 'searching'
          ? 'Search Ongoing'
          : rec?.state === 'rescued'
          ? 'Rescued'
          : rec?.state === 'deceased'
          ? 'Deceased'
          : 'Not Dispatched';
      const medical = rec?.state === 'rescued' ? (rec.medical ? 'Needed' : 'Not needed') : '-';
      const place = rec?.state === 'rescued' ? rec.shelter || '-' : rec?.state === 'deceased' ? rec.hospital || '-' : '-';
      return [
        csvCell(i + 1),
        csvCell(u.name),
        csvCell(u.nationality),
        csvCell(u.location_label || '-'),
        csvCell(getPlace(u).state),
        csvCell(getPlace(u).city),
        csvCell(u.location_lat != null ? u.location_lat.toFixed(4) : '-'),
        csvCell(u.location_lng != null ? u.location_lng.toFixed(4) : '-'),
        csvCell(statusConfig[u.status].label),
        csvCell(rescueLabel),
        csvCell(rec?.rescueId || '-'),
        csvCell(place),
        csvCell(medical),
        csvCell(u.emergency_contact_name),
        csvText(u.emergency_contact_phone),
        csvCell(csvDate(u.updated_at)),
      ].join(',');
    });

    const lines = [
      csvCell('SAFEPASS - CONSULAR MANIFEST'),
      `${csvCell('Generated')},${csvCell(csvDate(now.toISOString()))}`,
      `${csvCell('Total citizens')},${csvCell(filtered.length)}`,
      `${csvCell('Rescued')},${csvCell(countBy('rescued'))},${csvCell('Search ongoing')},${csvCell(countBy('searching'))},${csvCell('Deceased')},${csvCell(countBy('deceased'))}`,
      '',
      header.map(csvCell).join(','),
      ...rows,
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consular-manifest-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <button
            onClick={onLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all border border-slate-700"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-neutral-900 rounded-2xl shadow-md border border-neutral-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Registered Citizens</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{counts.total}</p>
          <p className="text-[11px] text-neutral-400 mt-1">Active in crisis corridor</p>
        </div>

        <div className="bg-neutral-900 rounded-2xl shadow-md border border-neutral-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Confirmed Safe</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{counts.safe}</p>
          <p className="text-[11px] text-emerald-300/70 mt-1">Sheltered in high ground</p>
        </div>

        <div className="bg-neutral-900 rounded-2xl shadow-md border border-neutral-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Under Caution</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">{counts.caution}</p>
          <p className="text-[11px] text-amber-300/70 mt-1">Restricted transit zone</p>
        </div>

        <div className="bg-neutral-900 rounded-2xl shadow-md border border-rose-900/60 bg-rose-950/20 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Distress / SOS</span>
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-400">{counts.danger}</p>
          <p className="text-[11px] text-rose-300/80 font-bold mt-1">Priority rescue queue</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tourist name, nationality, or hotel location..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-base sm:text-sm text-white bg-neutral-800 placeholder-neutral-400"
            style={{
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              caretColor: '#22d3ee',
              backgroundColor: '#262626',
              fontSize: '16px',
            }}
          />
        </div>

        {/* Nationality Dropdown */}
        <div className="flex items-center gap-2 bg-neutral-800 px-3 py-2 rounded-xl border border-neutral-700 text-base sm:text-sm">
          <Globe className="w-4 h-4 text-neutral-400" />
          <select
            value={nationalityFilter}
            onChange={(e) => setNationalityFilter(e.target.value)}
            className="bg-transparent font-semibold text-white outline-none cursor-pointer text-base sm:text-sm"
            style={{
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              backgroundColor: '#262626',
              fontSize: '14px',
            }}
          >
            {nationalitiesList.map((nat) => (
              <option key={nat} value={nat} className="bg-neutral-900 text-white">
                {nat === 'all' ? 'All Nationalities' : nat}
              </option>
            ))}
          </select>
        </div>

        {/* State Dropdown */}
        <div className="flex items-center gap-2 bg-neutral-800 px-3 py-2 rounded-xl border border-neutral-700 text-base sm:text-sm">
          <MapPin className="w-4 h-4 text-neutral-400" />
          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCityFilter('all');
            }}
            className="bg-transparent font-semibold text-white outline-none cursor-pointer text-base sm:text-sm"
            style={{
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              backgroundColor: '#262626',
              fontSize: '14px',
            }}
          >
            {statesList.map((st) => (
              <option key={st} value={st} className="bg-neutral-900 text-white">
                {st === 'all' ? 'All States' : st}
              </option>
            ))}
          </select>
        </div>

        {/* City Dropdown */}
        <div className="flex items-center gap-2 bg-neutral-800 px-3 py-2 rounded-xl border border-neutral-700 text-base sm:text-sm">
          <Building2 className="w-4 h-4 text-neutral-400" />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-transparent font-semibold text-white outline-none cursor-pointer text-base sm:text-sm"
            style={{
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              backgroundColor: '#262626',
              fontSize: '14px',
            }}
          >
            {citiesList.map((c) => (
              <option key={c} value={c} className="bg-neutral-900 text-white">
                {c === 'all' ? 'All Cities' : c}
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
                    ? 'bg-amber-500 text-neutral-950 font-extrabold shadow-sm'
                    : f === 'danger'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All Statuses' : statusConfig[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick-filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setRedZoneOnly(!redZoneOnly)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${
            redZoneOnly
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> High-Risk Red Zone ({counts.danger})
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 hover:text-white transition-all"
          >
            <X className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}
      </div>

      {/* Roster Table */}
      <div className="bg-neutral-900 rounded-3xl shadow-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Traveler Name</th>
                <th className="px-4 py-3.5">Nationality</th>
                <th className="px-4 py-3.5">Disaster Zone Location</th>
                <th className="px-4 py-3.5">Safety Status</th>
                <th className="px-4 py-3.5">Emergency Contact</th>
                <th className="px-4 py-3.5">Last Check-in</th>
                <th className="px-4 py-3.5">Medical Assistance</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-400">
                    {users.length === 0
                      ? 'No travelers currently registered in the crisis database.'
                      : 'No citizens match the selected filter criteria.'}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const st = getStatusBadge(u);
                  const rec = records[u.id];
                  return (
                    <tr key={u.id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-bold flex items-center justify-center text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{u.name}</p>
                            <p className="text-[11px] text-neutral-400 font-mono">ID: {u.id.substring(0, 10)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-neutral-400" />
                          {u.nationality}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="max-w-xs">
                          <p className="font-medium text-neutral-200 truncate flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                            {u.location_label || 'Mahabalipuram, Coastal Zone'}
                          </p>
                          {u.location_lat && u.location_lng && (
                            <p className="text-[11px] font-mono text-neutral-400">
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
                          <p className="font-semibold text-neutral-200">{u.emergency_contact_name}</p>
                          <a href={`tel:${u.emergency_contact_phone}`} className="text-cyan-400 hover:underline text-[11px] font-mono">
                            {u.emergency_contact_phone}
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-neutral-400 font-medium">
                          {formatDate(u.updated_at)}
                        </span>
                      </td>

                      {/* Medical assistance: only shown once the person is rescued */}
                      <td className="px-4 py-3.5">
                        {rec?.state === 'rescued' ? (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              rec.medical
                                ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                                : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                            }`}
                          >
                            {rec.medical ? 'Needed' : 'Not needed'}
                          </span>
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </td>

                      {/* Rescue actions: only one small button per row */}
                      <td className="px-4 py-3.5 text-right">
                        {rec?.state === 'rescued' || rec?.state === 'deceased' ? (
                          <span className="inline-block bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold px-3.5 py-2 rounded-lg text-xs">
                            {rec.state === 'rescued' ? 'Rescued' : 'Deceased'}
                          </span>
                        ) : rec?.state === 'searching' ? (
                          <button
                            onClick={() => openOutcome(u)}
                            className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3.5 py-2 rounded-lg text-xs transition-colors"
                          >
                            Search Ongoing
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLaunchRescue(u)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-sm"
                          >
                            Launch Rescue
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap border-t border-neutral-800 bg-neutral-950/60 px-5 py-3.5">
          <p className="text-xs text-neutral-400 font-medium">
            Showing {filtered.length} of {users.length} citizens
          </p>
          <button
            onClick={handleExportCsv}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Consular Manifest (CSV)
          </button>
        </div>
      </div>

      {/* Outcome Modal: Rescued / Deceased details */}
      {pending && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-neutral-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-800 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-white text-lg">
                Update Rescue Result: {pending.user.name}
              </h3>
              <button onClick={() => setPending(null)} className="text-neutral-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {(['rescued', 'deceased'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setPending({ ...pending, kind: k })}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    pending.kind === k
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  {k === 'rescued' ? 'Rescued' : 'Deceased'}
                </button>
              ))}
            </div>

            <div className="space-y-4 mb-5">
              {pending.kind === 'rescued' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Current Shelter Location</label>
                    <input
                      type="text"
                      value={shelterInput}
                      onChange={(e) => setShelterInput(e.target.value)}
                      placeholder="e.g. Mahabalipuram Relief Center"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-xs text-white placeholder-neutral-500"
                      style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#262626', fontSize: '14px' }}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={medicalNeeded}
                      onChange={(e) => setMedicalNeeded(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan-500"
                    />
                    Medical assistance needed
                  </label>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Current Hospital</label>
                  <input
                    type="text"
                    value={hospitalInput}
                    onChange={(e) => setHospitalInput(e.target.value)}
                    placeholder="e.g. Chengalpattu Government Hospital"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-xs text-white placeholder-neutral-500"
                    style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#262626', fontSize: '14px' }}
                  />
                </div>
              )}

              <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-900/50 text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span>This cannot be changed afterwards.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPending(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-4 py-2.5 rounded-xl text-xs border border-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmOutcome}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Consular Advisory Modal */}
      {broadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-neutral-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-800 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-cyan-950/80 text-cyan-400 rounded-2xl border border-cyan-800/50">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Broadcast Consular Advisory</h3>
                  <p className="text-xs text-neutral-400">Official SMS & Push Bulletin to Citizens</p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Target Geographic Zone</label>
                <input
                  type="text"
                  readOnly
                  value="Kancheepuram & Coastal Chengalpattu Red Warning Zone"
                  className="w-full bg-neutral-800 text-neutral-200 font-semibold px-3.5 py-2.5 rounded-xl text-xs border border-neutral-700"
                  style={{ fontSize: '16px', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Advisory Message Content</label>
                <textarea
                  readOnly
                  rows={4}
                  value="[CONSULAR EMERGENCY ADVISORY - LEVEL 3] Extreme coastal surge detected on ECR corridor. Do NOT attempt transit to Chennai airport. Move immediately to verified high-ground shelter or contact Consular Officer at +91 44 2857 4000."
                  className="w-full bg-neutral-800 text-neutral-200 font-medium p-3 rounded-xl text-xs border border-neutral-700 resize-none"
                  style={{ fontSize: '16px', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                />
              </div>

              <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-900/50 text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span>This advisory will reach all {counts.total} registered foreign travelers and notify local disaster liaison officers.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBroadcastModal(false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-4 py-2.5 rounded-xl text-xs border border-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={broadcastSent}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
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

// Demo login for the consular admin page (credentials are in the code, so this is for the demo only)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin@123';
const ADMIN_AUTH_KEY = 'safepass_admin_auth';

export default function Admin() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'yes';
    } catch {
      return false;
    }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
      try {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'yes');
      } catch {
        // Storage blocked: login still works for this visit
      }
      setLoginError('');
      setAuthed(true);
    } else {
      setLoginError('Incorrect username or password.');
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(ADMIN_AUTH_KEY);
    } catch {
      // ignore
    }
    setUsername('');
    setPassword('');
    setAuthed(false);
  };

  if (authed) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="max-w-sm mx-auto animate-fade-in py-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 border border-neutral-800 text-cyan-400 rounded-2xl mb-4 shadow-xl">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Consular Admin Login</h1>
        <p className="text-neutral-400 text-sm">Authorized embassy and TNDMA officers only.</p>
      </div>
      <form onSubmit={handleLogin} className="bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 p-6 sm:p-7 space-y-4 text-white">
        <div>
          <label className="block text-xs font-bold text-neutral-300 mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="admin"
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm text-white placeholder-neutral-500"
            style={{
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              backgroundColor: '#262626',
              fontSize: '16px',
            }}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-300 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm text-white placeholder-neutral-500"
            style={{
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              backgroundColor: '#262626',
              fontSize: '16px',
            }}
            required
          />
        </div>
        {loginError && (
          <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/50 rounded-xl p-3 border border-red-900/60">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {loginError}
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Lock className="w-4 h-4" /> Log In
        </button>
      </form>
    </div>
  );
}
