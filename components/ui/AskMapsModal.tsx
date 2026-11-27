"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  RotateCcw,
  Sparkles,
  Bookmark,
  History,
  Send,
  MapPin,
  Bot,
  Mic,
  MicOff,
  Star,
  User,
  Edit3,
  Train,
  Trash2,
  Navigation,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Brain,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
} from "lucide-react";
import { AreaIntelligenceData, LandmarkLocation } from "@/types/map";
import { getSavedLandmarks, toggleLandmarkSaved } from "@/lib/bookmarks";

interface AskMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlyToCoords?: (coords: [number, number]) => void;
  currentLocationName?: string;
  userCoordinates?: [number, number] | null;
  selectedLandmark?: LandmarkLocation | null;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  thoughtDuration?: string;
  thoughtSteps?: string[];
  data?: AreaIntelligenceData;
  feedback?: "up" | "down";
}

interface SpeechEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } };
  error?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechEvent) => void) | null;
  onend: (() => void) | null;
}

export function AskMapsModal({
  isOpen,
  onClose,
  onFlyToCoords,
  currentLocationName = "Delhi",
  userCoordinates,
  selectedLandmark,
}: AskMapsModalProps) {
  const [activeTab, setActiveTab] = useState<"ask" | "saved" | "recents">("ask");
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingTimer, setThinkingTimer] = useState(0);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [userName, setUserName] = useState<string>("Explorer");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [savedPlaces, setSavedPlaces] = useState<LandmarkLocation[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [expandedThoughtId, setExpandedThoughtId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync Saved Places
  useEffect(() => {
    const refreshSaved = () => {
      try {
        setSavedPlaces(getSavedLandmarks());
      } catch {
        setSavedPlaces([]);
      }
    };
    refreshSaved();
    window.addEventListener("delhi_bookmarks_changed", refreshSaved);
    return () => window.removeEventListener("delhi_bookmarks_changed", refreshSaved);
  }, []);

  // Sync Recent Queries
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("delhi_explorer_recent_queries");
        if (stored) {
          setRecentQueries(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Failed to load recents:", err);
      }
    }
  }, []);

  const saveRecentQuery = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    try {
      const stored = localStorage.getItem("delhi_explorer_recent_queries");
      const list: string[] = stored ? JSON.parse(stored) : [];
      const updated = [clean, ...list.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 15);
      localStorage.setItem("delhi_explorer_recent_queries", JSON.stringify(updated));
      setRecentQueries(updated);
    } catch (err) {
      console.warn("Failed to save recent query:", err);
    }
  };

  const clearRecentQueries = () => {
    try {
      localStorage.removeItem("delhi_explorer_recent_queries");
      setRecentQueries([]);
    } catch (err) {
      console.warn("Failed to clear recents:", err);
    }
  };

  // Sync User Name
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("delhi_explorer_user_name");
      if (saved && saved.trim()) {
        setUserName(saved.trim());
      }
    }
  }, []);

  // Thinking timer ticker
  useEffect(() => {
    if (isLoading) {
      setThinkingTimer(0);
      setThinkingStage(0);
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setThinkingTimer(parseFloat(elapsed.toFixed(1)));
        if (elapsed < 1.2) {
          setThinkingStage(0);
        } else if (elapsed < 2.5) {
          setThinkingStage(1);
        } else {
          setThinkingStage(2);
        }
      }, 100);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isLoading]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (tempName.trim()) {
      const cleanName = tempName.trim();
      setUserName(cleanName);
      if (typeof window !== "undefined") {
        localStorage.setItem("delhi_explorer_user_name", cleanName);
      }
    }
    setIsEditingName(false);
  };

  // Speech Recognition for Voice Q&A
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const SpeechRecognitionConstructor =
          (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
          (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

        if (SpeechRecognitionConstructor) {
          const recognition = new SpeechRecognitionConstructor();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = "en-IN";

          recognition.onstart = () => setIsListening(true);
          recognition.onresult = (event: SpeechEvent) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript) {
              setInputQuery(transcript);
            }
            setIsListening(false);
          };
          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);
          recognitionRef.current = recognition;
        }
      } catch (err) {
        console.warn("Speech recognition skipped in Ask Maps:", err);
      }
    }
  }, []);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome/Edge or type manually.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Mic start error:", err);
        setIsListening(false);
      }
    }
  };

  // Dynamic Location-Aware Suggestions Across India
  const locationSuggestions = useMemo(() => {
    const loc = (currentLocationName || "").toLowerCase();

    if (selectedLandmark) {
      return [
        { text: `What is the history of ${selectedLandmark.name}?`, category: "places", badge: "Selected", icon: "🏛️" },
        { text: `Nearest metro & best route to ${selectedLandmark.name}`, category: "transit", badge: "Route", icon: "🚇" },
        { text: `Best street food & cafes near ${selectedLandmark.name}`, category: "food", badge: "Dining", icon: "🍲" },
        { text: `Entry ticket, timings & tips for ${selectedLandmark.name}`, category: "tips", badge: "Info", icon: "🎫" },
        { text: `Top monuments to visit near ${selectedLandmark.name}`, category: "places", badge: "Nearby", icon: "📍" },
        { text: `Best photo spots around ${selectedLandmark.name}`, category: "tips", badge: "Photo", icon: "📸" },
      ];
    }

    if (loc.includes("bhopal")) {
      return [
        { text: "Best street food in Bhopal (Poha Jalebi & Chatori Gali)", category: "food", badge: "Trending", icon: "🍛" },
        { text: "Top attractions around Upper Lake (Bada Talab) & Van Vihar", category: "places", badge: "Popular", icon: "🏞️" },
        { text: "Historic guide to Taj-ul-Masajid & Shaukat Mahal", category: "places", badge: "Heritage", icon: "🕌" },
        { text: "How to travel from Bhopal to Delhi (Vande Bharat route)?", category: "transit", badge: "Express", icon: "🚅" },
        { text: "Evening sunset cafes on VIP Road & Boat Club", category: "food", badge: "Scenic", icon: "☕" },
        { text: "Best shopping markets in Bhopal for Zari & handicrafts", category: "tips", badge: "Shopping", icon: "🛍️" },
      ];
    }

    if (loc.includes("mumbai") || loc.includes("kurla") || loc.includes("bandra")) {
      return [
        { text: "Best street food in Mumbai (Vada Pav, Pav Bhaji & Chowpatty)", category: "food", badge: "Trending", icon: "🍔" },
        { text: "Top places near Marine Drive & Gateway of India", category: "places", badge: "Popular", icon: "🌊" },
        { text: "How to navigate Mumbai Local train & Metro lines?", category: "transit", badge: "Transit", icon: "🚆" },
        { text: "Scenic evening sea-facing cafes in Bandra", category: "food", badge: "Scenic", icon: "☕" },
        { text: "How far is Delhi from Mumbai & fastest trains?", category: "transit", badge: "Route", icon: "🚅" },
        { text: "Must-visit heritage spots in South Mumbai", category: "places", badge: "Heritage", icon: "🏛️" },
      ];
    }

    if (loc.includes("bengaluru") || loc.includes("bangalore")) {
      return [
        { text: "Best South Indian breakfast & Filter Coffee in Bengaluru", category: "food", badge: "Trending", icon: "☕" },
        { text: "Top heritage parks in Bengaluru (Lalbagh & Cubbon Park)", category: "places", badge: "Popular", icon: "🌳" },
        { text: "How to navigate Namma Metro Purple & Green lines?", category: "transit", badge: "Metro", icon: "🚇" },
        { text: "Famous breweries & cafes in Indiranagar & Koramangala", category: "food", badge: "Dining", icon: "🥗" },
        { text: "Guide to Bangalore Palace & Tipu Sultan's Palace", category: "places", badge: "Heritage", icon: "🏰" },
        { text: "Fastest way to Kempegowda Airport (KIA Vayu Vajra)", category: "transit", badge: "Airport", icon: "✈️" },
      ];
    }

    if (loc.includes("jaipur")) {
      return [
        { text: "Must-visit forts in Jaipur (Amer Fort & Nahargarh)", category: "places", badge: "Must Visit", icon: "🏰" },
        { text: "Authentic Rajasthani Dal Baati Churma & Pyaz Kachori spots", category: "food", badge: "Trending", icon: "🍛" },
        { text: "Photography tips & best timings for Hawa Mahal", category: "tips", badge: "Photo", icon: "📸" },
        { text: "Best traditional markets in Jaipur (Johari & Bapu Bazar)", category: "tips", badge: "Shopping", icon: "🛍️" },
      ];
    }

    const cityName = currentLocationName && currentLocationName !== "Delhi" ? currentLocationName : "Delhi";
    if (cityName === "Delhi") {
      return [
        { text: "Where is OpenSense Labs in Delhi NCR?", category: "places", badge: "Tech Hub", icon: "🏢" },
        { text: "Best authentic street food in Chandni Chowk", category: "food", badge: "Must Try", icon: "🍲" },
        { text: "How to reach Qutub Minar by metro?", category: "transit", badge: "Transit", icon: "🚇" },
        { text: "Top evening cafes & heritage walk in Connaught Place", category: "food", badge: "Dining", icon: "☕" },
        { text: "Plan a 1-day itinerary of historic monuments", category: "places", badge: "Tour", icon: "🏛️" },
        { text: "Best budget shopping markets (Sarojini & Janpath)", category: "tips", badge: "Bargain", icon: "🛍️" },
      ];
    }

    return [
      { text: `Top tourist attractions & heritage landmarks in ${cityName}`, category: "places", badge: "Popular", icon: "🏛️" },
      { text: `Famous local street food & best dining spots in ${cityName}`, category: "food", badge: "Foodie", icon: "🍲" },
      { text: `Transit options, nearest railway station & airport in ${cityName}`, category: "transit", badge: "Transit", icon: "🚆" },
      { text: `Best time of year to visit ${cityName} & weather guide`, category: "tips", badge: "Guide", icon: "🌤️" },
      { text: `Scenic sunset viewpoints & evening hangout spots in ${cityName}`, category: "places", badge: "Scenic", icon: "🌅" },
      { text: `Fastest travel routes and distance from ${cityName} to Delhi`, category: "transit", badge: "Route", icon: "🚗" },
    ];
  }, [currentLocationName, selectedLandmark]);

  const filteredSuggestions = useMemo(() => {
    if (selectedCategory === "all") return locationSuggestions;
    return locationSuggestions.filter((s) => s.category === selectedCategory);
  }, [locationSuggestions, selectedCategory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleSendQuery = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || isLoading) return;

    saveRecentQuery(q);

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const res = await fetch("/api/ai-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuery: q,
          currentLocation: currentLocationName,
          coordinates: userCoordinates,
        }),
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: "ai-" + Date.now(),
          sender: "ai",
          text: data.aiCopilotData?.directAnswer || "Information is currently unavailable.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thoughtDuration: `${elapsed}s`,
          thoughtSteps: [
            `Interpreted query context for: ${currentLocationName}`,
            `Fetched geospatial index & verified transit routes`,
            `Synthesized concise recommendations in fluent English`,
          ],
          data: data.aiCopilotData,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error("API request failed");
      }
    } catch {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const errorMsg: ChatMessage = {
        id: "ai-err-" + Date.now(),
        sender: "ai",
        text: "I apologize, but I encountered an issue fetching information. Please try asking again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thoughtDuration: `${elapsed}s`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setMessages([]);
    setInputQuery("");
  };

  const handleCopyText = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const handleSpeakText = (text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (id: string, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, feedback: type } : m))
    );
  };

  const thinkingStagesText = [
    `Analyzing location context for ${currentLocationName}...`,
    `Searching regional database & OpenStreetMap transit nodes...`,
    `Synthesizing travel advice & insider tips...`,
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
      />

      {/* Responsive AI Copilot Panel */}
      <div className="fixed top-0 left-0 bottom-0 w-full sm:w-[480px] max-w-[100vw] bg-[#f8fafc] dark:bg-[#1a1c1e] text-slate-800 dark:text-slate-100 z-50 shadow-2xl flex flex-row animate-in slide-in-from-left duration-250 border-r border-slate-200/90 dark:border-slate-800 overflow-hidden">
        
        {/* Desktop Side Rail (Hidden on mobile to provide 100% width) */}
        <aside className="hidden sm:flex w-16 border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 flex-col items-center py-4 justify-between shrink-0 select-none">
          <div className="flex flex-col items-center gap-5 w-full">
            <button
              onClick={() => setActiveTab("ask")}
              title="Ask AI"
              className={`flex flex-col items-center gap-1 w-full py-1 text-center transition-colors ${
                activeTab === "ask"
                  ? "text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "ask"
                    ? "bg-blue-100 dark:bg-blue-950/80 shadow-xs ring-1 ring-blue-500/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] tracking-tight">Ask AI</span>
            </button>

            <button
              onClick={() => setActiveTab("saved")}
              title="Saved Places"
              className={`flex flex-col items-center gap-1 w-full py-1 text-center transition-colors ${
                activeTab === "saved"
                  ? "text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "saved"
                    ? "bg-blue-100 dark:bg-blue-950/80 shadow-xs ring-1 ring-blue-500/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Bookmark className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] tracking-tight">Saved</span>
            </button>

            <button
              onClick={() => setActiveTab("recents")}
              title="Recent Searches"
              className={`flex flex-col items-center gap-1 w-full py-1 text-center transition-colors ${
                activeTab === "recents"
                  ? "text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-400 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "recents"
                    ? "bg-blue-100 dark:bg-blue-950/80 shadow-xs ring-1 ring-blue-500/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <History className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] tracking-tight">Recents</span>
            </button>
          </div>

          <div className="flex flex-col items-center text-center select-none group">
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_2px_10px_rgba(37,99,235,0.35)] group-hover:scale-105 transition-all">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 tracking-tight">
              AI Guide
            </span>
          </div>
        </aside>

        {/* Main Panel Content (100% full width on mobile) */}
        <div className="flex-1 flex flex-col h-full bg-[#f8fafc] dark:bg-[#1a1c1e] overflow-hidden">
          
          {/* Header Bar */}
          <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/90 px-3.5 sm:px-4 flex items-center justify-between bg-white dark:bg-[#202124] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4.5 h-4.5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                  Delhi Explorer AI
                </h1>
                <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate">
                  <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                  <span className="truncate">{currentLocationName || "India"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {messages.length > 0 && (
                <button
                  onClick={handleResetChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                title="Close AI Assistant"
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Mobile Tabs Switcher (Shown only on mobile screens) */}
          <div className="sm:hidden flex items-center justify-around border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-2 py-1.5 shrink-0">
            <button
              onClick={() => setActiveTab("ask")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === "ask"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === "saved"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved {savedPlaces.length > 0 && `(${savedPlaces.length})`}</span>
            </button>
            <button
              onClick={() => setActiveTab("recents")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activeTab === "recents"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Recents</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 scrollbar-thin">
            {activeTab === "ask" ? (
              <>
                {messages.length === 0 ? (
                  /* Welcome Screen & Fast Suggestions */
                  <div className="flex flex-col items-center text-center pt-3 pb-2 space-y-4 animate-in fade-in duration-300">
                    <div className="w-full">
                      {isEditingName ? (
                        <form
                          onSubmit={handleSaveName}
                          className="flex items-center gap-2 bg-white dark:bg-[#202124] p-1.5 px-3 rounded-2xl border-2 border-blue-500 shadow-md animate-in fade-in max-w-[280px] mx-auto"
                        >
                          <User className="w-4 h-4 text-blue-600 shrink-0" />
                          <input
                            type="text"
                            placeholder="Enter your name..."
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs"
                          >
                            Save
                          </button>
                        </form>
                      ) : (
                        <div
                          className="inline-flex items-center gap-1.5 group cursor-pointer"
                          onClick={() => {
                            setTempName(userName);
                            setIsEditingName(true);
                          }}
                          title="Click to customize your Explorer name"
                        >
                          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                            Hi, {userName}
                          </h2>
                          <span className="p-1 rounded-full text-slate-400 group-hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Ask anything about attractions, transit & food in{" "}
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {currentLocationName}
                        </span>
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar justify-start py-0.5">
                      {[
                        { id: "all", label: "All", icon: "✨" },
                        { id: "places", label: "Sights", icon: "🏛️" },
                        { id: "food", label: "Food", icon: "🍲" },
                        { id: "transit", label: "Transit", icon: "🚇" },
                        { id: "tips", label: "Tips", icon: "💡" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                            selectedCategory === cat.id
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-white dark:bg-[#202124] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Compact Suggestion Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
                      {filteredSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendQuery(s.text)}
                          className="p-3 rounded-2xl bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-start gap-2.5 active:scale-[0.98] group shadow-2xs"
                        >
                          <span className="text-base shrink-0 p-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/50">
                            {s.icon || "📍"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug block line-clamp-2">
                              {s.text}
                            </span>
                            {s.badge && (
                              <span className="inline-block mt-1.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {s.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Conversation Thread */
                  <div className="space-y-3.5 pb-2">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.sender === "user" ? "items-end" : "items-start"
                        } animate-in fade-in duration-200`}
                      >
                        {m.sender === "user" ? (
                          <div className="max-w-[85%] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs shadow-sm font-medium leading-relaxed">
                            {m.text}
                          </div>
                        ) : (
                          <div className="max-w-[96%] w-full bg-white dark:bg-[#202124] border border-slate-200/90 dark:border-slate-800 rounded-2xl rounded-tl-xs p-3.5 text-xs shadow-sm space-y-2.5 text-slate-800 dark:text-slate-100">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                              <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                                <div className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-2xs">
                                  <Bot className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-extrabold">Delhi Explorer AI</span>
                              </div>

                              {m.thoughtDuration && (
                                <button
                                  onClick={() =>
                                    setExpandedThoughtId(
                                      expandedThoughtId === m.id ? null : m.id
                                    )
                                  }
                                  className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200/70 dark:border-slate-700/60 transition-colors"
                                  title="View AI reasoning steps"
                                >
                                  <Brain className="w-3 h-3 text-indigo-500" />
                                  <span>Thought for {m.thoughtDuration}</span>
                                  {expandedThoughtId === m.id ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>

                            {expandedThoughtId === m.id && m.thoughtSteps && (
                              <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-[11px] animate-in fade-in duration-200">
                                <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                  <Brain className="w-3 h-3 text-indigo-500" />
                                  <span>AI Reasoning:</span>
                                </div>
                                {m.thoughtSteps.map((step, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300"
                                  >
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    <span>{step}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Render Answer Text with Clean Markdown formatting */}
                            <div className="leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200 text-xs sm:text-[13px] space-y-1">
                              {m.text}
                            </div>

                            {m.data && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                  {m.data.rating && (
                                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                                      <span>{m.data.rating}</span>
                                      {m.data.reviewsCount && (
                                        <span className="text-slate-400 font-normal text-[10px]">
                                          ({m.data.reviewsCount})
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {m.data.safetyScore && (
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                      🛡️ Safety: {m.data.safetyScore}
                                    </div>
                                  )}
                                </div>

                                {m.data.coordinates && onFlyToCoords && (
                                  <button
                                    onClick={() => {
                                      if (m.data?.coordinates) {
                                        onFlyToCoords(m.data.coordinates);
                                        onClose();
                                      }
                                    }}
                                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                                  >
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>View on Map</span>
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCopyText(m.text, m.id)}
                                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-[10px]"
                                  title="Copy response"
                                >
                                  {copiedMsgId === m.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-600 font-bold">Copied</span>
                                    </>
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleSpeakText(m.text, m.id)}
                                  className={`p-1 rounded-lg transition-colors flex items-center gap-1 text-[10px] ${
                                    speakingMsgId === m.id
                                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 font-bold animate-pulse"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  }`}
                                  title={speakingMsgId === m.id ? "Stop reading" : "Read aloud (English)"}
                                >
                                  {speakingMsgId === m.id ? (
                                    <>
                                      <VolumeX className="w-3 h-3 text-rose-600" />
                                      <span>Stop</span>
                                    </>
                                  ) : (
                                    <Volume2 className="w-3 h-3" />
                                  )}
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleFeedback(m.id, "up")}
                                  className={`p-1 rounded-lg transition-colors ${
                                    m.feedback === "up"
                                      ? "text-blue-600 bg-blue-50 dark:bg-blue-950/60 font-bold"
                                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  }`}
                                  title="Helpful response"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Follow up:
                              </span>
                              {[
                                "🚇 Nearest transit route",
                                "🍲 Best nearby food spots",
                                "🕒 Best time to visit",
                              ].map((fUp, fIdx) => (
                                <button
                                  key={fIdx}
                                  onClick={() => handleSendQuery(fUp)}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-600 hover:text-blue-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 transition-colors"
                                >
                                  {fUp}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                          {m.timestamp}
                        </span>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="max-w-[94%] bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 dark:from-slate-800/90 dark:via-indigo-950/40 dark:to-slate-800/90 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-3.5 shadow-xs space-y-2.5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                              <Brain className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                            </div>
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                              <span>Thinking...</span>
                              <span className="inline-flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                              </span>
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-blue-200/60 shadow-2xs">
                            {thinkingTimer}s
                          </span>
                        </div>

                        <div className="space-y-1.5 pl-8">
                          <div className="text-xs text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                            <span>{thinkingStagesText[thinkingStage]}</span>
                          </div>
                          <div className="w-full h-1.5 bg-blue-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 animate-pulse w-3/4 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </>
            ) : activeTab === "saved" ? (
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Saved Places ({savedPlaces.length})
                  </h3>
                  <span className="text-[10px] text-slate-400">Offline Bookmarks</span>
                </div>

                {savedPlaces.length === 0 ? (
                  <div className="p-8 text-center space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                      No Saved Places Yet
                    </h3>
                    <p className="text-xs text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                      Tap the bookmark icon on any landmark card or map pin to save places here for 1-click access!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {savedPlaces.map((loc) => (
                      <div
                        key={loc.id}
                        className="p-3 rounded-2xl bg-white dark:bg-[#202124] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3 group hover:border-blue-300 transition-all"
                      >
                        {loc.imageUrl ? (
                          <div className="w-13 h-13 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={loc.imageUrl}
                              alt={loc.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {loc.rating && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-bold text-amber-300 text-center py-0.2">
                                ★ {loc.rating}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-13 h-13 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-lg shrink-0">
                            🏛️
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {loc.name}
                          </h4>
                          {loc.metroStation && (
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5 truncate">
                              <Train className="w-3 h-3 shrink-0" />
                              <span className="truncate">{loc.metroStation}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 shrink-0">
                          {onFlyToCoords && (
                            <button
                              onClick={() => {
                                onFlyToCoords(loc.coordinates);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs"
                              title="Fly to on map"
                            >
                              <Navigation className="w-2.5 h-2.5" />
                              <span>View</span>
                            </button>
                          )}
                          <button
                            onClick={() => toggleLandmarkSaved(loc.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[10px] flex items-center justify-center transition-colors"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Recent Questions ({recentQueries.length})
                  </h3>
                  {recentQueries.length > 0 && (
                    <button
                      onClick={clearRecentQueries}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {recentQueries.length === 0 ? (
                  <div className="p-8 text-center space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                      No Recent Searches Yet
                    </h3>
                    <p className="text-xs text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                      Questions you ask in the AI Copilot will appear here so you can re-ask them with one tap!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentQueries.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveTab("ask");
                          handleSendQuery(q);
                        }}
                        className="w-full p-3 rounded-2xl bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 text-left flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <History className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600">
                            {q}
                          </span>
                        </div>
                        <span className="text-xs text-slate-300 group-hover:text-blue-500 font-bold shrink-0">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Chat Input Bar */}
          {activeTab === "ask" && (
            <div className="p-2.5 sm:p-3.5 bg-white dark:bg-[#202124] border-t border-slate-200/80 dark:border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery(inputQuery);
                }}
                className="bg-[#f1f3f4] dark:bg-slate-800 rounded-3xl p-1.5 pl-3.5 pr-1.5 flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60 shadow-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-[#202124] transition-all"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    isListening
                      ? "Listening... Speak now"
                      : `Ask about ${currentLocationName || "Delhi"} places, food, transit...`
                  }
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  title={isListening ? "Listening... click to stop" : "Speak question"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isListening
                      ? "bg-rose-500 text-white animate-bounce shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs"
                  title="Send query"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
