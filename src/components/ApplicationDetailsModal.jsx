import React from 'react';
import { X } from 'lucide-react';

const ApplicationDetailsModal = ({ application, onClose }) => {
    if (!application) return null;

    const { applicant, pet, livingType, hasChildren, childrenAges, hasOtherPets, otherPetsDetails, activityLevel, experienceLevel, workSchedule, reasonForAdoption, additionalNotes } = application;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Applicant & Pet Header */}
                    <div className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg">
                        {(pet?.photosUrls?.[0] || pet?.profileImageUrl) && (
                            <img src={pet.photosUrls?.[0] || pet.profileImageUrl} alt={pet.name} className="w-16 h-16 rounded-lg object-cover" />
                        )}
                        <div>
                            <h3 className="font-semibold text-lg">{`${applicant?.firstname || ''} ${applicant?.lastname || ''}`.trim() || 'Unknown'} wants to adopt {pet?.name}</h3>
                            <p className="text-sm text-gray-600">{applicant?.email}</p>
                            <p className="text-xs text-gray-500 mt-1">Applied on {new Date(application.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Living Situation */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 border-b pb-1">Living Situation</h4>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Housing Type:</dt>
                                    <dd className="font-medium">{livingType || 'N/A'}</dd>
                                </div>
                                {/* Yard info not in top level, maybe need to check profile? or just livingType */}
                            </dl>
                        </div>

                        {/* Family */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 border-b pb-1">Family & Household</h4>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Has Children:</dt>
                                    <dd className="font-medium">{hasChildren ? 'Yes' : 'No'}</dd>
                                </div>
                                {hasChildren && (
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">Ages:</dt>
                                        <dd className="font-medium">{childrenAges || 'N/A'}</dd>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Has Other Pets:</dt>
                                    <dd className="font-medium">{hasOtherPets ? 'Yes' : 'No'}</dd>
                                </div>
                                {hasOtherPets && (
                                    <div className="mt-1">
                                        <dt className="text-gray-500 text-xs mb-1">Details:</dt>
                                        <dd className="font-medium bg-gray-50 p-2 rounded text-xs">{otherPetsDetails || 'N/A'}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Lifestyle */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 border-b pb-1">Lifestyle</h4>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Activity Level:</dt>
                                    <dd className="font-medium">{activityLevel || 'N/A'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Work Schedule:</dt>
                                    <dd className="font-medium">{workSchedule || 'N/A'}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Experience */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 border-b pb-1">Experience</h4>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Experience Level:</dt>
                                    <dd className="font-medium">{experienceLevel || 'N/A'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Reasoning */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2 border-b pb-1">Reason for Adoption</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{reasonForAdoption || 'No reason provided.'}</p>
                    </div>

                    {/* Additional Notes */}
                    {additionalNotes && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2 border-b pb-1">Additional Notes</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{additionalNotes}</p>
                        </div>
                    )}

                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium cursor-pointer">Close</button>
                </div>
            </div>
        </div>
    );
};

export default ApplicationDetailsModal;
