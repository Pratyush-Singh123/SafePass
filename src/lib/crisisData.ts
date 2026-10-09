import type { WeatherData } from './types';

export interface EmergencyShelter {
  id: string;
  name: string;
  type: 'consular' | 'high_ground' | 'medical' | 'relief_camp';
  lat: number;
  lng: number;
  address: string;
  capacity: number;
  current_occupancy: number;
  has_medical: boolean;
  has_drinking_water: boolean;
  has_food: boolean;
  contact: string;
  distance_km?: number;
}

export interface HazardZone {
  id: string;
  name: string;
  severity: 'danger' | 'caution';
  center: [number, number];
  radius_meters: number;
  risk_type: string;
  recommendation: string;
}

export interface EmergencyContactInfo {
  agency: string;
  number: string;
  description: string;
  type: 'national' | 'state' | 'consular';
}

// Localized shelters around Chennai / Kancheepuram / Mahabalipuram coastal belt
export const VERIFIED_SHELTERS: EmergencyShelter[] = [
  {
    id: 'sh-1',
    name: 'Mahabalipuram High-Ground Cyclone Shelter',
    type: 'high_ground',
    lat: 12.6258,
    lng: 80.1912,
    address: 'Near Kovalam ECR Junction, Chengalpattu / Kancheepuram Dist.',
    capacity: 450,
    current_occupancy: 120,
    has_medical: true,
    has_drinking_water: true,
    has_food: true,
    contact: '+91 44 2744 2233',
  },
  {
    id: 'sh-2',
    name: 'Anna Community Relief & Disaster Center',
    type: 'relief_camp',
    lat: 12.6341,
    lng: 80.1785,
    address: 'Poonjeri Bypass Road, Mahabalipuram',
    capacity: 600,
    current_occupancy: 210,
    has_medical: true,
    has_drinking_water: true,
    has_food: true,
    contact: '+91 44 2744 3100',
  },
  {
    id: 'sh-3',
    name: 'International Tourist & Consular Safe Point',
    type: 'consular',
    lat: 12.8399,
    lng: 80.1558,
    address: 'OMR Tech Corridor / Consular Liaison Hub, Sholinganallur',
    capacity: 250,
    current_occupancy: 45,
    has_medical: true,
    has_drinking_water: true,
    has_food: true,
    contact: '+91 44 2811 7000',
  },
  {
    id: 'sh-4',
    name: 'Apollo Emergency Trauma & Disaster Ward',
    type: 'medical',
    lat: 12.7956,
    lng: 80.2185,
    address: 'ECR Kottivakkam & Perungudi Medical Wing',
    capacity: 150,
    current_occupancy: 80,
    has_medical: true,
    has_drinking_water: true,
    has_food: true,
    contact: '108 / +91 44 2829 0200',
  },
  {
    id: 'sh-5',
    name: 'Kancheepuram District Collectorate High-Ground Camp',
    type: 'high_ground',
    lat: 12.8387,
    lng: 79.7036,
    address: 'Collectorate Complex, Kancheepuram Central',
    capacity: 1200,
    current_occupancy: 380,
    has_medical: true,
    has_drinking_water: true,
    has_food: true,
    contact: '1077',
  },
];

