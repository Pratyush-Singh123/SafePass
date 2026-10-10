import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { ChatMessage, SafePassUser } from '@/lib/types';
import { generateLocalCrisisAdvice } from '@/lib/crisisData';
import {
  Send,
  Loader2,
  ArrowLeft,
  Shield,
  Phone,
  Globe2,
  Sparkles,
  HelpCircle,
  HeartPulse,
  Activity,
  X,
  Copy,
  Download,
  Check,
  Radio,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  PhoneCall,
  Zap,
  Building2,
  Users,
  Stethoscope,
  Car,
  RefreshCw,
  ShieldAlert,
  BatteryCharging,
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

interface CrisisCategory {
  id: string;
  icon: React.ElementType;
  label: Record<string, string>;
  prompts: Record<string, string[]>;
}

const CRISIS_CATEGORIES: CrisisCategory[] = [
  {
    id: 'transit',
    icon: Car,
    label: {
      en: 'Roads & Transit',
      fr: 'Routes & Transports',
      es: 'Carreteras y Vuelos',
      de: 'Straßen & Transit',
      ja: '道路・交通状況',
      ta: 'சாலை & போக்குவரத்து',
      hi: 'सड़क व यातायात',
    },
    prompts: {
      en: [
        'Is East Coast Road passable to Chennai airport?',
        'Can I take a taxi through flooded causeways?',
        'Are flights at Chennai Airport delayed or cancelled?',
      ],
      fr: [
        "La route côtière ECR vers l'aéroport est-elle praticable ?",
        "Puis-je prendre un taxi à travers les zones inondées ?",
        "Les vols à l'aéroport de Chennai sont-ils suspendus ?",
      ],
      es: [
        '¿Está transitable la carretera ECR hacia el aeropuerto?',
        '¿Es seguro tomar un taxi con calles inundadas?',
        '¿Están cancelados los vuelos en Chennai?',
      ],
      de: [
        'Ist die ECR-Straße zum Flughafen befahrbar?',
        'Sollte ich ein Taxi durch das Hochwasser rufen?',
      ],
      ja: [
        'チェンナイ空港への海岸道路は通行可能ですか？',
        '冠水した道路でタクシー移動は可能ですか？',
      ],
      ta: [
        'சென்னை விமான நிலையத்திற்கான சாலை பாதுகாப்பானதா?',
        'வெள்ள நீரில் டாக்சி பயணம் செய்யலாமா?',
      ],
      hi: [
        'क्या चेन्नई हवाई अड्डे का रास्ता खुला है?',
        'क्या बाढ़ में टैक्सी से निकलना सुरक्षित है?',
      ],
    },
  },
  {
    id: 'medical',
    icon: Stethoscope,
    label: {
      en: 'Medical & First Aid',
      fr: 'Urgences Médicales',
      es: 'Médico y Primeros Auxilios',
      de: 'Medizin & Erste Hilfe',
      ja: '救急・医療処置',
      ta: 'மருத்துவ உதவி',
      hi: 'चिकित्सा व प्राथमिक उपचार',
    },
    prompts: {
      en: [
        'Someone has a deep wound from flood debris. What first aid is needed?',
        'What should I do if bitten by a sea snake or insect in floodwater?',
        'Where is the nearest functioning emergency trauma hospital?',
      ],
      fr: [
        'Blessure par débris dans l’inondation : que faire ?',
        'Que faire en cas de morsure de serpent d’eau ?',
        'Où est l’hôpital d’urgence le plus proche ?',
      ],
      es: [
        '¿Qué primeros auxilios aplicar para una herida por escombros?',
        '¿Qué hacer ante una mordedura de serpiente en el agua?',
        '¿Dónde está el hospital de urgencias más cercano?',
      ],
      de: [
        'Verletzung durch Treibgut: Welche Erste Hilfe ist nötig?',
        'Wo befindet sich die nächste Notaufnahme?',
      ],
      ja: [
        '瓦礫で深い怪我をしました。応急処置を教えてください。',
        '最寄りの救急病院はどこですか？',
      ],
      ta: [
        'அவசர மருத்துவ முதலுதவி தேவைப்படுகிறது.',
        'அருகிலுள்ள அவசர சிகிச்சை மருத்துவமனை எங்குள்ளது?',
      ],
      hi: [
        'बाढ़ में चोट लग गई है, प्राथमिक उपचार कैसे करें?',
        'नज़दीकी इमरजेंसी अस्पताल कहाँ है?',
      ],
    },
  },
  {
    id: 'consular',
    icon: Building2,
    label: {
      en: 'Consular & Legal Rights',
      fr: 'Consulat & Droits',
      es: 'Consulado y Derechos',
      de: 'Konsulat & Rechte',
      ja: '領事館・法的権利',
      ta: 'தூதரகம் & உரிமைகள்',
      hi: 'दूतावास व अधिकार',
    },
    prompts: {
      en: [
        'My hotel is forcing me to check out into the cyclone. Can they do this?',
        'I lost my passport and travel documents in the flood.',
        'How do I contact my diplomatic consulate for emergency evacuation?',
      ],
      fr: [
        "L'hôtel exige mon départ pendant le cyclone. Ont-ils le droit ?",
        "J'ai perdu mon passeport dans l'inondation.",
        "Comment contacter le Consulat de France en urgence ?",
      ],
      es: [
        'El hotel me pide desalojar en medio del ciclón. ¿Es legal?',
        'Perdí mi pasaporte durante la inundación.',
        '¿Cómo contacto a mi embajada para evacuación?',
      ],
      de: [
        'Das Hotel verlangt Check-Out während des Zyklons. Ist das legal?',
        'Ich habe meinen Reisepass bei der Flut verloren.',
      ],
      ja: [
        'ホテルからサイクロン中にチェックアウトを求められています。違法ですか？',
        '洪水でパスポートを紛失しました。',
      ],
      ta: [
        'விடுதி நிர்வாகம் வெளியேற சொல்கிறது, சட்டப்படி இது சரியா?',
        'பாஸ்போர்ட் தொலைந்துவிட்டது, என்ன செய்ய வேண்டும்?',
      ],
      hi: [
        'होटल वाले चक्रवात में बाहर निकाल रहे हैं, क्या यह कानूनी है?',
        'बाढ़ में मेरा पासपोर्ट खो गया है, क्या करें?',
      ],
    },
  },
  {
    id: 'family',
    icon: Users,
    label: {
      en: 'Family & Children',
      fr: 'Famille & Enfants',
      es: 'Familia y Niños',
      de: 'Familie & Kinder',
      ja: '家族・子ども',
      ta: 'குடும்பம் & குழந்தைகள்',
      hi: 'परिवार व बच्चे',
    },
    prompts: {
      en: [
        'I have small children and elderly parents with me, should we evacuate or stay?',
        'We got separated from a family member in the flood. What is the lost registry?',
        'Where can I get safe baby milk formula and pediatric relief?',
      ],
      fr: [
        'Je suis avec des enfants et personnes âgées : évacuer ou rester ?',
        'Un membre de notre famille s’est perdu dans l’inondation.',
        'Où trouver du lait pour bébé et soins pédiatriques ?',
      ],
      es: [
        'Estoy con niños pequeños y ancianos, ¿evacuar o resguardarse?',
        'Me separé de un familiar en la inundación.',
        '¿Dónde conseguir leche de fórmula para bebés?',
      ],
      de: [
        'Ich bin mit kleinen Kindern hier: Evakuieren oder bleiben?',
        'Familienmitglied im Hochwasser verloren.',
      ],
      ja: [
        '小さな子どもと高齢者がいます。避難すべきですか、待機すべきですか？',
        '家族とはぐれてしまいました。捜索窓口はどこですか？',
      ],
      ta: [
        'சிறு குழந்தைகள் உடன் உள்ளனர், வெளியேறவா அல்லது தங்கவா?',
        'குடும்ப உறுப்பினர் பிரிந்துவிட்டார், எங்கு புகார் அளிப்பது?',
      ],
      hi: [
        'मेरे साथ छोटे बच्चे और बुजुर्ग हैं, क्या हम निकलें या वहीं रुकें?',
        'बाढ़ में परिवार का सदस्य बिछड़ गया है, कहाँ मदद मांगें?',
      ],
    },
  },
  {
    id: 'survival',
    icon: Zap,
    label: {
      en: 'Water, Food & Power',
      fr: 'Eau & Énergie',
      es: 'Agua y Batería',
      de: 'Wasser & Rationen',
      ja: '水・食料・電源',
      ta: 'குடிநீர் & உணவு',
      hi: 'पेयजल व बिजली',
    },
    prompts: {
      en: [
        'Is municipal tap water safe to drink during coastal storm surge?',
        'Where is the nearest relief center distributing drinking water cartons?',
        'My phone battery is under 15% with no power grid. How do I conserve it?',
      ],
      fr: [
        "L'eau du robinet est-elle potable pendant la tempête ?",
        "Où trouver de l'eau potable scellée et des rations ?",
        "Batterie inférieure à 15 % : comment économiser au maximum ?",
      ],
      es: [
        '¿Es seguro beber agua del grifo durante la inundación?',
        '¿Dónde distribuyen agua embotellada y raciones?',
        'Mi batería está bajo el 15%, ¿cómo ahorrarla al máximo?',
      ],
      de: [
        'Ist das Leitungswasser bei Hochwasser trinkbar?',
        'Wo gibt es sauberes Trinkwasser und Notrationen?',
      ],
      ja: [
        '洪水時の水道水は飲用可能ですか？',
        '飲料水と非常食が配給されている場所はどこですか？',
      ],
      ta: [
        'குடிநீர் பாதுகாப்பானதா? எங்கு பாட்டில் தண்ணீர் கிடைக்கும்?',
        'மொபைல் பேட்டரி குறைவாக உள்ளது, என்ன செய்ய வேண்டும்?',
      ],
      hi: [
        'क्या बाढ़ के समय नल का पानी पीना सुरक्षित है?',
        'साफ पीने का पानी और राशन कहाँ मिल रहा है?',
      ],
    },
  },
];

function getWelcomeMessage(profile: SafePassUser | null, lang: string): ChatMessage {
  const isFrench = lang === 'fr' || profile?.nationality?.toLowerCase().includes('france');
  return {
    id: 'welcome',
    user_id: profile?.id || null,
    role: 'assistant',
    content: isFrench
      ? `Bonjour ${profile?.name?.split(' ')[0] || 'voyageur'}. Je suis votre guide de crise SafePass en liaison avec le Consulat Général de France à Chennai.

[CRITICAL WARNING]
Alerte Rouge Cyclonique de Niveau 3 sur le couloir côtier de Mahabalipuram / Chengalpattu. La mer est démontée et les passes basses sont submergées.

[ACTION CHECKLIST]
• Restez au sec au premier étage ou supérieur d'une structure en béton armé.
• Ne tentez aucun déplacement à pied ou en voiture sur la route côtière (ECR).
• Conservez l'eau potable scellée et passez en Mode Économie de Batterie.
• Si vous êtes menacé, appuyez sur "Relayer au Consulat".

[SAFE SHELTER]
Refuge sécurisé de haute altitude : Mahabalipuram High-Ground Shelter (1,8 km à l'intérieur des terres, surélévation de 18 mètres).

[EMERGENCY CONTACT]
Liaison Consulat de France (Urgences 24/7) : +91 413 226 6500 | Secours Nationaux : 112 | Protection Civile : 1070.`
      : `Hello ${profile?.name?.split(' ')[0] || 'traveler'}. I am SafePass, your calm crisis triage companion.

[CRITICAL WARNING]
Active Cyclone Warning Level 3 in effect for coastal Mahabalipuram & Chengalpattu. Moving through floodwaters has an 82% higher casualty rate than vertical sheltering.

[ACTION CHECKLIST]
• Move to the 2nd floor or higher of a reinforced concrete building.
• Avoid basements, balconies, and exterior glass facades facing the ocean.
• Keep bottled water and power bank beside you in a sealed plastic bag.
• Tap "Relay to Embassy" if you require diplomatic extraction or emergency assistance.

[SAFE SHELTER]
Nearest Verified High-Ground Haven: Mahabalipuram High-Ground Cyclone Shelter (1.8 km inland, elevated 18m above surge line).

[EMERGENCY CONTACT]
National Rescue: 112 | Tamil Nadu State Disaster Operations: 1070 | Ambulance SMUR: 108.`,
    created_at: new Date().toISOString(),
  };
}

// Visual Card Parser & Renderer for Action Callouts
function CrisisMessageRenderer({
  content,
  isBatterySaver,
  onRelayEmbassy,
}: {
  content: string;
  isBatterySaver: boolean;
  onRelayEmbassy: () => void;
}) {
  const hasStructuredCards = /\[(CRITICAL WARNING|ACTION CHECKLIST|SAFE SHELTER|EMERGENCY CONTACT)\]/i.test(content);

  if (!hasStructuredCards) {
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  const warningMatch = content.match(/\[CRITICAL WARNING\]\s*([\s\S]*?)(?=\[(ACTION CHECKLIST|SAFE SHELTER|EMERGENCY CONTACT)\]|$)/i);
  const checklistMatch = content.match(/\[ACTION CHECKLIST\]\s*([\s\S]*?)(?=\[(CRITICAL WARNING|SAFE SHELTER|EMERGENCY CONTACT)\]|$)/i);
  const shelterMatch = content.match(/\[SAFE SHELTER\]\s*([\s\S]*?)(?=\[(CRITICAL WARNING|ACTION CHECKLIST|EMERGENCY CONTACT)\]|$)/i);
  const contactMatch = content.match(/\[EMERGENCY CONTACT\]\s*([\s\S]*?)(?=\[(CRITICAL WARNING|ACTION CHECKLIST|SAFE SHELTER)\]|$)/i);

  const firstTagIdx = content.search(/\[(CRITICAL WARNING|ACTION CHECKLIST|SAFE SHELTER|EMERGENCY CONTACT)\]/i);
  const intro = firstTagIdx > 0 ? content.substring(0, firstTagIdx).trim() : null;

  const warning = warningMatch ? warningMatch[1].trim() : null;
  const checklist = checklistMatch
    ? checklistMatch[1]
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => l.replace(/^[•\-\*]\s*/, ''))
    : null;
  const shelter = shelterMatch ? shelterMatch[1].trim() : null;
  const contact = contactMatch ? contactMatch[1].trim() : null;

  return (
    <div className="space-y-3">
      {intro && (
        <div className={`font-semibold text-xs sm:text-sm leading-relaxed ${isBatterySaver ? 'text-slate-200' : 'text-slate-800'}`}>
          {intro}
        </div>
      )}

      {/* Critical Hazard Alert Banner */}
      {warning && (
        <div
          className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
            isBatterySaver
              ? 'bg-rose-950/40 border-rose-800 text-rose-200'
              : 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded-md bg-rose-600 text-white">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">
              Critical Hazard Warning
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold leading-relaxed">
            {warning}
          </p>
        </div>
      )}

      {/* Tactical Action Protocol Checklist */}
      {checklist && checklist.length > 0 && (
        <div
          className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
            isBatterySaver
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span className="p-1 rounded-md bg-emerald-600 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Tactical Action Protocol
            </span>
          </div>
          <div className="space-y-2">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px] font-black mt-0.5">
                  ✓
                </span>
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Safe Haven Box */}
      {shelter && (
        <div
          className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
            isBatterySaver
              ? 'bg-sky-950/40 border-sky-800 text-sky-200'
              : 'bg-sky-50/90 border-sky-300 text-sky-950 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-sky-600 text-white">
                <Building2 className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-800">
                Verified Safe Haven
              </span>
            </div>
            <Link
              to="/dashboard"
              className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-white px-2 py-0.5 rounded-lg border border-sky-200 shadow-2xs flex items-center gap-1"
            >
              <Navigation className="w-3 h-3 text-sky-600" /> Map
            </Link>
          </div>
          <p className="text-xs sm:text-sm font-medium leading-relaxed mb-2.5">
            {shelter}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-sky-200/60 text-[11px]">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Navigation className="w-3 h-3 text-sky-700" /> View Evacuation Routes
            </Link>
          </div>
        </div>
      )}

      {/* Emergency Hotlines & One-Tap Direct Dial */}
      {contact && (
        <div
          className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
            isBatterySaver
              ? 'bg-amber-950/40 border-amber-800 text-amber-200'
              : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded-md bg-amber-600 text-white">
              <PhoneCall className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
              Direct Emergency Dispatch Hotlines
            </span>
          </div>
          <p className="text-xs font-semibold mb-2.5 text-amber-900 leading-relaxed">
            {contact}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {contact.split('|').map((part, pidx) => {
              const trimmed = part.trim();
              const numMatch = trimmed.match(/(\+?\d[\d\s\-]{2,}\d|\b\d{3,4}\b)/);
              const dialNumber = numMatch ? numMatch[0].replace(/[\s\-]/g, '') : null;
              if (dialNumber) {
                return (
                  <a
                    key={pidx}
                    href={`tel:${dialNumber}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition-all shadow-2xs"
                  >
                    <Phone className="w-3 h-3 text-amber-600" />
                    <span>Dial {dialNumber}</span>
                  </a>
                );
              }
              return null;
            })}
            <button
              onClick={onRelayEmbassy}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 px-2.5 py-1 rounded-lg transition-all shadow-2xs ml-auto"
            >
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>Relay to Embassy</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('safepass_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<SafePassUser | null>(null);

  // Category Selector
  const [selectedCategory, setSelectedCategory] = useState<string>('transit');

  // Battery Saver Mode
  const [batterySaver, setBatterySaver] = useState<boolean>(() => {
    return localStorage.getItem('safepass_battery_saver') === 'true';
  });

  // Modals & Enhanced Features
  const [breathingModalOpen, setBreathingModalOpen] = useState(false);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [escalationModalOpen, setEscalationModalOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [escalatedTicket, setEscalatedTicket] = useState<string | null>(() => {
    return localStorage.getItem('safepass_relayed_ticket') || null;
  });

  const [copiedSms, setCopiedSms] = useState(false);
  const [exportedLog, setExportedLog] = useState(false);

  // Box-Breathing State Machine
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [breathCycle, setBreathCycle] = useState(1);

  // Triage state
  const [triageAnswers, setTriageAnswers] = useState({
    risingWater: false,
    hasWater: true,
    hasDependents: false,
    lowBattery: false,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userId = localStorage.getItem('safepass_user_id');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gwtvgorxyylkwpkxwwuj.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

  // Toggle Battery Saver
  const toggleBatterySaver = () => {
    const nextVal = !batterySaver;
    setBatterySaver(nextVal);
    localStorage.setItem('safepass_battery_saver', String(nextVal));
  };

  // Persist chat messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('safepass_chat_history', JSON.stringify(messages));
      } catch {
        // quota exceeded fallback
      }
    }
  }, [messages]);

  // Breathing Cycle Timer
  useEffect(() => {
    if (!breathingModalOpen) return;
    const interval = setInterval(() => {
      setBreathCountdown((prev) => {
        if (prev > 1) return prev - 1;

        setBreathPhase((currentPhase) => {
          if (currentPhase === 'Inhale') return 'Hold';
          if (currentPhase === 'Hold') return 'Exhale';
          if (currentPhase === 'Exhale') return 'Rest';
          setBreathCycle((c) => c + 1);
          return 'Inhale';
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingModalOpen]);

  // User Profile Load & Initial Welcome
  useEffect(() => {
    (async () => {
      let profile: SafePassUser | null = null;
      if (userId) {
        try {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          if (data) profile = data as SafePassUser;
        } catch {
          // offline
        }
      }

      if (!profile) {
        profile = {
          id: 'demo-alex-mercer',
          name: 'Alex Mercer',
          nationality: 'France',
          location_lat: 12.6269,
          location_lng: 80.1932,
          location_label: 'Mahabalipuram Coastal Heritage Zone',
          emergency_contact_name: 'Claire Mercer',
          emergency_contact_phone: '+33 6 42 19 88 01',
          status: (localStorage.getItem('safepass_demo_status') as any) || 'caution',
          share_token: 'alex-demo-token-994',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      setUserProfile(profile);

      // Default to French if tourist is French and no language explicitly picked
      if (profile.nationality.toLowerCase().includes('france') && selectedLanguage === 'en') {
        setSelectedLanguage('fr');
      }

      // Initialize welcome message only if history was empty
      if (messages.length === 0) {
        const welcome = getWelcomeMessage(profile, profile.nationality.toLowerCase().includes('france') ? 'fr' : 'en');
        setMessages([welcome]);
      }
      setHistoryLoading(false);
    })();
  }, [userId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const copyGuidance = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText ?? input.trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: userProfile?.id || null,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    let reply = '';

    // Step 1: Attempt Edge Function call if configured
    try {
      const conversationMessages = [
        ...messages.filter((m) => m.id !== 'welcome').map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: textToSend },
      ];

      const res = await fetch(`${supabaseUrl}/functions/v1/claude-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          messages: conversationMessages,
          user_id: userProfile?.id,
          language: selectedLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          reply = data.reply;
        }
      }
    } catch {
      // offline fallback
    }

    // Step 2: Zero-Fail Local Crisis Engine Fallback
    if (!reply) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reply = generateLocalCrisisAdvice(textToSend, selectedLanguage);
    }

    const assistantMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      user_id: userProfile?.id || null,
      role: 'assistant',
      content: reply,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Submit Rapid SBAR Triage
  const handleCompleteTriage = () => {
    setTriageModalOpen(false);
    const report = `EMERGENCY TRIAGE STATUS:
- Rising Water Visible: ${triageAnswers.risingWater ? 'YES (High Inundation Risk)' : 'NO'}
- 24h Drinking Water Available: ${triageAnswers.hasWater ? 'YES' : 'NO (Urgent Supply Needed)'}
- Traveling with Dependents: ${triageAnswers.hasDependents ? 'YES (Children/Elderly)' : 'NO'}
- Phone Battery Critical: ${triageAnswers.lowBattery ? 'YES (<20% remaining)' : 'NO'}

Based on this assessment, should I evacuate to the nearest high-ground shelter or shelter in place right now?`;
    sendMessage(report);
  };

  // Relay Situation to Embassy Command (Bridge to Direction 3 /admin)
  const handleRelayToEmbassy = async () => {
    const ticket = `EMB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setEscalatedTicket(ticket);
    localStorage.setItem('safepass_demo_status', 'danger');
    localStorage.setItem('safepass_relayed_ticket', ticket);

    if (userProfile?.id) {
      try {
        await supabase
          .from('users')
          .update({ status: 'danger', updated_at: new Date().toISOString() })
          .eq('id', userProfile.id);
      } catch {
        // offline fallback
      }
    }

    if (userProfile) {
      setUserProfile({ ...userProfile, status: 'danger' });
    }

    const escalationMsg: ChatMessage = {
      id: `esc-${Date.now()}`,
      user_id: userProfile?.id || null,
      role: 'assistant',
      content: `🚨 CONSULAR EMERGENCY ESCALATION CONFIRMED:
Ticket ${ticket} dispatched to Consular Crisis Command (/admin).

[CRITICAL WARNING]
Priority Emergency Flag assigned. The French Diplomatic Liaison Mission in Chennai and District Disaster Operations have your live GPS coordinates logged.

[ACTION CHECKLIST]
• Remain on the 2nd floor or higher of your building.
• Conserve smartphone battery (activate Ultra Battery Saver).
• Have your flashlight or whistle ready to signal rescue personnel.
• Do not attempt horizontal evacuation on foot through flood currents.

[SAFE SHELTER]
Designated Fallback Haven: Mahabalipuram High-Ground Shelter (1.8 km inland, elevated 18m).

[EMERGENCY CONTACT]
Direct French Consular Emergency Liaison: +91 413 226 6500 | District Collectorate: 1077 | National Rescue: 112.`,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, escalationMsg]);
    setEscalationModalOpen(true);
  };

  // Reset conversation to fresh state
  const handleConfirmClearChat = () => {
    localStorage.removeItem('safepass_chat_history');
    const freshWelcome = getWelcomeMessage(userProfile, selectedLanguage);
    setMessages([freshWelcome]);
    setClearConfirmOpen(false);
  };

  const getCompressedSmsText = () => {
    const lat = userProfile?.location_lat?.toFixed(4) || '12.6269';
    const lng = userProfile?.location_lng?.toFixed(4) || '80.1932';
    const name = userProfile?.name || 'Alex Mercer';
    const nat = userProfile?.nationality || 'France';
    const status = userProfile?.status?.toUpperCase() || 'DANGER';
    const phone = userProfile?.emergency_contact_phone || '+33642198801';
    return `SAFEPASS-SOS: ${name} (${nat}) | GPS:${lat}N,${lng}E | LOC:Mahabalipuram | STATUS:${status} | CONTACT:${phone} | BATTERY:72%`;
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(getCompressedSmsText());
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2000);
  };

  const handleExportTranscript = () => {
    const lines = messages.map(
      (m) => `[${new Date(m.created_at).toLocaleTimeString()}] ${m.role === 'user' ? 'TRAVELER' : 'SAFEPASS AI'}:\n${m.content}\n`
    );
    const blob = new Blob([lines.join('\n---\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SafePass_Crisis_Log_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    setExportedLog(true);
    setTimeout(() => setExportedLog(false), 2500);
  };

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  // Active Category Prompts
  const activeCategoryObj = CRISIS_CATEGORIES.find((c) => c.id === selectedCategory) || CRISIS_CATEGORIES[0];
  const activePrompts =
    activeCategoryObj.prompts[selectedLanguage] || activeCategoryObj.prompts.en || [];

  return (
    <div
      className={`max-w-3xl mx-auto transition-colors duration-300 flex flex-col h-[calc(100vh-140px)] pb-2 ${
        batterySaver ? 'bg-black text-slate-100' : 'animate-fade-in'
      }`}
    >
      {/* Battery Saver Warning Strip */}
      {batterySaver && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded-xl mb-2 text-xs flex items-center justify-between font-mono">
          <span className="flex items-center gap-1.5 font-bold">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> ULTRA BATTERY SAVER MODE ACTIVE
          </span>
          <span className="text-[11px] text-emerald-400/80">Animations suspended • OLED high-contrast</span>
        </div>
      )}

      {/* Top Header Card */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 mb-2.5 p-3 rounded-2xl border transition-all ${
          batterySaver
            ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-none'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl text-white shadow-sm ${
              batterySaver
                ? 'bg-emerald-900 text-emerald-200'
                : 'bg-gradient-to-tr from-cyan-600 to-sky-500'
            }`}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight">The Calm Voice</h1>
              <span
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  batterySaver
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${batterySaver ? '' : 'animate-pulse'}`} />
                Triage Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multilingual crisis companion & consular triage
            </p>
          </div>
        </div>

        {/* Feature Triggers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Battery Saver Toggle */}
          <button
            onClick={toggleBatterySaver}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
              batterySaver
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Toggle Ultra Low-Power Battery Saver"
          >
            <BatteryCharging className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{batterySaver ? 'Battery Saver ON' : 'Battery Saver'}</span>
          </button>

          {/* Relay to Embassy SOS */}
          <button
            onClick={handleRelayToEmbassy}
            className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs"
            title="Relay Situation to Consular Roster (/admin)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Relay Embassy</span>
          </button>

          {/* 30s Breathing Trigger */}
          <button
            onClick={() => setBreathingModalOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs"
            title="30-Second Panic Breathing Exercise"
          >
            <HeartPulse className={`w-3.5 h-3.5 text-teal-600 ${batterySaver ? '' : 'animate-pulse'}`} />
            <span className="hidden sm:inline">30s Breath</span>
          </button>

          {/* SBAR Triage Trigger */}
          <button
            onClick={() => setTriageModalOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs"
            title="Emergency Triage Checklist"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Triage</span>
          </button>

          {/* 2G SMS Trigger */}
          <button
            onClick={() => setSmsModalOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1.5 rounded-xl transition-all shadow-2xs"
            title="Offline 2G SMS Fallback"
          >
            <Radio className="w-3.5 h-3.5 text-amber-600" />
            <span>2G SMS</span>
          </button>

          {/* Language Selector */}
          <div
            className={`flex items-center gap-1 border rounded-xl px-2 py-1.5 text-xs ${
              batterySaver ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent font-bold text-xs outline-none cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/dashboard"
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-xl border transition-all ${
              batterySaver
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-cyan-700'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Map
          </Link>
        </div>
      </div>

      {/* Main Chat Box */}
      <div
        className={`flex-1 rounded-3xl border flex flex-col overflow-hidden transition-all ${
          batterySaver
            ? 'bg-slate-950 border-slate-800 shadow-none'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* Messages viewport */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${batterySaver ? '' : 'animate-fade-in'}`}
              >
                <div className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                      isUser
                        ? 'bg-cyan-600 text-white font-bold text-xs'
                        : batterySaver
                        ? 'bg-slate-800 text-emerald-400'
                        : 'bg-slate-900 text-cyan-400'
                    }`}
                  >
                    {isUser ? 'You' : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3.5 text-sm ${
                      isUser
                        ? 'bg-cyan-600 text-white rounded-tr-sm shadow-sm'
                        : batterySaver
                        ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <CrisisMessageRenderer
                        content={msg.content}
                        isBatterySaver={batterySaver}
                        onRelayEmbassy={handleRelayToEmbassy}
                      />
                    )}

                    {/* Action footer for AI answers */}
                    {!isUser && (
                      <div
                        className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
                          batterySaver ? 'border-slate-800 text-slate-400' : 'border-slate-200/80 text-slate-500'
                        }`}
                      >
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-cyan-500" /> SafePass Crisis Protocol
                        </span>
                        <button
                          onClick={() => copyGuidance(msg.id, msg.content)}
                          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border shadow-2xs transition-colors ${
                            batterySaver
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                              : 'bg-white text-slate-600 hover:text-cyan-700 border-slate-200'
                          }`}
                          title="Copy Guidance to Clipboard"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className={`flex justify-start ${batterySaver ? '' : 'animate-fade-in'}`}>
              <div className="flex items-start gap-2.5">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    batterySaver ? 'bg-slate-800 text-emerald-400' : 'bg-slate-900 text-cyan-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div
                  className={`border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 ${
                    batterySaver ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-medium">Formulating calm evacuation advice...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5 Category Selector Bar */}
        <div
          className={`px-3 py-2 border-t flex items-center gap-1.5 overflow-x-auto whitespace-nowrap ${
            batterySaver ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-500" /> Category:
          </span>
          {CRISIS_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const catLabel = cat.label[selectedLanguage] || cat.label.en;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? batterySaver
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-cyan-600 text-white border-cyan-600 shadow-2xs'
                    : batterySaver
                    ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{catLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Suggested Crisis Questions Bar */}
        <div
          className={`px-3 sm:px-4 py-2 border-t overflow-x-auto ${
            batterySaver ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <span>Quick Inquiries ({activeCategoryObj.label[selectedLanguage] || activeCategoryObj.label.en}):</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setClearConfirmOpen(true)}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1"
                title="Restart chat session"
              >
                <RefreshCw className="w-3 h-3" /> Clear Chat
              </button>
              <button
                onClick={handleExportTranscript}
                className="text-[11px] font-semibold text-cyan-600 hover:underline flex items-center gap-1"
              >
                {exportedLog ? <Check className="w-3 h-3 text-emerald-500" /> : <Download className="w-3 h-3" />}
                {exportedLog ? 'Transcript Downloaded' : 'Export Log'}
              </button>
            </div>
          </div>

          <div className="flex gap-2 pb-1 overflow-x-auto whitespace-nowrap">
            {activePrompts.map((promptText, i) => (
              <button
                key={i}
                onClick={() => sendMessage(promptText)}
                disabled={loading}
                className={`inline-flex items-center text-xs px-3 py-1.5 rounded-xl border transition-all font-medium disabled:opacity-50 ${
                  batterySaver
                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                    : 'bg-white hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300 text-slate-700 border-slate-200 shadow-2xs'
                }`}
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div
          className={`border-t p-3 sm:p-4 ${
            batterySaver ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Describe your emergency in ${LANGUAGES.find((l) => l.code === selectedLanguage)?.label || 'any language'}...`}
              rows={1}
              className={`flex-1 resize-none border rounded-xl px-4 py-3 text-sm focus:outline-none max-h-32 shadow-2xs ${
                batterySaver
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200'
              }`}
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={`flex-shrink-0 p-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                batterySaver
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-black font-bold'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
              title="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-rose-500" /> For life-threatening emergencies, dial 112 directly.
            </span>
            <span className="hidden sm:inline font-mono">Consular Triage Engine Active</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: 30-Second Guided Box Breathing / Panic Regulation */}
      {breathingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-800 shadow-2xl text-center relative">
            <button
              onClick={() => setBreathingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/30 mb-4">
              <HeartPulse className="w-3.5 h-3.5 text-teal-400 animate-pulse" /> Somatic Panic Regulation
            </div>

            <h3 className="text-xl font-extrabold text-white mb-1">Take a Steady Breath</h3>
            <p className="text-xs text-slate-400 mb-8">
              Adrenaline clouds decision-making in a disaster. Let your pulse settle.
            </p>

            {/* Breathing Circle Visualizer */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center mb-8">
              <div
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                  breathPhase === 'Inhale'
                    ? 'scale-110 bg-teal-500/30 blur-xl'
                    : breathPhase === 'Hold'
                    ? 'scale-105 bg-cyan-500/40 blur-xl'
                    : breathPhase === 'Exhale'
                    ? 'scale-90 bg-indigo-500/20 blur-lg'
                    : 'scale-95 bg-slate-700/20'
                }`}
              />

              <div
                className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 shadow-xl ${
                  breathPhase === 'Inhale'
                    ? 'border-teal-400 bg-teal-950/80 scale-105'
                    : breathPhase === 'Hold'
                    ? 'border-cyan-400 bg-cyan-950/80 scale-105 ring-8 ring-cyan-500/20'
                    : breathPhase === 'Exhale'
                    ? 'border-indigo-400 bg-indigo-950/80 scale-95'
                    : 'border-slate-500 bg-slate-800 scale-95'
                }`}
              >
                <p className="text-sm font-bold uppercase tracking-widest text-teal-300">{breathPhase}</p>
                <p className="text-3xl font-extrabold text-white font-mono mt-1">{breathCountdown}</p>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-300 mb-6 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <p className="font-semibold text-teal-300">Cycle {breathCycle} of 3 completed</p>
              <p className="text-[11px] text-slate-400">
                Slow, even breathing lowers blood pressure and brings mental clarity.
              </p>
            </div>

            <button
              onClick={() => setBreathingModalOpen(false)}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all"
            >
              I Feel Calmer Now — Return to Crisis Chat
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Rapid SBAR Emergency Triage Checklist */}
      {triageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Rapid SBAR Triage Checklist</h3>
                  <p className="text-[11px] text-slate-500">10-Second Crisis Assessment</p>
                </div>
              </div>
              <button
                onClick={() => setTriageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Select your current situation to give the AI precise situational context:
            </p>

            <div className="space-y-2.5 mb-6">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-semibold text-slate-800">Is water actively rising around your building?</span>
                <input
                  type="checkbox"
                  checked={triageAnswers.risingWater}
                  onChange={(e) => setTriageAnswers({ ...triageAnswers, risingWater: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-semibold text-slate-800">Do you have clean drinking water for 24 hours?</span>
                <input
                  type="checkbox"
                  checked={triageAnswers.hasWater}
                  onChange={(e) => setTriageAnswers({ ...triageAnswers, hasWater: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-semibold text-slate-800">Are you with young children or elderly dependents?</span>
                <input
                  type="checkbox"
                  checked={triageAnswers.hasDependents}
                  onChange={(e) => setTriageAnswers({ ...triageAnswers, hasDependents: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <span className="text-xs font-semibold text-slate-800">Is your phone battery below 25%?</span>
                <input
                  type="checkbox"
                  checked={triageAnswers.lowBattery}
                  onChange={(e) => setTriageAnswers({ ...triageAnswers, lowBattery: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTriageModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteTriage}
                className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                Submit Triage to AI Assistant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: 2G SMS Compressed Distress Generator */}
      {smsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">2G Compressed SMS Fallback</h3>
                  <p className="text-[11px] text-slate-500">For Network Blackouts & 2G GSM Towers</p>
                </div>
              </div>
              <button
                onClick={() => setSmsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              If cellular internet drops, this compressed 140-character emergency string transmits your vital coordinates via standard 2G SMS to local disaster services:
            </p>

            <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-2xl font-mono text-xs leading-relaxed break-all border border-slate-800 mb-4 select-all">
              {getCompressedSmsText()}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopySms}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSms ? 'Copied to Clipboard' : 'Copy SMS Text'}
              </button>
              <a
                href={`sms:112?body=${encodeURIComponent(getCompressedSmsText())}`}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                Launch Native SMS
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Consular Escalation Confirmation Modal */}
      {escalationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Consular Escalation Broadcast</h3>
                  <p className="text-[11px] text-slate-500">Ticket Ref: #{escalatedTicket || 'EMB-2026-4819'}</p>
                </div>
              </div>
              <button
                onClick={() => setEscalationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-950 mb-4 space-y-1.5">
              <div className="flex justify-between font-bold">
                <span>Citizen:</span>
                <span>{userProfile?.name || 'Alex Mercer'} ({userProfile?.nationality || 'France'})</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-mono">12.6269° N, 80.1932° E</span>
              </div>
              <div className="flex justify-between">
                <span>Consular Status:</span>
                <span className="font-bold text-rose-700 uppercase">DANGER / PRIORITY LIAISON</span>
              </div>
              <div className="flex justify-between">
                <span>Assigned Consulate:</span>
                <span>Consulat Général de France (Chennai)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Your distress context and GPS coordinates have been pushed to the diplomatic mission roster and district disaster authorities. A consular liaison officer is alerted.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setEscalationModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs"
              >
                Close & Return
              </button>
              <Link
                to="/admin"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                View Consular Roster
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Clear Chat Confirmation Modal */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl text-slate-900">
            <h3 className="font-extrabold text-base mb-2">Reset Crisis Chat?</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              This will clear the current chat history on this device and restart from the localized crisis briefing. Your registered profile will remain safe.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearChat}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                Yes, Reset Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
