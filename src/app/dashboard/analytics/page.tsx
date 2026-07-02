'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface OutreachLog {
    id: string;
    created_at: string;
    platform: string;
    recipient: string;
    initiative: string;
    status: string;
    donation_amount: number;
}

export default function AnalyticsPage() {
    const supabase = createClient();
    const [logs, setLogs] = useState<OutreachLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalyticsLogs = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data, error } = await supabase
                        .from('outreach_logs')
                        .select('*')
                        .eq('user_id', session.user.id);

                    if (error) throw error;
                    setLogs(data || []);
                }
            } catch (err) {
                console.error('Error fetching analytics database logs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsLogs();
    }, [supabase]);

    // Derived statistics calculations
    const totalOutreaches = logs.length;
    const conversionCount = logs.filter(l => Number(l.donation_amount) > 0).length;
    const conversionRate = totalOutreaches > 0 ? Math.round((conversionCount / totalOutreaches) * 100) : 0;
    const totalDonations = logs.reduce((sum, item) => sum + Number(item.donation_amount), 0);

    // Platform distributions
    const whatsappCount = logs.filter(l => l.platform === 'whatsapp').length;
    const emailCount = logs.filter(l => l.platform === 'email').length;
    const linkedinCount = logs.filter(l => l.platform === 'linkedin').length;

    const getPlatformPercent = (count: number) => {
        return totalOutreaches > 0 ? Math.round((count / totalOutreaches) * 100) : 0;
    };

    const whatsappPercent = getPlatformPercent(whatsappCount);
    const emailPercent = getPlatformPercent(emailCount);
    const linkedinPercent = getPlatformPercent(linkedinCount);

    // Initiative distributions
    const foodDriveCount = logs.filter(l => l.initiative === 'food_drive').length;
    const strayAnimalsCount = logs.filter(l => l.initiative === 'stray_animals').length;
    const sanitaryPadsCount = logs.filter(l => l.initiative === 'sanitary_pads').length;

    const maxInitiativeCount = Math.max(foodDriveCount, strayAnimalsCount, sanitaryPadsCount, 1);

    // Initiative donation totals & tangible metrics
    const foodDriveDonations = logs
        .filter(l => l.initiative === 'food_drive')
        .reduce((sum, item) => sum + Number(item.donation_amount), 0);
    const strayAnimalsDonations = logs
        .filter(l => l.initiative === 'stray_animals')
        .reduce((sum, item) => sum + Number(item.donation_amount), 0);
    const sanitaryPadsDonations = logs
        .filter(l => l.initiative === 'sanitary_pads')
        .reduce((sum, item) => sum + Number(item.donation_amount), 0);

    const mealsDistributed = Math.floor(foodDriveDonations / 50); // ₹50 per meal
    const straysHelped = Math.floor(strayAnimalsDonations / 100); // ₹100 per stray animal fed/treated
    const hygieneKitsDistributed = Math.floor(sanitaryPadsDonations / 150); // ₹150 per hygiene pad kit

    // Projections
    const projectedReach = totalOutreaches * 45; // Assume 45 impressions per sent outreach campaign

    if (loading) {
        return (
            <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    <svg className="animate-spin w-12 h-12 text-brand-orange" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-zinc-300">Compiling impact metrics...</h3>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-white bg-gradient-to-r from-brand-orange to-brand-green bg-clip-text text-transparent">Impact & Metrics Analytics</h1>
                    <p className="text-[10px] text-zinc-500 font-mono">Real-time database stats from your executed outreach logs</p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-brand-green/10 border border-brand-green/20 text-[10px] text-brand-green font-mono uppercase tracking-wider w-fit self-start sm:self-center">
                    🟢 Sync Status: ACTIVE
                </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel p-5 rounded-2xl space-y-2 relative overflow-hidden group hover:border-brand-orange/20 transition-colors">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Total Outreach Executed</span>
                    <h2 className="text-3xl font-extrabold text-white">{totalOutreaches}</h2>
                    <span className="text-[10px] text-zinc-400 block">WhatsApp & Email outreach campaigns</span>
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-5 text-brand-orange text-8xl font-bold select-none pointer-events-none group-hover:scale-110 transition-transform">
                        ✍️
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl space-y-2 relative overflow-hidden group hover:border-brand-green/20 transition-colors">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Conversion Rate</span>
                    <h2 className="text-3xl font-extrabold text-brand-orange">{conversionRate}%</h2>
                    <div className="flex gap-2.5 items-center">
                        <span className="text-[10px] text-zinc-400 block">{conversionCount} of {totalOutreaches} resulted in donations</span>
                    </div>
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-5 text-brand-green text-8xl font-bold select-none pointer-events-none group-hover:scale-110 transition-transform">
                        ⭐
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl space-y-2 relative overflow-hidden group hover:border-brand-green/20 transition-colors">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Projected Donor Reach</span>
                    <h2 className="text-3xl font-extrabold text-brand-green">~{projectedReach.toLocaleString()}</h2>
                    <span className="text-[10px] text-zinc-400 block">Impressions based on send activity</span>
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-5 text-zinc-400 text-8xl font-bold select-none pointer-events-none group-hover:scale-110 transition-transform">
                        📈
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl space-y-2 relative overflow-hidden group hover:border-brand-orange/20 transition-colors">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block">Total Crowdfunded Value</span>
                    <h2 className="text-3xl font-extrabold text-white">₹{totalDonations.toLocaleString()}</h2>
                    <span className="text-[10px] text-zinc-400 block">Conversions recorded in transaction log</span>
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-5 text-brand-orange text-8xl font-bold select-none pointer-events-none group-hover:scale-110 transition-transform">
                        💰
                    </div>
                </div>
            </div>

            {/* Graphs and Breakdown Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Platform Mix Chart */}
                <div className="glass-panel p-6 rounded-2xl space-y-5">
                    <div className="border-b border-white/5 pb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Outreach Platform Mix</h3>
                        <p className="text-[10px] text-zinc-500">Distribution share of campaign channels executed</p>
                    </div>

                    {totalOutreaches === 0 ? (
                        <div className="py-12 text-center text-zinc-500 text-xs italic">
                            No logs available. Go to Outreach Generator and send a message to view metrics!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* WhatsApp bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-emerald-400 flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                        WhatsApp Outreach
                                    </span>
                                    <span className="text-zinc-300">{whatsappPercent}% ({whatsappCount} sent)</span>
                                </div>
                                <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${whatsappPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Email bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-brand-orange flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-brand-orange" />
                                        Email Campaigns
                                    </span>
                                    <span className="text-zinc-300">{emailPercent}% ({emailCount} sent)</span>
                                </div>
                                <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-brand-orange rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${emailPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* LinkedIn bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-zinc-300 flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-zinc-400" />
                                        LinkedIn Posts
                                    </span>
                                    <span className="text-zinc-300">{linkedinPercent}% ({linkedinCount} posts)</span>
                                </div>
                                <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-zinc-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${linkedinPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Initiative Mix bar chart */}
                <div className="glass-panel p-6 rounded-2xl space-y-5">
                    <div className="border-b border-white/5 pb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Campaign Initiative Focus</h3>
                        <p className="text-[10px] text-zinc-500">Breakdown of outreach execution per NGO cause</p>
                    </div>

                    {totalOutreaches === 0 ? (
                        <div className="py-12 text-center text-zinc-500 text-xs italic">
                            No logs available. Go to Outreach Generator and send a message to view metrics!
                        </div>
                    ) : (
                        <div className="h-48 flex items-end justify-around gap-6 pt-4 pb-2 border-b border-white/5 font-mono text-[10px]">
                            {/* Hunger relief bar */}
                            <div className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
                                <span className="text-brand-orange font-bold">{foodDriveCount}</span>
                                <div
                                    className="w-full bg-gradient-to-t from-brand-orange to-amber-500 rounded-t-lg transition-all duration-1000 ease-out"
                                    style={{ height: `${Math.max((foodDriveCount / maxInitiativeCount) * 120, 4)}px` }}
                                />
                                <span className="text-zinc-500 text-[9px] font-sans truncate w-full text-center">Hunger Relief</span>
                            </div>

                            {/* Stray Animals bar */}
                            <div className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
                                <span className="text-brand-green font-bold">{strayAnimalsCount}</span>
                                <div
                                    className="w-full bg-gradient-to-t from-brand-green to-emerald-400 rounded-t-lg transition-all duration-1000 ease-out"
                                    style={{ height: `${Math.max((strayAnimalsCount / maxInitiativeCount) * 120, 4)}px` }}
                                />
                                <span className="text-zinc-500 text-[9px] font-sans truncate w-full text-center">Stray Welfare</span>
                            </div>

                            {/* Sanitary Hygiene bar */}
                            <div className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
                                <span className="text-rose-400 font-bold">{sanitaryPadsCount}</span>
                                <div
                                    className="w-full bg-gradient-to-t from-rose-500 to-pink-400 rounded-t-lg transition-all duration-1000 ease-out"
                                    style={{ height: `${Math.max((sanitaryPadsCount / maxInitiativeCount) * 120, 4)}px` }}
                                />
                                <span className="text-zinc-500 text-[9px] font-sans truncate w-full text-center">Hygiene Kits</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Community Impact Scorecard */}
            <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Community Impact Scorecard</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Tangible footprint of campaign donation conversions</p>
                </div>

                {totalOutreaches === 0 ? (
                    <div className="glass-panel p-8 text-center text-zinc-500 text-xs italic">
                        No impact data logged yet. Complete campaign activities to see tangible social metrics!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Hunger Relief Card */}
                        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group border-brand-orange/10 bg-brand-orange/[0.02]">
                            <div className="absolute top-0 left-0 w-[4px] h-full bg-brand-orange" />
                            <div className="space-y-3 pl-2">
                                <span className="text-[10px] text-brand-orange font-mono uppercase block font-semibold">Hunger Relief Cause</span>
                                <div className="space-y-0.5">
                                    <h4 className="text-2xl font-extrabold text-white">{mealsDistributed.toLocaleString()}</h4>
                                    <span className="text-[10px] text-zinc-400 block font-medium">Hygienic Meals Distributed</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">
                                    Funded by ₹{foodDriveDonations.toLocaleString()} in campaign donations. Calculated at ₹50 per meal.
                                </p>
                            </div>
                        </div>

                        {/* Stray Animal Welfare Card */}
                        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group border-brand-green/10 bg-brand-green/[0.02]">
                            <div className="absolute top-0 left-0 w-[4px] h-full bg-brand-green" />
                            <div className="space-y-3 pl-2">
                                <span className="text-[10px] text-brand-green font-mono uppercase block font-semibold">Stray Animal Welfare</span>
                                <div className="space-y-0.5">
                                    <h4 className="text-2xl font-extrabold text-white">{straysHelped.toLocaleString()}</h4>
                                    <span className="text-[10px] text-zinc-400 block font-medium">Strays Fed & Vaccinated</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">
                                    Funded by ₹{strayAnimalsDonations.toLocaleString()} in campaign donations. Calculated at ₹100 per feed/treatment.
                                </p>
                            </div>
                        </div>

                        {/* Sanitary Hygiene Kits Card */}
                        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group border-rose-500/10 bg-rose-500/[0.02]">
                            <div className="absolute top-0 left-0 w-[4px] h-full bg-rose-500" />
                            <div className="space-y-3 pl-2">
                                <span className="text-[10px] text-rose-400 font-mono uppercase block font-semibold">Hygiene & Sanitary Drive</span>
                                <div className="space-y-0.5">
                                    <h4 className="text-2xl font-extrabold text-white">{hygieneKitsDistributed.toLocaleString()}</h4>
                                    <span className="text-[10px] text-zinc-400 block font-medium">Sanitary Kits Distributed</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">
                                    Funded by ₹{sanitaryPadsDonations.toLocaleString()} in campaign donations. Calculated at ₹150 per pad kit.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
