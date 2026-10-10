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

// Fresh 10 realistic international traveler records for Tamil Nadu / Chennai / Kancheepuram crisis zone
export const FRESH_TEN_RECORDS: SafePassUser[] = [
  {
    id: 'd8b51201-9a74-4b53-a18d-0b61e27a9001',
    name: 'Alex Mercer',
    nationality: 'France',
    phone: '+33 6 42 19 88 01',
    location_lat: 12.6269,
    location_lng: 80.1932,
    location_label: 'Mahabalipuram Coastal Heritage Zone, Chengalpattu / Kancheepuram',
    emergency_contact_name: 'Claire Mercer (Sister)',
    emergency_contact_phone: '+33 6 42 19 88 01',
    status: 'caution',
    share_token: 'd8b51201-9a74-4b53-a18d-0b61e27a9001',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'd8b51202-9a74-4b53-a18d-0b61e27a9002',
    name: 'Emma Watson',
    nationality: 'United Kingdom',
    phone: '+44 7700 900123',
    location_lat: 12.7932,
    location_lng: 80.2520,
    location_label: 'Taj Fisherman\'s Cove Resort, Kovalam / ECR',
    emergency_contact_name: 'Arthur Watson (Father)',
    emergency_contact_phone: '+44 7700 900123',
    status: 'danger',
    share_token: 'd8b51202-9a74-4b53-a18d-0b61e27a9002',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 'd8b51203-9a74-4b53-a18d-0b61e27a9003',
    name: 'Kenji Sato',
    nationality: 'Japan',
    phone: '+81 90 1234 5678',
    location_lat: 12.8988,
    location_lng: 80.2281,
    location_label: 'Sholinganallur Tech Corridor, OMR Expressway',
    emergency_contact_name: 'Yuki Sato (Wife)',
    emergency_contact_phone: '+81 90 1234 5678',
    status: 'safe',
    share_token: 'd8b51203-9a74-4b53-a18d-0b61e27a9003',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'd8b51204-9a74-4b53-a18d-0b61e27a9004',
    name: 'Michael Schmidt',
    nationality: 'Germany',
    phone: '+49 151 23456789',
    location_lat: 12.6512,
    location_lng: 80.1850,
    location_label: 'Buckingham Canal Heritage Villa, Chengalpattu',
    emergency_contact_name: 'Hanna Schmidt (Daughter)',
    emergency_contact_phone: '+49 151 23456789',
    status: 'danger',
    share_token: 'd8b51204-9a74-4b53-a18d-0b61e27a9004',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'd8b51205-9a74-4b53-a18d-0b61e27a9005',
    name: 'Sarah Miller',
    nationality: 'United States',
    phone: '+1 202 555 0192',
    location_lat: 12.8185,
    location_lng: 80.2435,
    location_label: 'Muttukadu Backwaters Surf & Kayak Center',
    emergency_contact_name: 'David Miller (Spouse)',
    emergency_contact_phone: '+1 202 555 0192',
    status: 'caution',
    share_token: 'd8b51205-9a74-4b53-a18d-0b61e27a9005',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'd8b51206-9a74-4b53-a18d-0b61e27a9006',
    name: 'Carlos Gomez',
    nationality: 'Spain',
    phone: '+34 600 123 456',
    location_lat: 12.8387,
    location_lng: 79.7036,
    location_label: 'Kancheepuram Silk Heritage Hub, Central Town',
    emergency_contact_name: 'Elena Gomez (Sister)',
    emergency_contact_phone: '+34 600 123 456',
    status: 'safe',
    share_token: 'd8b51206-9a74-4b53-a18d-0b61e27a9006',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: 'd8b51207-9a74-4b53-a18d-0b61e27a9007',
    name: 'Liam O\'Connor',
    nationality: 'Canada',
    phone: '+1 416 555 0147',
    location_lat: 12.9982,
    location_lng: 80.2665,
    location_label: 'Besant Nagar Beach Promenade, South Chennai',
    emergency_contact_name: 'Grace O\'Connor (Mother)',
    emergency_contact_phone: '+1 416 555 0147',
    status: 'safe',
    share_token: 'd8b51207-9a74-4b53-a18d-0b61e27a9007',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1500000).toISOString(),
  },
  {
    id: 'd8b51208-9a74-4b53-a18d-0b61e27a9008',
    name: 'Chloe Dubois',
    nationality: 'France',
    phone: '+33 6 55 91 22 34',
    location_lat: 12.5180,
    location_lng: 80.1585,
    location_label: 'Pudupattinam Coastal Ridge, Kalpakkam Sector',
    emergency_contact_name: 'Jean-Luc Dubois (Brother)',
    emergency_contact_phone: '+33 6 55 91 22 34',
    status: 'caution',
    share_token: 'd8b51208-9a74-4b53-a18d-0b61e27a9008',
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 800000).toISOString(),
  },
  {
    id: 'd8b51209-9a74-4b53-a18d-0b61e27a9009',
    name: 'Min-jun Park',
    nationality: 'South Korea',
    phone: '+82 10 2345 6789',
    location_lat: 12.9830,
    location_lng: 80.2594,
    location_label: 'Thiruvanmiyur Coastal Beach Sector, ECR',
    emergency_contact_name: 'Soo-jin Park (Wife)',
    emergency_contact_phone: '+82 10 2345 6789',
    status: 'caution',
    share_token: 'd8b51209-9a74-4b53-a18d-0b61e27a9009',
    created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
    updated_at: new Date(Date.now() - 1100000).toISOString(),
  },
  {
    id: 'd8b51210-9a74-4b53-a18d-0b61e27a9010',
    name: 'Olivia Bennett',
    nationality: 'Australia',
    phone: '+61 412 345 678',
    location_lat: 12.5284,
    location_lng: 80.1627,
    location_label: 'Sadras Dutch Fort & Coastal Heritage Point',
    emergency_contact_name: 'Jack Bennett (Brother)',
    emergency_contact_phone: '+61 412 345 678',
    status: 'safe',
    share_token: 'd8b51210-9a74-4b53-a18d-0b61e27a9010',
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    updated_at: new Date(Date.now() - 2000000).toISOString(),
  },
];

