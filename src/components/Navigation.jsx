/**
 * Navigation.jsx v3.2 - Badge sessions en attente
 * ✅ NOUVEAU : Compteur sessions créées par l'utilisateur
 */
import React from 'react';
import { Home, BookOpen, MessageSquareText, Settings, User, CloudOff, Cloud, Wifi } from 'lucide-react';

function GoogleDriveConnectionButton({ app }) {
  const { connection, connect, disconnect } = app;

  if (!connection) {
    return <div className="px-3 py-2 text-sm">...</div>;
  }
  
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
      <button onClick={disconnect} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border bg-green-500 hover:bg-green-600 text-white" title={`Connecté - ${userInfo?.name}`}>
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

function UserDisplay({ currentUser, userStyle, onUserClick }) {
  if (!currentUser) {
    return (
      <button onClick={onUserClick} className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors" title="Aucun utilisateur - Cliquer pour sélectionner">
        <User className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600 hidden sm:inline">Aucun utilisateur</span>
      </button>
    );
  }
  return (
    <button onClick={onUserClick} className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${userStyle.bg} ${userStyle.border}`} title={`Connecté en tant que ${currentUser.name} - Cliquer pour changer`}>
      <span className="text-lg">{currentUser.emoji}</span>
      <span className={`text-sm font-medium hidden sm:inline ${userStyle.text}`}>{currentUser.id}</span>
    </button>
  );
}

export function BottomNavigation({ currentPage, onPageChange, app }) {
  // ✅ NOUVEAU : Calculer le nombre de sessions en attente
  const pendingSessionsCount = React.useMemo(() => {
    if (!app.sessions || !app.currentUser) return 0;
    
    return app.sessions.filter(session => {
      // Sessions créées par l'utilisateur actuel
      if (session.user !== app.currentUser) return false;
      
      // Où le dernier message n'est PAS de lui (= en attente de réponse)
      if (!session.notes || session.notes.length === 0) return true; // Session vide
      
      const lastMessage = session.notes[session.notes.length - 1];
      return lastMessage.author !== app.currentUser;
    }).length;
  }, [app.sessions, app.currentUser]);

  const navItems = [
    { id: 'memories', icon: Home, label: 'Souvenirs' },
    { id: 'sessions', icon: BookOpen, label: 'Sessions', badge: pendingSessionsCount },
    { id: 'settings', icon: Settings, label: 'Réglages' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-amber-200 z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => onPageChange(item.id)} 
              className={`relative flex flex-col items-center py-2 px-3 transition-colors ${
                isActive ? 'text-amber-600 font-semibold' : 'text-amber-500'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-1" />
                {/* ✅ NOUVEAU : Badge */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TopNavigation({ onPageChange, app }) {
  const { currentUser, userStyle } = app;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-lg">🐘</span>
            </div>
            <h1 className="text-xl font-bold text-amber-900">Mémoire du Mékong</h1>
          </div>
          <div className="flex items-center space-x-3">
            <GoogleDriveConnectionButton app={app} />
            <UserDisplay currentUser={currentUser} userStyle={userStyle} onUserClick={() => onPageChange('settings')} />
          </div>
        </div>
      </div>
    </nav>
  );
}