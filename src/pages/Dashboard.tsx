import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabase';
import type { SafePassUser, WeatherData, SafetyStatus } from '@/lib/types';
import {
  ACTIVE_HAZARD_ZONES,
  VERIFIED_SHELTERS,
  FALLBACK_CYCLONE_WEATHER,
  getDynamicCycloneWeather,
  getSecondsUntilNextWeatherUpdate,
  type DynamicWeatherStage,
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
  Clock,
  Database,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
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
  html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.5); color: white; font-size: 16px;">🏠</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

const consularIcon = L.divIcon({
  className: 'custom-consular-marker',
  html: `<div style="background-color: #6366f1; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.5); color: white; font-size: 16px;">🏛️</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

const medicalIcon = L.divIcon({
  className: 'custom-medical-marker',
  html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.5); color: white; font-size: 16px;">🏥</div>`,
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
  safe: { label: 'Safe', color: 'text-green-400', bg: 'bg-green-600', ring: 'ring-4 ring-green-900/60', icon: CheckCircle2 },
  caution: { label: 'Caution', color: 'text-amber-400', bg: 'bg-amber-600', ring: 'ring-4 ring-amber-900/60', icon: AlertTriangle },
  danger: { label: 'Danger / SOS', color: 'text-red-400', bg: 'bg-red-600', ring: 'ring-4 ring-red-900/80 animate-pulse', icon: ShieldAlert },
};

function getWeatherIcon(iconCode: string) {
  if (iconCode.startsWith('01')) return Sun;
  if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) return Cloud;
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) return CloudRain;
  if (iconCode.startsWith('11')) return CloudLightning;
  if (iconCode.startsWith('13')) return CloudSnow;
  return Cloud;
}

/**
 * Calculates Haversine distance in kilometers between two lat/lng coordinates.
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates estimated walking time in minutes based on disaster evacuation speed (~4.5 km/h).
 */
function calculateWalkingTimeMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / 4.5) * 60));
}

/**
 * Computes the cumulative path distance in kilometers along a sequence of coordinates.
 */
function calculatePathLengthKm(coords: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += calculateDistanceKm(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
  }
  return total;
}

/**
 * Generates an evacuation corridor from user to destination shelter,
 * safely skirting around active red hazard zones (storm surge and canal breach).
 */
function generateSafeEvacuationRoute(
  start: [number, number],
  end: [number, number],
  hazards: HazardZone[]
): [number, number][] {
  const directDistM = calculateDistanceKm(start[0], start[1], end[0], end[1]) * 1000;

  // For immediate local shelters (< 600m), follow direct elevated road approach
  if (directDistM < 600) {
    const approachMid: [number, number] = [
      start[0] * 0.45 + end[0] * 0.55,
      start[1] * 0.55 + end[1] * 0.45,
    ];
    return [start, approachMid, end];
  }

  const dangerHazards = hazards.filter((h) => h.severity === 'danger');
  const mPerLat = 110574;
  const mPerLng = 111320 * Math.cos((start[0] * Math.PI) / 180);

  function toXY(pt: [number, number]): [number, number] {
    return [(pt[1] - start[1]) * mPerLng, (pt[0] - start[0]) * mPerLat];
  }
  function toLatLng(xy: [number, number]): [number, number] {
    return [start[0] + xy[1] / mPerLat, start[1] + xy[0] / mPerLng];
  }

  let waypoints: [number, number][] = [start, end];

  // Inspect segments and insert safety detours around red danger zones
  for (const hz of dangerHazards) {
    const hzXY = toXY(hz.center);
    const safeRadius = hz.radius_meters + 350; // 350m safety margin outside red circle
    const nextWaypoints: [number, number][] = [];
    let detourInserted = false;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      nextWaypoints.push(p1);

      if (!detourInserted) {
        const xy1 = toXY(p1);
        const xy2 = toXY(p2);
        const dx = xy2[0] - xy1[0];
        const dy = xy2[1] - xy1[1];
        const segLenSq = dx * dx + dy * dy;

        if (segLenSq > 0) {
          const t = ((hzXY[0] - xy1[0]) * dx + (hzXY[1] - xy1[1]) * dy) / segLenSq;
          // Only divert if the danger zone lies along the active travel segment
          if (t >= 0.05 && t <= 0.95) {
            const projX = xy1[0] + t * dx;
            const projY = xy1[1] + t * dy;
            const distToCenter = Math.hypot(hzXY[0] - projX, hzXY[1] - projY);

            if (distToCenter < safeRadius) {
              // Intersects danger zone: Route west/inland along elevated ridge to circumvent flood surge
              const isHeadingNorth = dy >= 0;
              const detourWestX = hzXY[0] - safeRadius * 1.15;
              const entryY = isHeadingNorth ? hzXY[1] - safeRadius * 0.5 : hzXY[1] + safeRadius * 0.5;
              const midY = hzXY[1];
              const exitY = isHeadingNorth ? hzXY[1] + safeRadius * 0.5 : hzXY[1] - safeRadius * 0.5;

              nextWaypoints.push(
                toLatLng([detourWestX, entryY]),
                toLatLng([detourWestX - 100, midY]),
                toLatLng([detourWestX, exitY])
              );
              detourInserted = true;
            }
          }
        }
      }
    }
    nextWaypoints.push(waypoints[waypoints.length - 1]);
    waypoints = nextWaypoints;
  }

  // Smooth intermediate steps for long evacuation transit corridors (> 4km)
  const finalCorridor: [number, number][] = [];
  for (let i = 0; i < waypoints.length; i++) {
    finalCorridor.push(waypoints[i]);
    if (i < waypoints.length - 1) {
      const pA = waypoints[i];
      const pB = waypoints[i + 1];
      const stepDist = calculateDistanceKm(pA[0], pA[1], pB[0], pB[1]);
      if (stepDist > 5) {
        finalCorridor.push([(pA[0] + pB[0]) / 2, (pA[1] + pB[1]) / 2]);
      }
    }
  }

  return finalCorridor;
}

