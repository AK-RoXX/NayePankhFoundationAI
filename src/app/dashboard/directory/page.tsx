'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Volunteer {
    id: string;
    name: string;
    role: string;
    months_active: number;
    events_participated: number;
    focus_area: string;
    status: string;
    total_hours: number;
    email: string;
    created_at: string;
}

interface Donor {
    id: string;
    name: string;
    age: number;
    address: string;
    donation_amount: number;
    events_contributed: number;
    email: string;
    phone: string;
    frequency: string;
    created_at: string;
}

export default function DirectoryPage() {
    const router = useRouter();
    const supabase = createClient();

    // CRM management tabs: 'volunteers' | 'donors'
    const [activeTab, setActiveTab] = useState<'volunteers' | 'donors'>('volunteers');
    
    // Lists and loaders
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [donors, setDonors] = useState<Donor[]>([]);
    const [loading, setLoading] = useState(true);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [volunteerStatusFilter, setVolunteerStatusFilter] = useState('all');
    const [volunteerFocusFilter, setVolunteerFocusFilter] = useState('all');
    const [donorFrequencyFilter, setDonorFrequencyFilter] = useState('all');

    // Modals visibility
    const [isVolModalOpen, setIsVolModalOpen] = useState(false);
    const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);

    // Add Volunteer Form State
    const [volForm, setVolForm] = useState({
        name: '',
        email: '',
        role: 'Volunteer',
        monthsActive: '1',
        eventsParticipated: '0',
        focusArea: 'General',
        status: 'Active',
        totalHours: '0'
    });

    // Add Donor Form State
    const [donorForm, setDonorForm] = useState({
        name: '',
        email: '',
        phone: '',
        age: '',
        address: '',
        donationAmount: '0',
        eventsContributed: '0',
        frequency: 'One-time'
    });

    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchDirectoryData = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            // Fetch Volunteers
            const { data: volData, error: volErr } = await supabase
                .from('volunteers')
                .select('*')
                .order('name', { ascending: true });
            
            if (volErr) throw volErr;
            setVolunteers(volData || []);

            // Fetch Donors
            const { data: donorData, error: donorErr } = await supabase
                .from('donors')
                .select('*')
                .order('name', { ascending: true });

            if (donorErr) throw donorErr;
            setDonors(donorData || []);

        } catch (err) {
            console.error('Error fetching directories data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDirectoryData();
    }, [supabase, router]);

    // Handle Volunteer Submit
    const handleVolSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSubmitting(true);

        try {
            const { error } = await supabase
                .from('volunteers')
                .insert({
                    name: volForm.name.trim(),
                    email: volForm.email.trim() || null,
                    role: volForm.role,
                    months_active: Number(volForm.monthsActive) || 1,
                    events_participated: Number(volForm.eventsParticipated) || 0,
                    focus_area: volForm.focusArea,
                    status: volForm.status,
                    total_hours: Number(volForm.totalHours) || 0
                });

            if (error) throw error;

            setIsVolModalOpen(false);
            setVolForm({
                name: '',
                email: '',
                role: 'Volunteer',
                monthsActive: '1',
                eventsParticipated: '0',
                focusArea: 'General',
                status: 'Active',
                totalHours: '0'
            });
            fetchDirectoryData();
        } catch (err: any) {
            setFormError(err.message || 'Failed to save volunteer details.');
        } finally {
            setFormSubmitting(false);
        }
    };

    // Handle Donor Submit
    const handleDonorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormSubmitting(true);

        try {
            const { error } = await supabase
                .from('donors')
                .insert({
                    name: donorForm.name.trim(),
                    email: donorForm.email.trim() || null,
                    phone: donorForm.phone.trim() || null,
                    age: donorForm.age ? Number(donorForm.age) : null,
                    address: donorForm.address.trim() || null,
                    donation_amount: Number(donorForm.donationAmount) || 0,
                    events_contributed: Number(donorForm.eventsContributed) || 0,
                    frequency: donorForm.frequency
                });

            if (error) throw error;

            setIsDonorModalOpen(false);
            setDonorForm({
                name: '',
                email: '',
                phone: '',
                age: '',
                address: '',
                donationAmount: '0',
                eventsContributed: '0',
                frequency: 'One-time'
            });
            fetchDirectoryData();
        } catch (err: any) {
            setFormError(err.message || 'Failed to save donor details.');
        } finally {
            setFormSubmitting(false);
        }
    };

    // Filtering logic
    const filteredVolunteers = volunteers.filter(vol => {
        const matchesSearch = 
            vol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vol.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (vol.email && vol.email.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesStatus = volunteerStatusFilter === 'all' || vol.status === volunteerStatusFilter;
        const matchesFocus = volunteerFocusFilter === 'all' || vol.focus_area === volunteerFocusFilter;

        return matchesSearch && matchesStatus && matchesFocus;
    });

    const filteredDonors = donors.filter(donor => {
        const matchesSearch = 
            donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (donor.address && donor.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (donor.email && donor.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (donor.phone && donor.phone.includes(searchQuery));
        
        const matchesFrequency = donorFrequencyFilter === 'all' || donor.frequency === donorFrequencyFilter;

        return matchesSearch && matchesFrequency;
    });

    if (loading) {
        return (
            <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    <svg className="animate-spin w-12 h-12 text-brand-orange" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                </div>
                <h3 className="text-sm font-semibold text-zinc-300">Synchronizing registry ledger...</h3>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-white bg-gradient-to-r from-brand-orange to-brand-green bg-clip-text text-transparent">Members Directory</h1>
                    <p className="text-[10px] text-zinc-500 font-mono">Manage volunteers and donor profiles in the NayePankh cloud registry</p>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'volunteers' ? (
                        <button
                            onClick={() => setIsVolModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 text-white text-xs font-bold hover:opacity-95 transition-opacity orange-glow flex items-center gap-1.5"
                        >
                            ➕ Add Volunteer
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsDonorModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-green to-emerald-500 text-white text-xs font-bold hover:opacity-95 transition-opacity green-glow flex items-center gap-1.5"
                        >
                            ➕ Add Donor
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs & Filters */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Tabs switcher */}
                <div className="flex border-b border-white/5 w-full md:w-auto">
                    <button
                        onClick={() => { setActiveTab('volunteers'); setSearchQuery(''); }}
                        className={`px-5 pb-2.5 text-xs font-bold border-b-2 transition-all ${
                            activeTab === 'volunteers'
                                ? 'border-brand-orange text-brand-orange font-extrabold'
                                : 'border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        Volunteers ({volunteers.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('donors'); setSearchQuery(''); }}
                        className={`px-5 pb-2.5 text-xs font-bold border-b-2 transition-all ${
                            activeTab === 'donors'
                                ? 'border-brand-green text-brand-green font-extrabold'
                                : 'border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        Donors ({donors.length})
                    </button>
                </div>

                {/* Filter and Search controls */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={activeTab === 'volunteers' ? "Search volunteers by name, role..." : "Search donors by name, address..."}
                        className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-orange/50 transition-colors w-full sm:w-64"
                    />

                    {activeTab === 'volunteers' ? (
                        <>
                            <select
                                value={volunteerStatusFilter}
                                onChange={(e) => setVolunteerStatusFilter(e.target.value)}
                                className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>

                            <select
                                value={volunteerFocusFilter}
                                onChange={(e) => setVolunteerFocusFilter(e.target.value)}
                                className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none"
                            >
                                <option value="all">All Initiatives</option>
                                <option value="Hunger Relief">Hunger Relief</option>
                                <option value="Stray Welfare">Stray Welfare</option>
                                <option value="Hygiene Kits">Hygiene Kits</option>
                                <option value="General">General Support</option>
                            </select>
                        </>
                    ) : (
                        <select
                            value={donorFrequencyFilter}
                            onChange={(e) => setDonorFrequencyFilter(e.target.value)}
                            className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none"
                        >
                            <option value="all">All Frequencies</option>
                            <option value="One-time">One-time</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Annual">Annual</option>
                        </select>
                    )}
                </div>
            </div>

            {/* List Panels */}
            {activeTab === 'volunteers' ? (
                <div className="glass-panel rounded-2xl overflow-hidden border-white/5">
                    {filteredVolunteers.length === 0 ? (
                        <div className="py-16 text-center text-zinc-500 text-xs italic">
                            No volunteers found matching your selection criteria.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-zinc-950/60 border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                                        <th className="py-4 px-6">Name</th>
                                        <th className="py-4 px-6">Role</th>
                                        <th className="py-4 px-6">Initiative Cause</th>
                                        <th className="py-4 px-6">Months Active</th>
                                        <th className="py-4 px-6">Events</th>
                                        <th className="py-4 px-6">Hours Contributed</th>
                                        <th className="py-4 px-6">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredVolunteers.map(vol => (
                                        <tr key={vol.id} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="py-4 px-6 font-semibold text-zinc-200">
                                                <div>
                                                    <span className="block text-white">{vol.name}</span>
                                                    <span className="block text-[10px] text-zinc-500 font-mono mt-0.5">{vol.email || 'No email log'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 font-medium">
                                                    {vol.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-zinc-300">{vol.focus_area}</td>
                                            <td className="py-4 px-6 text-zinc-300 font-mono">{vol.months_active} mo</td>
                                            <td className="py-4 px-6 text-zinc-300 font-mono">{vol.events_participated}</td>
                                            <td className="py-4 px-6 text-zinc-300 font-mono">{vol.total_hours} hrs</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                                                    vol.status === 'Active'
                                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                        : 'bg-zinc-800 border border-white/5 text-zinc-500'
                                                }`}>
                                                    {vol.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-panel rounded-2xl overflow-hidden border-white/5">
                    {filteredDonors.length === 0 ? (
                        <div className="py-16 text-center text-zinc-500 text-xs italic">
                            No donors found matching your selection criteria.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-zinc-950/60 border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                                        <th className="py-4 px-6">Name</th>
                                        <th className="py-4 px-6">Age</th>
                                        <th className="py-4 px-6">Location Address</th>
                                        <th className="py-4 px-6">Events Funded</th>
                                        <th className="py-4 px-6">Giving Type</th>
                                        <th className="py-4 px-6">Donation Cumulative</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredDonors.map(donor => (
                                        <tr key={donor.id} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="py-4 px-6 font-semibold text-zinc-200">
                                                <div>
                                                    <span className="block text-white">{donor.name}</span>
                                                    <span className="block text-[10px] text-zinc-500 font-mono mt-0.5">
                                                        {donor.email ? `📧 ${donor.email}` : ''} {donor.phone ? ` 📞 ${donor.phone}` : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-zinc-300 font-mono">{donor.age || '—'}</td>
                                            <td className="py-4 px-6 text-zinc-300 truncate max-w-[200px]">{donor.address || '—'}</td>
                                            <td className="py-4 px-6 text-zinc-300 font-mono">{donor.events_contributed}</td>
                                            <td className="py-4 px-6">
                                                <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 font-medium">
                                                    {donor.frequency}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 font-extrabold text-brand-green font-mono">
                                                ₹{Number(donor.donation_amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL 1: ADD VOLUNTEER */}
            {isVolModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel max-w-md w-full p-6 rounded-2xl relative overflow-hidden space-y-4">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-orange to-amber-500" />
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Volunteer Coordinator</h3>
                            <button
                                onClick={() => setIsVolModalOpen(false)}
                                className="text-zinc-500 hover:text-zinc-300 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-semibold">
                                ⚠️ {formError}
                            </div>
                        )}

                        <form onSubmit={handleVolSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={volForm.name}
                                        onChange={(e) => setVolForm({ ...volForm, name: e.target.value })}
                                        placeholder="e.g. John Doe"
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-700 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Email</label>
                                    <input
                                        type="email"
                                        value={volForm.email}
                                        onChange={(e) => setVolForm({ ...volForm, email: e.target.value })}
                                        placeholder="john@example.com"
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-700 focus:outline-none focus:border-brand-orange/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Role</label>
                                    <input
                                        required
                                        type="text"
                                        value={volForm.role}
                                        onChange={(e) => setVolForm({ ...volForm, role: e.target.value })}
                                        placeholder="e.g. Field Executive"
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-orange/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Initiative Focus</label>
                                    <select
                                        value={volForm.focusArea}
                                        onChange={(e) => setVolForm({ ...volForm, focusArea: e.target.value })}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-zinc-400 focus:outline-none"
                                    >
                                        <option value="Hunger Relief">Hunger Relief</option>
                                        <option value="Stray Welfare">Stray Welfare</option>
                                        <option value="Hygiene Kits">Hygiene Kits</option>
                                        <option value="General">General Support</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Months Active</label>
                                    <input
                                        type="number"
                                        value={volForm.monthsActive}
                                        onChange={(e) => setVolForm({ ...volForm, monthsActive: e.target.value })}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Events</label>
                                    <input
                                        type="number"
                                        value={volForm.eventsParticipated}
                                        onChange={(e) => setVolForm({ ...volForm, eventsParticipated: e.target.value })}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Hours</label>
                                    <input
                                        type="number"
                                        value={volForm.totalHours}
                                        onChange={(e) => setVolForm({ ...volForm, totalHours: e.target.value })}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase">Volunteer Status</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-zinc-300">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Active"
                                            checked={volForm.status === 'Active'}
                                            onChange={() => setVolForm({ ...volForm, status: 'Active' })}
                                        />
                                        Active
                                    </label>
                                    <label className="flex items-center gap-2 text-zinc-300">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Inactive"
                                            checked={volForm.status === 'Inactive'}
                                            onChange={() => setVolForm({ ...volForm, status: 'Inactive' })}
                                        />
                                        Inactive
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={formSubmitting}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 font-bold text-white hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center"
                            >
                                {formSubmitting ? 'Registering...' : 'Register Volunteer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADD DONOR */}
            {isDonorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel max-w-md w-full p-6 rounded-2xl relative overflow-hidden space-y-4">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-green to-emerald-500" />
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Philanthropic Donor</h3>
                            <button
                                onClick={() => setIsDonorModalOpen(false)}
                                className="text-zinc-500 hover:text-zinc-300 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-semibold">
                                ⚠️ {formError}
                            </div>
                        )}

                        <form onSubmit={handleDonorSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={donorForm.name}
                                        onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                                        placeholder="e.g. Meera Gupta"
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-700 focus:outline-none focus:border-brand-green/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Email</label>
                                    <input
                                        type="email"
                                        value={donorForm.email}
                                        onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                                        placeholder="meera@outlook.com"
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-zinc-700 focus:outline-none focus:border-brand-green/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Phone Contact</label>
                                    <input
                                        type="text"
                                        value={donorForm.phone}
                                        onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                                        placeholder="+919876543210"
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-green/50 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Age</label>
                                    <input
                                        type="number"
                                        value={donorForm.age}
                                        onChange={(e) => setDonorForm({ ...donorForm, age: e.target.value })}
                                        placeholder="e.g. 34"
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase">Address Location</label>
                                <input
                                    type="text"
                                    value={donorForm.address}
                                    onChange={(e) => setDonorForm({ ...donorForm, address: e.target.value })}
                                    placeholder="e.g. Bandra West, Mumbai"
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-green/50 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Donation Amount (INR)</label>
                                    <input
                                        required
                                        type="number"
                                        value={donorForm.donationAmount}
                                        onChange={(e) => setDonorForm({ ...donorForm, donationAmount: e.target.value })}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Events Funded</label>
                                    <input
                                        type="number"
                                        value={donorForm.eventsContributed}
                                        onChange={(e) => setDonorForm({ ...donorForm, eventsContributed: e.target.value })}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase">Giving Frequency</label>
                                <select
                                    value={donorForm.frequency}
                                    onChange={(e) => setDonorForm({ ...donorForm, frequency: e.target.value })}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-zinc-400 focus:outline-none"
                                >
                                    <option value="One-time">One-time Gift</option>
                                    <option value="Monthly">Monthly Pledge</option>
                                    <option value="Annual">Annual Supporter</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={formSubmitting}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-green to-emerald-500 font-bold text-white hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center"
                            >
                                {formSubmitting ? 'Saving...' : 'Save Donor Profile'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
