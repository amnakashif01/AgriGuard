'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Maximize2, Minimize2, Bot, User, Leaf, Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════
   KNOWLEDGE SECTIONS — parsed from knowledge.md
   ═══════════════════════════════════════════ */

interface KnowledgeEntry {
    keywords: string[];
    answer: string;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
    {
        keywords: ['what is agriguard', 'what is agrisahayak', 'about this project', 'about agriguard', 'what is this', 'tell me about', 'project info', 'what does this app do', 'what is this app', 'what is this website', 'introduce'],
        answer: 'AgriGuard (also known as AgriSahayak, meaning "Agriculture Helper") is an AI-powered agricultural assistant web application built specifically for Pakistani farmers. It uses a multi-agent AI system powered by Google Gemini AI and Firebase Genkit to help farmers diagnose crop diseases, receive personalized treatment plans, find nearby suppliers, and get proactive weather alerts. It was developed by Ayesha and Amna as their Final Year Project (FYP).'
    },
    {
        keywords: ['problem', 'challenge', 'why was it built', 'what problem', 'solve', 'issue', 'purpose'],
        answer: 'AgriGuard solves critical challenges faced by Pakistani farmers: 30-40% crop loss due to delayed disease detection, only 1 agricultural expert per 5,000 farmers, 2-3 day wait for expert consultation, 70% language barrier (farmers speak Urdu/Punjabi, not English), and approximately $3 billion in annual losses due to crop diseases in Pakistan. AgriGuard provides instant AI diagnosis in under 3 seconds with bilingual support.'
    },
    {
        keywords: ['how does it work', 'how it works', 'workflow', 'process', 'steps', 'how to use', 'how can i use', 'how do i use', 'usage', 'guide'],
        answer: 'Here\'s how AgriGuard works:\n\n1️⃣ Login — Sign in with your phone number using OTP verification (+92 Pakistan prefix).\n2️⃣ Dashboard — View your recent reports, weather alerts, and key statistics.\n3️⃣ Create Report — Upload a crop photo (PNG/JPG, max 10MB) and describe symptoms.\n4️⃣ AI Analysis — The AI analyzes your image in 2-3 seconds, identifying the disease with 85%+ accuracy.\n5️⃣ Treatment Plan — Get step-by-step treatment with local product names and costs in PKR.\n6️⃣ Find Suppliers — Locate nearby agricultural suppliers within 50km.\n7️⃣ Weather Alerts — Receive automatic weather monitoring every 6 hours.'
    },
    {
        keywords: ['features', 'what can it do', 'capabilities', 'functionality', 'functions'],
        answer: 'AgriGuard offers these key features:\n\n📸 Instant AI Diagnosis — Crop disease identification in 2-3 seconds.\n🎯 85%+ Accuracy — Using Gemini Vision AI.\n💊 Treatment Plans — Step-by-step protocols with local product names and PKR costs.\n🛒 Smart Marketplace — Find suppliers within 50km radius.\n🌦️ Weather Alerts — Proactive monitoring every 6 hours.\n🗣️ Bilingual Support — Full English and Urdu support.\n📱 Mobile-First Design — Works on all devices.\n🔐 Secure Authentication — Phone OTP with reCAPTCHA.'
    },
    {
        keywords: ['crop', 'crops', 'what crops', 'supported crops', 'which crops', 'crop type'],
        answer: 'AgriGuard can analyze any crop image, but it has preset support for the most common crops in Pakistan: Cotton, Wheat, Rice, Sugarcane, and Maize. You can select your crop type when creating a diagnosis report, or let the AI auto-detect it.'
    },
    {
        keywords: ['accuracy', 'how accurate', 'reliable', 'precision', 'confidence'],
        answer: 'The AI diagnosis achieves 85% or higher accuracy using Google Gemini 2.0 Flash Vision combined with a RAG (Retrieval-Augmented Generation) knowledge base. Each diagnosis includes a confidence score so you can see how certain the AI is about its identification.'
    },
    {
        keywords: ['language', 'urdu', 'english', 'bilingual', 'translation', 'hindi'],
        answer: 'AgriGuard supports both English and Urdu. You can set your preferred language in your Profile settings. Treatment plans, diagnosis results, and the interface can all be displayed in your chosen language.'
    },
    {
        keywords: ['diagnosis', 'diagnose', 'detect', 'disease', 'analyze', 'scan', 'identify', 'analysis'],
        answer: 'To get a crop diagnosis:\n\n1. Go to "New Report" from the sidebar or dashboard.\n2. Upload a clear photo of your crop (PNG/JPG, max 10MB).\n3. Describe the symptoms you\'ve observed.\n4. The AI analyzes your image in 2-3 seconds.\n5. You receive: disease name, confidence score, severity level (None/Low/Medium/High), affected parts, and a detailed description.\n\nFor best results, ensure good lighting and clear focus when photographing your crops.'
    },
    {
        keywords: ['treatment', 'treatment plan', 'cure', 'medicine', 'remedy', 'protocol', 'fix'],
        answer: 'After diagnosis, AgriGuard generates a personalized treatment plan that includes:\n\n• Step-by-step protocols with timing (Day 1, Day 3, Week 2)\n• Local Pakistani product names (e.g., Confidor 200SL)\n• Costs in PKR (typically Rs. 800-1200 per acre)\n• Application methods in Urdu or English\n• Safety warnings and precautions\n\nThe treatment plan is specific to the identified disease and your crop type.'
    },
    {
        keywords: ['cost', 'price', 'how much', 'expensive', 'free', 'payment', 'charges'],
        answer: 'AgriGuard is completely free to use! It was built as a Final Year Project to help Pakistani farmers. Treatment plan costs shown are estimates for agricultural products (typically Rs. 800-1200 per acre in PKR), not charges for using the app itself.'
    },
    {
        keywords: ['supplier', 'marketplace', 'shop', 'store', 'buy', 'purchase', 'find supplier', 'nearby'],
        answer: 'The Marketplace feature helps you find nearby agricultural suppliers:\n\n• Searches within a 50km radius of your location\n• Uses a three-tier system: Google Places API (primary), OpenStreetMap (secondary), and 8 curated Pakistani companies (backup)\n• Shows distance, ratings, and contact information\n• You can call suppliers directly or reach them via WhatsApp\n\nGo to the Marketplace section from the sidebar to search for suppliers.'
    },
    {
        keywords: ['weather', 'alert', 'forecast', 'rain', 'temperature', 'climate', 'notification'],
        answer: 'AgriGuard provides proactive weather alerts:\n\n• Automatic monitoring every 6 hours\n• Geofenced within a 50km radius of your location\n• Crop-specific recommendations based on weather conditions\n• Push notifications via Firebase Cloud Messaging\n\nWeather alerts appear on your dashboard automatically based on your profile location.'
    },
    {
        keywords: ['login', 'sign in', 'register', 'account', 'sign up', 'authentication', 'otp', 'phone'],
        answer: 'To use AgriGuard, sign in with your phone number:\n\n1. Go to the Login page.\n2. Enter your phone number with Pakistan\'s +92 prefix.\n3. Complete the reCAPTCHA verification.\n4. Receive an OTP code via SMS.\n5. Enter the OTP to verify your identity.\n\nYour account is created automatically on first login. All your reports and data are securely stored.'
    },
    {
        keywords: ['report', 'history', 'past report', 'old report', 'previous', 'view report', 'my reports'],
        answer: 'All your diagnosis reports are saved and accessible from the Dashboard:\n\n• Recent reports appear in a table showing image, crop, diagnosis, status, and date.\n• Reports go through stages: Pending → Processing → Complete (or Error).\n• You can view detailed results by clicking "View Results" on any completed report.\n• If a report failed, use the "Retry AI" button to re-run the diagnosis.\n• Reports persist across sessions — they\'re always available when you log in.'
    },
    {
        keywords: ['technology', 'tech stack', 'built with', 'framework', 'tools', 'stack'],
        answer: 'AgriGuard is built with:\n\n• Frontend: Next.js 15, React 18, TypeScript 5, Tailwind CSS, Shadcn/ui\n• AI: Firebase Genkit, Google Gemini Pro (text), Gemini 2.0 Flash Vision (images), RAG\n• Backend: Firebase Cloud Functions (Node.js 20), Next.js API Routes\n• Database: Firebase Firestore (real-time NoSQL)\n• Auth: Firebase Authentication (Phone OTP + reCAPTCHA)\n• APIs: Google Places API, OpenStreetMap, Weather API'
    },
    {
        keywords: ['who made', 'developer', 'creator', 'built by', 'team', 'developed', 'who created', 'ayesha', 'amna'],
        answer: 'AgriGuard was developed by Ayesha and Amna as their Final Year Project (FYP). It was built for the Innovista Agentic AI Hackathon — Track 2 (Vibe Coding with Firebase Studio).'
    },
    {
        keywords: ['image', 'photo', 'picture', 'format', 'upload', 'file size', 'camera'],
        answer: 'AgriGuard accepts PNG and JPG image formats with a maximum file size of 10MB. For best diagnostic results, ensure good lighting and clear focus when photographing your crops. You can either take a photo with your camera or upload an existing image.'
    },
    {
        keywords: ['mobile', 'phone', 'tablet', 'responsive', 'device', 'android', 'ios'],
        answer: 'Yes! AgriGuard is designed with a mobile-first approach and works on all devices — mobile phones, tablets, and desktop computers. The interface is fully responsive and adapts to any screen size.'
    },
    {
        keywords: ['secure', 'security', 'data', 'privacy', 'safe', 'protection'],
        answer: 'AgriGuard takes security seriously:\n\n• Firebase Authentication with phone OTP and reCAPTCHA\n• Data stored in Firebase Firestore with proper access controls\n• Each user can only access their own reports and data\n• No passwords to remember — phone-based authentication is used\n• All data transmission is encrypted'
    },
    {
        keywords: ['dashboard', 'home page', 'main page', 'overview', 'statistics', 'stats'],
        answer: 'The Dashboard is your main hub after logging in. It shows:\n\n• A welcome greeting with your name\n• Key statistics: Total Reports, Success Rate, High Priority alerts, Monthly activity\n• Recent diagnosis reports with status\n• Weather alerts for your location\n• Notifications panel\n• Quick action buttons for common tasks\n\nFrom the dashboard, you can quickly navigate to create a new report, view the marketplace, update your profile, or access admin features.'
    },
    {
        keywords: ['profile', 'settings', 'preferences', 'update', 'edit profile', 'configure'],
        answer: 'In your Profile page, you can manage:\n\n• Your name\n• Location (city/region)\n• Preferred language (English or Urdu)\n• Crop preferences (select from Cotton, Wheat, Rice, Sugarcane, Maize)\n\nGo to Profile from the sidebar to update your information. Your language preference affects how diagnosis results and treatment plans are presented.'
    },
    {
        keywords: ['agent', 'ai agent', 'multi-agent', 'coordinator', 'orchestrator'],
        answer: 'AgriGuard uses 5 specialized AI agents plus a coordinator:\n\n1. 📸 Image Processing Agent — Gemini 2.0 Flash Vision for crop image analysis\n2. 🔍 Diagnostic Agent — Combines image + symptoms + RAG knowledge base\n3. 💊 Treatment Plan Agent — Generates protocols with local products & PKR costs\n4. 🛒 Marketplace Agent — Finds suppliers using Google Places API + OSM\n5. 🌦️ Weather Alert Agent — Proactive monitoring with geofencing\n6. 🎛️ Coordinator Agent — Orchestrates all agents, manages task queues and priorities'
    },
    {
        keywords: ['retry', 'failed', 'error', 'not working', 'try again'],
        answer: 'If a diagnosis fails, the report status changes to "Error". You can retry by:\n\n1. Go to your Dashboard\n2. Find the failed report in the Recent Reports table\n3. Click the "Retry AI" button next to the report\n4. The AI will re-analyze your crop image and symptoms\n\nIf issues persist, make sure your internet connection is stable and try again.'
    },
    {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'assalam'],
        answer: 'Hello! 👋 Welcome to AgriGuard — your AI-powered agricultural assistant. I can help you learn about our crop diagnosis features, treatment plans, marketplace, weather alerts, and more. What would you like to know?'
    },
    {
        keywords: ['thank', 'thanks', 'thank you', 'shukriya', 'appreciated'],
        answer: 'You\'re welcome! 😊 If you have any more questions about AgriGuard, feel free to ask. I\'m here to help you understand and make the most of the platform!'
    },
    {
        keywords: ['help', 'support', 'assist', 'guidance', 'i need help'],
        answer: 'I\'m here to help! Here are some things you can ask me about:\n\n• How to create a diagnosis report\n• Understanding your treatment plan\n• Finding nearby suppliers\n• Weather alerts and notifications\n• Account and profile settings\n• Crop types supported\n• AI accuracy and technology\n\nJust type your question and I\'ll provide the most relevant information!'
    }
];

