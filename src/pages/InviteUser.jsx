import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Info } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import FormField from '../components/ui/form-field';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Page-local primitives (matching AddPet / ApplyForAdoption style)
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

const InviteUser = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'admin',
    nic: {
      number: '',
      issuedDate: '',
    },
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null); // { email, tempPassword }

  // Get current user to determine role options
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const handleChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field.startsWith('nic.')) {
      const nicField = field.split('.')[1];
      setFormData((prev) => ({ ...prev, nic: { ...prev.nic, [nicField]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.nic.number.trim()) errs['nic.number'] = 'NIC number is required';
    if (!formData.nic.issuedDate) errs['nic.issuedDate'] = 'NIC issued date is required';
    if (!formData.role) errs.role = 'Role is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.userManagement.inviteUser(formData);
      if (result.success) {
        setSuccessInfo({
          email: result.data.email,
          tempPassword: result.data.tempPassword,
        });
        toast.success(`${formData.firstName} ${formData.lastName} has been invited successfully!`);
      } else {
        toast.error(result.message || 'Failed to invite user');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to invite user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Success screen (show temp password before leaving)
  // -------------------------------------------------------------------------

  if (successInfo) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-pink-600 px-8 py-6 text-center">
              <UserPlus className="w-10 h-10 text-white mx-auto mb-2" />
              <h1 className="text-xl font-bold text-white">User Invited Successfully!</h1>
            </div>
            <div className="p-8">
              <p className="text-slate-600 text-sm mb-6 text-center">
                An invitation email has been sent to <strong>{successInfo.email}</strong>. <br />
                Share the temporary password below if the email wasn't received.
              </p>

              {/* Temp password display */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-5 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-pink-700 mb-1">Temporary Password</p>
                    <p className="font-mono text-lg font-bold text-pink-900 tracking-wider">
                      {successInfo.tempPassword}
                    </p>
                    <p className="text-xs text-pink-600 mt-2">
                      The user must change this password after their first login.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/user-management')}
                  className="px-5 py-2 bg-pink-600 text-white text-sm font-medium rounded-md hover:bg-pink-700 transition-colors cursor-pointer"
                >
                  Back to User Management
                </button>
                <button
                  onClick={() => {
                    setSuccessInfo(null);
                    setFormData({
                      firstName: '', lastName: '', email: '', phone: '',
                      role: 'admin', nic: { number: '', issuedDate: '' }
                    });
                    setErrors({});
                  }}
                  className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Invite Another User
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={() => navigate('/user-management')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to User Management
        </button>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900">Invite Team Member</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Add a new staff member to your PetConnect center. They will receive an email with their login credentials.
          </p>
        </div>

        <div className="flex flex-col gap-5">

          {/* Section 1 — Personal Information */}
          <SectionCard title="Personal Information" hint="Basic contact details for the new staff member">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="First Name" required error={errors.firstName}>
                  <PetInput
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="e.g. Sarah"
                    error={errors.firstName}
                  />
                </FormField>
                <FormField label="Last Name" required error={errors.lastName}>
                  <PetInput
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="e.g. Johnson"
                    error={errors.lastName}
                  />
                </FormField>
              </div>

              <FormField label="Email Address" required error={errors.email}>
                <PetInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="e.g. sarah@shelter.org"
                  error={errors.email}
                />
              </FormField>

              <FormField label="Phone Number" hint="Optional">
                <PetInput
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Section 2 — Identity Verification */}
          <SectionCard title="Identity Verification" hint="NIC details for staff verification">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="NIC Number" required error={errors['nic.number']}>
                  <PetInput
                    value={formData.nic.number}
                    onChange={(e) => handleChange('nic.number', e.target.value)}
                    placeholder="e.g. 199812345678"
                    error={errors['nic.number']}
                  />
                </FormField>
                <FormField label="NIC Issued Date" required error={errors['nic.issuedDate']}>
                  <PetInput
                    type="date"
                    value={formData.nic.issuedDate}
                    onChange={(e) => handleChange('nic.issuedDate', e.target.value)}
                    error={errors['nic.issuedDate']}
                  />
                </FormField>
              </div>
            </div>
          </SectionCard>

          {/* Section 3 — Access & Role */}
          <SectionCard title="Access & Role" hint="Set the staff member's permission level">
            <div className="flex flex-col gap-3">
              <FormField label="Role" required error={errors.role}>
                <PetSelect
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  disabled={currentUser?.role !== 'owner'}
                  error={errors.role}
                >
                  <option value="admin">Admin</option>
                  {currentUser?.role === 'owner' && <option value="owner">Owner</option>}
                </PetSelect>
              </FormField>

              <div className="text-xs text-slate-500 bg-slate-50 rounded-md px-3 py-2.5 border border-slate-100">
                {currentUser?.role === 'owner' ? (
                  <>
                    <strong>Owner</strong> — full control over all center settings, users, and pets.<br />
                    <strong>Admin</strong> — can manage pets and applications, but cannot manage other owners.
                  </>
                ) : (
                  'Only center owners can assign the Owner role. You can invite Admin-level staff members.'
                )}
              </div>
            </div>
          </SectionCard>

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
              ? <><Spinner size="sm" /> Sending Invite...</>
              : <><UserPlus className="w-4 h-4" /> Send Invite</>
            }
          </button>
          <button
            type="button"
            onClick={() => navigate('/user-management')}
            className="px-5 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default InviteUser;
