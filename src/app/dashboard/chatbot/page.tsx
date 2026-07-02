'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useState, useRef, useEffect } from 'react';

// Helper to get text content from Vercel AI SDK v4 message parts
const getMessageText = (message: any) => {
    if (!message.parts || !Array.isArray(message.parts)) {
        return message.content || '';
    }
    return message.parts
        .map((part: any) => {
            if (part.type === 'text') return part.text;
            if (part.type === 'reasoning') return part.reasoning;
            return '';
        })
        .join('');
};

export default function ChatbotPage() {
    const { messages, sendMessage, status } = useChat({
        transport: new TextStreamChatTransport({
            api: '/api/chat',
        }),
    });

    const [input, setInput] = useState('');
    const isLoading = status === 'submitted' || status === 'streaming';
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const quickPrompts = [
        {
            title: "WhatsApp Pitch",
            prompt: "Draft a concise WhatsApp pitch for NayePankh's Stray Animal Welfare drive.",
            icon: "🐾",
        },
        {
            title: "Tax Exemption FAQ",
            prompt: "How can I explain the Section 80G tax benefits to a skeptical donor?",
            icon: "📜",
        },
        {
            title: "LinkedIn Outline",
            prompt: "Provide a template for a LinkedIn post detailing our hunger relief achievements.",
            icon: "💼",
        },
        {
            title: "CSR Proposal Help",
            prompt: "What key points should I include in a corporate CSR pitch for sanitary kits?",
            icon: "🏢",
        },
    ];

    const handleQuickPromptClick = (promptText: string) => {
        setInput(promptText);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');

        try {
            await sendMessage({ text: userMsg });
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 h-[calc(100vh-4rem)] flex flex-col font-sans">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-green flex items-center justify-center p-[1px]">
                    <div className="w-full h-full rounded-[11px] bg-background flex items-center justify-center">
                        🐾
                    </div>
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white bg-gradient-to-r from-brand-orange to-brand-green bg-clip-text text-transparent">Volunteer Assistant</h1>
                    <p className="text-[10px] text-zinc-500 font-mono">PankhAI Intelligent Chat Portal</p>
                </div>
            </div>

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin font-sans">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto py-12">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-brand-orange/10 flex items-center justify-center orange-glow">
                                <svg className="w-8 h-8 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[9px] font-bold text-white">
                                AI
                            </span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-zinc-200">Welcome to NayePankh's Chat Support!</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                I am trained on NayePankh's operational procedures, campaigns, and pitching strategies. Ask me anything to streamline your volunteer outreach or draft custom copy!
                            </p>
                        </div>

                        {/* Quick Prompts Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
                            {quickPrompts.map((qp, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickPromptClick(qp.prompt)}
                                    className="glass-panel p-3.5 rounded-xl hover:border-brand-orange/30 text-left transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex gap-2.5 items-start">
                                        <span className="text-base">{qp.icon}</span>
                                        <div className="space-y-0.5">
                                            <span className="text-xs font-bold text-zinc-300 group-hover:text-brand-orange transition-colors">{qp.title}</span>
                                            <span className="text-[10px] text-zinc-500 block line-clamp-2 leading-snug">{qp.prompt}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((m) => {
                            const isUser = m.role === 'user';
                            return (
                                <div
                                    key={m.id}
                                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                >
                                    {!isUser && (
                                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-xs flex-shrink-0">
                                            🧡
                                        </div>
                                    )}
                                    <div
                                        className={`p-4 rounded-2xl max-w-[80%] text-xs leading-relaxed whitespace-pre-wrap ${
                                            isUser
                                                ? 'bg-zinc-900 border border-white/5 text-zinc-100 font-medium'
                                                : 'glass-panel text-zinc-300'
                                        }`}
                                    >
                                        {getMessageText(m)}
                                    </div>
                                    {isUser && (
                                        <div className="w-8 h-8 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-xs flex-shrink-0">
                                            👤
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div className="flex items-start gap-3 justify-start animate-pulse">
                                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-xs flex-shrink-0">
                                    ⏳
                                </div>
                                <div className="glass-panel p-4 rounded-2xl max-w-[80%] text-xs text-zinc-500 italic">
                                    PankhAI is typing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2.5 pt-2 mb-2 flex-shrink-0 border-t border-white/5">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about fundraising rules, donor pitches, or tax benefits..."
                    className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-orange/50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="py-3 px-5 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 text-white text-xs font-bold hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 orange-glow"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send
                </button>
            </form>
        </div>
    );
}
