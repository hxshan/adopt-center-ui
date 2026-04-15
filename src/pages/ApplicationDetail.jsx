import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Award, FileText,
  Edit3, Save, X, User, Mail, Phone, Search, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Spinner, PageSpinner } from '../components/ui/Spinner';
import { cn } from '../lib/utils';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Local primitives (same style as ApplyForAdoption.jsx)
// ---------------------------------------------------------------------------
const PetInput = ({ error, className, ...props }) => (
  <input
    {...props}
    className={cn(
      'w-full px-3 py-2 bg-white border rounded-md text-sm text-slate-800 placeholder-slate-300',
      'focus:outline-none focus:ring-1 transition-colors',
      error
        ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
        : 'border-slate-200 focus:ring-pink-400 focus:border-pink-400',
      className
    )}
  />
);

const PetSelect = ({ error, children, className, ...props }) => (
  <select
    {...props}
    className={cn(
      'w-full px-3 py-2 bg-white border rounded-md text-sm text-slate-800',
      'focus:outline-none focus:ring-1 transition-colors appearance-none',
      "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center]",
      error
        ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
        : 'border-slate-200 focus:ring-pink-400 focus:border-pink-400',
      className
    )}
  >
    {children}
  </select>
);

const SectionCard = ({ title, hint, children, className }) => (
  <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
    <div className="px-6 py-4 border-b border-slate-100">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const ReadRow = ({ label, value }) => (
  <div className="flex justify-between py-1.5 text-sm">
    <dt className="text-slate-500">{label}</dt>
    <dd className="font-medium text-slate-900 text-right max-w-[60%]">{value ?? 'N/A'}</dd>
  </div>
);

const YesNoToggle = ({ value, onChange, disabled }) => (
  <div className="flex gap-2">
    {[true, false].map((opt) => (
      <button
        key={String(opt)}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(opt)}
        className={cn(
          'px-4 py-1.5 rounded-md text-sm font-medium border transition-colors',
          value === opt
            ? 'bg-pink-600 text-white border-pink-600'
            : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {opt ? 'Yes' : 'No'}
      </button>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// UserAutocomplete (reused from ApplyForAdoption.jsx pattern)
// ---------------------------------------------------------------------------
const UserAutocomplete = ({ selectedUser, onSelect, onClear }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setShowDropdown(false); return; }
    setLoading(true);
    try {
      const res = await api.userManagement.searchMobileUsers(q);
      if (res.success) {
        setResults(res.data || []);
        setShowDropdown(true);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (selectedUser) {
    return (
      <div className="flex items-center justify-between p-3 bg-pink-50 border border-pink-200 rounded-lg">
        <div className="flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.email}`}
            alt=""
            className="w-9 h-9 rounded-full border border-pink-200"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {selectedUser.firstname} {selectedUser.lastname}
            </p>
            <p className="text-xs text-slate-500">{selectedUser.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md focus-within:ring-1 focus-within:ring-pink-400 focus-within:border-pink-400 transition-colors">
        <Search className="w-4 h-4 text-slate-300 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="Search by name or email..."
          className="flex-1 text-sm text-slate-800 placeholder-slate-300 outline-none bg-transparent"
        />
        {loading && <Spinner size="sm" className="text-slate-300 flex-shrink-0" />}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">No users found</div>
          ) : results.map((u) => (
            <button
              key={u._id}
              type="button"
              onClick={() => { onSelect(u); setQuery(''); setShowDropdown(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 transition-colors text-left"
            >
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                alt=""
                className="w-8 h-8 rounded-full flex-shrink-0 border border-slate-100"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{u.firstname} {u.lastname}</p>
                <p className="text-xs text-slate-400 truncate">{u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
const STATUS_COLORS = {
  Pending:       'bg-slate-100 text-slate-700 border-slate-200',
  'Under Review':'bg-amber-50 text-amber-700 border-amber-200',
  Approved:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected:      'bg-red-50 text-red-700 border-red-200',
  Adopted:       'bg-blue-50 text-blue-700 border-blue-200',
  Withdrawn:     'bg-slate-100 text-slate-500 border-slate-200',
};

const StatusBadge = ({ status }) => (
  <span className={cn(
    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
    STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border-slate-200'
  )}>
    {status}
  </span>
);

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function ApplicationDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // -------- Fetch application --------
  const fetchApplication = async () => {
    try {
      setLoading(true);
      const res = await api.applications.getApplicationDetails(applicationId);
      if (res.success) {
        setApplication(res.data);
        setReviewNotes(res.data.reviewNotes || '');
      } else {
        toast.error(res.message || 'Failed to load application');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  // -------- Enter edit mode: seed form with current values --------
  const handleEnterEdit = () => {
    if (!application) return;
    setEditData({
      livingType: application.livingType || '',
      hasChildren: application.hasChildren ?? false,
      childrenAges: application.childrenAges?.join(', ') || '',
      hasOtherPets: application.hasOtherPets ?? false,
      otherPetsDetails: application.otherPetsDetails || '',
      activityLevel: application.activityLevel || '',
      experienceLevel: application.experienceLevel || '',
      workSchedule: application.workSchedule || '',
      reasonForAdoption: application.reasonForAdoption || '',
      additionalNotes: application.additionalNotes || '',
    });
    setSelectedUser(null);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setSelectedUser(null);
    setEditData({});
  };

  // -------- Save edits --------
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...editData,
        childrenAges: editData.hasChildren
          ? editData.childrenAges.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
          : [],
      };
      if (selectedUser) payload.userId = selectedUser._id;

      const res = await api.applications.updateApplication(applicationId, payload);
      if (res.success) {
        setApplication(res.data);
        setEditMode(false);
        setSelectedUser(null);
        toast.success('Application updated successfully');
      } else {
        toast.error(res.message || 'Failed to update application');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update application');
    } finally {
      setIsSaving(false);
    }
  };

  // -------- Status actions --------
  const handleStatusAction = async (newStatus) => {
    setIsActioning(true);
    try {
      const res = await api.applications.review(applicationId, newStatus, reviewNotes);
      if (res.success) {
        setApplication(res.data);
        toast.success(`Application ${newStatus.toLowerCase()} successfully`);
      } else {
        toast.error(res.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setIsActioning(false);
    }
  };

  const handleFinalize = async () => {
    setIsActioning(true);
    try {
      await toast.promise(
        api.applications.finalizeAdoption(applicationId),
        {
          loading: 'Finalizing adoption...',
          success: `Adoption finalized! ${application?.pet?.name || 'Pet'} has been transferred.`,
          error: (err) => err.message || 'Failed to finalize adoption.',
        }
      );
      fetchApplication();
    } catch { /* handled by toast.promise */ }
    finally { setIsActioning(false); }
  };

  // -------- Loading / error states --------
  if (loading) return <PageSpinner label="Loading application..." />;
  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-slate-600 font-medium">Application not found</p>
        <button
          onClick={() => navigate('/applications')}
          className="text-sm text-pink-600 hover:underline"
        >
          ← Back to Applications
        </button>
      </div>
    );
  }

  const { pet, applicant, status, createdAt, reviewedBy, reviewedAt } = application;
  const petPhoto = pet?.photosUrls?.[0] || pet?.profileImageUrl || null;
  const applicantName = `${applicant?.firstname || ''} ${applicant?.lastname || ''}`.trim() || 'Unknown';
  const canAction = ['Pending', 'Under Review', 'Approved'].includes(status);
  const isLocked = ['Adopted', 'Cancelled', 'Withdrawn'].includes(status);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Back */}
      <button
        onClick={() => navigate('/applications')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </button>

      {/* ── Pet Hero Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Pet photo */}
          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-100 flex-shrink-0 bg-slate-100">
            {petPhoto ? (
              <img src={petPhoto} alt={pet?.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl font-bold">
                {(pet?.name || '?').charAt(0)}
              </div>
            )}
          </div>

          {/* Pet info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{pet?.name || 'Unknown Pet'}</h1>
              <StatusBadge status={status} />
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-500 mb-3">
              {pet?.species && <span className="bg-slate-100 px-2 py-0.5 rounded-full">{pet.species}</span>}
              {pet?.breed && <span className="bg-slate-100 px-2 py-0.5 rounded-full">{pet.breed}</span>}
              {pet?.adoptionFee != null && (
                <span className="bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                  Adoption Fee: ${pet.adoptionFee}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Application submitted on {new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {reviewedBy && reviewedAt && (
                <> · Reviewed by {reviewedBy.firstName} {reviewedBy.lastName} on {new Date(reviewedAt).toLocaleDateString()}</>
              )}
            </p>
          </div>

          {/* Application ID */}
          <div className="text-right text-xs text-slate-400 shrink-0">
            <p className="font-medium">Application ID</p>
            <p className="font-mono">{application._id?.substring(0, 12)}...</p>
          </div>
        </div>
      </div>

      {/* ── Applicant Card ── */}
      <SectionCard
        title="Applicant"
        hint={editMode ? 'Search to change the applicant for this application' : undefined}
      >
        {editMode ? (
          <UserAutocomplete
            selectedUser={selectedUser}
            onSelect={setSelectedUser}
            onClear={() => setSelectedUser(null)}
          />
        ) : (
          <div className="flex items-center gap-4">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${applicant?.email || 'default'}`}
              alt={applicantName}
              className="w-12 h-12 rounded-full border border-slate-100 flex-shrink-0"
            />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">{applicantName}</p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                {applicant?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />{applicant.email}
                  </span>
                )}
                {applicant?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />{applicant.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Status Actions ── */}
      {canAction && (
        <SectionCard title="Application Decision">
          {/* Review notes */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Review Notes <span className="text-slate-400">(optional — included in email notification)</span>
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about your decision..."
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-colors resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {(status === 'Pending' || status === 'Under Review') && (
              <>
                <button
                  onClick={() => handleStatusAction('Approved')}
                  disabled={isActioning}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isActioning ? <Spinner size="sm" className="text-white" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  onClick={() => handleStatusAction('Rejected')}
                  disabled={isActioning}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isActioning ? <Spinner size="sm" className="text-white" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
                {status === 'Pending' && (
                  <button
                    onClick={() => handleStatusAction('Under Review')}
                    disabled={isActioning}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isActioning ? <Spinner size="sm" className="text-white" /> : <FileText className="w-4 h-4" />}
                    Mark Under Review
                  </button>
                )}
              </>
            )}
            {status === 'Approved' && (
              <button
                onClick={handleFinalize}
                disabled={isActioning}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isActioning ? <Spinner size="sm" className="text-white" /> : <Award className="w-4 h-4" />}
                Finalize Adoption
              </button>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Edit Toggle Row ── */}
      {!isLocked && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Edit Application Details</p>
            <p className="text-xs text-slate-400 mt-0.5">Toggle to modify form fields or change the applicant</p>
          </div>
          <div className="flex items-center gap-3">
            {editMode && (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-1.5 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <><Spinner size="sm" className="text-white" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </>
            )}
            <Switch
              id="edit-mode"
              checked={editMode}
              onCheckedChange={(v) => v ? handleEnterEdit() : handleCancelEdit()}
            />
            <Label htmlFor="edit-mode" className="text-sm text-slate-600 cursor-pointer">
              {editMode ? 'Editing' : 'Edit Mode'}
            </Label>
          </div>
        </div>
      )}

      {/* ── Application Form Sections ── */}

      {/* Living Situation */}
      <SectionCard title="Living Situation">
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Housing Type</label>
              <PetSelect
                value={editData.livingType}
                onChange={(e) => setEditData(d => ({ ...d, livingType: e.target.value }))}
              >
                <option value="">Select type</option>
                {['Apartment', 'House', 'Condo', 'Farm', 'Other'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </PetSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Has Children?</label>
              <YesNoToggle value={editData.hasChildren} onChange={(v) => setEditData(d => ({ ...d, hasChildren: v }))} />
            </div>
            {editData.hasChildren && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Children's Ages (comma-separated)</label>
                <PetInput
                  value={editData.childrenAges}
                  onChange={(e) => setEditData(d => ({ ...d, childrenAges: e.target.value }))}
                  placeholder="e.g. 3, 7, 12"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Has Other Pets?</label>
              <YesNoToggle value={editData.hasOtherPets} onChange={(v) => setEditData(d => ({ ...d, hasOtherPets: v }))} />
            </div>
            {editData.hasOtherPets && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Other Pets Details</label>
                <PetInput
                  value={editData.otherPetsDetails}
                  onChange={(e) => setEditData(d => ({ ...d, otherPetsDetails: e.target.value }))}
                  placeholder="Describe other pets..."
                />
              </div>
            )}
          </div>
        ) : (
          <dl className="divide-y divide-slate-50">
            <ReadRow label="Housing Type" value={application.livingType} />
            <ReadRow label="Has Children" value={application.hasChildren ? 'Yes' : 'No'} />
            {application.hasChildren && (
              <ReadRow label="Children's Ages" value={application.childrenAges?.join(', ') || 'N/A'} />
            )}
            <ReadRow label="Has Other Pets" value={application.hasOtherPets ? 'Yes' : 'No'} />
            {application.hasOtherPets && (
              <ReadRow label="Other Pets Details" value={application.otherPetsDetails} />
            )}
          </dl>
        )}
      </SectionCard>

      {/* Lifestyle */}
      <SectionCard title="Lifestyle">
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Activity Level</label>
              <PetSelect
                value={editData.activityLevel}
                onChange={(e) => setEditData(d => ({ ...d, activityLevel: e.target.value }))}
              >
                <option value="">Select level</option>
                {['Low', 'Moderate', 'High', 'Very High'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </PetSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Experience Level</label>
              <PetSelect
                value={editData.experienceLevel}
                onChange={(e) => setEditData(d => ({ ...d, experienceLevel: e.target.value }))}
              >
                <option value="">Select level</option>
                {['First-time', 'Experienced', 'Expert'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </PetSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Work Schedule</label>
              <PetInput
                value={editData.workSchedule}
                onChange={(e) => setEditData(d => ({ ...d, workSchedule: e.target.value }))}
                placeholder="e.g. 9-5 office, remote, shifts..."
              />
            </div>
          </div>
        ) : (
          <dl className="divide-y divide-slate-50">
            <ReadRow label="Activity Level" value={application.activityLevel} />
            <ReadRow label="Experience Level" value={application.experienceLevel} />
            <ReadRow label="Work Schedule" value={application.workSchedule} />
          </dl>
        )}
      </SectionCard>

      {/* Reason + Notes */}
      <SectionCard title="Applicant's Message">
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reason for Adoption</label>
              <textarea
                rows={4}
                value={editData.reasonForAdoption}
                onChange={(e) => setEditData(d => ({ ...d, reasonForAdoption: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-colors resize-none"
                placeholder="Why does this person want to adopt?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes</label>
              <textarea
                rows={3}
                value={editData.additionalNotes}
                onChange={(e) => setEditData(d => ({ ...d, additionalNotes: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-colors resize-none"
                placeholder="Any extra information..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Reason for Adoption</h4>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg leading-relaxed">
                {application.reasonForAdoption || 'No reason provided.'}
              </p>
            </div>
            {application.additionalNotes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Additional Notes</h4>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg leading-relaxed">
                  {application.additionalNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}