// Active severe hazard zones (Inundations, coastal surge, breaches)
export const ACTIVE_HAZARD_ZONES: HazardZone[] = [
  {
    id: 'hz-1',
    name: 'Mahabalipuram Coastal Storm Surge Zone',
    severity: 'danger',
    center: [12.6185, 80.1989],
    radius_meters: 1800,
    risk_type: 'Severe Storm Surge & Tidal Flooding',
    recommendation: 'Immediate evacuation inland. Stay at least 1.5 km away from beach coastline.',
  },
  {
    id: 'hz-2',
    name: 'Buckingham Canal / ECR Low-Lying Breach',
    severity: 'danger',
    center: [12.6512, 80.185],
    radius_meters: 1400,
    risk_type: 'Flash Flood & Road Cutoff',
    recommendation: 'Road submerged under 3.5 ft water. East Coast Road north passage impassable.',
  },
  {
    id: 'hz-3',
    name: 'Kovalam Estuary & Backwaters Alert Area',
    severity: 'caution',
    center: [12.788, 80.246],
    radius_meters: 2200,
    risk_type: 'Rising Water Levels & Heavy Currents',
    recommendation: 'Exercise extreme caution. Do not cross bridges or causeways on foot or bike.',
  },
  {
    id: 'hz-4',
    name: 'Tambaram / Adyar Basin Tributary Overflow',
    severity: 'caution',
    center: [12.9249, 80.100],
    radius_meters: 2500,
    risk_type: 'Waterlogging & Traffic Gridlock',
    recommendation: 'Avoid underpasses and low-lying ground level residential lanes.',
  },
];

export const EMERGENCY_CONTACTS: EmergencyContactInfo[] = [
  { agency: 'State Disaster Management Control (TNDMA)', number: '1070', description: '24/7 State Emergency Operations Centre', type: 'state' },
  { agency: 'District Disaster Emergency Hotline', number: '1077', description: 'Local District Collectorate Rapid Response', type: 'state' },
  { agency: 'National Emergency Helpline', number: '112', description: 'Unified Police, Fire & Coast Guard dispatch', type: 'national' },
  { agency: 'Medical Emergency Ambulance', number: '108', description: 'Immediate paramedic response', type: 'national' },
  { agency: 'Tourist Police & International Assistance', number: '+91 44 2846 1450', description: 'Multilingual tourist helpline', type: 'consular' },
  { agency: 'French Consulate Emergency (Puducherry/Chennai)', number: '+91 413 226 6500', description: 'French Consular Affairs Liaison', type: 'consular' },
  { agency: 'US Consulate General Chennai American Citizens', number: '+91 44 2857 4000', description: 'Consular ACS Emergency', type: 'consular' },
  { agency: 'British Deputy High Commission Chennai', number: '+91 44 4219 2151', description: 'UK Foreign Office Rapid Response', type: 'consular' },
];

export const FALLBACK_CYCLONE_WEATHER: WeatherData = {
  temp: 24,
  feels_like: 21,
  description: 'Severe Cyclonic Storm & Torrental Rain',
  icon: '11d',
  city: 'Coastal Chennai & Kancheepuram',
  humidity: 94,
  wind_speed: 78,
  alerts: [
    {
      event: 'Cyclone Alert - Level 3 (Red Warning)',
      description: 'Regional Meteorological Centre (IMD) has issued a Red Warning for heavy to extremely heavy rainfall with gale wind gusts reaching 75-85 kmph across Kancheepuram and coastal districts.',
      severity: 'extreme',
    },
    {
      event: 'Flash Flood & Inundation Warning',
      description: 'Low-lying coastal corridors, ECR causeways, and canal adjoining areas face severe flooding. Foreign travelers are strongly advised to remain on reinforced upper floors.',
      severity: 'severe',
    },
  ],
};

