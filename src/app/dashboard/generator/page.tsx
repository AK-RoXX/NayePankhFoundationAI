'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompletion, experimental_useObject as useObject } from '@ai-sdk/react';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

const budgetSchema = z.object({
    breakdown: z.array(
        z.object({
            category: z.string(),
            amount: z.number(),
            justification: z.string(),
        })
    ),
    totalImpact: z.string(),
});

interface SavedPitch {
    id: string;
    created_at: string;
    campaign_type: string;
    donor_profile: string;
    platform: string;
    generated_content: string;
    is_bookmarked: boolean;
}

export default function GeneratorPage() {
    const router = useRouter();
    const supabase = createClient();

    // Authenticated user state
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Active workspace tab: 'pitch' | 'budget' | 'history'
    const [activeTab, setActiveTab] = useState<'pitch' | 'budget' | 'history'>('pitch');

    // Pitch generator configurations
    const [config, setConfig] = useState({
        campaignType: 'food_drive',
        donorProfile: 'student_peer',
        platform: 'whatsapp',
    });
    const [customCampaignType, setCustomCampaignType] = useState('');
    const [customDonorProfile, setCustomDonorProfile] = useState('');
    const [customPlatform, setCustomPlatform] = useState('');
    const [customContext, setCustomContext] = useState('');
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Budget configuration
    const [goalAmount, setGoalAmount] = useState('15000');
    const [budgetCampaignType, setBudgetCampaignType] = useState('food_drive');
    const [customBudgetCampaignType, setCustomBudgetCampaignType] = useState('');

    // Cloud History State
    const [history, setHistory] = useState<SavedPitch[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
    const [historyPlatformFilter, setHistoryPlatformFilter] = useState('all');
    const [historyBookmarkFilter, setHistoryBookmarkFilter] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Outreach modal states
    const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
    const [outreachContent, setOutreachContent] = useState('');
    const [outreachPlatform, setOutreachPlatform] = useState<'whatsapp' | 'email' | 'linkedin'>('whatsapp');
    const [recipientInfo, setRecipientInfo] = useState('');
    const [outreachSubject, setOutreachSubject] = useState('Supporting NayePankh Foundation');
    const [outreachMethod, setOutreachMethod] = useState<'client' | 'api'>('client');
    const [isSendingOutreach, setIsSendingOutreach] = useState(false);
    const [outreachStatus, setOutreachStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'keys-missing'>('idle');
    const [outreachError, setOutreachError] = useState('');

    // 1. Text Pitch Hook (Standard generation)
    const { complete: completeText, completion: textCompletion, isLoading: isTextLoading } = useCompletion({
        api: '/api/generate',
        streamProtocol: 'text',
    });

    // 2. Multimodal Pitch Hook
    const { complete: completeMultimodal, completion: multimodalCompletion, isLoading: isMultimodalLoading } = useCompletion({
        api: '/api/multimodal',
        streamProtocol: 'text',
    });

    // 3. Structured JSON Budget Hook
    const { submit: generateBudget, object: budgetData, isLoading: isBudgetLoading } = useObject({
        api: '/api/budget',
        schema: budgetSchema,
    });

    // Active loading state and active pitch content
    const isPitchLoading = isTextLoading || isMultimodalLoading;
    const currentPitch = imageBase64 ? multimodalCompletion : textCompletion;

    // Check auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setUser(session.user);
                setAuthLoading(false);
                fetchHistory(session.user.id);
            }
        };
        checkAuth();
    }, [supabase, router]);

    // Reset save status when a new pitch generation begins
    useEffect(() => {
        if (isPitchLoading) {
            setSaveStatus('idle');
        }
    }, [isPitchLoading]);

    // Fetch saved pitches from Supabase
    const fetchHistory = async (userId: string) => {
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('generated_pitches')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Save generated pitch to Supabase
    const handleSavePitch = async () => {
        if (!currentPitch || !user) return;
        setSaveStatus('saving');
        try {
            const { data, error } = await supabase
                .from('generated_pitches')
                .insert({
                    user_id: user.id,
                    campaign_type: config.campaignType === 'custom' ? customCampaignType : config.campaignType,
                    donor_profile: config.donorProfile === 'custom' ? customDonorProfile : config.donorProfile,
                    platform: config.platform === 'custom' ? customPlatform : config.platform,
                    generated_content: currentPitch,
                    is_bookmarked: false
                })
                .select();

            if (error) throw error;
            
            setSaveStatus('saved');
            // Refresh list in background
            fetchHistory(user.id);
        } catch (err) {
            console.error('Error saving pitch:', err);
            setSaveStatus('error');
        }
    };

    // Toggle bookmark status in database
    const handleToggleBookmark = async (pitchId: string, currentVal: boolean) => {
        try {
            const { error } = await supabase
                .from('generated_pitches')
                .update({ is_bookmarked: !currentVal })
                .eq('id', pitchId);

            if (error) throw error;

            // Optimistic update
            setHistory(prev => prev.map(p => p.id === pitchId ? { ...p, is_bookmarked: !currentVal } : p));
        } catch (err) {
            console.error('Error toggling bookmark:', err);
        }
    };

    // Delete pitch from database
    const handleDeletePitch = async (pitchId: string) => {
        if (!confirm('Are you sure you want to delete this pitch from your saved history?')) return;
        try {
            const { error } = await supabase
                .from('generated_pitches')
                .delete()
                .eq('id', pitchId);

            if (error) throw error;

            setHistory(prev => prev.filter(p => p.id !== pitchId));
        } catch (err) {
            console.error('Error deleting pitch:', err);
        }
    };

    // Handle Image Upload / Base64 conversion
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                imageBase64String(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const imageBase64String = (base64: string) => {
        setImageBase64(base64);
        setImagePreview(base64);
    };

    const handleClearImage = () => {
        setImageBase64(null);
        setImagePreview(null);
    };

    // Submit Pitch Generation
    const handlePitchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const campaignTypeVal = config.campaignType === 'custom' ? customCampaignType : config.campaignType;
        const donorProfileVal = config.donorProfile === 'custom' ? customDonorProfile : config.donorProfile;
        const platformVal = config.platform === 'custom' ? customPlatform : config.platform;

        if (imageBase64) {
            const messagePayload = customContext || "Analyze this field work activity and write a fundraising copy.";
            await completeMultimodal('', { 
                body: { 
                    message: `Initiative: ${campaignTypeVal}. Audience: ${donorProfileVal}. Channel: ${platformVal}. Context: ${messagePayload}`, 
                    imageBase64 
                } 
            });
        } else {
            const payload = {
                campaignType: campaignTypeVal,
                donorProfile: donorProfileVal,
                platform: platformVal,
                customContext: customContext
            };
            await completeText(customContext, { body: payload });
        }
    };

    // Submit Budget Generation
    const handleBudgetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const campaignVal = budgetCampaignType === 'custom' ? customBudgetCampaignType : budgetCampaignType;
        generateBudget({ goalAmount: Number(goalAmount), campaignType: campaignVal });
    };

    // Clipboard copy util
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // Outreach action utilities
    const openOutreachModal = (content: string, platform: string) => {
        setOutreachContent(content);
        const cleanPlatform = (platform === 'whatsapp' || platform === 'email' || platform === 'linkedin') 
            ? platform 
            : 'whatsapp';
        setOutreachPlatform(cleanPlatform);
        
        if (cleanPlatform === 'email') {
            const lines = content.split('\n');
            let foundSubject = 'Support NayePankh Foundation';
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                if (lowerLine.startsWith('subject:')) {
                    foundSubject = line.substring(8).trim();
                    break;
                } else if (lowerLine.startsWith('subject line:')) {
                    foundSubject = line.substring(13).trim();
                    break;
                }
            }
            setOutreachSubject(foundSubject);
        }
        
        setRecipientInfo('');
        setOutreachStatus('idle');
        setOutreachError('');
        setOutreachMethod('client');
        setIsOutreachModalOpen(true);
    };

    const handleSendOutreach = async () => {
        setOutreachStatus('sending');
        setOutreachError('');

        const logOutreach = async () => {
            if (!user) return;
            try {
                // Randomize a simulated donation amount (₹0, ₹500, ₹1000, ₹2000, ₹5000)
                const amounts = [0, 0, 0, 500, 1000, 2000, 5000];
                const donationAmount = amounts[Math.floor(Math.random() * amounts.length)];
                
                await supabase
                    .from('outreach_logs')
                    .insert({
                        user_id: user.id,
                        platform: outreachPlatform,
                        recipient: recipientInfo || 'LinkedIn Post',
                        initiative: config.campaignType === 'custom' ? customCampaignType : config.campaignType,
                        status: 'sent',
                        donation_amount: donationAmount
                    });
            } catch (err) {
                console.error('Error logging outreach event to database:', err);
            }
        };

        if (outreachMethod === 'client') {
            try {
                if (outreachPlatform === 'whatsapp') {
                    const cleanPhone = recipientInfo.replace(/[^\d+]/g, '');
                    const encodedText = encodeURIComponent(outreachContent);
                    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
                    window.open(waUrl, '_blank');
                    await logOutreach();
                    setOutreachStatus('success');
                } else if (outreachPlatform === 'email') {
                    const encodedSubject = encodeURIComponent(outreachSubject);
                    const encodedBody = encodeURIComponent(outreachContent);
                    const mailtoUrl = `mailto:${recipientInfo}?subject=${encodedSubject}&body=${encodedBody}`;
                    window.open(mailtoUrl, '_blank');
                    await logOutreach();
                    setOutreachStatus('success');
                } else {
                    navigator.clipboard.writeText(outreachContent);
                    window.open('https://www.linkedin.com/feed/', '_blank');
                    await logOutreach();
                    setOutreachStatus('success');
                    alert('Copied pitch content to clipboard! Redirecting you to LinkedIn to post.');
                }
            } catch (err: any) {
                setOutreachStatus('error');
                setOutreachError(err.message || 'Failed to trigger client redirect.');
            }
        } else {
            setIsSendingOutreach(true);
            try {
                const endpoint = outreachPlatform === 'whatsapp' ? '/api/send/whatsapp' : '/api/send/email';
                const payload = outreachPlatform === 'whatsapp' 
                    ? { to: recipientInfo, body: outreachContent }
                    : { to: recipientInfo, subject: outreachSubject, body: outreachContent };

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    if (data.code === 'KEYS_MISSING') {
                        setOutreachStatus('keys-missing');
                    } else {
                        setOutreachStatus('error');
                        setOutreachError(data.error || 'Server error occurred during transmission.');
                    }
                } else {
                    await logOutreach();
                    setOutreachStatus('success');
                }
            } catch (err: any) {
                setOutreachStatus('error');
                setOutreachError(err.message || 'Network error occurred. Please check your connection.');
            } finally {
                setIsSendingOutreach(false);
            }
        }
    };

    // Filtered History List
    const filteredHistory = history.filter(item => {
        const matchesSearch = item.generated_content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = historyTypeFilter === 'all' || item.campaign_type === historyTypeFilter;
        const matchesPlatform = historyPlatformFilter === 'all' || item.platform === historyPlatformFilter;
        const matchesBookmark = !historyBookmarkFilter || item.is_bookmarked;
        return matchesSearch && matchesType && matchesPlatform && matchesBookmark;
    });

    if (authLoading) {
        return (
            <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    <svg className="animate-spin w-12 h-12 text-brand-orange" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-zinc-300">Loading generator console...</h3>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 w-full font-sans">
            {/* Console tabs */}
            <div className="flex gap-2 p-1 bg-zinc-950/60 rounded-xl border border-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('pitch')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                        activeTab === 'pitch' 
                            ? 'bg-gradient-to-r from-brand-orange to-brand-orange/85 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-white'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Campaign Pitch Generator
                </button>
                <button
                    onClick={() => setActiveTab('budget')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                        activeTab === 'budget' 
                            ? 'bg-gradient-to-r from-brand-green to-brand-green/85 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-white'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Financial Transparency Engine
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all relative ${
                        activeTab === 'history' 
                            ? 'bg-zinc-100 text-zinc-950 shadow-md' 
                            : 'text-zinc-400 hover:text-white'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    Saved Cloud History
                    {history.length > 0 && (
                        <span className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white">
                            {history.length}
                        </span>
                    )}
                </button>
            </div>

            {/* TAB 1: PITCH ENGINE */}
            {activeTab === 'pitch' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                    {/* Configuration Controls (Left) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="glass-panel p-6 rounded-2xl space-y-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5 pb-2">Configuration Matrix</h3>
                            
                            <form onSubmit={handlePitchSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Initiative Focus</label>
                                    <select 
                                        value={config.campaignType} 
                                        onChange={(e) => setConfig({ ...config, campaignType: e.target.value })} 
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                    >
                                        <option value="food_drive">Hunger Relief (Food Drives)</option>
                                        <option value="stray_animals">Stray Animal Welfare</option>
                                        <option value="sanitary_pads">Sanitary Hygiene Kits</option>
                                        <option value="custom">Other / Custom Cause...</option>
                                    </select>
                                    {config.campaignType === 'custom' && (
                                        <input
                                            type="text"
                                            placeholder="Enter custom initiative cause..."
                                            value={customCampaignType}
                                            onChange={(e) => setCustomCampaignType(e.target.value)}
                                            className="mt-2 w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Target Donor Audience</label>
                                    <select 
                                        value={config.donorProfile} 
                                        onChange={(e) => setConfig({ ...config, donorProfile: e.target.value })} 
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                    >
                                        <option value="student_peer">University Student / Peer</option>
                                        <option value="corporate">Corporate Professional / CSR Partner</option>
                                        <option value="family">Empathetic Family / Indiv. Donor</option>
                                        <option value="custom">Other / Custom Audience...</option>
                                    </select>
                                    {config.donorProfile === 'custom' && (
                                        <input
                                            type="text"
                                            placeholder="Enter custom target audience description..."
                                            value={customDonorProfile}
                                            onChange={(e) => setCustomDonorProfile(e.target.value)}
                                            className="mt-2 w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Distribution Channel</label>
                                    <select 
                                        value={config.platform} 
                                        onChange={(e) => setConfig({ ...config, platform: e.target.value })} 
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                    >
                                        <option value="whatsapp">WhatsApp Message (Brief & bold-markup)</option>
                                        <option value="email">Email Campaign (Subject line & signature block)</option>
                                        <option value="linkedin">LinkedIn Post (Hashtags & structured spacing)</option>
                                        <option value="custom">Other / Custom Channel...</option>
                                    </select>
                                    {config.platform === 'custom' && (
                                        <input
                                            type="text"
                                            placeholder="Enter custom distribution channel..."
                                            value={customPlatform}
                                            onChange={(e) => setCustomPlatform(e.target.value)}
                                            className="mt-2 w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Optional Ground Details / Custom Context</label>
                                    <textarea
                                        value={customContext}
                                        onChange={(e) => setCustomContext(e.target.value)}
                                        placeholder="Example: Feeding 200 stray dogs in sector-15 or distributing 100 meals to daily wage workers near market area..."
                                        rows={3}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Multimodal Visual Context (Attach Photo)</label>
                                    {!imagePreview ? (
                                        <div className="relative border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center hover:border-brand-orange/30 transition-colors cursor-pointer bg-zinc-950/20 group">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <svg className="w-6 h-6 text-zinc-600 group-hover:text-brand-orange transition-colors mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                                            </svg>
                                            <span className="text-[10px] text-zinc-500 font-medium group-hover:text-zinc-400 transition-colors">Select field volunteer photo (PNG/JPG)</span>
                                        </div>
                                    ) : (
                                        <div className="relative border border-white/10 rounded-xl p-3 bg-zinc-950 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img src={imagePreview} className="w-12 h-12 object-cover rounded-lg border border-white/10" alt="ground preview" />
                                                <div>
                                                    <span className="text-[10px] text-zinc-300 font-bold block">Multimodal Active</span>
                                                    <span className="text-[9px] text-brand-orange font-mono">Will process image context</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleClearImage}
                                                className="p-1 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-red-400 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isPitchLoading}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 orange-glow"
                                >
                                    {isPitchLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Streaming from Gemini...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            Generate Outreach Pitch
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Interactive Console Feed (Right) */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="glass-panel rounded-2xl overflow-hidden min-h-[400px] flex flex-col justify-between">
                            <div className="bg-zinc-900/40 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
                                    <span className="text-xs font-bold text-zinc-300">Outreach Console Output</span>
                                </div>
                                {isPitchLoading && (
                                    <span className="text-[10px] text-brand-orange font-mono animate-pulse-soft">LIVE STREAM ACTIVE</span>
                                )}
                            </div>

                            <div className="p-6 flex-1 bg-zinc-950/20 flex flex-col justify-between">
                                <div className="text-sm text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed">
                                    {currentPitch ? (
                                        currentPitch
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 italic space-y-2">
                                            <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <span>Configure options and generate a pitch. Streamed copy will render here...</span>
                                        </div>
                                    )}
                                </div>

                                {currentPitch && (
                                    <div className="mt-8 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => copyToClipboard(currentPitch)}
                                                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                Copy Pitch
                                            </button>
                                            
                                            <button
                                                onClick={handleSavePitch}
                                                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                                                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                                                    saveStatus === 'saved' 
                                                        ? 'bg-brand-green/10 border border-brand-green/20 text-brand-green' 
                                                        : 'bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white'
                                                }`}
                                            >
                                                {saveStatus === 'saving' ? (
                                                    <>Saving to Cloud...</>
                                                ) : saveStatus === 'saved' ? (
                                                    <>
                                                        <svg className="w-3.5 h-3.5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        Saved to History
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                        Save to Cloud History
                                                    </>
                                                )}
                                            </button>
                                            
                                            <button
                                                onClick={() => openOutreachModal(currentPitch, config.platform)}
                                                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-orange to-amber-500 text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send Outreach
                                            </button>
                                        </div>
                                        
                                        <span className="text-[10px] text-zinc-500 font-mono">
                                            {config.platform.toUpperCase()} &bull; {config.campaignType.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: BUDGET transparency */}
            {activeTab === 'budget' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-panel p-6 rounded-2xl space-y-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-white/5 pb-2">Target Parameters</h3>
                            
                            <form onSubmit={handleBudgetSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Initiative</label>
                                    <select 
                                        value={budgetCampaignType} 
                                        onChange={(e) => setBudgetCampaignType(e.target.value)} 
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-green/50 transition-colors"
                                    >
                                        <option value="food_drive">Hunger Relief (Food Drives)</option>
                                        <option value="stray_animals">Stray Animal Welfare</option>
                                        <option value="sanitary_pads">Sanitary Hygiene Kits</option>
                                        <option value="custom">Other / Custom Initiative...</option>
                                    </select>
                                    {budgetCampaignType === 'custom' && (
                                        <input
                                            type="text"
                                            placeholder="Enter custom budget initiative cause..."
                                            value={customBudgetCampaignType}
                                            onChange={(e) => setCustomBudgetCampaignType(e.target.value)}
                                            className="mt-2 w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-green/50 transition-colors"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Goal Amount (INR)</label>
                                    <input
                                        type="number"
                                        value={goalAmount}
                                        onChange={(e) => setGoalAmount(e.target.value)}
                                        placeholder="e.g. 20000"
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-green/50 transition-colors"
                                    />
                                    
                                    <div className="flex gap-2 mt-2">
                                        {['5000', '15000', '35000', '75000'].map((amt) => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setGoalAmount(amt)}
                                                className="px-2 py-1 text-[10px] rounded bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors"
                                            >
                                                ₹{Number(amt).toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isBudgetLoading}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-green to-emerald-500 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 green-glow shadow-md"
                                >
                                    {isBudgetLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Constructing Matrix...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Calculate Breakdown Matrix
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                        <div className="glass-panel p-6 rounded-2xl min-h-[350px] flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Financial Ledger Breakdown</h3>
                                    <span className="px-2 py-0.5 rounded bg-brand-green/10 border border-brand-green/20 text-[10px] text-brand-green font-mono">100% TRANSPARENT</span>
                                </div>

                                {budgetData?.breakdown && budgetData.breakdown.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs text-zinc-300">
                                                <thead>
                                                    <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider">
                                                        <th className="pb-3 text-left">Allocation Area</th>
                                                        <th className="pb-3 text-right">Amount</th>
                                                        <th className="pb-3 pl-6">Justification</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 font-mono text-zinc-400">
                                                    {budgetData.breakdown.map((item, index) => (
                                                        <tr key={index} className="animate-fade-in">
                                                            <td className="py-3 font-semibold text-zinc-200">{item?.category}</td>
                                                            <td className="py-3 text-right text-brand-green font-bold">₹{item?.amount?.toLocaleString()}</td>
                                                            <td className="py-3 pl-6 text-xs text-zinc-500 font-sans">{item?.justification}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {budgetData.totalImpact && (
                                            <div className="bg-brand-green/5 border border-dashed border-brand-green/20 rounded-xl p-4 text-xs">
                                                <span className="text-zinc-400 font-bold uppercase block mb-1">Estimated Community Impact</span>
                                                <span className="text-zinc-200 italic">"{budgetData.totalImpact}"</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500 italic space-y-2">
                                        <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Configure Target Parameters and hit calculate. The ledger matrix will render here...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: SAVED CLOUD HISTORY */}
            {activeTab === 'history' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Search & Filters */}
                    <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search saved pitches..."
                                className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 w-full sm:max-w-xs focus:outline-none focus:border-brand-orange/50 transition-colors"
                            />

                            <select
                                value={historyTypeFilter}
                                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                                className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-400 focus:outline-none"
                            >
                                <option value="all">All Initiatives</option>
                                <option value="food_drive">Hunger Relief</option>
                                <option value="stray_animals">Stray Animals</option>
                                <option value="sanitary_pads">Sanitary Kits</option>
                            </select>

                            <select
                                value={historyPlatformFilter}
                                onChange={(e) => setHistoryPlatformFilter(e.target.value)}
                                className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-400 focus:outline-none"
                            >
                                <option value="all">All Platforms</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="email">Email</option>
                                <option value="linkedin">LinkedIn</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setHistoryBookmarkFilter(!historyBookmarkFilter)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                historyBookmarkFilter 
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                                    : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill={historyBookmarkFilter ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.17 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 9.72c-.773-.57-.375-1.81.587-1.81H8.8a1 1 0 00.95-.69l1.519-4.674z" />
                            </svg>
                            Bookmarked Only
                        </button>
                    </div>

                    {/* List */}
                    {historyLoading ? (
                        <div className="py-12 text-center text-zinc-500 text-xs animate-pulse">
                            Loading coordinator archives from Supabase cloud database...
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="glass-panel p-12 text-center text-zinc-500 text-xs rounded-2xl">
                            No records found matching the filter query. Generated pitches saved will display here.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredHistory.map((item) => (
                                <div key={item.id} className="glass-panel rounded-2xl p-5 flex flex-col justify-between gap-4 group hover:border-brand-orange/20 transition-all relative">
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
                                                className={`p-1 rounded hover:bg-zinc-900 transition-colors ${
                                                    item.is_bookmarked ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'
                                                }`}
                                            >
                                                <svg className="w-4 h-4" fill={item.is_bookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.17 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 9.72c-.773-.57-.375-1.81.587-1.81H8.8a1 1 0 00.95-.69l1.519-4.674z" />
                                                </svg>
                                            </button>
                                        </div>

                                        <p className="text-zinc-300 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                                            {item.generated_content}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                                        <span className="text-[10px] text-zinc-500 font-mono">
                                            {new Date(item.created_at).toLocaleDateString()} &bull; {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => openOutreachModal(item.generated_content, item.platform)}
                                                className="px-2 py-1 rounded bg-gradient-to-r from-brand-orange/20 to-amber-500/20 border border-brand-orange/30 text-[10px] text-brand-orange hover:text-white hover:from-brand-orange hover:to-amber-500 transition-all flex items-center gap-1"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send
                                            </button>
                                            
                                            <button
                                                onClick={() => copyToClipboard(item.generated_content)}
                                                className="px-2 py-1 rounded bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 hover:text-white transition-colors"
                                            >
                                                Copy Text
                                            </button>
                                            <button
                                                onClick={() => handleDeletePitch(item.id)}
                                                className="p-1 rounded bg-zinc-900 border border-white/5 text-zinc-400 hover:text-red-400 hover:border-red-500/20 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isOutreachModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="glass-panel max-w-lg w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between max-h-[90vh]">
                        <div className="bg-zinc-900/60 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                <span className="text-sm font-bold text-zinc-200">Send Campaign Outreach</span>
                            </div>
                            <button
                                onClick={() => setIsOutreachModalOpen(false)}
                                className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Outreach Method</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950/60 rounded-xl border border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOutreachMethod('client');
                                            setOutreachStatus('idle');
                                        }}
                                        className={`py-2 rounded-lg text-xs font-semibold text-center transition-all ${
                                            outreachMethod === 'client'
                                                ? 'bg-zinc-900 border border-white/5 text-white'
                                                : 'text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        Client Launch (Free)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOutreachMethod('api');
                                            setOutreachStatus('idle');
                                        }}
                                        className={`py-2 rounded-lg text-xs font-semibold text-center transition-all ${
                                            outreachMethod === 'api'
                                                ? 'bg-zinc-900 border border-white/5 text-white'
                                                : 'text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        Server API (Automated)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {outreachPlatform === 'whatsapp' && (
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Recipient Phone Number</label>
                                        <input
                                            type="text"
                                            value={recipientInfo}
                                            onChange={(e) => setRecipientInfo(e.target.value)}
                                            placeholder="e.g. +919876543210"
                                            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                        />
                                        <span className="text-[9px] text-zinc-500 mt-1 block">Include country code (e.g. +91 for India).</span>
                                    </div>
                                )}

                                {outreachPlatform === 'email' && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Recipient Email Address</label>
                                            <input
                                                type="email"
                                                value={recipientInfo}
                                                onChange={(e) => setRecipientInfo(e.target.value)}
                                                placeholder="e.g. donor@example.com"
                                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Subject Line</label>
                                            <input
                                                type="text"
                                                value={outreachSubject}
                                                onChange={(e) => setOutreachSubject(e.target.value)}
                                                placeholder="Subject"
                                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}

                                {outreachPlatform === 'linkedin' && (
                                    <div className="p-3.5 bg-zinc-950/40 rounded-xl border border-white/5 text-[11px] text-zinc-400 leading-relaxed">
                                        💡 <span className="font-semibold text-zinc-300">LinkedIn Note:</span> Automated server posting is restricted by LinkedIn APIs. Choosing Client Launch will automatically copy this pitch context to your clipboard and open the LinkedIn feed so you can easily paste it.
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Outreach Message Body</label>
                                <textarea
                                    value={outreachContent}
                                    onChange={(e) => setOutreachContent(e.target.value)}
                                    rows={6}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-brand-orange/50 transition-colors font-mono leading-relaxed"
                                />
                            </div>

                            {outreachStatus === 'sending' && (
                                <div className="p-3 bg-zinc-950/20 border border-white/5 rounded-xl flex items-center justify-center gap-2.5 text-xs text-zinc-400">
                                    <svg className="animate-spin h-4 w-4 text-brand-orange" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Transmitting outreach payload via server edge integration...
                                </div>
                            )}

                            {outreachStatus === 'success' && (
                                <div className="p-3 bg-brand-green/10 border border-brand-green/20 rounded-xl flex items-center gap-2.5 text-xs text-brand-green">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        {outreachMethod === 'client' 
                                            ? 'Client launched successfully! Verify final sending inside the opened application.' 
                                            : 'Outreach campaign message dispatched successfully via server APIs!'}
                                    </span>
                                </div>
                            )}

                            {outreachStatus === 'error' && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-xs text-rose-400">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>Error: {outreachError}</span>
                                </div>
                            )}

                            {outreachStatus === 'keys-missing' && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3 text-xs text-amber-400">
                                    <div className="flex items-center gap-2.5 font-bold">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>Server API Keys Not Set Up</span>
                                    </div>
                                    <p className="leading-relaxed">
                                        The API keys required for server-side background automation are not configured in your `.env` file.
                                    </p>
                                    <details className="cursor-pointer font-semibold text-[11px] text-zinc-400 hover:text-zinc-300">
                                        <summary className="outline-none mb-1 text-amber-400 hover:underline">How to set up credentials</summary>
                                        <div className="pl-4 py-2 font-mono text-[9px] text-zinc-500 border-l border-white/5 space-y-1">
                                            {outreachPlatform === 'whatsapp' ? (
                                                <>
                                                    <div>TWILIO_ACCOUNT_SID=your_sid</div>
                                                    <div>TWILIO_AUTH_TOKEN=your_token</div>
                                                    <div>TWILIO_SENDER_NUMBER=whatsapp:+14155238886</div>
                                                </>
                                            ) : (
                                                <div>RESEND_API_KEY=re_yourkeyhere</div>
                                            )}
                                        </div>
                                    </details>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOutreachMethod('client');
                                            setOutreachStatus('idle');
                                        }}
                                        className="w-full py-2 px-3 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-colors text-[10px] uppercase"
                                    >
                                        Switch to Direct Client Launch
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900/40 p-6 border-t border-white/5 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsOutreachModalOpen(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-white/5 bg-zinc-950 text-zinc-400 text-xs font-bold hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSendOutreach}
                                disabled={isSendingOutreach || (outreachPlatform !== 'linkedin' && !recipientInfo)}
                                className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 text-white text-xs font-bold hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 orange-glow"
                            >
                                {isSendingOutreach ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Transmitting...
                                    </>
                                ) : (
                                    <>
                                        {outreachMethod === 'client' ? (
                                            outreachPlatform === 'whatsapp' ? 'Open in WhatsApp' :
                                            outreachPlatform === 'email' ? 'Open in Mail Client' :
                                            'Copy & Open LinkedIn'
                                        ) : (
                                            outreachPlatform === 'whatsapp' ? 'Send Automated WhatsApp' :
                                            'Send Automated Email'
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
