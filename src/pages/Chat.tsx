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
  MapPin,
  CheckCircle2,
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
];

const QUICK_PROMPTS: Record<string, string[]> = {
  en: [
    'Where is the nearest verified shelter?',
    'Is East Coast Road passable to Chennai airport?',
    'I lost my passport and travel documents in the flood.',
    'I have two children with me, should we evacuate or stay?',
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
  ],
  de: [
    'Wo ist die nächste sichere Notunterkunft?',
    'Ist die Straße zum Flughafen Chennai befahrbar?',
  ],
  ja: [
    '最寄りの高台避難所はどこですか？',
    'チェンナイ空港への道路は通行可能ですか？',
  ],
  ta: [
    'அருகிலுள்ள புயல் நிவாரண முகாம் எங்குள்ளது?',
    'சென்னை விமான நிலையத்திற்கான சாலை பாதுகாப்பானதா?',
  ],
};

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<SafePassUser | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userId = localStorage.getItem('safepass_user_id');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    // Check if speech synthesis is available
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
          ? `Bonjour Alex. Je suis votre guide de crise SafePass en liaison avec le Consulat à Chennai.

Prenez une respiration calme. Vous êtes actuellement localisé à Mahabalipuram (Zone Côtière sous Alerte Cyclone Niveau 3).

Je suis là pour vous accompagner pas à pas. Décrivez-moi votre situation ou choisissez une question rapide ci-dessous.`
          : `Hello ${profile.name.split(' ')[0]}. I am SafePass, your calm crisis companion.

Take a steady breath. I have your location logged at ${profile.location_label || 'Mahabalipuram / Coastal Kancheepuram'}. 

I am here to guide you step-by-step through current cyclone conditions. Tell me what you see around you, or tap a quick question below.`,
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
    utterance.rate = 0.92; // Slightly slower, reassuring pace
    utterance.pitch = 1.0;

    // Pick appropriate language voice if available
    if (selectedLanguage === 'fr') utterance.lang = 'fr-FR';
    else if (selectedLanguage === 'es') utterance.lang = 'es-ES';
    else if (selectedLanguage === 'de') utterance.lang = 'de-DE';
    else if (selectedLanguage === 'ja') utterance.lang = 'ja-JP';
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
      await new Promise((resolve) => setTimeout(resolve, 600)); // Natural response cadence
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

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  const promptOptions = QUICK_PROMPTS[selectedLanguage] || QUICK_PROMPTS.en;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-600 to-sky-500 p-2.5 rounded-2xl shadow-sm text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">The Calm Voice</h1>
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Crisis AI Ready
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              Multilingual panic triage & localized guidance
            </p>
          </div>
        </div>

        {/* Controls: Language Selector & Back to Dashboard */}
        <div className="flex items-center gap-2">
          {/* Language Picker */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1.5 shadow-sm text-xs text-white">
            <Globe2 className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent font-semibold text-white outline-none cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-neutral-800 text-white">
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs font-semibold text-white hover:text-cyan-400 bg-neutral-900 border border-neutral-700 hover:border-cyan-500 px-3 py-2 rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
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
                <div className={`flex items-start gap-2.5 max-w-[85%] sm:max-w-[78%] ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                    isUser ? 'bg-cyan-600 text-white font-bold text-xs' : 'bg-slate-800 text-cyan-400'
                  }`}>
                    {isUser ? 'You' : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-sm shadow-sm'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-sm shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Audio read-aloud button for AI answers */}
                    {!isUser && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
                        <button
                          onClick={() => speakMessage(msg.id, msg.content)}
                          className="flex items-center gap-1.5 hover:text-cyan-600 font-medium transition-colors"
                          title="Listen with Calm Voice"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span className="text-amber-600 font-bold">Stop Calm Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen to Calm Voice</span>
                            </>
                          )}
                        </button>
                        <span className="text-[11px] text-slate-400">Verified Crisis Protocol</span>
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Assessing safety protocols...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Question Chips Bar */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50/80 border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
            <span className="font-semibold">Quick Crisis Inquiries:</span>
          </div>
          <div className="flex gap-2 pb-1 overflow-x-auto whitespace-nowrap">
            {promptOptions.map((promptText, i) => (
              <button
                key={i}
                onClick={() => sendMessage(promptText)}
                disabled={loading}
                className="inline-flex items-center text-xs bg-white hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-all shadow-sm font-medium disabled:opacity-50"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="border-t border-slate-200 p-3 sm:p-4 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Describe your situation in ${LANGUAGES.find((l) => l.code === selectedLanguage)?.label || 'any language'}...`}
              rows={1}
              className="flex-1 resize-none border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all max-h-32"
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
              <Phone className="w-3 h-3 text-red-500" /> For life-threatening emergency, dial 112 directly.
            </span>
            <span className="hidden sm:inline font-mono">End-to-End Triage Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
