import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { petAPI, authAPI } from '../services/api';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [pets, setPets] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigateRouter = useNavigate();
  const location = useLocation();

  // Derive currentPage from URL pathname
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path === '/inventory') return 'inventory';
    if (path === '/add-pet') return 'add-pet';
    if (path.startsWith('/pet/')) return 'pet-detail';
    if (path.startsWith('/edit-pet/')) return 'edit-pet';
    if (path === '/applications') return 'applications';
    if (path.startsWith('/applications/')) return 'application-detail';
    if (path === '/vaccinations') return 'vaccinations';
    if (path === '/reports') return 'reports';
    if (path === '/settings') return 'settings';
    if (path === '/users' || path === '/user-management') return 'users';
    if (path === '/invite-user') return 'invite-user';
    if (path.startsWith('/apply/')) return 'apply';
    return 'dashboard';
  };

  const currentPage = getCurrentPage();

  // Get petId from URL params if on pet detail or edit page
  const getSelectedPetId = () => {
    const match = location.pathname.match(/\/(pet|edit-pet)\/([^/]+)/);
    return match ? match[2] : null;
  };

  const selectedPetId = getSelectedPetId();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const navigate = (page, petId = null) => {
    window.scrollTo(0, 0);

    // Map page names to routes
    switch (page) {
      case 'dashboard':
        navigateRouter('/');
        break;
      case 'inventory':
        navigateRouter('/inventory');
        break;
      case 'add-pet':
        navigateRouter('/add-pet');
        break;
      case 'pet-detail':
        if (petId) navigateRouter(`/pet/${petId}`);
        break;
      case 'edit-pet':
        if (petId) navigateRouter(`/edit-pet/${petId}`);
        break;
      case 'apply':
        if (petId) navigateRouter(`/apply/${petId}`);
        break;
      case 'applications':
        navigateRouter('/applications');
        break;
      case 'application-detail':
        if (petId) navigateRouter(`/applications/${petId}`);
        break;
      case 'users':
        navigateRouter('/users');
        break;
      case 'invite-user':
        navigateRouter('/invite-user');
        break;
      case 'vaccinations':
        navigateRouter('/vaccinations');
        break;
      case 'reports':
        navigateRouter('/reports');
        break;
      case 'settings':
        navigateRouter('/settings');
        break;
      default:
        navigateRouter('/');
    }
  };

  // Fetch all pets from API
  const fetchPets = async () => {
    try {
      setLoading(true);
      const result = await petAPI.getAll();
      setPets(result.data || []);
    } catch (error) {
      showToast(error.message || 'Failed to load pets', 'error');
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load pets on mount
  useEffect(() => {
    fetchPets();
  }, []);

  const addPet = async (petData) => {
    try {
      setLoading(true);
      const result = await petAPI.create(petData);
      setPets(prev => [...prev, result.data]);
      showToast(`${petData.name} has been added to the system!`);
      navigate('inventory');
      return result.data;
    } catch (error) {
      showToast(error.message || 'Failed to add pet', 'error');
      console.error('Error adding pet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deletePet = async (id) => {
    try {
      setLoading(true);
      const pet = pets.find(p => p._id === id);
      await petAPI.delete(id);
      setPets(prev => prev.filter(p => p._id !== id));
      showToast(`${pet?.name || 'Pet'} has been removed from the system.`, 'info');
    } catch (error) {
      showToast(error.message || 'Failed to delete pet', 'error');
      console.error('Error deleting pet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePet = async (id, updatedData) => {
    try {
      setLoading(true);
      const result = await petAPI.update(id, updatedData);
      setPets(prev => prev.map(p => (p._id === id ? result.data : p)));
      showToast(`${updatedData.name} has been updated!`);
      navigate('inventory');
      return result.data;
    } catch (error) {
      showToast(error.message || 'Failed to update pet', 'error');
      console.error('Error updating pet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Quick status-only update (used by Inventory table — no navigation)
  const updatePetStatus = async (id, adoptionStatus) => {
    try {
      const result = await petAPI.updateStatus(id, adoptionStatus);
      setPets(prev => prev.map(p => (p._id === id ? { ...p, adoptionStatus } : p)));
      showToast('Status updated successfully');
      return result;
    } catch (error) {
      showToast(error.message || 'Failed to update status', 'error');
      console.error('Error updating pet status:', error);
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    showToast('Logged out successfully', 'info');
    navigateRouter('/login');
  };

  const value = {
    pets,
    addPet,
    deletePet,
    updatePet,
    updatePetStatus,
    fetchPets,
    toast,
    currentPage,
    navigate,
    selectedPetId,
    loading,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};