import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { PageSpinner } from '../components/ui/Spinner';
import { reportAPI } from '../services/api';

// ── Colour maps ──────────────────────────────────────────────────────────────
const FUNNEL_COLORS = {
    'Pending': '#F59E0B',
    'Under Review': '#3B82F6',
    'Approved': '#10B981',
    'Rejected': '#EF4444',
};

const INVENTORY_COLORS = {
    'Available': '#10B981',
    'Pending': '#F59E0B',
    'On Hold': '#3B82F6',
    'Medical Care': '#EF4444',
    'Adopted': '#8B5CF6',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function Delta({ current, previous }) {
    const diff = current - previous;
    if (diff === 0) return <span className="flex items-center gap-1 text-xs text-slate-400"><Minus className="w-3 h-3" /> same as last month</span>;
    const up = diff > 0;
    return (
        <span className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {up ? '+' : ''}{diff} vs last month
        </span>
    );
}

function KpiCard({ label, value, sub, children }) {
    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
                {children && <div className="mt-1">{children}</div>}
            </CardContent>
        </Card>
    );
}

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [speciesData, setSpeciesData] = useState([]);
    const [funnelData, setFunnelData] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const [s, t, sp, f, inv] = await Promise.all([
                    reportAPI.getSummaryStats(),
                    reportAPI.getAdoptionTrends(),
                    reportAPI.getSpeciesDistribution(),
                    reportAPI.getApplicationFunnel(),
                    reportAPI.getInventoryStatus(),
                ]);
                setSummary(s.data);
                setTrendData(t.data || []);
                setSpeciesData(sp.data || []);
                setFunnelData(f.data || []);
                setInventoryData(inv.data || []);
            } catch (err) {
                console.error('Reports fetch error:', err);
                setError(err.message || 'Failed to load report data');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const handleExport = () => {
        const blob = new Blob([JSON.stringify({ summary, trendData, speciesData, funnelData, inventoryData }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adoption-report-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <PageSpinner label="Loading reports..." />;

    if (error) return (
        <div className="flex items-center justify-center h-64">
            <p className="text-sm text-red-500">{error}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h1>
                    <p className="text-slate-500 mt-1">Performance metrics and shelter statistics.</p>
                </div>
                <Button onClick={handleExport} className="bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-200">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                </Button>
            </div>

            {/* Row 1 — KPI Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Adoptions This Month"
                        value={summary.adoptedThisMonth}
                    >
                        <Delta current={summary.adoptedThisMonth} previous={summary.adoptedLastMonth} />
                    </KpiCard>
                    <KpiCard
                        label="Applications This Month"
                        value={summary.applicationsThisMonth}
                    />
                    <KpiCard
                        label="Approval Rate"
                        value={`${summary.approvalRate}%`}
                        sub="of reviewed applications"
                    />
                    <KpiCard
                        label="Avg Review Time"
                        value={`${summary.avgReviewHours}h`}
                        sub="from submission to decision"
                    />
                </div>
            )}

            {/* Row 2 — Adoption Trends (full width) */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Adoption Trends</CardTitle>
                    <CardDescription>Monthly completed adoptions by species.</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px]">
                    {trendData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-sm text-slate-400">No adoption history yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" stroke="#64748B" tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748B" tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                <Legend />
                                <Line type="monotone" dataKey="dogs" name="Dogs" stroke="#FB6F92" strokeWidth={3} dot={{ r: 4, fill: '#FB6F92' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="cats" name="Cats" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Row 3 — Inventory Pie + Application Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory Pie */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Current Inventory</CardTitle>
                        <CardDescription>Distribution of pets by species.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        {speciesData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-sm text-slate-400">No pets in inventory.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={speciesData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {speciesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} pets`, name]} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Application Pipeline */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Application Pipeline</CardTitle>
                        <CardDescription>Current applications by review status.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        {funnelData.every(d => d.count === 0) ? (
                            <div className="flex items-center justify-center h-full text-sm text-slate-400">No applications yet.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} layout="vertical" margin={{ left: 16, right: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                    <XAxis type="number" stroke="#64748B" tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="status" stroke="#64748B" tickLine={false} axisLine={false} width={90} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Applications" radius={[0, 4, 4, 0]}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[entry.status] || '#94A3B8'} />
                                        ))}
                                        <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: '#475569' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 4 — Inventory Status Breakdown (full width) */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Inventory Status Breakdown</CardTitle>
                    <CardDescription>How many pets are in each stage right now.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                    {inventoryData.every(d => d.count === 0) ? (
                        <div className="flex items-center justify-center h-full text-sm text-slate-400">No pets found.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inventoryData} margin={{ top: 16, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="status" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                <YAxis stroke="#64748B" tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" name="Pets" radius={[4, 4, 0, 0]}>
                                    {inventoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={INVENTORY_COLORS[entry.status] || '#94A3B8'} />
                                    ))}
                                    <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Reports;
