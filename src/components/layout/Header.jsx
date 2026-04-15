import React, { useState } from 'react';
import { Menu, Bell, Search, ChevronDown, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';

const Header = ({ setIsOpen, user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { currentPage, navigate } = useAppContext();

  // Helper to get breadcrumb data with paths
  const getBreadcrumbs = () => {
    const breadcrumbs = [{ label: 'Dashboard', path: 'dashboard' }];
    
    switch (currentPage) {
      case 'dashboard':
        return breadcrumbs;
      case 'inventory':
        breadcrumbs.push({ label: 'Pets', path: 'inventory' });
        return breadcrumbs;
      case 'add-pet':
        breadcrumbs.push({ label: 'Pets', path: 'inventory' });
        breadcrumbs.push({ label: 'Add New', path: null }); // Current page, not clickable
        return breadcrumbs;
      case 'pet-detail':
        breadcrumbs.push({ label: 'Pets', path: 'inventory' });
        breadcrumbs.push({ label: 'Details', path: null });
        return breadcrumbs;
      case 'edit-pet':
        breadcrumbs.push({ label: 'Pets', path: 'inventory' });
        breadcrumbs.push({ label: 'Edit', path: null });
        return breadcrumbs;
      case 'applications':
        breadcrumbs.push({ label: 'Applications', path: null });
        return breadcrumbs;
      case 'vaccinations':
        breadcrumbs.push({ label: 'Vaccinations', path: null });
        return breadcrumbs;
      case 'reports':
        breadcrumbs.push({ label: 'Reports', path: null });
        return breadcrumbs;
      case 'settings':
        breadcrumbs.push({ label: 'Settings', path: null });
        return breadcrumbs;
      case 'users':
        breadcrumbs.push({ label: 'Users', path: null });
        return breadcrumbs;
      case 'invite-user':
        breadcrumbs.push({ label: 'Users', path: 'users' });
        breadcrumbs.push({ label: 'Invite User', path: null });
        return breadcrumbs;
      case 'apply':
        breadcrumbs.push({ label: 'Pets', path: 'inventory' });
        breadcrumbs.push({ label: 'Apply for Adoption', path: null });
        return breadcrumbs;
      case 'application-detail':
        breadcrumbs.push({ label: 'Applications', path: 'applications' });
        breadcrumbs.push({ label: 'Application Details', path: null });
        return breadcrumbs;
      default:
        return breadcrumbs;
    }
  };

  const handleBreadcrumbClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  // Get user display name from stored user data
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.name) {
      return user.name;
    }
    return 'User';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.name) {
      const parts = user.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: Mobile Menu & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center text-sm font-medium text-slate-500">
            {getBreadcrumbs().map((crumb, index, arr) => (
              <React.Fragment key={index}>
                {crumb.path ? (
                  <button
                    onClick={() => handleBreadcrumbClick(crumb.path)}
                    className="text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-slate-900">
                    {crumb.label}
                  </span>
                )}
                {index < arr.length - 1 && <span className="mx-2 text-slate-400">/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Center/Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="hidden md:block relative w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search pets, applicants..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium placeholder:font-normal"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 p-[2px]">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <img
                    src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`}
                    alt="User"
                    className="w-full h-full rounded-full"
                  />
                </div>
              </div>
              <div className="hidden sm:block text-left mr-1">
                <p className="text-sm font-semibold text-slate-900 leading-none">{getUserDisplayName()}</p>
                <p className="text-xs text-slate-500 mt-1 leading-none">{user?.role || 'Admin'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{user?.email || 'No email'}</p>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate('settings');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-500"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;