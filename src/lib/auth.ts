import { supabase } from '@/lib/supabase';
import type { SafePassUser, SafetyStatus } from '@/lib/types';
import { getLanguageForCountry } from '@/lib/crisisData';

export interface LocationSnapshot {
  lat: number;
  lng: number;
  label: string;
  updatedAt: string;
}

const DEFAULT_CRISIS_LOCATION: LocationSnapshot = {
  lat: 12.6269,
  lng: 80.1932,
  label: 'Mahabalipuram Coastal Zone, Kancheepuram Dist., Tamil Nadu',
  updatedAt: new Date().toISOString(),
};

// Demo user persona for realistic zero-network presentations
export const DEMO_USER_PERSONA: SafePassUser = {
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
  created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Checks whether an active persistent session exists on this device.
 * Sessions NEVER expire automatically — they persist until intentional logout.
 */
export function isLoggedIn(): boolean {
  return !!localStorage.getItem('safepass_session');
}

/**
 * Retrieves the currently logged-in user profile from local storage or cached session.
 */
export function getCurrentUser(): SafePassUser | null {
  try {
    const profileStr = localStorage.getItem('safepass_user_profile');
    if (profileStr) {
      return JSON.parse(profileStr);
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Activates an indefinite session for a user profile.
 */
export function createSession(user: SafePassUser): void {
  localStorage.setItem('safepass_session', 'active');
  localStorage.setItem('safepass_user_id', user.id);
  localStorage.setItem('safepass_share_token', user.share_token);
  localStorage.setItem('safepass_user_profile', JSON.stringify(user));
  localStorage.setItem('safepass_demo_status', user.status);

  // Auto-detect country language
  const defaultLang = getLanguageForCountry(user.nationality);
  if (!localStorage.getItem('safepass_selected_language')) {
    localStorage.setItem('safepass_selected_language', defaultLang);
  }

  // Update last recorded location if coordinates are available
  if (user.location_lat && user.location_lng) {
    saveLastLocation(user.location_lat, user.location_lng, user.location_label || 'Mahabalipuram Coastal Zone');
  }
}

/**
 * Intentional user logout.
 * Clears authentication session, but PRESERVES last recorded location
 * so that emergency SOS helplines still know where the device is located.
 */
export function logoutUser(): void {
  localStorage.removeItem('safepass_session');
  localStorage.removeItem('safepass_user_id');
  localStorage.removeItem('safepass_share_token');
  localStorage.removeItem('safepass_user_profile');
  localStorage.removeItem('safepass_chat_history');
  // NOTE: safepass_last_location is purposely NOT deleted for emergency safety
}

/**
 * Saves last known GPS coordinates to device memory.
 */
export function saveLastLocation(lat: number, lng: number, label: string): void {
  const snapshot: LocationSnapshot = {
    lat,
    lng,
    label,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem('safepass_last_location', JSON.stringify(snapshot));
  } catch {
    // quota fallback
  }
}

/**
 * Retrieves the last recorded location, falling back to current disaster zone coordinates.
 */
export function getLastLocation(): LocationSnapshot {
  try {
    const raw = localStorage.getItem('safepass_last_location');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.lat && parsed.lng) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_CRISIS_LOCATION;
}

/**
 * Logs in with any identifier:
 * 1. SafePass Share Token (e.g. alex-demo-token-994 or UUID)
 * 2. Full Name (e.g. Alex Mercer, Pratyush)
 * 3. Emergency Contact Phone Number
 */
export async function loginWithIdentifier(identifier: string): Promise<{ success: boolean; user?: SafePassUser; error?: string }> {
  const query = identifier.trim();
  if (!query) {
    return { success: false, error: 'Please enter your name, phone number, or SafePass token.' };
  }

  // Check demo persona shortcut
  if (
    query.toLowerCase().includes('alex') ||
    query.toLowerCase().includes('france') ||
    query.toLowerCase() === 'demo' ||
    query === 'alex-demo-token-994'
  ) {
    createSession(DEMO_USER_PERSONA);
    return { success: true, user: DEMO_USER_PERSONA };
  }

  // Check locally saved user profile from previous registration
  const savedProfile = getCurrentUser();
  if (
    savedProfile &&
    (savedProfile.name.toLowerCase().includes(query.toLowerCase()) ||
      savedProfile.share_token.toLowerCase() === query.toLowerCase() ||
      savedProfile.emergency_contact_phone.includes(query))
  ) {
    createSession(savedProfile);
    return { success: true, user: savedProfile };
  }

  // Query Cloud Database (Supabase users table)
  try {
    // 1. Try share_token match
    const { data: tokenMatch } = await supabase
      .from('users')
      .select('*')
      .eq('share_token', query)
      .maybeSingle();

    if (tokenMatch) {
      const user = tokenMatch as SafePassUser;
      createSession(user);
      return { success: true, user };
    }

    // 2. Try name or phone match
    const { data: nameMatch } = await supabase
      .from('users')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(1);

    if (nameMatch && nameMatch.length > 0) {
      const user = nameMatch[0] as SafePassUser;
      createSession(user);
      return { success: true, user };
    }

    const { data: phoneMatch } = await supabase
      .from('users')
      .select('*')
      .ilike('emergency_contact_phone', `%${query}%`)
      .limit(1);

    if (phoneMatch && phoneMatch.length > 0) {
      const user = phoneMatch[0] as SafePassUser;
      createSession(user);
      return { success: true, user };
    }
  } catch {
    // offline
  }

  // If no match found online or locally, create a resilient guest session with the name provided
  const guestUser: SafePassUser = {
    id: 'user-' + Math.random().toString(36).substring(2, 9),
    name: query,
    nationality: 'India',
    location_lat: DEFAULT_CRISIS_LOCATION.lat,
    location_lng: DEFAULT_CRISIS_LOCATION.lng,
    location_label: DEFAULT_CRISIS_LOCATION.label,
    emergency_contact_name: 'Emergency Services Desk',
    emergency_contact_phone: '112',
    status: 'caution',
    share_token: 'token-' + Math.random().toString(36).substring(2, 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  createSession(guestUser);
  return { success: true, user: guestUser };
}
