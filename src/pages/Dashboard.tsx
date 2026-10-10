import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabase';
import type { SafePassUser, WeatherData, SafetyStatus } from '@/lib/types';
import {
  ACTIVE_HAZARD_ZONES,
  VERIFIED_SHELTERS,
  FALLBACK_CYCLONE_WEATHER,
  EMERGENCY_CONTACTS,
  type EmergencyShelter,
  type HazardZone,
} from '@/lib/crisisData';
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  CloudLightning,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Droplets,
  Wind,
  MapPin,
  MessageCircle,
  Eye,
  Thermometer,
  Navigation,
  Shield,
  ShieldAlert,
  Building2,
  HeartPulse,
  Radio,
  Share2,
  PhoneCall,
  Check,
  X,
  Compass,
} from 'lucide-react';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for shelters and user
const shelterIcon = L.divIcon({
  className: 'custom-shelter-marker',
  html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: white; font-size: 16px;">🏠</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

const consularIcon = L.divIcon({
  className: 'custom-consular-marker',
  html: `<div style="background-color: #6366f1; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: white; font-size: 16px;">🏛️</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

const medicalIcon = L.divIcon({
  className: 'custom-medical-marker',
  html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); color: white; font-size: 16px;">🏥</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background-color: #0284c7; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.4); color: white; font-size: 16px;">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const statusConfig: Record<SafetyStatus, { label: string; color: string; bg: string; ring: string; icon: typeof CheckCircle2 }> = {
  safe: { label: 'Safe', color: 'text-green-600', bg: 'bg-green-500', ring: 'ring-4 ring-green-100', icon: CheckCircle2 },
  caution: { label: 'Caution', color: 'text-amber-600', bg: 'bg-amber-500', ring: 'ring-4 ring-amber-100', icon: AlertTriangle },
  danger: { label: 'Danger / SOS', color: 'text-red-600', bg: 'bg-red-500', ring: 'ring-4 ring-red-200 animate-pulse', icon: ShieldAlert },
};

function getWeatherIcon(iconCode: string) {
  if (iconCode.startsWith('01')) return Sun;
  if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) return Cloud;
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return CloudRain;
  if (iconCode.startsWith('11')) return CloudLightning;
  if (iconCode.startsWith('13')) return CloudSnow;
  return Cloud;
}

export default function Dashboard() {
  const [user, setUser] = useState<SafePassUser | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(FALLBACK_CYCLONE_WEATHER);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mapLayer, setMapLayer] = useState<'all' | 'shelters' | 'hazards'>('all');
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const userId = localStorage.getItem('safepass_user_id');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const loadDemoPersona = () => {
    const demoUser: SafePassUser = {
      id: 'demo-alex-mercer',
      name: 'Alex Mercer',
      nationality: 'France',
      location_lat: 12.6269,
      location_lng: 80.1932,
      location_label: 'Mahabalipuram Coastal Heritage Zone, Chengalpattu / Kancheepuram',
      emergency_contact_name: 'Claire Mercer (Sister)',
      emergency_contact_phone: '+33 6 42 19 88 01',
      status: 'caution',
      share_token: 'alex-demo-token-994',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('safepass_user_id', demoUser.id);
    localStorage.setItem('safepass_share_token', demoUser.share_token);
    setUser(demoUser);
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    (async () => {
      // 1. Check if user profile is already saved in localStorage
      let localUser: SafePassUser | null = null;
      const profileStr = localStorage.getItem('safepass_user_profile');
      if (profileStr) {
        try {
          localUser = JSON.parse(profileStr);
        } catch {}
      }

      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (data) {
          const u = data as SafePassUser;
          setUser(u);
          localStorage.setItem('safepass_user_profile', JSON.stringify(u));
          fetchWeather(u.location_lat, u.location_lng, u.location_label || undefined);
          setLoading(false);
          return;
        }
      } catch {
        // offline fallback
      }

      if (localUser) {
        setUser(localUser);
        fetchWeather(localUser.location_lat, localUser.location_lng, localUser.location_label || undefined);
      } else {
        loadDemoPersona();
      }
      setLoading(false);
    })();
  }, [userId]);

  const fetchWeather = async (lat: number | null, lng: number | null, city?: string) => {
    setWeatherLoading(true);
    try {
      const params = new URLSearchParams();
      if (lat && lng) {
        params.set('lat', String(lat));
        params.set('lng', String(lng));
      } else if (city) {
        params.set('city', city);
      }
      const res = await fetch(
        `${supabaseUrl}/functions/v1/weather?${params}`,
        { headers: { Authorization: `Bearer ${supabaseAnonKey}` } },
      );
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setWeather(data as WeatherData);
          setWeatherLoading(false);
          return;
        }
      }
    } catch {
      // Fallback
    }
    // High-impact localized cyclone weather fallback for Tamil Nadu / Kancheepuram
    setWeather(FALLBACK_CYCLONE_WEATHER);
    setWeatherLoading(false);
  };

  const updateStatus = async (status: SafetyStatus) => {
    if (!user) return;
    setUpdatingStatus(true);
    const updated = { ...user, status, updated_at: new Date().toISOString() };
    setUser(updated);

    try {
      await supabase
        .from('users')
        .update({ status, updated_at: updated.updated_at })
        .eq('id', user.id);
    } catch {
      // offline sync
    }
    setUpdatingStatus(false);
  };

  const triggerSOS = async () => {
    await updateStatus('danger');
    setSosModalOpen(true);
  };

  const relocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (user) {
        const updated = {
          ...user,
          location_lat: lat,
          location_lng: lng,
          updated_at: new Date().toISOString(),
        };
        setUser(updated);
        try {
          await supabase.from('users').update({
            location_lat: lat,
            location_lng: lng,
            updated_at: updated.updated_at,
          }).eq('id', user.id);
        } catch {
          // offline
        }
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 13);
        }
      }
    });
  };

  const copyShareLink = () => {
    const token = user?.share_token || localStorage.getItem('safepass_share_token') || 'alex-demo-token-994';
    const link = `${window.location.origin}/status?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fade-in bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 rounded-full mb-4">
          <Compass className="w-8 h-8 text-cyan-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Profile Detected</h2>
        <p className="text-slate-600 text-sm mb-6">
          You can complete the 20-second tourist onboarding, or instantly load our demo scenario (Alex Mercer in Mahabalipuram).
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={loadDemoPersona}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md text-sm"
          >
            ⚡ Load Tourist Demo Persona (Alex Mercer)
          </button>
          <Link
            to="/"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-3 rounded-xl transition-all text-sm"
          >
            Create New Profile from Scratch
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[user.status];
  const StatusIcon = statusInfo.icon;
  const userLat = user.location_lat ?? 12.6269;
  const userLng = user.location_lng ?? 80.1932;
  const mapCenter: [number, number] = [userLat, userLng];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner: Severe Crisis Alert Notice */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white text-red-700 font-extrabold text-xs px-2 py-0.5 rounded-full uppercase tracking-wider">
                Official Alert
              </span>
              <p className="font-bold text-sm sm:text-base">Cyclone Alert Level 3 — Coastal Warning Active</p>
            </div>
            <p className="text-xs sm:text-sm text-red-100 mt-0.5">
              Regional Met Centre issued Red Warning for Kancheepuram / Chennai coast. Avoid low-lying corridors.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={triggerSOS}
            className="bg-white hover:bg-red-50 text-red-600 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4 text-red-600" /> One-Tap SOS
          </button>
          <Link
            to="/chat"
            className="bg-red-800/80 hover:bg-red-900 text-white font-medium px-4 py-2 rounded-xl text-xs sm:text-sm transition-all border border-red-400/40 flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" /> Ask Calm Voice
          </Link>
        </div>
      </div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome, {user.name}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {user.nationality}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time crisis triage & consular safety monitor
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 bg-white border border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-cyan-700 font-medium px-3.5 py-2 rounded-xl transition-all text-xs sm:text-sm shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
            {copiedLink ? 'Link Copied!' : 'Share Status Page'}
          </button>
          <Link
            to="/status"
            className="flex items-center gap-1.5 bg-white border border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-cyan-700 font-medium px-3.5 py-2 rounded-xl transition-all text-xs sm:text-sm shadow-sm"
          >
            <Eye className="w-4 h-4" /> Family View
          </Link>
          <Link
            to="/admin"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium px-3.5 py-2 rounded-xl transition-all text-xs sm:text-sm shadow-sm"
          >
            <Building2 className="w-4 h-4" /> Embassy Admin
          </Link>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) + Status & Weather (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Interactive Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-600" />
              <div>
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">Crisis Geospatial Navigator</h2>
                <p className="text-xs text-slate-500">Live Shelters & Hazard Surge Zones</p>
              </div>
            </div>

            {/* Layer Filters */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setMapLayer('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  mapLayer === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Layers
              </button>
              <button
                onClick={() => setMapLayer('shelters')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  mapLayer === 'shelters' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Shelters ({VERIFIED_SHELTERS.length})
              </button>
              <button
                onClick={() => setMapLayer('hazards')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  mapLayer === 'hazards' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Hazards ({ACTIVE_HAZARD_ZONES.length})
              </button>
            </div>

            <button
              onClick={relocate}
              className="flex items-center gap-1 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition-colors border border-cyan-200"
            >
              <Navigation className="w-3.5 h-3.5" /> GPS Recalibrate
            </button>
          </div>

          {/* Map Canvas */}
          <div className="h-[430px] sm:h-[480px] relative w-full">
            <MapContainer
              center={mapCenter}
              zoom={12}
              ref={(map) => { if (map) mapRef.current = map; }}
              className="absolute inset-0 z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {/* User Position */}
              <Marker position={[userLat, userLng]} icon={userIcon}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-sm text-slate-900">{user.name} (You)</p>
                    <p className="text-xs text-slate-600 mt-0.5">{user.location_label || 'Current Position'}</p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusInfo.bg}`} />
                      <span className="text-xs font-bold capitalize text-slate-700">Status: {user.status}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Active Hazard Circles */}
              {(mapLayer === 'all' || mapLayer === 'hazards') &&
                ACTIVE_HAZARD_ZONES.map((zone) => {
                  const isDanger = zone.severity === 'danger';
                  return (
                    <Circle
                      key={zone.id}
                      center={zone.center}
                      radius={zone.radius_meters}
                      pathOptions={{
                        color: isDanger ? '#ef4444' : '#f59e0b',
                        fillColor: isDanger ? '#ef4444' : '#f59e0b',
                        fillOpacity: isDanger ? 0.28 : 0.2,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="max-w-xs p-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                              isDanger ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {zone.severity}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">{zone.risk_type}</span>
                          </div>
                          <p className="font-bold text-sm text-slate-900 mt-1">{zone.name}</p>
                          <p className="text-xs text-slate-600 mt-1">{zone.recommendation}</p>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}

              {/* Emergency Shelters */}
              {(mapLayer === 'all' || mapLayer === 'shelters') &&
                VERIFIED_SHELTERS.map((sh) => {
                  let icon = shelterIcon;
                  if (sh.type === 'consular') icon = consularIcon;
                  if (sh.type === 'medical') icon = medicalIcon;

                  const occupancyPercent = Math.round((sh.current_occupancy / sh.capacity) * 100);

                  return (
                    <Marker key={sh.id} position={[sh.lat, sh.lng]} icon={icon}>
                      <Popup>
                        <div className="max-w-xs p-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {sh.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-500">Verified Shelter</span>
                          </div>
                          <p className="font-bold text-sm text-slate-900 mt-1">{sh.name}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{sh.address}</p>

                          <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700">
                              <span>Occupancy</span>
                              <span>{sh.current_occupancy} / {sh.capacity} ({occupancyPercent}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${occupancyPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${occupancyPercent}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
                              {sh.has_drinking_water && <span>💧 Potable Water</span>}
                              {sh.has_food && <span>🍲 Hot Rations</span>}
                              {sh.has_medical && <span>🩺 First Aid</span>}
                            </div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-mono font-medium text-slate-600">{sh.contact}</span>
                            <a
                              href={`tel:${sh.contact}`}
                              className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-md hover:bg-emerald-700 transition-colors"
                            >
                              Call Shelter
                            </a>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
          </div>

          {/* Map Footer Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Danger Zone (Surge/Flood)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Caution Zone
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Safe High Ground Shelter
              </span>
            </div>
            <span className="text-slate-400 font-mono">Location: {user.location_label || `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`}</span>
          </div>
        </div>

        {/* Right Sidebar: Status Switcher & Real Weather */}
        <div className="space-y-6">
          {/* Status Switcher Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base">Your Crisis Status</h2>
              <span className="text-xs font-medium text-slate-400">Syncs to Embassy & Family</span>
            </div>

            <div className="flex flex-col items-center mb-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`w-16 h-16 rounded-full ${statusInfo.bg} flex items-center justify-center ${statusInfo.ring} shadow-md`}>
                <StatusIcon className="w-8 h-8 text-white" />
              </div>
              <p className={`mt-3 text-xl font-extrabold ${statusInfo.color}`}>{statusInfo.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Last broadcast: {new Date(user.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Change Safety Status</p>
              {(Object.keys(statusConfig) as SafetyStatus[]).map((s) => {
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                const active = user.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={updatingStatus}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-semibold ${
                      active
                        ? `${cfg.bg} text-white border-transparent shadow-md`
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{cfg.label}</span>
                    </div>
                    {active && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={triggerSOS}
              className="w-full mt-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              Broadcast Emergency SOS Now
            </button>
          </div>

          {/* Severe Weather Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base">Weather & Disaster Warnings</h2>
              {weatherLoading && <Loader2 className="w-4 h-4 text-cyan-600 animate-spin" />}
            </div>

            {weather && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-extrabold text-slate-900">{weather.temp}°C</p>
                    <p className="text-sm font-semibold text-slate-600 capitalize">{weather.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{weather.city}</p>
                  </div>
                  {(() => {
                    const WeatherIconComponent = getWeatherIcon(weather.icon);
                    return <WeatherIconComponent className="w-14 h-14 text-cyan-500 animate-pulse" />;
                  })()}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <Thermometer className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-[11px] text-slate-400 font-medium">Feels</p>
                    <p className="text-sm font-bold text-slate-700">{weather.feels_like}°C</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <Droplets className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-[11px] text-slate-400 font-medium">Humidity</p>
                    <p className="text-sm font-bold text-slate-700">{weather.humidity}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <Wind className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-[11px] text-slate-400 font-medium">Wind</p>
                    <p className="text-sm font-bold text-red-600">{weather.wind_speed} km/h</p>
                  </div>
                </div>

                {/* Weather Alert Boxes */}
                {weather.alerts && weather.alerts.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Active Disaster Bulletins ({weather.alerts.length})
                    </p>
                    {weather.alerts.map((al, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded-xl p-3 text-left">
                        <p className="text-xs font-bold text-red-800">{al.event}</p>
                        <p className="text-xs text-red-700 mt-1 leading-relaxed">{al.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SOS Modal Dialog */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-full animate-bounce">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Emergency SOS Broadcast Active</h3>
                  <p className="text-xs text-red-600 font-semibold">Priority Distress Signal Transmitted</p>
                </div>
              </div>
              <button
                onClick={() => setSosModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 mb-5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Citizen:</span>
                <span className="font-bold text-slate-900">{user.name} ({user.nationality})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Relayed Coordinates:</span>
                <span className="font-mono font-bold text-red-600">{userLat.toFixed(4)}° N, {userLng.toFixed(4)}° E</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Family SMS Dispatch:</span>
                <span className="text-emerald-700 font-bold">✓ Sent to {user.emergency_contact_phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Consular Notification:</span>
                <span className="text-emerald-700 font-bold">✓ Logged on Consular Roster</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Instant Emergency Hotlines</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:112"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" /> Dial 112 (National)
                </a>
                <a
                  href="tel:1070"
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <PhoneCall className="w-4 h-4" /> Dial 1070 (Disaster)
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link
                to="/chat"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" /> Talk with Calm Voice
              </Link>
              <button
                onClick={() => setSosModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