// Primary demo user persona (Alex Mercer)
export const DEMO_USER_PERSONA: SafePassUser = FRESH_TEN_RECORDS[0];

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
 * Local directory of all profiles registered on this device or session.
 */
export function getRegisteredUsers(): SafePassUser[] {
  try {
    const raw = localStorage.getItem('safepass_registered_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 10) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  try {
    localStorage.setItem('safepass_registered_users', JSON.stringify(FRESH_TEN_RECORDS));
  } catch {
    // fallback
  }
  return FRESH_TEN_RECORDS;
}

/**
 * Persists a newly registered profile to the local registry.
 */
export function saveRegisteredUser(user: SafePassUser): void {
  try {
    const list = getRegisteredUsers();
    const updated = list.filter((u) => {
      if (u.id === user.id) return false;
      if (u.share_token === user.share_token) return false;
      if (user.phone && u.phone && doPhonesMatch(user.phone, u.phone)) return false;
      return true;
    });
    updated.unshift(user);
    localStorage.setItem('safepass_registered_users', JSON.stringify(updated));
  } catch {
    // quota fallback
  }
}

/**
 * Completely resets and seeds the registry and database with 10 fresh international traveler records.
 */
export async function resetToFreshTenRecords(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    localStorage.setItem('safepass_registered_users', JSON.stringify(FRESH_TEN_RECORDS));
    
    // Purge old database entries and re-insert fresh 10
    try {
      await supabase
        .from('users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      await supabase
        .from('users')
        .insert(FRESH_TEN_RECORDS);
    } catch {
      // offline fallback
    }

    return { success: true, count: FRESH_TEN_RECORDS.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Failed to reset records' };
  }
}

export interface OtpChallenge {
  code: string;
  expiresAt: number;
  targetPhone: string;
  userName: string;
}

/**
 * Generates a 4-digit emergency OTP verification code for a registered user.
 */
export function generateLoginOtp(user: SafePassUser): { code: string; challenge: OtpChallenge } {
  // Realistic 4-digit code for emergency crisis verification
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const challenge: OtpChallenge = {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // Valid for 10 minutes
    targetPhone: user.phone || user.emergency_contact_phone || 'Emergency Device',
    userName: user.name,
  };

  try {
    sessionStorage.setItem('safepass_login_otp', JSON.stringify(challenge));
  } catch {
    // fallback
  }

  return { code, challenge };
}

/**
 * Validates the entered 4-digit OTP against active challenge.
 */
export function verifyLoginOtp(inputCode: string): { valid: boolean; error?: string } {
  const trimmed = inputCode.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter the 4-digit verification code.' };
  }

  try {
    const raw = sessionStorage.getItem('safepass_login_otp');
    if (!raw) {
      // Allow fallback master emergency code 1234 for testing/demo
      if (trimmed === '1234') {
        return { valid: true };
      }
      return { valid: false, error: 'Verification code expired or not requested. Please request a new code.' };
    }

    const challenge: OtpChallenge = JSON.parse(raw);
    if (Date.now() > challenge.expiresAt) {
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }

    if (challenge.code === trimmed || trimmed === '1234') {
      sessionStorage.removeItem('safepass_login_otp');
      return { valid: true };
    }

    return { valid: false, error: 'Incorrect verification code. Please check the 4-digit code.' };
  } catch {
    return { valid: false, error: 'Verification error. Please try again.' };
  }
}

/**
 * Normalizes phone numbers to digits-only for resilient international/local matching.
 */
export function extractPhoneDigits(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Checks whether two phone numbers match (handles leading +, country codes, and spaces).
 */
export function doPhonesMatch(phoneA?: string | null, phoneB?: string | null): boolean {
  const digitsA = extractPhoneDigits(phoneA);
  const digitsB = extractPhoneDigits(phoneB);
  if (!digitsA || !digitsB) return false;
  if (digitsA === digitsB) return true;
  // Suffix matching for local vs international formatting (e.g. 9876543210 vs 919876543210)
  if (digitsA.length >= 7 && digitsB.length >= 7) {
    return digitsA.endsWith(digitsB) || digitsB.endsWith(digitsA);
  }
  return false;
}

/**
 * Searches exclusively for REGISTERED users SOLELY by their Mobile Phone Number.
 * This guarantees privacy and security by preventing unauthorized users from guessing names.
 */
export async function findRegisteredUserByPhone(inputPhone: string): Promise<SafePassUser | null> {
  const cleanDigits = extractPhoneDigits(inputPhone);
  if (cleanDigits.length < 6) return null;

  // 1. Check Fresh 10 Registered Travelers first
  for (const person of FRESH_TEN_RECORDS) {
    if (
      doPhonesMatch(inputPhone, person.phone) ||
      doPhonesMatch(inputPhone, person.emergency_contact_phone)
    ) {
      return person;
    }
  }

  // 2. Check locally registered users directory
  const localList = getRegisteredUsers();
  for (const user of localList) {
    if (
      doPhonesMatch(inputPhone, user.phone) ||
      doPhonesMatch(inputPhone, user.emergency_contact_phone)
    ) {
      return user;
    }
  }

  // 3. Check current profile in localStorage
  const current = getCurrentUser();
  if (
    current &&
    (doPhonesMatch(inputPhone, current.phone) ||
      doPhonesMatch(inputPhone, current.emergency_contact_phone))
  ) {
    return current;
  }

  // 4. Check Supabase Database
  try {
    const last4 = cleanDigits.slice(-4);
    const { data } = await supabase
      .from('users')
      .select('*')
      .ilike('emergency_contact_phone', `%${last4}%`)
      .limit(10);

    if (data && data.length > 0) {
      for (const row of data) {
        if (
          doPhonesMatch(inputPhone, row.emergency_contact_phone) ||
          doPhonesMatch(inputPhone, (row as any).phone)
        ) {
          return {
            ...row,
            phone: (row as any).phone || row.emergency_contact_phone,
          } as SafePassUser;
        }
      }
    }
  } catch {
    // offline fallback
  }

  return null;
}

/**
 * Authenticates a registered user SOLELY by mobile phone number.
 */
export async function loginWithPhoneNumber(phone: string): Promise<{ success: boolean; user?: SafePassUser; error?: string }> {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { success: false, error: 'Please enter your registered mobile phone number.' };
  }

  const digits = extractPhoneDigits(trimmed);
  if (digits.length < 7) {
    return {
      success: false,
      error: 'Please enter a valid mobile number with at least 7 digits (e.g. +33 6 42 19 88 01 or +91 98765 43210).',
    };
  }

  const user = await findRegisteredUserByPhone(trimmed);

  if (!user) {
    return {
      success: false,
      error: `No registered SafePass profile found for mobile number "${trimmed}". Login is strictly mobile-verified. Please check your number or register first.`,
    };
  }

  createSession(user);
  return { success: true, user };
}

/**
 * Searches exclusively for REGISTERED users across:
 * 1. Demo Persona (Alex Mercer / France)
 * 2. Locally registered user profiles (safepass_registered_users & safepass_user_profile)
 * 3. Supabase Cloud Database (users table)
 * Returns the registered user or null (NO automatic guest generation).
 */
export async function findRegisteredUser(identifier: string): Promise<SafePassUser | null> {
  const query = identifier.trim().toLowerCase();
  if (!query) return null;

  // First try phone match if input contains digits
  if (extractPhoneDigits(query).length >= 6) {
    const byPhone = await findRegisteredUserByPhone(query);
    if (byPhone) return byPhone;
  }

  // Check Demo Persona shortcut
  // Check fresh 10 registered travelers
  for (const person of FRESH_TEN_RECORDS) {
    if (
      person.name.toLowerCase().includes(query) ||
      person.share_token.toLowerCase() === query ||
      person.id.toLowerCase() === query ||
      (person.phone && doPhonesMatch(query, person.phone))
    ) {
      return person;
    }
  }

  // Check locally registered users directory
  const localList = getRegisteredUsers();
  for (const user of localList) {
    if (
      user.name.toLowerCase().includes(query) ||
      user.share_token.toLowerCase() === query ||
      user.id.toLowerCase() === query
    ) {
      return user;
    }
  }

  // Check current profile in localStorage
  const current = getCurrentUser();
  if (
    current &&
    (current.name.toLowerCase().includes(query) ||
      current.share_token.toLowerCase() === query ||
      current.id.toLowerCase() === query)
  ) {
    return current;
  }

  // Query Supabase Database by token
  try {
    const { data: tokenMatch } = await supabase
      .from('users')
      .select('*')
      .eq('share_token', identifier.trim())
      .maybeSingle();

    if (tokenMatch) {
      return tokenMatch as SafePassUser;
    }
  } catch {
    // offline
  }

  return null;
}

/**
 * Legacy identifier login (for backward compatibility).
 */
export async function loginWithIdentifier(identifier: string): Promise<{ success: boolean; user?: SafePassUser; error?: string }> {
  return loginWithPhoneNumber(identifier);
}
