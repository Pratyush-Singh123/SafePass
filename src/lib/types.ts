export type SafetyStatus = 'safe' | 'caution' | 'danger';

export interface SafePassUser {
  id: string;
  name: string;
  nationality: string;
  location_lat: number | null;
  location_lng: number | null;
  location_label: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  status: SafetyStatus;
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  city: string;
  humidity: number;
  wind_speed: number;
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  event: string;
  description: string;
  severity: string;
}
