import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  PlusCircle, 
  History, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, isAdmin, isAgent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Tableau de bord', path: '/', icon: LayoutDashboard, roles: ['CITOYEN', 'AGENT', 'ADMIN'] },
    { name: 'Carte interactive', path: '/map', icon: MapIcon, roles: ['CITOYEN', 'AGENT', 'ADMIN'] },
    { name: 'Signaler un problème', path: '/new', icon: PlusCircle, roles: ['CITOYEN'] },
    { name: 'Mes signalements', path: '/history', icon: History, roles: ['CITOYEN'] },
    { name: 'Interventions', path: '/interventions', icon: Briefcase, roles: ['AGENT', 'ADMIN'] },
    { name: 'Administration', path: '/admin', icon: ShieldCheck, roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (isAdmin) return true;
    if (isAgent) return item.roles.includes('AGENT');
    return item.roles.includes('CITOYEN');
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Unable to sign out:', error);
      toast.error('Impossible de vous déconnecter. Réessayez.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between gap-2">
            <Link to="/" aria-label="LUMTERRA — accueil" className="block min-w-0 overflow-hidden rounded-xl bg-white">
              <img src="/lumterra-logo.png" alt="LUMTERRA — Terre de lumière" className="block w-full max-w-[190px] object-contain" />
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Profile & Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-slate-900 font-bold uppercase">
                {profile?.full_name?.charAt(0) || profile?.email.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'Utilisateur'}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest">{profile?.role}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 text-slate-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 px-4">
            <h1 className="text-sm font-semibold text-slate-900">
              {navItems.find(i => i.path === location.pathname)?.name || 'Tableau de bord'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <Link to="/profile" className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings size={20} className="text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
