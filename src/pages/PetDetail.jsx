import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Edit, ClipboardList } from 'lucide-react';
import { PageSpinner } from '../components/ui/Spinner';
import { useAppContext } from '../context/AppContext';
import { getImageUrl } from '../lib/utils';
import api from '../services/api';

const PetDetail = () => {
  const { petId } = useParams();
  const { pets, navigate } = useAppContext();
  const [pet, setPet] = useState(() => pets.find((p) => p._id === petId) || null);
  const [loading, setLoading] = useState(!pet);
  const [activeImage, setActiveImage] = useState(0);

  // Fetch from API if pet not in context (direct URL navigation)
  useEffect(() => {
    if (!pet && petId) {
      setLoading(true);
      api.pet.getById(petId)
        .then((result) => {
          if (result.success && result.data) {
            setPet(result.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [petId, pet]);

  if (loading) {
    return <PageSpinner label="Loading pet details..." />;
  }

  if (!pet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pet Not Found</h2>
        <button
          onClick={() => navigate('inventory')}
          className="text-pink-600 hover:text-pink-700 font-medium text-sm cursor-pointer"
        >
          Back to Inventory
        </button>
      </div>
    );
  }

  const allPhotos = pet.photos && pet.photos.length > 0 ? pet.photos : [pet.imageUrl || ''];

  // Latest weight from weightHistory array
  const latestWeight =
    pet.weightHistory && pet.weightHistory.length > 0
      ? pet.weightHistory[pet.weightHistory.length - 1]?.weight
      : null;

  // Format date of birth
  const formattedDob = pet.dob
    ? new Date(pet.dob).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => navigate('inventory')}
        className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2 text-sm font-medium cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Inventory
      </button>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Pet Header & Gallery */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Gallery */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden relative">
                {allPhotos[activeImage] ? (
                  <img
                    src={getImageUrl(allPhotos[activeImage])}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {pet.species === 'Dog' ? '🐕' : '🐱'}
                  </div>
                )}
              </div>
              {allPhotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allPhotos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer ${
                        activeImage === index ? 'border-pink-500' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={getImageUrl(photo)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                  <p className="text-lg text-gray-500 mt-1">{pet.breed || 'Mixed Breed'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${
                      pet.adoptionStatus === 'Available'
                        ? 'bg-green-100 text-green-700'
                        : pet.adoptionStatus === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : pet.adoptionStatus === 'Adopted'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pet.adoptionStatus}
                  </span>
                </div>
              </div>

              {/* Adoption Fee Banner */}
              {pet.adoptionFee !== undefined && (
                <div className="mb-5">
                  <span className="inline-flex px-4 py-1.5 bg-pink-50 text-pink-700 rounded-full text-sm font-semibold border border-pink-100">
                    {pet.adoptionFee > 0 ? `Adoption Fee: $${pet.adoptionFee}` : 'Free Adoption'}
                  </span>
                </div>
              )}

              {/* Stats Grid — Row 1: Species, Gender, Age, Size */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Species</p>
                  <p className="font-semibold text-gray-900 text-sm">{pet.species}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Gender</p>
                  <p className="font-semibold text-gray-900 text-sm">{pet.gender}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Age</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {pet.age} {pet.age === 1 ? 'Year' : 'Years'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Size</p>
                  <p className="font-semibold text-gray-900 text-sm">{pet.size || 'N/A'}</p>
                </div>
              </div>

              {/* Stats Grid — Row 2: Color, Date of Birth, Weight, Energy */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Color</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {(pet.colors && pet.colors.length > 0 ? pet.colors.join(', ') : pet.color) || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                  <p className="font-semibold text-gray-900 text-sm">{formattedDob || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Weight</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {latestWeight ? `${latestWeight} kg` : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Energy</p>
                  <p className="font-semibold text-gray-900 text-sm">{pet.energyLevel || 'N/A'}</p>
                </div>
              </div>

              {/* Characteristics Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {pet.goodWithKids && (
                  <span className="bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-xs font-medium">
                    Good with Kids
                  </span>
                )}
                {pet.goodWithPets && (
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    Good with Pets
                  </span>
                )}
                {pet.vaccinated && (
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    Vaccinated
                  </span>
                )}
                {pet.neutered && (
                  <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-medium">
                    Neutered / Spayed
                  </span>
                )}
                {pet.houseTrained && (
                  <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                    House Trained
                  </span>
                )}
                {pet.specialNeeds && (
                  <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                    Special Needs
                  </span>
                )}
              </div>

              {/* Description */}
              {pet.description && (
                <div className="prose prose-sm max-w-none text-gray-600 mb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">About {pet.name}</h3>
                  <p className="text-sm leading-relaxed">{pet.description}</p>
                </div>
              )}

              {/* Special Needs Detail */}
              {pet.specialNeeds && typeof pet.specialNeeds === 'string' && pet.specialNeeds.length > 3 && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                  <h3 className="text-sm font-semibold text-orange-800 mb-1">Special Needs</h3>
                  <p className="text-sm text-orange-700 leading-relaxed">{pet.specialNeeds}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('edit-pet', pet._id)}
                  className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  Edit Pet Information
                </button>

                {pet.adoptionStatus === 'Available' ? (
                  <button
                    className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium shadow-md shadow-pink-200 flex items-center justify-center gap-2 cursor-pointer"
                    onClick={() => navigate('apply', pet._id)}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Start Adoption Process
                  </button>
                ) : (
                  <div className="flex items-center px-5 py-3 rounded-lg bg-slate-100 text-slate-500 text-sm font-medium gap-2">
                    <ClipboardList className="w-4 h-4" />
                    {pet.adoptionStatus === 'Pending'
                      ? 'Application Pending'
                      : pet.adoptionStatus === 'Adopted'
                      ? 'Already Adopted'
                      : pet.adoptionStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details (Bottom) */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
          <span>ID: {pet._id}</span>
          {pet.uuidToken && <span>Token: {pet.uuidToken.slice(0, 8)}…</span>}
          <span>Added: {new Date(pet.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PetDetail;