const FALLBACK_RESPONSE = "I can only help you with information about this project.";

function findBestAnswer(query: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    const cleanQuery = normalizedQuery.replace(/[^\w\s]/gi, '');
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);

    if (normalizedQuery.length < 2) {
        return 'Please type a more detailed question so I can help you better!';
    }

    // Score each knowledge entry
    let bestMatch: { entry: KnowledgeEntry; score: number } | null = null;

    for (const entry of KNOWLEDGE_BASE) {
        let score = 0;
        for (const keyword of entry.keywords) {
            // Exact phrase match gives a massive boost
            if (normalizedQuery.includes(keyword) || cleanQuery.includes(keyword)) {
                score += keyword.split(' ').length * 10;
            }
            
            // Check individual words
            const keywordWords = keyword.split(' ');
            for (const kw of keywordWords) {
                // Only match words that are at least 3 chars, or exact match for shorter words
                if (kw.length <= 2) {
                    if (queryWords.includes(kw)) score += 1;
                } else {
                    if (queryWords.some(qw => qw === kw || (qw.length > 3 && (qw.startsWith(kw) || kw.startsWith(qw))))) {
                        score += 2;
                    }
                }
            }
        }

        // Require a minimum score threshold to prevent random loose matches
        if (score >= 3 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { entry, score };
        }
    }

    // Explicit fallback check for greetings (which might not meet the >2 word length threshold easily)
    if (!bestMatch) {
        const greetings = ['hi', 'hey', 'hello'];
        if (greetings.some(g => cleanQuery === g || cleanQuery.split(/\s+/).includes(g))) {
            return KNOWLEDGE_BASE.find(e => e.keywords.includes('hello'))?.answer || FALLBACK_RESPONSE;
        }
    }

    return bestMatch ? bestMatch.entry.answer : FALLBACK_RESPONSE;
}

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
}