// Multilingual Crisis AI Guidance Engine (Zero-Fail Local Fallback)
export function generateLocalCrisisAdvice(userMessage: string, language: string = 'en'): string {
  const q = userMessage.toLowerCase();

  // French
  if (language === 'fr' || q.includes('route') || q.includes('aeroport') || q.includes('bonjour') || q.includes('danger') || q.includes('francais')) {
    if (q.includes('aeroport') || q.includes('airport') || q.includes('route')) {
      return `Restez calme et en sécurité.

1. Situation routière : La route côtière (ECR) est actuellement inondée et fermée à la circulation au nord de Mahabalipuram. N'essayez PAS de vous rendre à l'aéroport de Chennai en voiture ou en taxi pour l'instant.

2. Consigne de sécurité immédiate : Restez au sec au premier étage ou supérieur de votre hôtel. Ne traversez aucune zone inondée à pied.

3. Point de rassemblement sécurisé : Le refuge d'urgence officiel le plus proche est le "Mahabalipuram High-Ground Shelter" situé à 1,8 km à l'intérieur des terres (Contact : +91 44 2744 2233).

4. Liaison consulaire : Votre statut est transmis au Consulat Général de France à Chennai. Pour une urgence vitale, composez le 112.`;
    }
    return `Je suis SafePass, votre guide de crise en français.

Respirez profondément, vous n'êtes pas seul(e). Voici vos priorités immédiates :
• Restez à l'abri sur les hauteurs (évitez les rez-de-chaussée).
• Ne vous approchez pas du littoral ni des câbles électriques au sol.
• Conservez la batterie de votre téléphone en mode économie.
• L'ambassade et les secours locaux (112) sont alertés de la situation dans votre secteur.

Dites-moi exactement où vous vous trouvez (nom d'hôtel ou repère) et si vous avez des proches avec vous.`;
  }

  // German
  if (language === 'de') {
    return `Bleiben Sie ruhig und geschützt. Ich bin Ihr SafePass-Krisenbegleiter.

1. Sofortige Sicherheitsregel: Verlassen Sie Ihr Gebäude nicht. Die Küstenstraße (ECR) ist wegen Überschwemmungen unpassierbar.
2. Sicherer Zufluchtsort: Die nächstgelegene Notunterkunft ist das "Mahabalipuram High-Ground Shelter" (+91 44 2744 2233).
3. Notruf: Bei unmittelbarer Gefahr wählen Sie bitte 112. Ihr Status wird gleichzeitig an das Konsulat übermittelt.

Wie ist Ihre genaue Situation? Brauchen Sie medizinische Hilfe?`;
  }

  // Spanish
  if (language === 'es') {
    return `Mantenga la calma. Estoy aquí para guiarle paso a paso con SafePass.

1. Estado actual: Alerta Roja por Ciclón en la zona costera de Kancheepuram / Chennai.
2. Instrucción de seguridad: Permanezca en un piso alto dentro de una estructura de concreto. No intente conducir por la carretera costera (ECR) ya que está cortada.
3. Refugio verificado: El refugio de terreno elevado más cercano está en Mahabalipuram (+91 44 2744 2233).
4. Emergencias: Llame al 112 para rescate directo.

¿Se encuentra en un lugar techado en este momento?`;
  }

  // Japanese
  if (language === 'ja') {
    return `落ち着いてください。SafePassの危機対応ガイドです。

1. 現在の警報：チェンナイ・カンチープラム沿岸部にサイクロン警戒レベル3（赤色警報）が発令されています。
2. 安全確保：海岸沿いの道路（ECR）は冠水のため通行止めです。無理に空港へ向かわず、コンクリート建造物の2階以上に待機してください。
3. 最寄りの避難所：マハバリプラム高台避難センター（連絡先: +91 44 2744 2233）。
4. 緊急通報：人命に関わる事態は直ちに「112」へダイヤルしてください。

現在、飲料水や電源は確保できていますか？`;
  }

  // Tamil
  if (language === 'ta') {
    return `பயப்பட வேண்டாம், பாதுகாப்பாக இருங்கள். SafePass உங்கள் உதவிக்கு உள்ளது.

1. வானிலை எச்சரிக்கை: காஞ்சிபுரம் மற்றும் கடலோரப் பகுதிகளில் புயல் அதிதீவிர எச்சரிக்கை விடுக்கப்பட்டுள்ளது.
2. பாதுகாப்பு வழிமுறை: தரைத்தளங்களில் தங்க வேண்டாம்; மேல்தளத்திற்கு செல்லவும். ஈசிஆர் சாலையில் வெள்ளப்பெருக்கு ஏற்பட்டுள்ளதால் பயணம் செய்ய வேண்டாம்.
3. அருகிலுள்ள முகாம்: மாமல்லபுரம் உயர்நிலைப் புயல் நிவாரண முகாம் (தொடர்புக்கு: +91 44 2744 2233).
4. அவசர உதவி எண்: 112 அல்லது மாநில பேரிடர் எண் 1070.

உங்களுக்கு ஏதேனும் உடனடி மருத்துவ உதவி தேவையா?`;
  }

  // Specific English scenarios
  if (q.includes('shelter') || q.includes('safe place') || q.includes('evacuat')) {
    return `Here is your clear, actionable shelter plan:

1. Nearest High-Ground Shelter:
   • Location: Mahabalipuram High-Ground Cyclone Shelter (1.8 km inland)
   • Facilities: Drinking water, dry rations, emergency power generator, and paramedic staff on duty.
   • Emergency Phone: +91 44 2744 2233

2. Evacuation Safety Rules:
   • Do NOT walk through flowing flood water (even 6 inches can sweep you off your feet).
   • Move only along main high-elevation access routes. Avoid canal embankments.
   • Take your phone, power bank, passport (in a sealed plastic bag), and bottled water.

Are you alone, or are there children or elderly companions with you?`;
  }

  if (q.includes('road') || q.includes('airport') || q.includes('travel') || q.includes('car') || q.includes('taxi')) {
    return `URGENT ROAD NOTICE:

1. Airport Transit Status:
   • The East Coast Road (ECR) between Kovalam and Mahabalipuram has water accumulation of 2.5–3.5 feet.
   • Chennai International Airport (MAA) access via lower GST road is experiencing delays. Local authorities advise tourists to SHELTER IN PLACE rather than attempting transit through flooded causeways.

2. What to do right now:
   • Contact your hotel management or front desk immediately. They are required under district disaster protocols to accommodate stranded guests on upper floors.
   • Keep your mobile phone charged.
   • Update your SafePass status button to "Caution" or "Danger" so your Embassy and family are alerted.`;
  }

  if (q.includes('passport') || q.includes('embassy') || q.includes('consulate') || q.includes('document')) {
    return `Consular Guidance for Lost Documents in a Disaster:

1. Don't panic: Under international disaster conventions, local authorities prioritize physical safety over travel documents.
2. Embassy Status: Your SafePass profile is logged on the Consular Roster (/admin). Consular liaison officers are monitoring tourist safety flags in this district.
3. Steps:
   • Secure your digital copies on your phone if available.
   • After storm conditions subside, the Tourist Police (+91 44 2846 1450) and Consular Safe Points will issue an Emergency Travel Certificate (Laissez-Passer).
   • Your first priority remains staying high and dry.`;
  }

  if (q.includes('food') || q.includes('water') || q.includes('power') || q.includes('battery')) {
    return `Essential Disaster Survival Steps:

1. Potable Water: Drink only bottled or boiled water. Flood runoff severely contaminates tap and groundwater.
2. Battery Conservation: Switch your smartphone to Ultra Battery Saver mode right now. Turn off Bluetooth and background apps.
3. Food: Consume dry, packaged items first. Keep canned/dry food elevated above floor level.
4. If you run out of essential supplies, press "I Need Help" on your dashboard to trigger district relief dispatch.`;
  }

  // Default calm crisis guidance
  return `I am here with you. Take a steady breath.

Here are your three immediate priorities:
1. Stay Indoors & Elevated: Move to the second floor or higher. Avoid basements and low-lying ground floors completely.
2. Stay Away from Hazards: Stay clear of exterior glass windows facing the ocean and avoid fallen electric lines or stagnant water.
3. Update Your Circle: Tap "Caution" or "Danger" on your SafePass dashboard to notify your emergency contact and local diplomatic registry.

Local Emergency Numbers:
• National Emergency: 112
• Tamil Nadu Disaster Management: 1070
• Medical / Ambulance: 108

Tell me: What is your current building type (hotel, guesthouse, or outside), and what immediate danger are you seeing?`;
}
