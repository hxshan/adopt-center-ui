import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, User, Building2, Check, AlertCircle, MapPin } from 'lucide-react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Admin Info (Step 1)
    nicNumber: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    adminPhone: '',
    // Center Info (Step 2)
    centerName: '',
    centerEmail: '',
    centerPhone: '',
    centerAddress: '',
    centerStreet: '',
    centerCity: '',
    centerState: '',
    centerZipCode: '',
    centerCountry: '',
    centerLat: null,
    centerLng: null,
    centerPlaceId: '',
    licenseNumber: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const centerAddressRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Helper to load Google Maps JS dynamically
  const loadGoogleMaps = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('No window'));
      if (window.google && window.google.maps) return resolve(window.google);

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return reject(new Error('Google Maps API key not configured'));

      const callbackName = `gmaps_onload_${Date.now()}`;
      window[callbackName] = () => {
        resolve(window.google);
        delete window[callbackName];
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  };

  // Initialize Google Map when map picker is shown
  useEffect(() => {
    if (!showMapPicker) return;

    const initMap = (center) => {
      const mapEl = document.getElementById('mapCanvas');
      if (!mapEl) return;

      const map = new window.google.maps.Map(mapEl, {
        center,
        zoom: 13,
        gestureHandling: 'greedy',
        fullscreenControl: false
      });
      mapRef.current = map;

      const geocoder = new window.google.maps.Geocoder();

      const updateLocationFromLatLng = (latLng) => {
        try {
          const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
          const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
          
          setFormData(prev => ({ ...prev, centerLat: lat, centerLng: lng }));
          
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const place = results[0];
              const addressComponents = extractAddressComponents(place.address_components);
              
              setFormData(prev => ({
                ...prev,
                centerAddress: place.formatted_address,
                centerPlaceId: place.place_id || prev.centerPlaceId,
                centerStreet: addressComponents.street,
                centerCity: addressComponents.city,
                centerState: addressComponents.state,
                centerZipCode: addressComponents.zipCode,
                centerCountry: addressComponents.country
              }));
            }
          });
        } catch (err) {
          console.error('Error updating location:', err);
        }
      };

      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true
      });
      markerRef.current = marker;

      map.addListener('click', (e) => {
        if (!markerRef.current) {
          markerRef.current = new window.google.maps.Marker({
            position: e.latLng,
            map,
            draggable: true
          });
          markerRef.current.addListener('dragend', () => 
            updateLocationFromLatLng(markerRef.current.getPosition())
          );
        } else {
          markerRef.current.setPosition(e.latLng);
        }
        updateLocationFromLatLng(e.latLng);
      });

      marker.addListener('dragend', () => {
        updateLocationFromLatLng(markerRef.current.getPosition());
      });

      // Add instruction overlay
      const instr = document.createElement('div');
      instr.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 6px 10px;
        background: rgba(255,255,255,0.95);
        border-radius: 6px;
        font-size: 13px;
        color: #374151;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      `;
      instr.innerText = 'Click map to place marker. Drag marker to fine-tune.';
      mapEl.style.position = 'relative';
      mapEl.appendChild(instr);
    };

    const setup = async () => {
      try {
        if (!window.google || !window.google.maps) {
          await loadGoogleMaps();
        }

        let initialCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo default

        if (formData.centerLat && formData.centerLng) {
          initialCenter = { lat: Number(formData.centerLat), lng: Number(formData.centerLng) };
          initMap(initialCenter);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              initMap(center);
            },
            () => initMap(initialCenter),
            { timeout: 3000 }
          );
        } else {
          initMap(initialCenter);
        }
      } catch (err) {
        console.error('Failed to load Google Maps:', err);
        setError('Failed to load map. Please check your internet connection.');
      }
    };

    setup();

    return () => {
      try {
        if (mapRef.current && window.google) {
          window.google.maps.event.clearInstanceListeners(mapRef.current);
        }
      } catch (err) {
        console.error('Error cleaning up map:', err);
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [showMapPicker, formData.centerLat, formData.centerLng]);

  // Extract address components from Google Place
  const extractAddressComponents = (components) => {
    const result = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };

    if (!components) return result;

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        result.street = component.long_name + ' ' + result.street;
      }
      if (types.includes('route')) {
        result.street += component.long_name;
      }
      if (types.includes('locality')) {
        result.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        result.state = component.long_name;
      }
      if (types.includes('postal_code')) {
        result.zipCode = component.long_name;
      }
      if (types.includes('country')) {
        result.country = component.long_name;
      }
    });

    return result;
  };

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!centerAddressRef.current) return;

    const setupAutocomplete = async () => {
      try {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          await loadGoogleMaps();
        }

        const autocomplete = new window.google.maps.places.Autocomplete(
          centerAddressRef.current,
          { fields: ['formatted_address', 'geometry', 'place_id', 'address_components'] }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place || !place.geometry) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const addressComponents = extractAddressComponents(place.address_components);

          setFormData(prev => ({
            ...prev,
            centerAddress: place.formatted_address || '',
            centerLat: lat,
            centerLng: lng,
            centerPlaceId: place.place_id || '',
            centerStreet: addressComponents.street,
            centerCity: addressComponents.city,
            centerState: addressComponents.state,
            centerZipCode: addressComponents.zipCode,
            centerCountry: addressComponents.country
          }));

          // Update map if shown
          if (mapRef.current && window.google) {
            const latLng = new window.google.maps.LatLng(lat, lng);
            mapRef.current.panTo(latLng);
            mapRef.current.setZoom(15);
            
            if (markerRef.current) {
              markerRef.current.setPosition(latLng);
            } else {
              markerRef.current = new window.google.maps.Marker({
                position: latLng,
                map: mapRef.current,
                draggable: true
              });
              markerRef.current.addListener('dragend', () => {
                const geocoder = new window.google.maps.Geocoder();
                const pos = markerRef.current.getPosition();
                const la = pos.lat();
                const lo = pos.lng();
                
                setFormData(prev => ({ ...prev, centerLat: la, centerLng: lo }));
                
                geocoder.geocode({ location: { lat: la, lng: lo } }, (results, status) => {
                  if (status === 'OK' && results && results[0]) {
                    const addressComponents = extractAddressComponents(results[0].address_components);
                    setFormData(prev => ({
                      ...prev,
                      centerAddress: results[0].formatted_address,
                      centerPlaceId: results[0].place_id || prev.centerPlaceId,
                      centerStreet: addressComponents.street,
                      centerCity: addressComponents.city,
                      centerState: addressComponents.state,
                      centerZipCode: addressComponents.zipCode,
                      centerCountry: addressComponents.country
                    }));
                  }
                });
              });
            }
          }
        });
      } catch (err) {
        console.warn('Places autocomplete not available:', err);
      }
    };

    setupAutocomplete();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateStep1 = () => {
    const { adminFirstName, adminLastName, nicNumber, adminEmail, adminPhone, adminPassword, confirmPassword } = formData;

    if (!adminFirstName || !adminLastName || !nicNumber || !adminEmail || !adminPhone || !adminPassword || !confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }

    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setError('');
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async () => {
    const { centerName, centerEmail, centerPhone, centerAddress } = formData;

    if (!centerName || !centerEmail || !centerPhone || !centerAddress) {
      setError('Please fill in all required center fields');
      return;
    }

    // Validate email format for center
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(centerEmail)) {
      setError('Please enter a valid center email address');
      return;
    }

    // Validate coordinates
    const coordsValid = (lat, lng) => {
      const a = Number(lat);
      const b = Number(lng);
      return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) > 0.000001 && Math.abs(b) > 0.000001;
    };

    if (!coordsValid(formData.centerLat, formData.centerLng)) {
      setError('Please select an address from autocomplete or pick a location on the map');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare payload matching backend expectations
      const payload = {
        // Admin details
        adminFirstName: formData.adminFirstName,
        adminLastName: formData.adminLastName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        adminPhone: formData.adminPhone,
        nicNumber: formData.nicNumber,
        
        // Center details
        centerName: formData.centerName,
        centerEmail: formData.centerEmail,
        centerPhone: formData.centerPhone,
        centerAddress: formData.centerAddress,
        centerStreet: formData.centerStreet,
        centerCity: formData.centerCity,
        centerState: formData.centerState,
        centerZipCode: formData.centerZipCode,
        centerCountry: formData.centerCountry,
        centerLat: formData.centerLat,
        centerLng: formData.centerLng,
        centerPlaceId: formData.centerPlaceId,
        licenseNumber: formData.licenseNumber || undefined,
        description: formData.description || undefined
      };

      const response = await authAPI.signup(payload);

      if (response.success) {
        setSuccess(response.message || 'Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PetConnect Registration</h1>
          <p className="text-gray-500 text-sm">
            {step === 1 ? 'Step 1 of 2: Admin Information' : 'Step 2 of 2: Center Details'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > 1 ? <Check size={16} /> : <User size={16} />}
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>Admin Info</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200 rounded">
              <div 
                className="h-full bg-pink-600 rounded transition-all duration-300" 
                style={{ width: step === 1 ? '0%' : '100%' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Building2 size={16} />
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>Center Details</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-xs text-green-700">{success}</p>
            </div>
          )}

          {step === 1 ? (
            // Step 1: Admin Information
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="adminFirstName"
                    value={formData.adminFirstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Enter first name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="adminLastName"
                    value={formData.adminLastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Enter last name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIC Number *
                </label>
                <input
                  type="text"
                  name="nicNumber"
                  value={formData.nicNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="Enter NIC number"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="admin@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="0771234567"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Min 6 characters"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Confirm password"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={loading}
                className="w-full bg-pink-600 text-white py-2.5 rounded-md font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                Next Step
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            // Step 2: Center Details
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Center Name *
                </label>
                <input
                  type="text"
                  name="centerName"
                  value={formData.centerName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="e.g., Happy Tails Adoption Center"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Center Email *
                  </label>
                  <input
                    type="email"
                    name="centerEmail"
                    value={formData.centerEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="contact@center.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Center Phone *
                  </label>
                  <input
                    type="tel"
                    name="centerPhone"
                    value={formData.centerPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="0771234567"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="Enter license number (optional)"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                  placeholder="Brief description of your adoption center (optional)"
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Center Address *
                </label>
                <div className="flex gap-2">
                  <input
                    ref={centerAddressRef}
                    type="text"
                    name="centerAddress"
                    value={formData.centerAddress}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Type or choose an address"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(prev => !prev)}
                    disabled={loading}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin size={16} />
                    {showMapPicker ? 'Hide Map' : 'Show Map'}
                  </button>
                </div>

                <div className="mt-2">
                  {!formData.centerLat || !formData.centerLng ? (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Please select an address from autocomplete or pick a location on the map
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check size={12} />
                      Location selected — ready to submit
                    </p>
                  )}
                </div>

                {showMapPicker && (
                  <div className="mt-3 rounded-md overflow-hidden border border-gray-200" style={{ height: '320px' }}>
                    <div id="mapCanvas" style={{ width: '100%', height: '100%' }} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-md font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <ChevronLeft size={20} />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-pink-600 text-white py-2.5 rounded-md font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-pink-600 hover:text-pink-700 font-medium cursor-pointer"
              disabled={loading}
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