/* ═══════════════════════════════════════════
   CHAT WIDGET COMPONENT
   ═══════════════════════════════════════════ */

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'bot',
            content: 'Hello! 👋 I\'m the AgriGuard assistant. Ask me anything about our AI-powered crop diagnosis, treatment plans, marketplace, weather alerts, or how to get started!',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = useCallback(async () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmed,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate a small delay for natural feel
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

        const answer = findBestAnswer(trimmed);

        const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            content: answer,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    }, [inputValue]);

    const sendQuickQuestion = useCallback(async (question: string) => {
        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: question,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

        const answer = findBestAnswer(question);
        const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            content: answer,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleOpen = () => {
        if (isOpen && isFullScreen) {
            setIsFullScreen(false);
        }
        setIsOpen(!isOpen);
    };

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // ─── CHAT WINDOW STYLES ───
    const chatWindowClasses = isFullScreen
        ? 'fixed inset-0 z-[9999] flex flex-col'
        : 'fixed bottom-24 right-5 sm:right-6 z-[9998] w-[calc(100vw-2.5rem)] sm:w-[420px] max-h-[min(600px,calc(100vh-8rem))] flex flex-col rounded-3xl shadow-2xl border border-gray-200/80';

    return (
        <>
            {/* ═══ FLOATING CHAT ICON ═══ */}
            <button
                onClick={toggleOpen}
                className="fixed bottom-6 right-5 sm:right-6 z-[9999] group"
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
                style={{ animation: isOpen ? 'none' : 'chat-float 3s ease-in-out infinite' }}
            >
                <div className={`relative p-4 rounded-full shadow-xl transition-all duration-300 ${
                    isOpen
                        ? 'bg-gray-800 hover:bg-gray-700 scale-90'
                        : 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 hover:scale-110 hover:shadow-2xl'
                }`}>
                    {/* Pulse ring */}
                    {!isOpen && (
                        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 animate-ping" style={{ animationDuration: '2s' }} />
                    )}
                    {isOpen ? (
                        <X className="h-6 w-6 text-white transition-transform duration-300" />
                    ) : (
                        <MessageCircle className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-12" />
                    )}
                </div>
            </button>

            {/* ═══ CHAT WINDOW ═══ */}
            {isOpen && (
                <div
                    className={chatWindowClasses}
                    style={{
                        animation: isFullScreen ? 'none' : 'chat-slideUp 0.35s ease-out',
                        background: isFullScreen ? 'white' : undefined,
                    }}
                >
                    {/* ── Header ── */}
                    <div className={`flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white flex-shrink-0 ${
                        isFullScreen ? '' : 'rounded-t-3xl'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm border border-white/20">
                                <Leaf className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base leading-tight">AgriGuard Assistant</h3>
                                <p className="text-xs text-green-100 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                                    Always online
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleFullScreen}
                                className="p-2 rounded-xl hover:bg-white/15 transition-colors"
                                aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
                                title={isFullScreen ? 'Exit full screen' : 'Full screen'}
                            >
                                {isFullScreen ? (
                                    <Minimize2 className="h-4.5 w-4.5 text-white" />
                                ) : (
                                    <Maximize2 className="h-4.5 w-4.5 text-white" />
                                )}
                            </button>
                            <button
                                onClick={toggleOpen}
                                className="p-2 rounded-xl hover:bg-white/15 transition-colors"
                                aria-label="Close chat"
                            >
                                <X className="h-4.5 w-4.5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* ── Messages ── */}
                    <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-gray-50 to-white ${
                        isFullScreen ? 'max-w-4xl mx-auto w-full' : ''
                    }`}
                         style={{ scrollBehavior: 'smooth' }}
                    >
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {/* Bot avatar */}
                                {msg.role === 'bot' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                )}

                                <div className={`max-w-[80%] ${isFullScreen ? 'max-w-[60%]' : ''}`}>
                                    <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl rounded-br-md shadow-md'
                                            : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    <p className={`text-[10px] text-gray-400 mt-1 px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        {formatTime(msg.timestamp)}
                                    </p>
                                </div>

                                {/* User avatar */}
                                {msg.role === 'user' && (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-sm">
                                        <User className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="flex items-end gap-2.5">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="bg-white rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm border border-gray-100">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* ── Quick suggestions (show only when few messages) ── */}
                    {messages.length <= 2 && !isTyping && (
                        <div className={`px-4 pb-2 flex flex-wrap gap-2 bg-white border-t border-gray-50 ${isFullScreen ? 'max-w-4xl mx-auto w-full' : ''}`}>
                            {['How does it work?', 'What crops are supported?', 'How accurate is the AI?', 'Is it free?'].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => sendQuickQuestion(q)}
                                    className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60 hover:bg-emerald-100 hover:border-emerald-300 transition-colors font-medium"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Input ── */}
                    <div className={`flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0 ${
                        isFullScreen ? 'max-w-4xl mx-auto w-full' : 'rounded-b-3xl'
                    }`}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about AgriGuard..."
                            className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 placeholder:text-gray-400 transition-all"
                            disabled={isTyping}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isTyping}
                            className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                            aria-label="Send message"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>

                    {/* ── Powered by label ── */}
                    <div className={`text-center py-1.5 bg-gray-50 text-[10px] text-gray-400 font-medium ${
                        isFullScreen ? '' : 'rounded-b-3xl'
                    }`}>
                        <span className="flex items-center justify-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            Powered by AgriGuard Knowledge Base
                        </span>
                    </div>
                </div>
            )}

            {/* ═══ INLINE STYLES for chat-specific animations ═══ */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes chat-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes chat-slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}} />
        </>
    );
}
