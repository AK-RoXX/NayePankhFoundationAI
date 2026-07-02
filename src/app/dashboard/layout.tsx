'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setUser(session.user);
                setAuthLoading(false);
            }
        };
        checkAuth();
    }, [supabase, router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
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
                <h3 className="text-sm font-semibold text-zinc-300">Authenticating volunteer session...</h3>
            </div>
        );
    }

    const navigationItems = [
        {
            name: 'Overview Hub',
            href: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
            ),
        },
        {
            name: 'Outreach Generator',
            href: '/dashboard/generator',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        },
        {
            name: 'Volunteer Chatbot',
            href: '/dashboard/chatbot',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
        },
        {
            name: 'Impact Analytics',
            href: '/dashboard/analytics',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            name: 'Members Directory',
            href: '/dashboard/directory',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-zinc-950/40 backdrop-blur-md sticky top-0 h-screen z-30">
                <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
                    <img 
                        src="/assets/naypankhlogo.png" 
                        alt="NayePankh Logo" 
                        className="w-8 h-8 rounded-md object-contain"
                    />
                    <div>
                        <span className="text-base font-bold bg-gradient-to-r from-brand-orange to-brand-green bg-clip-text text-transparent">PankhAI Console</span>
                        <span className="text-[9px] text-zinc-500 font-mono block -mt-1">NayePankh Foundation</span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-6 space-y-1.5">
                    {navigationItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-brand-orange to-brand-orange/85 text-white shadow-md orange-glow'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-white/5 space-y-3">
                    <div className="px-3 py-2 rounded-xl bg-zinc-950/60 border border-white/5">
                        <span className="text-[10px] text-zinc-500 font-mono block uppercase">VOLUNTEER</span>
                        <span className="text-[11px] text-zinc-300 font-semibold truncate block max-w-full" title={user?.email}>
                            {user?.email}
                        </span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all font-semibold"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header / Nav */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-40">
                    <div className="px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img 
                                src="/assets/naypankhlogo.png" 
                                alt="NayePankh Logo" 
                                className="w-6 h-6 rounded-md object-contain"
                            />
                            <span className="text-sm font-bold bg-gradient-to-r from-brand-orange to-brand-green bg-clip-text text-transparent">PankhAI Console</span>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-1 rounded-lg border border-white/5 text-zinc-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {isMobileMenuOpen && (
                        <div className="px-4 py-4 bg-zinc-950/95 border-b border-white/5 space-y-1.5 animate-fade-in">
                            {navigationItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                                            isActive
                                                ? 'bg-gradient-to-r from-brand-orange to-brand-orange/85 text-white'
                                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {item.icon}
                                        {item.name}
                                    </Link>
                                );
                            })}
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between px-4">
                                <span className="text-[11px] text-zinc-500 truncate max-w-[180px]">{user?.email}</span>
                                <button
                                    onClick={handleSignOut}
                                    className="text-xs font-bold text-red-400 hover:underline"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </header>

                {/* Dashboard Children Content */}
                <main className="flex-1 overflow-y-auto flex flex-col justify-between">
                    <div className="flex-1">
                        {children}
                    </div>

                    {/* NayePankh Footer */}
                    <footer className="w-full bg-zinc-950/80 border-t border-white/5 py-12 relative z-20 mt-12">
                        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            
                            {/* Left Column: Get in Touch & Follow us */}
                            <div className="space-y-6 text-left">
                                <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
                                    Get in touch
                                </h2>
                                <div className="space-y-2 text-sm text-zinc-400 font-medium">
                                    <p className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <a href="mailto:contact@nayepankh.com" className="text-zinc-300 hover:text-brand-orange transition-colors">
                                            contact@nayepankh.com
                                        </a>
                                    </p>
                                    <p className="flex items-center gap-2 text-zinc-300">
                                        <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span>Mobile No: +91- 8318500748</span>
                                    </p>
                                </div>
                                
                                <div className="space-y-3">
                                    <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                                        Follow us
                                    </h3>
                                    <div className="flex gap-4 items-center">
                                        {/* Instagram */}
                                        <a href="https://www.instagram.com/nayepankhfoundation" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-orange transition-colors" title="Instagram">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                            </svg>
                                        </a>
                                        {/* LinkedIn */}
                                        <a href="https://www.linkedin.com/company/nayepankh-foundation" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-orange transition-colors" title="LinkedIn">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                            </svg>
                                        </a>
                                        {/* YouTube */}
                                        <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-orange transition-colors" title="YouTube">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
                                                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                                            </svg>
                                        </a>
                                        {/* Facebook */}
                                        <a href="https://www.facebook.com/nayepankhfoundation" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-orange transition-colors" title="Facebook">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                                            </svg>
                                        </a>
                                        {/* X */}
                                        <a href="https://twitter.com/nayepankh" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-brand-orange transition-colors" title="X (Twitter)">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Column: Links Stack */}
                            <div className="flex flex-col md:items-end justify-center h-full text-sm font-semibold space-y-3.5 text-zinc-400">
                               <a href="https://nayepankh.com/contact-us" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">
                                    Contact Us
                                </a>
                                <a href="https://nayepankh.com/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">
                                    Terms and Conditions
                                </a>
                                <a href="https://nayepankh.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">
                                    Privacy Policy
                                </a>
                                <a href="https://nayepankh.com/cancellation-and-refund" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">
                                    Cancellation and Refund
                                </a>
                                <a href="https://nayepankh.com/cancellation-and-refund" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">
                                    Shipping and Exchange
                                </a>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}
