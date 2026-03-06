import React, { useState } from 'react';
import { LayoutGrid, Dog, FileText, Syringe, BarChart, Settings, Users, PawPrint, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAppContext();

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/inventory') || path.startsWith('/add-pet') || path.startsWith('/edit-pet') || path.startsWith('/pet/')) return 'inventory';
    if (path.startsWith('/applications')) return 'applications';
    if (path.startsWith('/vaccinations')) return 'vaccinations';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/users')) return 'users';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const currentPage = getCurrentPage();

  const mainItems = [
    { icon: LayoutGrid, label: 'Dashboard', page: 'dashboard' },
    { icon: Dog, label: 'Pets', page: 'inventory' },
    { icon: FileText, label: 'Applications', page: 'applications' },
    { icon: Syringe, label: 'Vaccinations', page: 'vaccinations' },
    { icon: BarChart, label: 'Reports', page: 'reports' },
  ];

  const systemItems = [
    { icon: Users, label: 'User Management', page: 'users' },
    { icon: Settings, label: 'Settings', page: 'settings' },
  ];

  const NavItem = ({ item }) => {
    const isActive = currentPage === item.page;

    const handleClick = () => {
      const routes = {
        dashboard: '/dashboard',
        inventory: '/inventory',
        applications: '/applications',
        vaccinations: '/vaccinations',
        users: '/users',
        reports: '/reports',
        settings: '/settings',
      };
      navigate(routes[item.page] || '/dashboard');
      if (window.innerWidth < 1024) setIsOpen(false);
    };

    return (
      <button
        onClick={handleClick}
        title={collapsed ? item.label : undefined}
        className={cn(
          "relative flex items-center transition-all duration-200 group cursor-pointer",
          collapsed
            ? "justify-center w-10 h-10 rounded-xl mx-auto"
            : "w-full gap-3 px-4 py-2.5 rounded-xl",
          isActive
            ? "bg-pink-50 text-pink-600"
            : "text-slate-400 hover:text-pink-500 hover:bg-pink-50/50"
        )}
      >
        <span className={cn(
          "flex items-center justify-center flex-shrink-0 transition-all duration-200",
          collapsed ? "w-5 h-5" : "w-8 h-8 rounded-lg",
          !collapsed && (isActive
            ? "bg-pink-100 text-pink-600"
            : "text-slate-400 group-hover:text-pink-500 group-hover:bg-pink-50")
        )}>
          <item.icon className="w-4 h-4" />
        </span>

        {!collapsed && (
          <span className={cn(
            "text-sm font-medium transition-colors",
            isActive ? "text-pink-600" : "text-slate-500 group-hover:text-pink-500"
          )}>
            {item.label}
          </span>
        )}

        {/* Tooltip for collapsed mode */}
        {collapsed && (
          <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {item.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/40 z-40 lg:hidden transition-opacity backdrop-blur-sm",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-100 transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[220px]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-slate-100 relative flex-shrink-0",
          collapsed ? "justify-center" : "px-5 gap-2.5"
        )}>
          <div className="w-8 h-8 bg-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <PawPrint className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-slate-900 tracking-tight">PetConnect</span>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-pink-600 hover:border-pink-300 transition-colors z-10 cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* Navigation — overflow-x-hidden prevents any child tooltip from causing scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-5 flex flex-col gap-5">
          <div>
            {!collapsed && (
              <p className="px-5 mb-2 text-[10px] font-semibold text-slate-300 uppercase tracking-widest">
                Main
              </p>
            )}
            <nav className={cn("flex flex-col gap-0.5", collapsed ? "items-center px-2" : "px-3")}>
              {mainItems.map((item) => (
                <NavItem key={item.page} item={item} />
              ))}
            </nav>
          </div>

          <div>
            {!collapsed && (
              <p className="px-5 mb-2 text-[10px] font-semibold text-slate-300 uppercase tracking-widest">
                System
              </p>
            )}
            <nav className={cn("flex flex-col gap-0.5", collapsed ? "items-center px-2" : "px-3")}>
              {systemItems.map((item) => (
                <NavItem key={item.page} item={item} />
              ))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;