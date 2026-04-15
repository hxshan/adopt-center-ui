import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, MoreHorizontal, FileText, Award, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { PageSpinner } from '../components/ui/Spinner';
import { toast } from 'sonner';
import api from '../services/api';

const Applications = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [speciesFilter, setSpeciesFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, [statusFilter]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (statusFilter !== 'all') filters.status = statusFilter;

            const response = await api.applications.getCenterApplications(filters);
            if (response.success) {
                setApplications(response.data);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (e, id, newStatus) => {
        e.stopPropagation();
        try {
            await api.applications.review(id, newStatus, "Status updated via portal");
            toast.success(`Application updated to ${newStatus}`);
            fetchApplications();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.message || 'Failed to update application status');
        }
    };

    const handleFinalize = async (e, id, petName) => {
        e.stopPropagation();
        try {
            await toast.promise(
                api.applications.finalizeAdoption(id),
                {
                    loading: 'Finalizing adoption...',
                    success: `Adoption finalized! ${petName || 'Pet'} has been transferred to the adopter.`,
                    error: (err) => err.message || 'Failed to finalize adoption.',
                }
            );
            fetchApplications();
        } catch (error) {
            console.error('Error finalizing adoption:', error);
        }
    };

    const getApplicantName = (app) => {
        const first = app.applicant?.firstname || '';
        const last = app.applicant?.lastname || '';
        return `${first} ${last}`.trim() || 'Unknown';
    };

    const filteredApps = applications.filter(app => {
        const applicantName = getApplicantName(app);
        const petName = app.pet?.name || '';
        const matchesSearch =
            applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (app.applicant?.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSpecies = speciesFilter === 'all' || app.pet?.species === speciesFilter;

        const appDate = new Date(app.createdAt);
        const matchesDateFrom = !dateFrom || appDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || appDate <= new Date(dateTo + 'T23:59:59');

        return matchesSearch && matchesSpecies && matchesDateFrom && matchesDateTo;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
            case 'Under Review': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Adopted': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const hasActiveFilter = searchTerm || statusFilter !== 'all' || speciesFilter !== 'all' || dateFrom || dateTo;

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSpeciesFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Adoption Applications</h1>
                <p className="text-slate-500 mt-1">Review and manage incoming adoption requests.</p>
            </div>

            {/* Inline Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col gap-3">
                    {/* Row 1: Search + Status + Species */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by applicant name, email or pet name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all min-w-[140px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Adopted">Adopted</option>
                            <option value="Withdrawn">Withdrawn</option>
                        </select>
                        <select
                            value={speciesFilter}
                            onChange={(e) => setSpeciesFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all min-w-[130px]"
                        >
                            <option value="all">All Species</option>
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                            <option value="Bird">Bird</option>
                            <option value="Guinea Pig">Guinea Pig</option>
                            <option value="Hamster">Hamster</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    {/* Row 2: Date range + Clear */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <span className="text-xs text-slate-500 font-medium shrink-0">Date applied:</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                        />
                        <span className="text-xs text-slate-400 shrink-0">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                        />
                        {hasActiveFilter && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <PageSpinner label="Loading applications..." />
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableHead>Application ID</TableHead>
                                <TableHead>Applicant</TableHead>
                                <TableHead>Pet</TableHead>
                                <TableHead>Date Applied</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredApps.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        No applications found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredApps.map((app) => (
                                    <TableRow
                                        key={app._id}
                                        className="hover:bg-slate-50 cursor-pointer"
                                        onClick={() => navigate(`/applications/${app._id}`)}
                                    >
                                        <TableCell className="font-medium text-xs text-slate-500">
                                            {app._id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-slate-900">{getApplicantName(app)}</p>
                                                <p className="text-xs text-slate-500">{app.applicant?.email || 'No email'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {app.pet?.photosUrls?.[0] || app.pet?.profileImageUrl ? (
                                                    <img
                                                        src={app.pet.photosUrls?.[0] || app.pet.profileImageUrl}
                                                        alt={app.pet?.name}
                                                        className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs text-slate-400 font-medium">
                                                            {(app.pet?.name || '?').charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">{app.pet?.name || 'Unknown Pet'}</p>
                                                    {app.pet?.species && (
                                                        <p className="text-xs text-slate-400">{app.pet.species}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/applications/${app._id}`); }}>
                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {(app.status === 'Pending' || app.status === 'Under Review') && (
                                                        <>
                                                            <DropdownMenuItem onClick={(e) => handleStatusChange(e, app._id, 'Approved')}>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => handleStatusChange(e, app._id, 'Rejected')}>
                                                                <XCircle className="mr-2 h-4 w-4 text-rose-600" /> Reject
                                                            </DropdownMenuItem>
                                                            {app.status === 'Pending' && (
                                                                <DropdownMenuItem onClick={(e) => handleStatusChange(e, app._id, 'Under Review')}>
                                                                    <FileText className="mr-2 h-4 w-4 text-amber-600" /> Mark Under Review
                                                                </DropdownMenuItem>
                                                            )}
                                                        </>
                                                    )}
                                                    {app.status === 'Approved' && (
                                                        <DropdownMenuItem
                                                            onClick={(e) => handleFinalize(e, app._id, app.pet?.name)}
                                                            className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
                                                        >
                                                            <Award className="mr-2 h-4 w-4 text-emerald-600" /> Finalize Adoption
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <div className="text-sm text-slate-500">
                Showing {filteredApps.length} of {applications.length} applications
            </div>
        </div>
    );
};

export default Applications;
