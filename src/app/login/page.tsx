'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'signup') {
            setIsSignUp(true);
        } else {
            setIsSignUp(false);
        }
    }, [searchParams]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setInfoMsg('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (error) throw error;
                if (data.user && data.session === null) {
                    setInfoMsg('Check your email for the confirmation link to complete registration!');
                } else {
                    setInfoMsg('Account created successfully! Redirecting...');
                    setTimeout(() => router.push('/dashboard'), 1500);
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setInfoMsg('Signed in successfully! Redirecting...');
                router.refresh();
                setTimeout(() => router.push('/dashboard'), 1000);
            }
        } catch (error: any) {
            setErrorMsg(error.message || 'An error occurred during authentication.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/95 border border-zinc-200/60 shadow-xl shadow-zinc-200/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-orange to-brand-green" />
            
            <div className="mb-6 text-center flex flex-col items-center">
                <Link href="/" className="inline-flex flex-col items-center gap-2 mb-2 group">
                    <img 
                        src="/assets/naypankhlogo.png" 
                        alt="NayePankh Logo" 
                        className="h-16 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
                    />
                    <span className="text-2xl font-bold text-zinc-900 tracking-tight mt-1">
                        Pankh<span className="bg-gradient-to-r from-brand-orange to-brand-green bg-clip-text text-transparent">AI</span>
                    </span>
                </Link>
                <p className="text-zinc-500 text-xs font-medium">Campaign Coprocessor & Trust Budgeting Suite</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-100 mb-6">
                <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setErrorMsg(''); setInfoMsg(''); }}
                    className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                        !isSignUp 
                            ? 'border-brand-orange text-zinc-950' 
                            : 'border-transparent text-zinc-400 hover:text-zinc-600'
                    }`}
                >
                    Sign In
                </button>
                <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setErrorMsg(''); setInfoMsg(''); }}
                    className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                        isSignUp 
                            ? 'border-brand-orange text-zinc-950' 
                            : 'border-transparent text-zinc-400 hover:text-zinc-600'
                    }`}
                >
                    Create Account
                </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-600 font-bold mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="volunteer@nayepankh.org"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/15 focus:border-brand-orange transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-600 font-bold mb-1">Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/15 focus:border-brand-orange transition-colors"
                    />
                </div>

                {errorMsg && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
                        {errorMsg}
                    </div>
                )}

                {infoMsg && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                        {infoMsg}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-green text-white text-sm font-semibold hover:opacity-95 transition-all active:scale-[0.99] duration-150 shadow-md shadow-brand-orange/10 mt-6 flex items-center justify-center gap-2 cursor-pointer"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                        </>
                    ) : (
                        isSignUp ? 'Register Coordinator' : 'Enter Suite Console'
                    )}
                </button>
            </form>

            <div className="mt-8 text-center text-xs text-zinc-400 font-medium">
                Authorized volunteers of NayePankh Foundation only.
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="flex-1 min-h-screen flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-orange-50/70 via-white to-emerald-50/50">
            {/* Decorative background gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-brand-orange/5 blur-[100px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-brand-green/5 blur-[100px] rounded-full pointer-events-none -z-10" />

            {/* Header spacing spacer */}
            <div className="h-6" />

            {/* Main Centered Content */}
            <div className="flex items-center justify-center px-6 py-12 flex-grow">
                <Suspense fallback={
                    <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-zinc-200/60 shadow-xl text-center">
                        <div className="animate-pulse h-12 w-32 bg-zinc-100 mx-auto rounded-lg mb-4" />
                        <div className="animate-pulse h-8 w-48 bg-zinc-100 mx-auto rounded-lg" />
                    </div>
                }>
                    <AuthForm />
                </Suspense>
            </div>

            {/* NayePankh Footer */}
            <footer className="w-full bg-white/70 border-t border-zinc-200/60 py-12 backdrop-blur-md relative z-20">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    
                    {/* Left Column: Get in Touch & Follow us */}
                    <div className="space-y-6">
                        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 font-sans">
                            Get in touch
                        </h2>
                        <div className="space-y-2 text-sm text-zinc-750 font-semibold">
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <a href="mailto:contact@nayepankh.com" className="text-zinc-800 hover:text-brand-orange transition-colors">
                                    contact@nayepankh.com
                                </a>
                            </p>
                            <p className="flex items-center gap-2 text-zinc-850">
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
                                <a href="https://www.instagram.com/nayepankhfoundation" target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-brand-orange transition-colors" title="Instagram">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                    </svg>
                                </a>
                                {/* LinkedIn */}
                                <a href="https://www.linkedin.com/company/nayepankh-foundation" target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-brand-orange transition-colors" title="LinkedIn">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                    </svg>
                                </a>
                                {/* YouTube */}
                                <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-brand-orange transition-colors" title="YouTube">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
                                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                                    </svg>
                                </a>
                                {/* Facebook */}
                                <a href="https://www.facebook.com/nayepankhfoundation" target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-brand-orange transition-colors" title="Facebook">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                                    </svg>
                                </a>
                                {/* X */}
                                <a href="https://twitter.com/nayepankh" target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-brand-orange transition-colors" title="X (Twitter)">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Column: Links Stack */}
                    <div className="flex flex-col md:items-end justify-center h-full text-sm font-semibold space-y-3.5 text-zinc-700">
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
        </div>
    );
}
