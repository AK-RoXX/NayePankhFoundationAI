'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
    const supabase = createClient();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        };
        checkUser();
    }, [supabase]);

    return (
        <div className="flex-1 flex flex-col font-sans selection:bg-brand-orange selection:text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-green p-[1px] transition-transform group-hover:scale-105">
                            <div className="w-full h-full rounded-[11px] bg-background flex items-center justify-center">
                                {/* Wing SVG */}
                                <svg className="w-5 h-5 text-brand-orange group-hover:text-brand-green transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-brand-orange to-brand-green bg-clip-text text-transparent">PankhAI</span>
                            <span className="text-[10px] text-zinc-500 font-mono block -mt-1">NayePankh Foundation</span>
                        </div>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <a href="#initiatives" className="hover:text-white transition-colors">Our Initiatives</a>
                        <a href="#impact" className="hover:text-white transition-colors">NGO Impact</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        {isAuthenticated === null ? (
                            <div className="h-9 w-24 bg-white/5 animate-pulse rounded-lg" />
                        ) : isAuthenticated ? (
                            <Link href="/dashboard" className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-brand-orange to-brand-green text-white hover:opacity-90 transition-opacity orange-glow">
                                Go to Console
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <Link href="/login?tab=signup" className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-colors">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-24 lg:py-32">
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-8">


                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] animate-fade-in">
                        Giving <span className="bg-gradient-to-r from-brand-orange to-amber-500 bg-clip-text text-transparent">Wings</span> to NGO Campaigns & <span className="bg-gradient-to-r from-brand-green to-emerald-400 bg-clip-text text-transparent">Donor Trust</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Empowering NayePankh Foundation volunteers to instantly craft engaging fundraising copy and display precise, transparent budget models for impact.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link href="/dashboard" className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold rounded-xl bg-gradient-to-r from-brand-orange to-brand-green text-white hover:opacity-95 transition-opacity duration-300 orange-glow shadow-lg flex items-center justify-center gap-2 group">
                            Launch Assistant Console
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                        <a href="#initiatives" className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold rounded-xl glass-panel text-zinc-300 hover:text-white hover:border-white/20 transition-all text-center">
                            Explore NGO Causes
                        </a>
                    </div>
                </div>

                {/* Decorative Background Blur */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-green/5 blur-[100px] rounded-full pointer-events-none" />
            </section>

            {/* Initiatives Grid */}
            <section id="initiatives" className="py-20 border-t border-white/5 bg-zinc-950/30">
                <div className="max-w-7xl mx-auto px-6 space-y-12">
                    <div className="text-center space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight text-white">Focus Areas & Campaigns</h2>
                        <p className="text-zinc-400 max-w-xl mx-auto text-sm">
                            Tailor-made generative options matching the ground realities of NayePankh's primary missions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Initiative 1 */}
                        <div className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col justify-between group">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                                    {/* Food Bowl SVG */}
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white group-hover:text-brand-orange transition-colors">Hunger Relief (Food Drives)</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Crafting emotional fundraising texts for feeding under-resourced families and organizing public kitchen drives. Generates high-converting Copy.
                                </p>
                            </div>
                            <div className="pt-6 text-brand-orange text-xs font-semibold flex items-center gap-1">
                                Generates WhatsApp, Email & LinkedIn Appeals
                            </div>
                        </div>

                        {/* Initiative 2 */}
                        <div className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col justify-between group">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                                    {/* Paw Print/Heart SVG */}
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white group-hover:text-brand-green transition-colors">Stray Animal Welfare</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Supporting stray animal medical aid and feeding drives. Create content focusing on compassion, medical rescues, and shelter support.
                                </p>
                            </div>
                            <div className="pt-6 text-brand-green text-xs font-semibold flex items-center gap-1">
                                Tone: Compelling, Caring & Urgent
                            </div>
                        </div>

                        {/* Initiative 3 */}
                        <div className="glass-panel glass-panel-hover p-8 rounded-2xl flex flex-col justify-between group">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                                    {/* Shield/Health SVG */}
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors">Sanitary Hygiene Kits</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Promoting female hygiene education and sanitary kit distribution camps. Create structured pitches tailored for corporate sponsors (CSR).
                                </p>
                            </div>
                            <div className="pt-6 text-rose-400 text-xs font-semibold flex items-center gap-1">
                                Perfect for CSR & Professional Pitching
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section id="impact" className="py-20 bg-zinc-950/60 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="space-y-2">
                            <div className="text-4xl md:text-5xl font-extrabold text-white">10x</div>
                            <div className="text-xs uppercase text-zinc-500 tracking-wider">Fast Campaign Copy</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl md:text-5xl font-extrabold text-brand-orange">100%</div>
                            <div className="text-xs uppercase text-zinc-500 tracking-wider">Budget Transparency</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl md:text-5xl font-extrabold text-brand-green">15,000+</div>
                            <div className="text-xs uppercase text-zinc-500 tracking-wider">INR budgets calculated</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl md:text-5xl font-extrabold text-white">3+</div>
                            <div className="text-xs uppercase text-zinc-500 tracking-wider">Core NGO Causes</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-24 text-center max-w-7xl mx-auto px-6 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Ready to boost donor outreach?</h2>
                <p className="text-zinc-400 max-w-md mx-auto text-sm">
                    Enter the PankhAI terminal today to log campaign pitches and configure transparent financial budgets.
                </p>
                <div className="pt-4">
                    <Link href="/dashboard" className="px-8 py-3.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold transition-colors duration-300 shadow-md">
                        Get Started for Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-zinc-950/80 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <p>&copy; {new Date().getFullYear()} PankhAI for NayePankh Foundation. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with
                        <svg className="w-3.5 h-3.5 text-brand-orange" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        for grassroots community impact
                    </p>
                </div>
            </footer>
        </div>
    );
}