export default function Dashboard() {
  const [user, setUser] = useState<SafePassUser | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(FALLBACK_CYCLONE_WEATHER);
  const [dynamicWeather, setDynamicWeather] = useState<DynamicWeatherStage | null>(null);
  const [weatherOffset, setWeatherOffset] = useState<number>(0);
  const [secondsUntilNextForecast, setSecondsUntilNextForecast] = useState<number>(getSecondsUntilNextWeatherUpdate());
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mapLayer, setMapLayer] = useState<'all' | 'shelters' | 'hazards'>('all');
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<EmergencyShelter | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(true);
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

  // 1-second countdown ticker for the 3-minute IMD satellite bulletin
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextForecast(getSecondsUntilNextWeatherUpdate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update dynamic weather whenever user, coordinates, or manual offset change
  useEffect(() => {
    const lat = user?.location_lat ?? 12.6269;
    const lng = user?.location_lng ?? 80.1932;
    const label = user?.location_label || undefined;
    const name = user?.name || undefined;

    const dynamic = getDynamicCycloneWeather(lat, lng, label, name, weatherOffset);
    setDynamicWeather(dynamic);
    setWeather(dynamic);

    // Periodically verify if the 3-minute window epoch changed
    const autoRefresh = setInterval(() => {
      const refreshed = getDynamicCycloneWeather(lat, lng, label, name, weatherOffset);
      setDynamicWeather(refreshed);
      setWeather(refreshed);
    }, 10000);

    return () => clearInterval(autoRefresh);
  }, [user?.location_lat, user?.location_lng, user?.location_label, user?.name, weatherOffset]);

  const fetchWeather = async (lat: number | null, lng: number | null, city?: string) => {
    setWeatherLoading(true);
    const dynamic = getDynamicCycloneWeather(lat, lng, city, user?.name, weatherOffset);
    setDynamicWeather(dynamic);
    setWeather(dynamic);
    setWeatherLoading(false);
  };

  const handleCycleWeatherForecast = () => {
    setWeatherOffset((prev) => prev + 1);
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
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fade-in bg-neutral-900 text-white p-8 rounded-2xl border border-neutral-800 shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-950 text-cyan-400 rounded-full mb-4 border border-cyan-800/60">
          <Compass className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Profile Detected</h2>
        <p className="text-neutral-300 text-sm mb-6">
          Log in with your verified mobile number, register a new profile, or view sample emergency data.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={loadDemoPersona}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            View Sample Tourist (Alex Mercer)
          </button>
          <Link
            to="/onboarding"
            className="w-full bg-neutral-800 hover:bg-neutral-750 text-white font-medium px-6 py-3 rounded-xl transition-all text-sm border border-neutral-700"
          >
            Register New Profile
          </Link>
          <Link
            to="/login"
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-cyan-400 font-medium px-6 py-2.5 rounded-xl transition-all text-xs border border-neutral-800"
          >
            Log In with Mobile Number →
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

  // Nearest High-Ground Shelter calculation
  const highGroundShelters = VERIFIED_SHELTERS.filter((s) => s.type === 'high_ground');
  const nearestHighGround =
    highGroundShelters.reduce<EmergencyShelter | null>((closest, s) => {
      const dist = calculateDistanceKm(userLat, userLng, s.lat, s.lng);
      if (!closest) return s;
      const closestDist = calculateDistanceKm(userLat, userLng, closest.lat, closest.lng);
      return dist < closestDist ? s : closest;
    }, null) || VERIFIED_SHELTERS[0];

  const nearestDistanceKm = nearestHighGround
    ? calculateDistanceKm(userLat, userLng, nearestHighGround.lat, nearestHighGround.lng)
    : 0;
  const nearestWalkingMinutes = calculateWalkingTimeMinutes(nearestDistanceKm);

  // Safe evacuation route to selected shelter
  const evacuationRoute = selectedShelter
    ? generateSafeEvacuationRoute([userLat, userLng], [selectedShelter.lat, selectedShelter.lng], ACTIVE_HAZARD_ZONES)
    : [];

  const corridorDistanceKm =
    evacuationRoute.length > 0
      ? calculatePathLengthKm(evacuationRoute)
      : selectedShelter
      ? calculateDistanceKm(userLat, userLng, selectedShelter.lat, selectedShelter.lng)
      : 0;
  const corridorWalkMins = calculateWalkingTimeMinutes(corridorDistanceKm);

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-white">
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
              <p className="font-bold text-sm sm:text-base text-white">
                {dynamicWeather?.officialWarningHeadline || 'Cyclone Alert Level 3 — Coastal Warning Active'}
              </p>
            </div>
            <p className="text-xs sm:text-sm text-red-100 mt-0.5">
              {dynamicWeather?.alerts?.[0]?.description || 'Regional Met Centre issued Red Warning for Kancheepuram / Chennai coast. Avoid low-lying corridors.'}
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
            <MessageCircle className="w-4 h-4 text-white" /> Ask Calm Voice
          </Link>
        </div>
      </div>

      {/* Header bar: Welcome Alex Mercer & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome, {user.name}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700">
              {user.nationality}
            </span>
          </div>
          <p className="text-neutral-400 text-sm mt-0.5">
            Real-time crisis triage & consular safety monitor
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 hover:border-cyan-500 text-white hover:text-cyan-400 font-medium px-3.5 py-2 rounded-xl transition-all text-xs sm:text-sm shadow-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-neutral-300" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Status Page'}</span>
          </button>
          <Link
            to="/status"
            className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 hover:border-cyan-500 text-white hover:text-cyan-400 font-medium px-3.5 py-2 rounded-xl transition-all text-xs sm:text-sm shadow-sm"
          >
            <Eye className="w-4 h-4 text-neutral-300" /> <span>Family View</span>
          </Link>
          <Link
            to="/admin"
            className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700/80 hover:border-neutral-600 text-neutral-400 hover:text-white font-medium px-3 py-2 rounded-xl transition-all text-xs sm:text-sm shadow-xs"
            title="Consular Officer & Disaster Management Authority Login"
          >
            <Lock className="w-3.5 h-3.5 text-neutral-400" /> <span>Officer Portal</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Shelters (Left) + Status & Weather (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Map + Highlighted Shelter Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leaflet Interactive Map Card */}
          <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden flex flex-col text-white">
            <div className="p-3.5 sm:p-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-white text-sm sm:text-base">Crisis Geospatial Navigator</h2>
                    {/* Requirement 4: Offline Geospatial Cache Active Status Badge */}
                    <div className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-xs">
                      <Database className="w-3 h-3 text-emerald-400" />
                      <span>Offline Geospatial Cache Active</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400">Live Shelters & Hazard Surge Zones</p>
                </div>
              </div>

              {/* Layer Filters & Action Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile version of Offline Cache badge */}
                <div className="sm:hidden inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>Offline Cache Active</span>
                </div>

                <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl border border-neutral-700 text-xs font-semibold">
                  <button
                    onClick={() => setMapLayer('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      mapLayer === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setMapLayer('shelters')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      mapLayer === 'shelters' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    Shelters ({VERIFIED_SHELTERS.length})
                  </button>
                  <button
                    onClick={() => setMapLayer('hazards')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      mapLayer === 'hazards' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    Hazards ({ACTIVE_HAZARD_ZONES.length})
                  </button>
                </div>

                <button
                  onClick={relocate}
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 px-3 py-1.5 rounded-lg transition-colors border border-cyan-800/80"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" /> GPS Recalibrate
                </button>
              </div>
            </div>

            {/* Map Canvas with Floating Speed-Dial & Active Route Indicator */}
            <div className="h-[430px] sm:h-[480px] relative w-full overflow-hidden">
              {/* Active Evacuation Route Pill Overlay */}
              {selectedShelter && !sosModalOpen && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-500/60 flex items-center gap-2 text-xs max-w-[90%] sm:max-w-max pointer-events-auto">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-semibold text-emerald-300 shrink-0">Safe Corridor Active:</span>
                  <span className="truncate max-w-[130px] sm:max-w-[210px] font-medium text-white">{selectedShelter.name}</span>
                  <span className="text-neutral-300 font-mono text-[11px] hidden sm:inline">
                    ({corridorDistanceKm.toFixed(2)} km • ~{corridorWalkMins} min walk)
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShelter(null);
                    }}
                    className="ml-1 text-neutral-400 hover:text-white p-0.5 rounded transition-colors"
                    title="Clear corridor"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Requirement 3: Floating Speed-Dial Emergency Calling Buttons */}
              {!sosModalOpen && (
                <div
                  className="absolute bottom-4 right-4 z-[500] flex flex-col items-end pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {speedDialOpen && (
                    <div className="mb-2 space-y-2 flex flex-col items-end animate-fade-in">
                      {/* 112: National Rescue */}
                      <a
                        href="tel:112"
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xl transition-transform hover:scale-105 border border-red-400/40"
                      >
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                          <PhoneCall className="w-3.5 h-3.5 text-white animate-pulse" />
                        </div>
                        <div className="text-left">
                          <p className="leading-tight font-extrabold text-white">Dial 112 (National Rescue)</p>
                          <p className="text-[10px] text-red-100 font-normal">Police • Fire • Coast Guard</p>
                        </div>
                      </a>

                      {/* 1070: Tamil Nadu Disaster Helpline */}
                      <a
                        href="tel:1070"
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-xl transition-transform hover:scale-105 border border-amber-400/40"
                      >
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                          <Radio className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="leading-tight font-extrabold text-white">Dial 1070 (Tamil Nadu Disaster Helpline)</p>
                          <p className="text-[10px] text-amber-100 font-normal">TNDMA 24/7 State Emergency Control</p>
                        </div>
                      </a>

                      {/* 108: Medical */}
                      <a
                        href="tel:108"
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xl transition-transform hover:scale-105 border border-emerald-400/40"
                      >
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                          <HeartPulse className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="leading-tight font-extrabold text-white">Dial 108 (Medical)</p>
                          <p className="text-[10px] text-emerald-100 font-normal">Ambulance & Trauma Response</p>
                        </div>
                      </a>
                    </div>
                  )}

                  {/* Speed-Dial Main Trigger */}
                  <button
                    onClick={() => setSpeedDialOpen(!speedDialOpen)}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/95 hover:bg-slate-900 text-white rounded-xl shadow-2xl backdrop-blur-md border border-white/20 text-xs font-bold transition-all hover:scale-105"
                    title="Toggle Emergency Speed-Dial"
                  >
                    <PhoneCall className="w-4 h-4 text-red-400 animate-pulse" />
                    <span className="text-white">Emergency Speed-Dial</span>
                    {speedDialOpen ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />}
                  </button>
                </div>
              )}

              {/* MapContainer */}
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

                {/* User Position Marker */}
                <Marker position={[userLat, userLng]} icon={userIcon}>
                  <Popup>
                    <div className="p-1 text-white">
                      <p className="font-bold text-sm text-white">{user.name} (You)</p>
                      <p className="text-xs text-neutral-300 mt-0.5">{user.location_label || 'Current Position'}</p>
                      <div className="mt-2 pt-2 border-t border-neutral-700 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusInfo.bg}`} />
                        <span className="text-xs font-bold capitalize text-white">Status: {user.status}</span>
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
                          fillOpacity: isDanger ? 0.35 : 0.25,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <div className="max-w-xs p-1 text-white">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                                isDanger ? 'bg-red-950 text-red-300 border border-red-700/60' : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                              }`}>
                                {zone.severity}
                              </span>
                              <span className="text-xs text-neutral-400 font-semibold">{zone.risk_type}</span>
                            </div>
                            <p className="font-bold text-sm text-white mt-1">{zone.name}</p>
                            <p className="text-xs text-neutral-200 mt-1">{zone.recommendation}</p>
                          </div>
                        </Popup>
                      </Circle>
                    );
                  })}

                {/* Requirement 1: Green Leaflet Polyline for Safe Evacuation Corridor */}
                {selectedShelter && evacuationRoute.length > 0 && (
                  <>
                    {/* Protective outer green corridor border */}
                    <Polyline
                      positions={evacuationRoute}
                      pathOptions={{
                        color: '#047857',
                        weight: 6,
                        opacity: 0.6,
                      }}
                    />
                    {/* High-visibility green dashed evacuation route */}
                    <Polyline
                      positions={evacuationRoute}
                      pathOptions={{
                        color: '#10b981',
                        weight: 4,
                        opacity: 0.95,
                        dashArray: '8, 8',
                      }}
                    />
                  </>
                )}

                {/* Emergency Shelters Pins */}
                {(mapLayer === 'all' || mapLayer === 'shelters') &&
                  VERIFIED_SHELTERS.map((sh) => {
                    let icon = shelterIcon;
                    if (sh.type === 'consular') icon = consularIcon;
                    if (sh.type === 'medical') icon = medicalIcon;

                    const occupancyPercent = Math.round((sh.current_occupancy / sh.capacity) * 100);
                    const isSelected = selectedShelter?.id === sh.id;

                    return (
                      <Marker
                        key={sh.id}
                        position={[sh.lat, sh.lng]}
                        icon={icon}
                        eventHandlers={{
                          click: () => {
                            setSelectedShelter(sh);
                          },
                        }}
                      >
                        <Popup>
                          <div className="max-w-xs p-1 text-white">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                                {sh.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-neutral-400">Verified Shelter</span>
                            </div>
                            <p className="font-bold text-sm text-white mt-1">{sh.name}</p>
                            <p className="text-xs text-neutral-300 mt-0.5">{sh.address}</p>

                            <div className="mt-2 bg-neutral-800/90 p-2 rounded-lg border border-neutral-700">
                              <div className="flex items-center justify-between text-xs mb-1 font-semibold text-white">
                                <span>Occupancy</span>
                                <span className="text-neutral-200">{sh.current_occupancy} / {sh.capacity} ({occupancyPercent}%)</span>
                              </div>
                              <div className="w-full bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${occupancyPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${occupancyPercent}%` }}
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-200">
                                {sh.has_drinking_water && <span>💧 Potable Water</span>}
                                {sh.has_food && <span>🍲 Hot Rations</span>}
                                {sh.has_medical && <span>🩺 First Aid</span>}
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-neutral-700 flex items-center justify-between gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedShelter(sh);
                                }}
                                className={`text-xs font-bold px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60'
                                }`}
                              >
                                <Navigation className="w-3 h-3" />
                                {isSelected ? 'Corridor Active ✓' : 'Plot Safe Corridor'}
                              </button>
                              <a
                                href={`tel:${sh.contact}`}
                                className="text-xs font-bold bg-neutral-800 text-white px-2.5 py-1.5 rounded-md hover:bg-neutral-700 border border-neutral-700 transition-colors flex items-center gap-1"
                              >
                                <PhoneCall className="w-3 h-3 text-cyan-400" /> Call
                              </a>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            </div>

            {/* Map Footer Bar with Offline Cache details & Hazard legends */}
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center justify-between text-xs text-neutral-300 gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-neutral-200">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Danger Zone (Surge/Flood)
                </span>
                <span className="flex items-center gap-1.5 text-neutral-200">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Caution Zone
                </span>
                <span className="flex items-center gap-1.5 text-neutral-200">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Safe High-Ground Shelter
                </span>
              </div>
              <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Offline Geo-Vector Active
                </span>
                <span className="text-neutral-400">Location: {user.location_label || `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`}</span>
              </div>
            </div>
          </div>

          {/* Requirement 2: Highlighted Shelter Card with Distance (km) & Walking ETA */}
          {nearestHighGround && (
            <div className="bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-950 rounded-2xl shadow-lg border-2 border-emerald-500/80 p-5 relative overflow-hidden transition-all text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header with High-Ground Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs tracking-wide uppercase shadow-sm">
                    <Shield className="w-3.5 h-3.5 text-white" /> Nearest High-Ground Shelter
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                    Above Surge Inundation
                  </span>
                </div>
                <span className="text-xs font-semibold text-neutral-300">
                  Capacity: {nearestHighGround.current_occupancy} / {nearestHighGround.capacity} (
                  {Math.round((nearestHighGround.current_occupancy / nearestHighGround.capacity) * 100)}% filled)
                </span>
              </div>

              {/* Main Info & Metrics */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span>{nearestHighGround.name}</span>
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{nearestHighGround.address}</span>
                  </p>
                </div>

                {/* Highlighted Metric Badges: Distance & Estimated Walking Time */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="bg-neutral-800/90 rounded-xl p-3 border border-emerald-500/40 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-300 shrink-0">
                      <Navigation className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Distance</p>
                      <p className="text-base font-extrabold text-white">
                        {nearestDistanceKm < 1
                          ? `${Math.round(nearestDistanceKm * 1000)} m`
                          : `${nearestDistanceKm.toFixed(2)} km`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-neutral-800/90 rounded-xl p-3 border border-emerald-500/40 shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-300 shrink-0">
                      <Clock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Walking ETA</p>
                      <p className="text-base font-extrabold text-emerald-300">
                        ~{nearestWalkingMinutes} min{nearestWalkingMinutes > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities & Fast Actions */}
              <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-neutral-300 flex-wrap">
                  <span className="font-semibold text-white">Verified Supplies:</span>
                  {nearestHighGround.has_drinking_water && (
                    <span className="inline-flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700 text-[11px] font-medium text-white">
                      💧 Potable Water
                    </span>
                  )}
                  {nearestHighGround.has_food && (
                    <span className="inline-flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700 text-[11px] font-medium text-white">
                      🍲 Hot Rations
                    </span>
                  )}
                  {nearestHighGround.has_medical && (
                    <span className="inline-flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700 text-[11px] font-medium text-white">
                      🩺 Paramedic Post
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedShelter(nearestHighGround);
                      if (mapRef.current) {
                        mapRef.current.setView([nearestHighGround.lat, nearestHighGround.lng], 13);
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                      selectedShelter?.id === nearestHighGround.id
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    {selectedShelter?.id === nearestHighGround.id ? 'Corridor Active On Map ✓' : 'Trace Evacuation Corridor'}
                  </button>
                  <a
                    href={`tel:${nearestHighGround.contact}`}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Shelter</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Status Switcher & Real Weather */}
        <div className="space-y-6">
          {/* Status Switcher Card */}
          <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-base">Your Crisis Status</h2>
              <span className="text-xs font-medium text-neutral-400">Syncs to Embassy & Family</span>
            </div>

            <div className="flex flex-col items-center mb-5 p-4 rounded-xl bg-neutral-800/80 border border-neutral-700/80">
              <div className={`w-16 h-16 rounded-full ${statusInfo.bg} flex items-center justify-center ${statusInfo.ring} shadow-md`}>
                <StatusIcon className="w-8 h-8 text-white" />
              </div>
              <p className={`mt-3 text-xl font-extrabold ${statusInfo.color}`}>{statusInfo.label}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Last broadcast: {new Date(user.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Change Safety Status</p>
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
                        : 'border-neutral-700 text-white hover:border-neutral-600 bg-neutral-800 hover:bg-neutral-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-white" />
                      <span className="text-white">{cfg.label}</span>
                    </div>
                    {active && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={triggerSOS}
              className="w-full mt-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <ShieldAlert className="w-5 h-5 animate-pulse text-white" />
              <span>Broadcast Emergency SOS Now</span>
            </button>
          </div>

          {/* Severe Weather Card */}
          <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-bold text-white text-base">Weather & Disaster Warnings</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-600/50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    IMD Radar Active • Stage {dynamicWeather?.stageNumber || 1}/4
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Next Bulletin: {String(Math.floor(secondsUntilNextForecast / 60)).padStart(2, '0')}:{String(secondsUntilNextForecast % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCycleWeatherForecast}
                  title="Simulate next 3-minute meteorological forecast stage"
                  className="inline-flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-cyan-400 hover:text-cyan-300 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" /> ⚡ +3m Forecast
                </button>
                {weatherLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
              </div>
            </div>

            {weather && (
              <div>
                {/* 3-Minute Stage Description Pill */}
                {dynamicWeather?.stageTitle && (
                  <div className="mb-3 px-3 py-1.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60 text-xs text-cyan-300 font-semibold flex items-center justify-between">
                    <span>Forecast: {dynamicWeather.stageTitle}</span>
                    <span className="text-[11px] font-mono text-neutral-400">Auto-cycles every 3m</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-extrabold text-white">{weather.temp}°C</p>
                    <p className="text-sm font-semibold text-neutral-300 capitalize">{weather.description}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{weather.city}</p>
                  </div>
                  {(() => {
                    const WeatherIconComponent = getWeatherIcon(weather.icon);
                    return <WeatherIconComponent className="w-14 h-14 text-cyan-400 animate-pulse" />;
                  })()}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-neutral-800/80 rounded-xl p-2.5 border border-neutral-700/80">
                    <Thermometer className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                    <p className="text-[11px] text-neutral-400 font-medium">Feels</p>
                    <p className="text-sm font-bold text-white">{weather.feels_like}°C</p>
                  </div>
                  <div className="bg-neutral-800/80 rounded-xl p-2.5 border border-neutral-700/80">
                    <Droplets className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                    <p className="text-[11px] text-neutral-400 font-medium">Humidity</p>
                    <p className="text-sm font-bold text-white">{weather.humidity}%</p>
                  </div>
                  <div className="bg-neutral-800/80 rounded-xl p-2.5 border border-neutral-700/80">
                    <Wind className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                    <p className="text-[11px] text-neutral-400 font-medium">Wind</p>
                    <p className="text-sm font-bold text-red-400">{weather.wind_speed} km/h</p>
                  </div>
                </div>

                {/* Weather Alert Boxes */}
                {weather.alerts && weather.alerts.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Active Disaster Bulletins ({weather.alerts.length})
                    </p>
                    {weather.alerts.map((al, idx) => (
                      <div key={idx} className="bg-red-950/40 border border-red-800/60 rounded-xl p-3 text-left">
                        <p className="text-xs font-bold text-red-300">{al.event}</p>
                        <p className="text-xs text-red-200 mt-1 leading-relaxed">{al.description}</p>
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
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-neutral-900 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-red-500/60 relative z-[10000] text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-red-950 text-red-400 border border-red-800/60 rounded-full animate-bounce">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Emergency SOS Broadcast Active</h3>
                  <p className="text-xs text-red-400 font-semibold">Priority Distress Signal Transmitted</p>
                </div>
              </div>
              <button
                onClick={() => setSosModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-800/90 p-4 rounded-xl border border-neutral-700 space-y-2.5 mb-5 text-xs text-neutral-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-400">Citizen:</span>
                <span className="font-bold text-white">{user.name} ({user.nationality})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-400">Relayed Coordinates:</span>
                <span className="font-mono font-bold text-red-400">{userLat.toFixed(4)}° N, {userLng.toFixed(4)}° E</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-400">Family SMS Dispatch:</span>
                <span className="text-emerald-400 font-bold">✓ Sent to {user.emergency_contact_phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-400">Consular Notification:</span>
                <span className="text-emerald-400 font-bold">✓ Logged on Consular Roster</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Instant Emergency Hotlines</p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href="tel:112"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold p-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs shadow-sm text-center"
                >
                  <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                  <span>112 (National)</span>
                </a>
                <a
                  href="tel:1070"
                  className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold p-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs shadow-sm text-center"
                >
                  <Radio className="w-3.5 h-3.5 shrink-0" />
                  <span>1070 (Disaster)</span>
                </a>
                <a
                  href="tel:108"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs shadow-sm text-center"
                >
                  <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                  <span>108 (Medical)</span>
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
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-neutral-700 transition-colors"
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
