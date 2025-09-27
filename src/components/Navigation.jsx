/**
 * Navigation.jsx v2.3 - Final UI
 * This version provides the complete top and bottom navigation bars.
 */
import React from 'react';
import { Cloud, Settings, User, CloudOff, Wifi } from 'lucide-react';

function GoogleDriveConnectionButton({ app }) {
  const { connection, connect, disconnect } = app;
  if (!connection) return null;
  const { isConnecting, isOnline, userInfo } = connection;

  if (isConnecting) {
    return (
      <button disabled className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border bg-blue-400 text-white animate-pulse">
        <Wifi className="w-4 h-4" /> <span className="hidden sm:inline">Connexion...</span>
      </button>
    );
  }

  if (isOnline) {
    return (
      <button onClick={disconnect} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border bg-green-500 hover:bg-green-600 text-white" title={`Connecté: ${userInfo?.name}`}>
        <Cloud className="w-4 h-4" /> <span className="hidden sm:inline">En ligne</span>
      </button>
    );
  }

  return (
    <button onClick={connect} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border bg-blue-500 hover:bg-blue-600 text-white">
      <CloudOff className="w-4 h-4" /> <span className="hidden sm:inline">Se connecter</span>
    </button>
  );
}

const NavLinks = ({ currentPage, onPageChange }) => {
    const navItems = [
        { id: 'memories', icon: Cloud, label: 'Mémoires' },
        { id: 'settings', icon: Settings, label: 'Réglages' }
    ];
    return (
         <>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button 
                  key={item.id} 
                  onClick={() => onPageChange(item.id)} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isActive ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
         </>
    );
};

export function TopNavigation({ app, onPageChange }) {
  if (!app) return null;
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center"><span className="text-lg">🐘</span></div>
            <h1 className="text-xl font-bold text-gray-800">Mémoire du Mékong</h1>
          </div>
          <div className="hidden md:flex items-center space-x-2">
              <NavLinks currentPage={app.currentPage} onPageChange={onPageChange} />
          </div>
          <div className="flex items-center space-x-3">
            <GoogleDriveConnectionButton app={app} />
          </div>
        </div>
      </div>
    </nav>
  );
}

export function BottomNavigation({ currentPage, onPageChange }) {
  const navItems = [
    { id: 'memories', icon: Cloud, label: 'Mémoires' },
    { id: 'settings', icon: Settings, label: 'Réglages' }
  ];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button key={item.id} onClick={() => onPageChange(item.id)} className={`flex flex-col items-center py-2 px-3 transition-colors ${isActive ? 'text-amber-600' : 'text-gray-500'}`}>
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

