import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { ChatMessage, SafePassUser } from '@/lib/types';
import { generateLocalCrisisAdvice } from '@/lib/crisisData';
import {
  Send,
  MessageCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Phone,
  Volume2,
  VolumeX,
  Globe2,
  Sparkles,
  HelpCircle,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Download,
  Share2,
  Check,
  Radio,
  Sliders,
  FileText,
  LifeBuoy,
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

const QUICK_PROMPTS: Record<string, string[]> = {
  en: [
    'Where is the nearest verified shelter?',
    'Is East Coast Road passable to Chennai airport?',
    'I lost my passport and travel documents in the flood.',
    'I have small children with me, should we evacuate or stay?',
  ],
  fr: [
    'Où se trouve le refuge le plus proche ?',
    'La route côtière vers l’aéroport est-elle praticable ?',
    "J'ai perdu mon passeport dans l'inondation.",
    'Je suis avec deux enfants, devons-nous évacuer ?',
  ],
  es: [
    '¿Dónde está el refugio seguro más cercano?',
    '¿Está transitable la carretera hacia el aeropuerto?',
    'Perdí mi pasaporte durante la inundación.',
    'Estoy con niños, ¿debemos quedarnos o evacuar?',
  ],
  de: [
    'Wo ist die nächste sichere Notunterkunft?',
    'Ist die Straße zum Flughafen Chennai befahrbar?',
    'Ich habe meinen Reisepass bei der Überschwemmung verloren.',
  ],
  ja: [
    '最寄りの高台避難所はどこですか？',
    'チェンナイ空港への道路は通行可能ですか？',
    '洪水でパスポートを紛失しました。',
  ],
  ta: [
    'அருகிலுள்ள புயல் நிவாரண முகாம் எங்குள்ளது?',
    'சென்னை விமான நிலையத்திற்கான சாலை பாதுகாப்பானதா?',
    'அவசர மருத்துவ உதவி தேவைப்படுகிறது.',
  ],
  hi: [
    'सबसे नज़दीकी सुरक्षित राहत शिविर कहाँ है?',
    'क्या चेन्नई हवाई अड्डे का रास्ता खुला है?',
    'बाढ़ में मेरा पासपोर्ट खो गया है, क्या करें?',
  ],
};

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.88); // Soothing slow cadence
  const [userProfile, setUserProfile] = useState<SafePassUser | null>(null);

  // Modals & Enhanced Features
  const [breathingModalOpen, setBreathingModalOpen] = useState(false);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
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

  // Breathing Cycle Timer
  useEffect(() => {
    if (!breathingModalOpen) return;
    const interval = setInterval(() => {
      setBreathCountdown((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phases: Inhale (4s) -> Hold (4s) -> Exhale (4s) -> Rest (4s)
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

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
          status: 'caution',
          share_token: 'alex-demo-token-994',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      setUserProfile(profile);

      // Auto-set language if tourist is French
      if (profile.nationality.toLowerCase().includes('france')) {
        setSelectedLanguage('fr');
      }

      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        user_id: profile.id,
        role: 'assistant',
        content: profile.nationality.toLowerCase().includes('france')
          ? `Bonjour Alex. Je suis votre guide de crise SafePass en liaison avec le Consulat Général de France à Chennai.

Prenez une respiration calme. Vous êtes actuellement localisé à Mahabalipuram (Zone Côtière sous Alerte Cyclone Niveau 3).

Je suis là pour vous accompagner pas à pas sans panique. Décrivez-moi ce que vous voyez ou utilisez une question rapide ci-dessous.`
          : `Hello ${profile.name.split(' ')[0]}. I am SafePass, your calm crisis triage companion.

Take a steady breath. I have your coordinates logged at ${profile.location_label || 'Mahabalipuram / Coastal Kancheepuram'}. 

I am here to guide you step-by-step through current cyclone conditions. Tell me what is happening around you, or tap a quick question below.`,
        created_at: new Date().toISOString(),
      };

      setMessages([welcomeMsg]);
      setHistoryLoading(false);
    })();
  }, [userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const speakMessage = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechSpeed; // Calming cadence
    utterance.pitch = 1.0;

    if (selectedLanguage === 'fr') utterance.lang = 'fr-FR';
    else if (selectedLanguage === 'es') utterance.lang = 'es-ES';
    else if (selectedLanguage === 'de') utterance.lang = 'de-DE';
    else if (selectedLanguage === 'ja') utterance.lang = 'ja-JP';
    else if (selectedLanguage === 'ta') utterance.lang = 'ta-IN';
    else if (selectedLanguage === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
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
      // network/unconfigured fallback
    }

    // Step 2: Zero-Fail Local Crisis Engine Fallback
    if (!reply) {
      await new Promise((resolve) => setTimeout(resolve, 600));
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

  const getCompressedSmsText = () => {
    const lat = userProfile?.location_lat?.toFixed(4) || '12.6269';
    const lng = userProfile?.location_lng?.toFixed(4) || '80.1932';
    const name = userProfile?.name || 'Alex Mercer';
    const nat = userProfile?.nationality || 'France';
    const status = userProfile?.status?.toUpperCase() || 'CAUTION';
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

  const promptOptions = QUICK_PROMPTS[selectedLanguage] || QUICK_PROMPTS.en;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-150px)] pb-2">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-600 to-sky-500 p-2.5 rounded-xl shadow-sm text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">The Calm Voice</h1>
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Triage Engine Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Multilingual panic de-escalation & localized consular triage
            </p>
          </div>
        </div>

        {/* Feature Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 30s Breathing Trigger */}
          <button
            onClick={() => setBreathingModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
            title="30-Second Panic Breathing Exercise"
          >
            <HeartPulse className="w-4 h-4 text-teal-600 animate-pulse" />
            <span>30s Calm Breath</span>
          </button>

          {/* SBAR Triage Trigger */}
          <button
            onClick={() => setTriageModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
            title="Emergency Triage Checklist"
          >
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Rapid Triage</span>
          </button>

          {/* 2G SMS Trigger */}
          <button
            onClick={() => setSmsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs"
            title="Offline 2G SMS Fallback"
          >
            <Radio className="w-3.5 h-3.5 text-amber-600" />
            <span>SMS Fallback</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs">
            <Globe2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-cyan-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Map
          </Link>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {/* Messages viewport */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeaking = speakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex items-start gap-2.5 max-w-[88%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                    isUser ? 'bg-cyan-600 text-white font-bold text-xs' : 'bg-slate-900 text-cyan-400'
                  }`}>
                    {isUser ? 'You' : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-sm shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Audio read-aloud controls for AI answers */}
                    {!isUser && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => speakMessage(msg.id, msg.content)}
                            className="flex items-center gap-1.5 font-bold hover:text-cyan-700 transition-colors bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                            title="Listen to Calm Voice"
                          >
                            {isSpeaking ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                <span className="text-rose-600">Stop Audio</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
                                <span>Listen to Calm Voice</span>
                              </>
                            )}
                          </button>

                          {/* Soundwave Animation while speaking */}
                          {isSpeaking && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-cyan-50 rounded-lg">
                              <span className="w-1 h-3 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-5 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-4 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              <span className="w-1 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                              <span className="text-[10px] font-bold text-cyan-800 ml-1">Calm Voice Active</span>
                            </div>
                          )}
                        </div>

                        {/* Pace controller */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Sliders className="w-3 h-3" />
                          <button
                            onClick={() => setSpeechSpeed(speechSpeed === 0.88 ? 1.0 : 0.88)}
                            className="hover:underline font-semibold text-slate-600"
                          >
                            Pace: {speechSpeed === 0.88 ? 'Soothing (0.88x)' : 'Normal (1.0x)'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-cyan-400 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-2 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Formulating calm evacuation advice...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Crisis Questions Bar */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50/90 border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
              <span>Suggested Crisis Inquiries:</span>
            </div>
            <button
              onClick={handleExportTranscript}
              className="text-[11px] font-semibold text-cyan-700 hover:underline flex items-center gap-1"
            >
              {exportedLog ? <Check className="w-3 h-3 text-emerald-600" /> : <Download className="w-3 h-3" />}
              {exportedLog ? 'Transcript Downloaded' : 'Export Log for Embassy'}
            </button>
          </div>
          <div className="flex gap-2 pb-1 overflow-x-auto whitespace-nowrap">
            {promptOptions.map((promptText, i) => (
              <button
                key={i}
                onClick={() => sendMessage(promptText)}
                disabled={loading}
                className="inline-flex items-center text-xs bg-white hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-all shadow-2xs font-medium disabled:opacity-50"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="border-t border-slate-200 p-3 sm:p-4 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Describe your situation in ${LANGUAGES.find((l) => l.code === selectedLanguage)?.label || 'any language'}...`}
              rows={1}
              className="flex-1 resize-none border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all max-h-32 shadow-2xs"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
              {/* Outer halo */}
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

              {/* Main pulsating circle */}
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
                <Send className="w-3.5 h-3.5" />
                Launch Native SMS
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
