import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Heart, Search, X, User, Mail, Phone, Send } from 'lucide-react';
import { Spinner, PageSpinner } from '../components/ui/Spinner';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { validateAdoptionForm } from '../lib/validation';
import { cn } from '../lib/utils';
import FormField from '../components/ui/form-field';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Page-local primitives (matching AddPet styling)
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
    <div className="px-6 py-5 border-b border-slate-100">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const YesNoToggle = ({ value, onChange, error }) => (
  <div className="flex gap-2">
    {[true, false].map((opt) => (
      <button
        key={String(opt)}
        type="button"
        onClick={() => onChange(opt)}
        className={cn(
          'flex-1 px-3 py-2 rounded-md border text-sm font-medium transition-all cursor-pointer',
          value === opt
            ? 'border-pink-400 bg-pink-50 text-pink-600'
            : error
              ? 'border-red-300 text-slate-500'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
        )}
      >
        {opt ? 'Yes' : 'No'}
      </button>
    ))}
  </div>
);

const RadioPillGroup = ({ options, value, onChange, error }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <label
        key={opt}
        className={cn(
          'flex items-center justify-center px-3 py-2 rounded-md border text-xs cursor-pointer transition-all',
          value === opt
            ? 'border-pink-400 bg-pink-50 text-pink-600 font-medium'
            : error
              ? 'border-red-300 text-slate-500'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
        )}
      >
        <input
          type="radio"
          value={opt}
          checked={value === opt}
          onChange={() => onChange(opt)}
          className="hidden"
        />
        {opt}
      </label>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// User Autocomplete Component
// ---------------------------------------------------------------------------

const UserAutocomplete = ({ selectedUser, onSelect, onClear, error }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

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

  const handleSearch = useCallback((val) => {
    setQuery(val);
    setShowDropdown(true);
    clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await api.userManagement.searchMobileUsers(val);
        setSuggestions(result.data || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleSelect = (user) => {
    onSelect(user);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onClear();
    setQuery('');
    setSuggestions([]);
  };

  const getInitials = (u) => {
    const fn = u.firstname || u.firstName || '';
    const ln = u.lastname || u.lastName || '';
    return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase() || '?';
  };

  const getFullName = (u) => {
    return `${u.firstname || u.firstName || ''} ${u.lastname || u.lastName || ''}`.trim();
  };

  if (selectedUser) {
    return (
      <div className={cn(
        'rounded-lg border p-4 flex items-start gap-4',
        error ? 'border-red-300 bg-red-50' : 'border-pink-200 bg-pink-50/60'
      )}>
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-sm flex-shrink-0">
          {getInitials(selectedUser)}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{getFullName(selectedUser)}</p>
          <div className="flex flex-col gap-0.5 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Mail className="w-3 h-3" />
              <span>{selectedUser.email}</span>
            </div>
            {selectedUser.phone && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="w-3 h-3" />
                <span>{selectedUser.phone}</span>
              </div>
            )}
          </div>
        </div>
        {/* Clear */}
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-full hover:bg-pink-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 bg-white border rounded-md transition-colors',
        error ? 'border-red-400' : 'border-slate-200 focus-within:ring-1 focus-within:ring-pink-400 focus-within:border-pink-400'
      )}>
        <Search className="w-4 h-4 text-slate-300 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="Search by name or email..."
          className="flex-1 text-sm text-slate-800 placeholder-slate-300 outline-none bg-transparent"
        />
        {loading && <Spinner size="sm" className="text-slate-300 flex-shrink-0" />}
      </div>

      {showDropdown && (query.length >= 2) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4" />
              {query.length >= 2 ? 'No users found' : 'Type at least 2 characters'}
            </div>
          ) : (
            suggestions.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => handleSelect(u)}
                className="w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-semibold text-xs flex-shrink-0">
                  {getInitials(u)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{`${u.firstname || ''} ${u.lastname || ''}`.trim()}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const ApplyForAdoption = () => {
  const { petId } = useParams();
  const { pets, navigate } = useAppContext();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  // User selector
  const [selectedUser, setSelectedUser] = useState(null);
  const [sendEmail, setSendEmail] = useState(true);

  const [formData, setFormData] = useState({
    livingType: '',
    hasChildren: null,
    childrenAges: [],
    hasOtherPets: null,
    otherPetsDetails: '',
    activityLevel: '',
    experienceLevel: '',
    workSchedule: '',
    reasonForAdoption: '',
    additionalNotes: '',
  });

  const [childrenAgesInput, setChildrenAgesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Load pet from context
  useEffect(() => {
    if (petId && pets.length > 0) {
      const foundPet = pets.find(p => p._id === petId);
      if (foundPet) {
        // Guard: redirect if pet is not available
        if (foundPet.adoptionStatus !== 'Available') {
          toast.error(`${foundPet.name} is not available for adoption (status: ${foundPet.adoptionStatus})`);
          navigate('pet-detail', petId);
          return;
        }
        setPet(foundPet);
        setLoading(false);
      } else {
        toast.error('Pet not found');
        navigate('inventory');
      }
    } else if (petId && pets.length === 0) {
      setLoading(true);
    }
  }, [petId, pets, navigate]);

  const clearFieldError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleChange = (field, value) => {
    clearFieldError(field);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const parseChildrenAges = (raw) => {
    return raw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate user selection
    if (!selectedUser) {
      setErrors((prev) => ({ ...prev, selectedUser: 'Please select the applicant (mobile app user)' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Please select the applicant before submitting');
      return;
    }

    const payload = {
      ...formData,
      petId: pet._id,
      userId: selectedUser._id,
      sendEmail,
      childrenAges: formData.hasChildren ? parseChildrenAges(childrenAgesInput) : [],
    };

    const validation = validateAdoptionForm(payload);
    if (!validation.success) {
      setErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await toast.promise(
        api.applications.centerSubmitApplication(payload),
        {
          loading: `Submitting adoption application for ${pet.name}...`,
          success: `Application submitted successfully for ${pet.name}!`,
          error: (err) => err.message || 'Failed to submit application. Please try again.',
        }
      );

      navigate('pet-detail', pet._id);
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Loading State
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <PageSpinner label="Loading pet details..." />
      </div>
    );
  }

  if (!pet) return null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={() => navigate('pet-detail', pet._id)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {pet.name}'s Profile
        </button>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900">Adoption Application</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Apply to adopt <span className="font-medium text-slate-600">{pet.name}</span> · {pet.species} · {pet.breed}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Applicant Selector — REQUIRED */}
            <SectionCard
              title="Applicant *"
              hint="Search and select the mobile app user applying for this pet"
              className="overflow-visible"
            >
              <div className="flex flex-col gap-3">
                <UserAutocomplete
                  selectedUser={selectedUser}
                  onSelect={(u) => {
                    setSelectedUser(u);
                    clearFieldError('selectedUser');
                  }}
                  onClear={() => setSelectedUser(null)}
                  error={errors.selectedUser}
                />
                {errors.selectedUser && (
                  <p className="text-xs text-red-500 flex items-center gap-1">{errors.selectedUser}</p>
                )}

                {/* Send Email Toggle */}
                {selectedUser && (
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <Label htmlFor="send-email-switch" className="text-xs font-medium text-slate-700 cursor-pointer">
                        Send email notification
                      </Label>
                      <p className="text-xs text-slate-400 mt-0.5">Notify applicant about their application</p>
                    </div>
                    <Switch
                      id="send-email-switch"
                      checked={sendEmail}
                      onCheckedChange={setSendEmail}
                    />
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Pet Preview Card */}
            <SectionCard title="Adopting" hint="The pet being applied for">
              <div className="flex flex-col items-center text-center">
                {pet.photosUrls?.[0] || pet.profileImageUrl ? (
                  <img
                    src={pet.photosUrls?.[0] || pet.profileImageUrl}
                    alt={pet.name}
                    className="w-32 h-32 rounded-full object-cover mb-3 border-4 border-pink-50"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center mb-3 border-4 border-pink-50 text-4xl">
                    {pet.species === 'Dog' ? '🐕' : '🐱'}
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-900">{pet.name}</h3>
                <p className="text-sm text-slate-500 mb-1">
                  {pet.species} · {pet.breed}
                </p>
                <p className="text-xs text-slate-400">
                  {pet.age} {pet.age === 1 ? 'year' : 'years'} old · {pet.gender}
                </p>
                {pet.adoptionFee > 0 && (
                  <div className="mt-3 px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">
                    Adoption Fee: ${pet.adoptionFee}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* About Your Home */}
            <SectionCard title="About the Applicant's Home" hint="Living situation details">
              <div className="flex flex-col gap-4">

                <FormField label="Living Situation" required error={errors.livingType}>
                  <PetSelect
                    value={formData.livingType}
                    onChange={(e) => handleChange('livingType', e.target.value)}
                    error={errors.livingType}
                  >
                    <option value="" disabled>Select home type...</option>
                    <option>Apartment</option>
                    <option>House</option>
                    <option>Condo</option>
                    <option>Farm</option>
                    <option>Other</option>
                  </PetSelect>
                </FormField>

                <FormField label="Do they have children?" required error={errors.hasChildren}>
                  <YesNoToggle
                    value={formData.hasChildren}
                    onChange={(v) => handleChange('hasChildren', v)}
                    error={errors.hasChildren}
                  />
                </FormField>

                {formData.hasChildren === true && (
                  <FormField label="Children's Ages" hint="Enter ages separated by commas (e.g. 3, 7, 12)">
                    <PetInput
                      value={childrenAgesInput}
                      onChange={(e) => setChildrenAgesInput(e.target.value)}
                      placeholder="e.g. 3, 7, 12"
                    />
                  </FormField>
                )}

                <FormField label="Do they have other pets?" required error={errors.hasOtherPets}>
                  <YesNoToggle
                    value={formData.hasOtherPets}
                    onChange={(v) => handleChange('hasOtherPets', v)}
                    error={errors.hasOtherPets}
                  />
                </FormField>

                {formData.hasOtherPets === true && (
                  <FormField label="Describe their other pets" hint="Species, breed, temperament...">
                    <textarea
                      value={formData.otherPetsDetails}
                      onChange={(e) => handleChange('otherPetsDetails', e.target.value)}
                      rows={2}
                      placeholder="e.g. A 3-year-old Labrador, very friendly..."
                      className={cn(
                        'w-full px-3 py-2.5 bg-white border rounded-md text-sm text-slate-800 placeholder-slate-300 resize-none',
                        'focus:outline-none focus:ring-1 border-slate-200 focus:ring-pink-400 focus:border-pink-400 transition-colors'
                      )}
                    />
                  </FormField>
                )}

              </div>
            </SectionCard>

          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Lifestyle */}
            <SectionCard title="Applicant's Lifestyle" hint="Help match the right pet">
              <div className="flex flex-col gap-4">

                <FormField label="Activity Level" required error={errors.activityLevel}>
                  <RadioPillGroup
                    options={['Low', 'Moderate', 'High', 'Very High']}
                    value={formData.activityLevel}
                    onChange={(v) => handleChange('activityLevel', v)}
                    error={errors.activityLevel}
                  />
                </FormField>

                <FormField label="Experience with Pets" required error={errors.experienceLevel}>
                  <RadioPillGroup
                    options={['First-time', 'Experienced', 'Expert']}
                    value={formData.experienceLevel}
                    onChange={(v) => handleChange('experienceLevel', v)}
                    error={errors.experienceLevel}
                  />
                </FormField>

                <FormField label="Work Schedule" required error={errors.workSchedule}>
                  <PetSelect
                    value={formData.workSchedule}
                    onChange={(e) => handleChange('workSchedule', e.target.value)}
                    error={errors.workSchedule}
                  >
                    <option value="" disabled>Select schedule...</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Remote</option>
                    <option>Retired</option>
                    <option>Student</option>
                  </PetSelect>
                </FormField>

              </div>
            </SectionCard>

            {/* Message */}
            <SectionCard title="Adoption Message" hint="Reason for adopting this pet">
              <div className="flex flex-col gap-4">

                <FormField label="Why do they want to adopt?" required error={errors.reasonForAdoption}>
                  <textarea
                    value={formData.reasonForAdoption}
                    onChange={(e) => handleChange('reasonForAdoption', e.target.value)}
                    rows={6}
                    placeholder={`Describe the motivation to adopt ${pet.name}, their lifestyle, and how they plan to care for the pet...`}
                    className={cn(
                      'w-full px-3 py-2.5 bg-white border rounded-md text-sm text-slate-800 placeholder-slate-300 resize-none',
                      'focus:outline-none focus:ring-1 transition-colors',
                      errors.reasonForAdoption
                        ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                        : 'border-slate-200 focus:ring-pink-400 focus:border-pink-400'
                    )}
                  />
                  {!errors.reasonForAdoption && (
                    <p className="text-xs text-slate-400 mt-1">{formData.reasonForAdoption.length} / 2000 characters</p>
                  )}
                </FormField>

                <FormField label="Additional Notes" hint="Any other information? (optional)">
                  <textarea
                    value={formData.additionalNotes}
                    onChange={(e) => handleChange('additionalNotes', e.target.value)}
                    rows={3}
                    placeholder="Anything else we should know..."
                    className={cn(
                      'w-full px-3 py-2.5 bg-white border rounded-md text-sm text-slate-800 placeholder-slate-300 resize-none',
                      'focus:outline-none focus:ring-1 border-slate-200 focus:ring-pink-400 focus:border-pink-400 transition-colors'
                    )}
                  />
                </FormField>

              </div>
            </SectionCard>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-pink-600 text-white text-sm font-medium rounded-md hover:bg-pink-700 active:bg-pink-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting
              ? <><Spinner size="sm" /> Submitting...</>
              : <><Send className="w-4 h-4" /> Submit Application</>
            }
          </button>
          <button
            type="button"
            onClick={() => navigate('pet-detail', pet._id)}
            className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default ApplyForAdoption;
