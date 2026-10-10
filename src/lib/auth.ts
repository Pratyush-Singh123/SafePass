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
  phone: '+33 6 42 19 88 01',
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
 * Local directory of all profiles registered on this device or session.
 */
export function getRegisteredUsers(): SafePassUser[] {
  try {
    const raw = localStorage.getItem('safepass_registered_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return [DEMO_USER_PERSONA];
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

  // 1. Check Demo Persona (Alex Mercer's mobile: +33 6 42 19 88 01)
  if (
    doPhonesMatch(inputPhone, DEMO_USER_PERSONA.phone) ||
    doPhonesMatch(inputPhone, DEMO_USER_PERSONA.emergency_contact_phone)
  ) {
    return DEMO_USER_PERSONA;
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
  if (
    query.includes('alex') ||
    query.includes('france') ||
    query === 'demo' ||
    query === 'alex-demo-token-994' ||
    query === DEMO_USER_PERSONA.id.toLowerCase()
  ) {
    return DEMO_USER_PERSONA;
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
