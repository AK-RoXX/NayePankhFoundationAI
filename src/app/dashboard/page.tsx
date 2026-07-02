'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface SavedPitch {
    id: string;
    created_at: string;
    campaign_type: string;
    donor_profile: string;
    platform: string;
    generated_content: string;
    is_bookmarked: boolean;
}

export default function OverviewHub() {
    const router = useRouter();
    const supabase = createClient();

    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [history, setHistory] = useState<SavedPitch[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setUser(session.user);
                setAuthLoading(false);
                fetchRecentPitches(session.user.id);
            }
        };
        checkAuth();
    }, [supabase, router]);

    const fetchRecentPitches = async (userId: string) => {
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('generated_pitches')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) throw error;
            setHistory(data || []);
        } catch (err) {
            console.error('Error fetching recent history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleToggleBookmark = async (pitchId: string, currentVal: boolean) => {
        try {
            const { error } = await supabase
                .from('generated_pitches')
                .update({ is_bookmarked: !currentVal })
                .eq('id', pitchId);

            if (error) throw error;
            setHistory(prev => prev.map(p => p.id === pitchId ? { ...p, is_bookmarked: !currentVal } : p));
        } catch (err) {
            console.error('Error toggling bookmark:', err);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    if (authLoading) {
        return (
            <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    <svg className="animate-spin w-12 h-12 text-brand-orange" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-zinc-300">Synchronizing console hub...</h3>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans">
            {/* Welcome banner */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden orange-glow">
                <div className="max-w-2xl space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-brand-orange/10 border border-brand-orange/20 text-[10px] text-brand-orange font-mono uppercase tracking-wider font-bold">
                        Volunteer Workspace Hub
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                        Welcome back to PankhAI Console
                    </h1>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        PankhAI helps NayePankh Foundation coordinators draft campaign materials, construct detailed financial transparency worksheets, consult guideline chatbots, and track outreach data.
                    </p>
                </div>
                {/* Decorative glow elements */}
                <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-brand-orange/5 to-transparent pointer-events-none" />
            </div>

            {/* Quick navigation modules */}
            <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Core Console Modules</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Generator module */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6 hover:border-brand-orange/30 transition-all group">
                        <div className="space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-lg">
                                ✍️
                            </div>
                            <h3 className="text-sm font-bold text-zinc-200 group-hover:text-brand-orange transition-colors">Outreach Campaign Generator</h3>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                                Write targeted campaign pitches for WhatsApp, email, or LinkedIn using AI. Automatically generate matching transparent budget models in INR.
                            </p>
                        </div>
                        <Link 
                            href="/dashboard/generator"
                            className="inline-flex items-center gap-1.5 text-xs text-brand-orange font-bold hover:underline"
                        >
                            Open Generator
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {/* Chatbot module */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6 hover:border-brand-green/30 transition-all group">
                        <div className="space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-lg">
                                💬
                            </div>
                            <h3 className="text-sm font-bold text-zinc-200 group-hover:text-brand-green transition-colors">Volunteer Chatbot Assistant</h3>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                                Consult with an AI assistant trained on NayePankh's guidelines, tax benefits FAQs (Section 80G/12A), donor communication, and volunteer logistics.
                            </p>
                        </div>
                        <Link 
                            href="/dashboard/chatbot"
                            className="inline-flex items-center gap-1.5 text-xs text-brand-green font-bold hover:underline"
                        >
                            Open Chatbot
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {/* Analytics module */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6 hover:border-zinc-500/30 transition-all group">
                        <div className="space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                                📊
                            </div>
                            <h3 className="text-sm font-bold text-zinc-200 group-hover:text-zinc-100 transition-colors">Impact & Metrics Analytics</h3>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                                View stats generated dynamically from your database. Monitor channels breakdown, cause focus share, bookmark ratios, and simulated outreach reach.
                            </p>
                        </div>
                        <Link 
                            href="/dashboard/analytics"
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 font-bold hover:underline"
                        >
                            View Analytics
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent pitch history */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recent Generated Copy logs</h2>
                    {history.length > 0 && (
                        <Link href="/dashboard/generator" className="text-[11px] text-brand-orange hover:underline font-semibold">
                            View All History ({history.length}+)
                        </Link>
                    )}
                </div>

                {historyLoading ? (
                    <div className="py-8 text-center text-zinc-600 text-xs animate-pulse">
                        Retrieving recent pitch logs from database...
                    </div>
                ) : history.length === 0 ? (
                    <div className="glass-panel p-10 text-center rounded-2xl text-xs text-zinc-500 space-y-3">
                        <p>No outreach pitches found in your database history.</p>
                        <Link 
                            href="/dashboard/generator"
                            className="inline-block px-4 py-2 bg-brand-orange text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Create First Campaign Pitch
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {history.map((item) => (
                            <div key={item.id} className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-brand-orange/20 transition-all">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                                item.campaign_type === 'food_drive' ? 'bg-orange-500/10 text-orange-400' :
                                                item.campaign_type === 'stray_animals' ? 'bg-emerald-500/10 text-emerald-400' :
                                                'bg-rose-500/10 text-rose-400'
                                            }`}>
                                                {item.campaign_type.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-[9px] text-zinc-400 font-mono uppercase">
                                                {item.platform}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleToggleBookmark(item.id, item.is_bookmarked)}
                                            className={`p-1 rounded transition-colors ${
                                                item.is_bookmarked ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill={item.is_bookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.17 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 9.72c-.773-.57-.375-1.81.587-1.81H8.8a1 1 0 00.95-.69l1.519-4.674z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <p className="text-zinc-300 text-xs font-sans whitespace-pre-wrap leading-relaxed line-clamp-4">
                                        {item.generated_content}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                                    <span className="text-[9px] text-zinc-500 font-mono">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                    
                                    <button
                                        onClick={() => copyToClipboard(item.generated_content)}
                                        className="px-2 py-1 rounded bg-zinc-900 border border-white/5 text-[9px] text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Copy Text
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
