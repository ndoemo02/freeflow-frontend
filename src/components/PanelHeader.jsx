import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../state/ui';
import { useAuth } from '../state/auth';

export default function PanelHeader({ title, subtitle, showBackButton = true, showMenuButton = true, showLogoutButton = true }) {
  const navigate = useNavigate();
  const openDrawer = useUI((s) => s.openDrawer);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="mb-8 text-center relative">
      {/* Back Button - Left */}
      {showBackButton && (
        <button
          onClick={() => navigate('/')}
          className="absolute top-0 left-0 w-10 h-10 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition-colors"
          title="Zamknij panel (ESC)"
        >
          ✕
        </button>
      )}

      {/* Right Side Buttons */}
      <div className="absolute top-0 right-0 flex gap-2">
        {/* Logout Button */}
        {showLogoutButton && user && (
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition-colors"
            title="Wyloguj się"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}

        {/* Menu Button */}
        {showMenuButton && (
          <button
            onClick={openDrawer}
            className="w-10 h-10 rounded-full bg-black/20 border border-orange-400/20 text-orange-200 hover:bg-black/30 hover:border-orange-400/40 transition-all duration-200 flex items-center justify-center"
            title="Otwórz menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Title */}
      <h1 className="mb-2 text-4xl font-bold text-white">{title}</h1>
      {subtitle && (
        <p className="text-lg text-slate-400">{subtitle}</p>
      )}
      
      {/* User info */}
      {user && (
        <div className="mt-3 text-sm text-white/60">
          Zalogowany jako: <span className="text-orange-300">{user.email}</span>
        </div>
      )}
    </div>
  );
}
