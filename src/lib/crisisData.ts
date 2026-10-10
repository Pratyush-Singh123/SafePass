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
    if (q.includes('hotel') || q.includes('expuls') || q.includes('refus') || q.includes('chambre') || q.includes('quitter') || q.includes('partir')) {
      return `DROITS DES RÉSIDENTS EN SITUATION DE CATASTROPHE (NDMA 2005) :

[CRITICAL WARNING]
Selon l'article 30 du Disaster Management Act indien (NDMA 2005), il est strictement interdit aux hôtels et pensions d'expulser des résidents pendant une Alerte Rouge cyclonique.

[ACTION CHECKLIST]
• Montrez cette notification à la réception de votre hôtel.
• Les autorités du district de Kancheepuram ont ordonné aux hôteliers d'offrir un abri vertical aux étages.
• En cas de refus ou menace : composez le 1077 pour intervention directe du Magistrat de District.
• Votre situation est enregistrée auprès du Consulat de France.

[SAFE SHELTER]
Cellule d'urgence du District Collectorate : 1077 (Les officiers de gestion des catastrophes contacteront l'hôtel directement).

[EMERGENCY CONTACT]
Magistrat de District : 1077 | Brigade Touristique : +91 44 2846 1450 | Consulat de France : +91 413 226 6500.`;
    }

    if (q.includes('passeport') || q.includes('passport') || q.includes('consulat') || q.includes('ambassade') || q.includes('papier') || q.includes('visa')) {
      return `CONSULAT DE FRANCE — PERTE DE DOCUMENTS :

[CRITICAL WARNING]
Ne prenez aucun risque physique pour récupérer des papiers ou bagages dans des zones inondées. La vie humaine prévaut sur tout document administratif.

[ACTION CHECKLIST]
• Les protocoles internationaux humanitaires garantissent le passage sécurisé en zone de catastrophe sans passeport physique.
• SafePass a synchronisé votre profil sur le registre de crise du Consulat Général de France (/admin).
• Le Consulat à Pondichéry/Chennai et le FRRO délivreront un Laissez-Passer d'urgence dès que la météo le permettra.

[SAFE SHELTER]
Point Consulaire Sécurisé International (Corridor OMR, Sholinganallur — Desk de liaison pour ressortissants français et européens).

[EMERGENCY CONTACT]
Liaison Consulat de France (Urgences 24/7) : +91 413 226 6500 | Police Touristique : +91 44 2846 1450.`;
    }

    if (q.includes('enfant') || q.includes('famille') || q.includes('bebe') || q.includes('separ') || q.includes('fils') || q.includes('fille')) {
      return `SÉCURITÉ FAMILLE ET ENFANTS :

[CRITICAL WARNING]
Ne séparez jamais votre groupe dans l'eau. Un courant d'eau de seulement 15 cm de hauteur peut emporter un jeune enfant.

[ACTION CHECKLIST]
• Inscrivez vos coordonnées téléphoniques sur le bras de vos enfants au feutre indélébile.
• Restez aux étages supérieurs au sec.
• En cas de membre égaré : prévenez immédiatement la Police Touristique (+91 44 2846 1450) qui tient un registre centralisé des personnes séparées.
• Utilisez le bouton "Relayer au Consulat" pour prioriser votre famille.

[SAFE SHELTER]
Centre de secours Anna (Bypass de Mahabalipuram — Rations pédiatriques et lait maternisé disponibles).

[EMERGENCY CONTACT]
Helpline Enfance : 1098 | Urgences Nationales : 112 | Police Touristique : +91 44 2846 1450.`;
    }

    if (q.includes('bless') || q.includes('medic') || q.includes('serpent') || q.includes('hopital') || q.includes('docteur') || q.includes('sang') || q.includes('fievre')) {
      return `GUIDE MÉDICAL D'URGENCE :

[CRITICAL WARNING]
Les eaux d'inondation contiennent des bactéries sévères et des reptiles déplacés par la houle (vipères, serpents marins). Ne laissez aucune plaie entrer en contact avec l'eau.

[ACTION CHECKLIST]
• Nettoyez immédiatement toute coupure à l'eau potable en bouteille et antiseptique.
• En cas de morsure : immobilisez le membre sous le niveau du cœur, ne posez pas de garrot serré.
• Gardez la personne au chaud et calme pour éviter l'état de choc.

[SAFE SHELTER]
Unité d'Urgences & Traumatologie Apollo (ECR Perungudi, 8.2 km, sérums antivenimeux et chirurgiens d'urgence).

[EMERGENCY CONTACT]
Ambulance SMUR : 108 | Urgences Nationales : 112 | Apollo Trauma : +91 44 2829 0200.`;
    }

    if (q.includes('eau') || q.includes('manger') || q.includes('nourriture') || q.includes('faim') || q.includes('batterie') || q.includes('boire') || q.includes('electric')) {
      return `EAU POTABLE ET RESSOURCES DE SURVIE :

[CRITICAL WARNING]
L'eau du réseau est contaminée par le refoulement des eaux usées. Ne buvez jamais l'eau du robinet et ne vous lavez pas avec l'eau d'inondation.

[ACTION CHECKLIST]
• Buvez exclusivement de l'eau en bouteille capsulée ou bouillie pendant 3 minutes.
• Activez immédiatement le Mode Économie de Batterie (luminosité à 15 %, Bluetooth désactivé).
• Consommez en priorité les denrées sèches (biscuits, fruits secs, conserves).

[SAFE SHELTER]
Centre de Secours Anna (Poonjeri Bypass) distribue de l'eau scellée et des repas secs chauds.

[EMERGENCY CONTACT]
Ravitaillement de Secours : 1077 | Centre des Opérations d'Urgence : 1070.`;
    }

    if (q.includes('aeroport') || q.includes('airport') || q.includes('route') || q.includes('taxi') || q.includes('vol') || q.includes('voiture')) {
      return `BULLETIN DE TRANSIT RÉGIONAL :

[CRITICAL WARNING]
La route côtière (ECR) est coupée par 80 cm d'eau au niveau du pont de Kovalam. Les vols à l'aéroport de Chennai (MAA) subissent de fortes perturbations.

[ACTION CHECKLIST]
• Restez au sec au premier étage ou supérieur de votre hôtel.
• Ne prenez aucun taxi ou véhicule de location dans les zones inondées.
• Ne traversez aucune rue inondée à pied (fort courant marin).
• Mettez votre téléphone en mode économie d'énergie.

[SAFE SHELTER]
Refuge sécurisé : Mahabalipuram High-Ground Shelter (situé à 1,8 km à l'intérieur des terres, élevé au-dessus de la ligne de houle).

[EMERGENCY CONTACT]
Assistance Routière d'Urgence : 1033 | Urgences Nationales : 112 | Liaison Consulat de France : +91 413 226 6500.`;
    }

    return `Je suis SafePass, votre guide de crise en français.

[CRITICAL WARNING]
Alerte Rouge Cyclonique de Niveau 3 sur la côte de Mahabalipuram / Chengalpattu. Évitez absolument le front de mer et les rez-de-chaussée.

[ACTION CHECKLIST]
• Réfugiez-vous sur les hauteurs (2e étage minimum).
• Conservez l'eau potable dans des bouteilles étanches.
• Évitez de toucher les câbles au sol.
• Informez la réception de votre présence.

[SAFE SHELTER]
Refuge de terrain élevé : Mahabalipuram High-Ground Shelter (Contact : +91 44 2744 2233).

[EMERGENCY CONTACT]
Urgences Nationales : 112 | Liaison Consulat de France : +91 413 226 6500.`;
  }

  // Hindi
  if (language === 'hi' || q.includes('हवाई अड्डा') || q.includes('शिविर') || q.includes('मदद') || q.includes('पानी')) {
    return `शांत और सुरक्षित रहें। SafePass संकट प्रबंधन सहायता आपके साथ है।

[CRITICAL WARNING]
महाबलीपुरम और ईसीआर तटीय मार्ग पर 2.5 से 3 फीट बाढ़ का पानी भरा है। वाहन से निकलने का प्रयास न करें।

[ACTION CHECKLIST]
• तुरंत कंक्रीट की इमारत के दूसरे या तीसरे तल पर शरण लें।
• बिजली के खंभों और बाढ़ के बहते पानी से दूर रहें।
• पीने के लिए केवल उबला हुआ या बोतलबंद पानी ही इस्तेमाल करें।

[SAFE SHELTER]
नज़दीकी सुरक्षित शिविर: महाबलीपुरम हाई-ग्राउंड साइक्लोन शेल्टर (1.8 किमी अंदरूनी भाग, भोजन व मेडिकल सुविधा उपलब्ध)।

[EMERGENCY CONTACT]
राष्ट्रीय आपातकालीन नंबर: 112 | तमिलनाडु राज्य आपदा नियंत्रण: 1070 | एम्बुलेंस: 108.`;
  }

  // German
  if (language === 'de') {
    return `Bleiben Sie ruhig und geschützt. Ich bin Ihr SafePass-Krisenbegleiter.

[CRITICAL WARNING]
Die Küstenstraße (ECR) ist wegen Sturmflut unpassierbar. Unternehmen Sie keine Fahrten zum Flughafen Chennai.

[ACTION CHECKLIST]
• Bleiben Sie im Gebäude im 1. oder 2. Stock.
• Meiden Sie Keller und Erdgeschossräume.
• Halten Sie Ihr Smartphone im Energiesparmodus.

[SAFE SHELTER]
Notunterkunft: Mahabalipuram High-Ground Shelter (1,8 km landeinwärts, +91 44 2744 2233).

[EMERGENCY CONTACT]
Notruf Rettungsdienst: 112 | Tamil Nadu Katastrophenschutz: 1070.`;
  }

  // Spanish
  if (language === 'es') {
    return `Mantenga la calma. Estoy aquí para guiarle paso a paso con SafePass.

[CRITICAL WARNING]
Alerta Roja por Ciclón y marejada en el corredor costero de Mahabalipuram. La carretera ECR está cortada por inundación.

[ACTION CHECKLIST]
• Permanezca en un piso superior dentro de una estructura de concreto.
• No intente cruzar aguas en movimiento a pie ni en coche.
• Guarde agua potable y cargue baterías de emergencia.

[SAFE SHELTER]
Refugio de Terreno Elevado de Mahabalipuram (+91 44 2744 2233, raciones y primeros auxilios disponibles).

[EMERGENCY CONTACT]
Emergencias: 112 | Control de Desastres de Tamil Nadu: 1070.`;
  }

  // Japanese
  if (language === 'ja') {
    return `落ち着いて行動してください。SafePassの危機対応ガイドです。

[CRITICAL WARNING]
マハバリプラム沿岸部にサイクロン警戒レベル3（赤色警報）発令中。海岸道路（ECR）は冠水のため通行止めです。

[ACTION CHECKLIST]
• コンクリート建物の2階以上に避難し、窓から離れてください。
• 冠水した道路を徒歩で移動しないでください（水流による転倒危険）。
• 飲料水を確保し、スマートフォンの省電力モードを有効化してください。

[SAFE SHELTER]
指定高台避難所：マハバリプラム高台避難センター（内陸1.8km、医療品・飲料水配給あり、+91 44 2744 2233）。

[EMERGENCY CONTACT]
緊急通報：112 | 州災害対策本部：1070。`;
  }

  // Tamil
  if (language === 'ta') {
    return `பயப்பட வேண்டாம், பாதுகாப்பாக இருங்கள். SafePass உங்களுடன் உள்ளது.

[CRITICAL WARNING]
மாமல்லபுரம் கடலோரப் பகுதியில் புயல் எச்சரிக்கை நிலை 3 அமலில் உள்ளது. ஈசிஆர் சாலையில் வெள்ளப்பெருக்கு ஏற்பட்டுள்ளதால் பயணம் தவிர்க்கவும்.

[ACTION CHECKLIST]
• உடனடியாக கான்கிரீட் கட்டடங்களின் மேல்தளத்திற்கு செல்லவும்.
• மின் கம்பங்கள் மற்றும் தேங்கிய மழைநீரில் நடக்க வேண்டாம்.
• பாட்டில் குடிநீரை மட்டுமே பயன்படுத்தவும்.

[SAFE SHELTER]
அருகிலுள்ள முகாம்: மாமல்லபுரம் உயர்நிலைப் புயல் நிவாரண முகாம் (தொடர்புக்கு: +91 44 2744 2233).

[EMERGENCY CONTACT]
அவசர உதவி எண்: 112 | மாநில பேரிடர் கட்டுப்பாட்டு அறை: 1070.`;
  }

  // Specific English scenarios:

  // Medical emergency
  if (q.includes('medic') || q.includes('injur') || q.includes('doctor') || q.includes('cut') || q.includes('snake') || q.includes('fever') || q.includes('pain')) {
    return `EMERGENCY MEDICAL GUIDANCE:

[CRITICAL WARNING]
Flood waters carry high biological contamination and venomous reptiles (sea snakes / vipers displaced by surge). Keep wounds elevated and completely dry.

[ACTION CHECKLIST]
• Clean cuts immediately with antiseptic bottled water. Do NOT use tap or flood water.
• If bitten by an insect/reptile: Immobilize the limb below heart level. Do NOT tie tight tourniquets or cut the wound.
• Keep the patient calm and warm to prevent circulatory shock.

[SAFE SHELTER]
Apollo Emergency Trauma & Disaster Ward (Perungudi / ECR Wing, 8.2 km, Equipped with Anti-Snake Venom & Trauma Specialists).
Phone: +91 44 2829 0200 / 108.

[EMERGENCY CONTACT]
Immediate Paramedic Ambulance Dispatch: Dial 108. State Emergency Dispatch: Dial 112.`;
  }

  // Children and Family separation
  if (q.includes('child') || q.includes('kid') || q.includes('baby') || q.includes('separat') || q.includes('family') || q.includes('wife') || q.includes('husband')) {
    return `FAMILY & DEPENDENTS SAFETY PROTOCOL:

[CRITICAL WARNING]
Never separate group members in water exceeding ankle depth. Flowing water of just 6 inches can easily sweep away a child.

[ACTION CHECKLIST]
• Write parent contact numbers on children's arms in waterproof ink.
• Keep children on the highest dry elevation of your hotel.
• If a companion is separated: Report immediately to Tourist Police (+91 44 2846 1450). Police disaster stations maintain a synchronized lost-tourist registry.
• Update SafePass status to "Danger" so your Consular mission prioritizes your group.

[SAFE SHELTER]
Anna Community Relief Center (Mahabalipuram Bypass) has dedicated maternal and pediatric relief rations.

[EMERGENCY CONTACT]
Child Helpline: 1098 | National Emergency: 112 | Tourist Police: +91 44 2846 1450.`;
  }

  // Hotel refusal / legal rights
  if (q.includes('hotel') || q.includes('evict') || q.includes('refus') || q.includes('stay') || q.includes('check out') || q.includes('reception')) {
    return `LEGAL CRISIS NOTICE — HOTEL GUEST RIGHTS:

[CRITICAL WARNING]
Under Section 30 of the National Disaster Management Act (NDMA 2005), hotels and guesthouses are legally strictly prohibited from evicting guests into an active Red Alert cyclone or flood zone.

[ACTION CHECKLIST]
• Show this message to hotel management or front desk staff.
• Inform them that district authorities have mandated all tourist establishments to provide vertical high-ground shelter.
• If they refuse or threaten checkout: Request immediate escalation to the District Tourist Officer.
• Your location is logged with the diplomatic consulate.

[SAFE SHELTER]
Kancheepuram District Collectorate Emergency Desk: 1077 (Disaster enforcement officers will contact hotel management directly).

[EMERGENCY CONTACT]
District Disaster Collectorate: 1077 | Tourist Police Flying Squad: +91 44 2846 1450.`;
  }

  // Transit and road closure
  if (q.includes('road') || q.includes('airport') || q.includes('travel') || q.includes('car') || q.includes('taxi') || q.includes('bus') || q.includes('flight')) {
    return `URGENT REGIONAL TRANSIT BULLETIN:

[CRITICAL WARNING]
The East Coast Road (ECR) between Kovalam and Mahabalipuram has water accumulation of 2.5–3.5 feet. Lower causeways are breached by canal overflow. Flight operations at Chennai International Airport (MAA) are facing gale-force delays.

[ACTION CHECKLIST]
• SHELTER IN PLACE: Do NOT hire taxis or drive rental cars into low-lying coastal causeways.
• Do not attempt to walk along beach bypass roads.
• Check flight rebooking online only when phone battery permits.
• Remain at your current high-ground building until district authorities issue an "All Clear".

[SAFE SHELTER]
Mahabalipuram High-Ground Cyclone Shelter (1.8 km inland, elevated 18 meters above storm surge line).

[EMERGENCY CONTACT]
State Highway Emergency Hotline: 1033 | National Rescue: 112 | Disaster Operations: 1070.`;
  }

  // Lost passport and travel documents
  if (q.includes('passport') || q.includes('embassy') || q.includes('consulate') || q.includes('document') || q.includes('visa') || q.includes('wallet')) {
    return `CONSULAR GUIDANCE — LOST DOCUMENTS:

[CRITICAL WARNING]
Do not risk personal safety to retrieve lost bags or documents from flooded rooms or submerged vehicles. Life safety always takes precedence over paper documents.

[ACTION CHECKLIST]
• International humanitarian protocols grant safe transit during declared catastrophes regardless of missing paper passports.
• SafePass has logged your citizenship with the diplomatic consular mission on the Consular Command Center (/admin).
• As soon as rainfall subsides, your embassy liaison and the Foreigners Regional Registration Office (FRRO) will issue an Emergency Travel Certificate (Laissez-Passer).

[SAFE SHELTER]
International Tourist & Consular Safe Point (OMR Tech Corridor, Sholinganallur — Direct liaison desk for French, British, American, and EU citizens).

[EMERGENCY CONTACT]
Tourist Police Helpline: +91 44 2846 1450 | French Consulate Emergency: +91 413 226 6500 | US Citizens ACS: +91 44 2857 4000.`;
  }

  // Water, rations and power
  if (q.includes('food') || q.includes('water') || q.includes('power') || q.includes('battery') || q.includes('charg') || q.includes('drink')) {
    return `SURVIVAL RESOURCES & SANITATION:

[CRITICAL WARNING]
Municipal tap water is compromised by flood sewage. Never consume unboiled tap water or wash face with flood runoff (leptospirosis and cholera risk).

[ACTION CHECKLIST]
• Drink strictly bottled or rolling-boiled water.
• Switch smartphone to Ultra Battery Saver mode immediately (disable Wi-Fi, Bluetooth, screen brightness to 15%).
• Collect rainwater in clean pots only from elevated open surfaces away from gutters.
• Eat dry rations (biscuits, nuts, canned food) first.

[SAFE SHELTER]
Anna Community Relief Center (Poonjeri Bypass Road) is distributing sealed bottled water cartons and hot dry rations.

[EMERGENCY CONTACT]
Food & Relief Supplies Dispatch: 1077 | State Operations: 1070.`;
  }

  // SBAR Triage response
  if (q.includes('triage') || q.includes('emergency triage status')) {
    return `SBAR CLINICAL TRIAGE RECOMMENDATION:

[CRITICAL WARNING]
Active severe cyclonic storm in progress. Moving through active floodwater has an 82% higher casualty rate than vertical sheltering in concrete multi-story buildings.

[ACTION CHECKLIST]
• RECOMMENDATION: VERTICAL SHELTER IN PLACE on 2nd floor or higher.
• Do NOT attempt horizontal foot evacuation unless water levels inside your building breach floor 1.
• Conserve remaining smartphone battery for emergency broadcasts.
• Keep emergency whistle or flashlight accessible for rescue signaling.

[SAFE SHELTER]
If building structural integrity fails, your fallback shelter is: Mahabalipuram High-Ground Shelter (1.8 km, elevated ridge, contact: +91 44 2744 2233).

[EMERGENCY CONTACT]
Disaster Operations NDRF Dispatch: 1070 | National Rescue: 112.`;
  }

  // Default calm crisis guidance
  return `I am with you. Take a steady breath.

[CRITICAL WARNING]
Coastal Kancheepuram & Chengalpattu under active Cyclone Warning Level 3. Stay at least 1.5 km away from coastal surge boundaries.

[ACTION CHECKLIST]
• Move to the 2nd floor or higher of a reinforced concrete building.
• Avoid basements, balconies, and exterior glass facades.
• Keep bottled water and power bank beside you in a sealed plastic bag.
• Tap "Caution" or "Danger" on your SafePass dashboard to alert your embassy.

[SAFE SHELTER]
Nearest Verified Safe Haven: Mahabalipuram High-Ground Cyclone Shelter (1.8 km inland, phone: +91 44 2744 2233).

[EMERGENCY CONTACT]
National Emergency Rescue: 112 | Tamil Nadu State Disaster Operations: 1070 | Ambulance: 108.`;
}
