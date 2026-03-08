import React, { useState } from 'react';
import { Dog, Cat, ArrowLeft, Upload, X, Plus, Sparkles } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import BreedAutocomplete from '../components/common/BreedAutocomplete';
import { validatePetForm } from '../lib/validation';
import { cn } from '../lib/utils';
import FormField from '../components/ui/form-field';
import { enhanceDescription } from '../services/openrouter';

// ---------------------------------------------------------------------------
// Page-local primitives (pet-form specific styling — NOT generic enough for ui/)
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const AddPet = () => {
  const { addPet, navigate } = useAppContext();

  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    gender: 'Male',
    size: 'Medium',
    age: '',
    weight: '',
    description: '',
    adoptionFee: '0',
    specialNeeds: '',
    goodWithKids: false,
    goodWithPets: false,
    vaccinated: false,
    neutered: false,
    houseTrained: false,
    energyLevel: 'Moderate',
    adoptionStatus: 'Available',   // NEW — default to available
  });

  // Multi-color state: array of strings, first is required
  const [colors, setColors] = useState(['']);

  const [photos, setPhotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enhancingDesc, setEnhancingDesc] = useState(false);
  const [errors, setErrors] = useState({});

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const clearFieldError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    clearFieldError(name);
    if (name === 'species') {
      setFormData((prev) => ({ ...prev, species: value, breed: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleBreedChange = (val) => {
    clearFieldError('breed');
    setFormData((prev) => ({ ...prev, breed: val }));
  };

  // ── Color array handlers ──────────────────────────────────────────────────
  const updateColor = (index, value) => {
    setColors((prev) => prev.map((c, i) => (i === index ? value : c)));
  };

  const addColor = () => {
    if (colors.length < 3) setColors((prev) => [...prev, '']);
  };

  const removeColor = (index) => {
    if (colors.length <= 1) return; // keep at least one
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Photo handlers ────────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      setErrors((prev) => ({ ...prev, photos: 'Maximum 5 photos allowed' }));
      return;
    }
    const oversizedFiles = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        photos: `Files too large (max 10 MB): ${oversizedFiles.map((f) => f.name).join(', ')}`,
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, photos: undefined }));
    setPhotos((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // ── AI description enhancer ───────────────────────────────────────────────
  const handleEnhance = async () => {
    if (!formData.description.trim()) return;
    setEnhancingDesc(true);
    try {
      const enhanced = await enhanceDescription(formData.description);
      setFormData((prev) => ({ ...prev, description: enhanced }));
    } finally {
      setEnhancingDesc(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form — inject primary color from the colors array before Zod checks it
    const validation = validatePetForm({ ...formData, color: colors.filter(Boolean)[0] || '' });
    if (!validation.success) {
      setErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const data = new FormData();

      // Append all scalar fields (skip color — handled separately)
      Object.keys(formData).forEach((key) => {
        data.append(key, typeof formData[key] === 'boolean' ? formData[key].toString() : formData[key]);
      });

      // Append colors array as JSON string
      const filteredColors = colors.filter(Boolean);
      data.append('colors', JSON.stringify(filteredColors));
      // Also set the primary color field
      if (filteredColors.length > 0) {
        data.set('color', filteredColors[0]);
      }

      photos.forEach((photo) => data.append('photos', photo));

      await toast.promise(
        addPet(data),
        {
          loading: `Adding ${formData.name || 'pet'} to the system...`,
          success: `${formData.name || 'Pet'} has been successfully added!`,
          error: (err) => err.message || 'Failed to add pet. Please try again.',
        }
      );
    } catch (error) {
      console.error('Failed to add pet:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const characteristics = [
    { name: 'goodWithKids', label: 'Good with Kids' },
    { name: 'goodWithPets', label: 'Good with Pets' },
    { name: 'vaccinated', label: 'Vaccinated' },
    { name: 'neutered', label: 'Neutered' },
    { name: 'houseTrained', label: 'House Trained' },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={() => navigate('inventory')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </button>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900">Add New Pet</h1>
          <p className="text-sm text-slate-400 mt-0.5">Fill in the details to list a new pet for adoption</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* Pet Information */}
            <SectionCard title="Pet Information" hint="Basic details about the pet.">
              <div className="flex flex-col gap-4">

                <FormField label="Name" required error={errors.name}>
                  <PetInput
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Buddy"
                    error={errors.name}
                  />
                </FormField>

                {/* Species */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Species <span className="text-pink-500 ml-0.5">*</span>
                  </label>
                  <div className="flex gap-2 mt-1">
                    {['Dog', 'Cat'].map((sp) => (
                      <label
                        key={sp}
                        className={cn(
                          'flex items-center gap-2 flex-1 px-3 py-2 rounded-md border text-sm cursor-pointer transition-all',
                          formData.species === sp
                            ? 'border-pink-400 bg-pink-50 text-pink-600'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        )}
                      >
                        <input
                          type="radio"
                          name="species"
                          value={sp}
                          checked={formData.species === sp}
                          onChange={handleChange}
                          className="hidden"
                        />
                        {sp === 'Dog' ? <Dog className="w-4 h-4" /> : <Cat className="w-4 h-4" />}
                        {sp}
                      </label>
                    ))}
                  </div>
                </div>

                <FormField label="Breed" required error={errors.breed}>
                  <BreedAutocomplete
                    value={formData.breed}
                    onChange={handleBreedChange}
                    species={formData.species}
                    hasError={!!errors.breed}
                  />
                </FormField>

                {/* ── Multi-Color Inputs ──────────────────────────────── */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Color <span className="text-pink-500 ml-0.5">*</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {colors.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <PetSelect
                          value={c}
                          onChange={(e) => updateColor(idx, e.target.value)}
                          error={idx === 0 && errors.color}
                        >
                          <option value="">{idx === 0 ? 'Select primary color…' : 'Select color…'}</option>
                          {['Black', 'Brown', 'Golden', 'Yellow', 'Cream', 'Gray', 'White'].map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </PetSelect>
                        {colors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeColor(idx)}
                            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {colors.length < 3 && (
                    <button
                      type="button"
                      onClick={addColor}
                      className="mt-2 flex items-center gap-1.5 text-xs text-pink-500 hover:text-pink-700 transition-colors font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add another color
                    </button>
                  )}
                </div>

              </div>
            </SectionCard>

            {/* Adoption Details */}
            <SectionCard title="Adoption Details">
              <div className="flex flex-col gap-4">

                {/* ── Availability Toggle ─────────────────────────────── */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Available for Adoption</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formData.adoptionStatus === 'Available' ? 'Visible to adopters' : 'Not listed as available'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        adoptionStatus: prev.adoptionStatus === 'Available' ? 'On Hold' : 'Available',
                      }))
                    }
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                      'transition-colors duration-200 ease-in-out focus:outline-none',
                      formData.adoptionStatus === 'Available' ? 'bg-pink-500' : 'bg-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out',
                        formData.adoptionStatus === 'Available' ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                <FormField label="Adoption Fee ($)" required error={errors.adoptionFee}>
                  <PetInput
                    name="adoptionFee"
                    value={formData.adoptionFee}
                    onChange={handleChange}
                    placeholder="e.g., 250"
                    error={errors.adoptionFee}
                  />
                </FormField>

                <FormField label="Special Needs" hint="Leave blank if none.">
                  <PetInput
                    name="specialNeeds"
                    value={formData.specialNeeds}
                    onChange={handleChange}
                    placeholder="Any special requirements..."
                  />
                </FormField>

              </div>
            </SectionCard>

          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Media */}
            <SectionCard title="Media" hint="Upload up to 5 photos of the pet.">
              {errors.photos && (
                <p className="text-xs text-red-500 mb-3 font-medium">{errors.photos}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200 group"
                  >
                    <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 text-slate-500 hover:text-red-500 rounded-full flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {photos.length < 5 && (
                  <label className="w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors group">
                    <Upload className="w-5 h-5 text-slate-300 group-hover:text-pink-400 transition-colors" />
                    <span className="text-xs text-slate-400 group-hover:text-pink-400 mt-1.5 transition-colors font-medium">
                      Drag or browse
                    </span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>
            </SectionCard>

            {/* Physical Details */}
            <SectionCard title="Physical Details" hint="Size, age, weight and energy level.">
              <div className="grid grid-cols-2 gap-4">

                <FormField label="Gender" required>
                  <PetSelect name="gender" value={formData.gender} onChange={handleChange}>
                    <option>Male</option>
                    <option>Female</option>
                  </PetSelect>
                </FormField>

                <FormField label="Size" required>
                  <PetSelect name="size" value={formData.size} onChange={handleChange}>
                    <option>Small</option>
                    <option>Medium</option>
                    <option>Large</option>
                    <option>Extra Large</option>
                  </PetSelect>
                </FormField>

                <FormField label="Age (years)" required error={errors.age}>
                  <PetInput
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g., 2"
                    error={errors.age}
                  />
                </FormField>

                <FormField label="Weight (kg)" error={errors.weight}>
                  <PetInput
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g., 10"
                    error={errors.weight}
                  />
                </FormField>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Energy Level</label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {['Low', 'Moderate', 'High', 'Very High'].map((level) => (
                      <label
                        key={level}
                        className={cn(
                          'flex items-center justify-center px-2 py-2 rounded-md border text-xs cursor-pointer transition-all text-center',
                          formData.energyLevel === level
                            ? 'border-pink-400 bg-pink-50 text-pink-600 font-medium'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        )}
                      >
                        <input
                          type="radio"
                          name="energyLevel"
                          value={level}
                          checked={formData.energyLevel === level}
                          onChange={handleChange}
                          className="hidden"
                        />
                        {level}
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </SectionCard>

            {/* Characteristics */}
            <SectionCard title="Characteristics" hint="Select all that apply to this pet.">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {characteristics.map(({ name, label }) => (
                  <label
                    key={name}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-md border text-sm cursor-pointer transition-all',
                      formData[name]
                        ? 'border-pink-400 bg-pink-50 text-pink-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all',
                        formData[name] ? 'bg-pink-500 border-pink-500' : 'border-slate-300'
                      )}
                    >
                      {formData[name] && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} className="hidden" />
                    {label}
                  </label>
                ))}
              </div>
            </SectionCard>

            {/* Description */}
            <SectionCard title="Description" hint="Tell potential adopters about this pet's personality.">
              <FormField required error={errors.description}>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Describe the pet's personality, habits, and what makes them special..."
                    className={cn(
                      'w-full px-3 py-2.5 bg-white border rounded-md text-sm text-slate-800 placeholder-slate-300 resize-none',
                      'focus:outline-none focus:ring-1 transition-colors',
                      errors.description
                        ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                        : 'border-slate-200 focus:ring-pink-400 focus:border-pink-400'
                    )}
                  />
                  {/* ✨ AI Enhance Button */}
                  <button
                    type="button"
                    disabled={enhancingDesc || !formData.description.trim()}
                    onClick={handleEnhance}
                    title="Enhance"
                    className={cn(
                      'absolute bottom-2 right-2 flex items-center justify-center w-8 h-8 rounded-md transition-colors z-10',
                      'text-pink-500 hover:text-pink-600 hover:bg-pink-50',
                      'disabled:opacity-40 disabled:cursor-not-allowed'
                    )}
                  >
                    {enhancingDesc
                      ? <span className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                      : <Sparkles className="w-4 h-4" />
                    }
                  </button>
                </div>
              </FormField>
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
            style={{ boxShadow: 'none' }}
          >
            {isSubmitting && <Spinner size="sm" />}
            {isSubmitting ? 'Adding Pet...' : '+ Add Pet'}
          </button>
          <button
            type="button"
            onClick={() => navigate('inventory')}
            className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddPet;
