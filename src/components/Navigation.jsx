/**
 * Navigation.jsx v5.1 - Phase 18a : Bouton contextuel + mode exploration
 * ✅ Bottom Bar dynamique : 
 *    - Chat : [💬] [✨] [← Retour]
 *    - Exploration (depuis chat) : [💬] [✨] [← Retour]
 *    - Autres : [💬] [✨] [🎮 Jeux]
 */
import React from 'react';
import { Sparkles, MessageSquare, ArrowLeft, Gamepad2 } from 'lucide-react';

export function BottomNavigation({ currentPage, onPageChange, app, navigationContext }) {
  const pendingSessionsCount = React.useMemo(() => {
    if (!app.sessions || !app.currentUser) return 0;
    
    return app.sessions.filter(session => {
      if (session.user !== app.currentUser?.id) return false;
      if (!session.notes || session.notes.length === 0) return true;
      
      const lastMessage = session.notes[session.notes.length - 1];
      return lastMessage.author !== app.currentUser?.id;
    }).length;
  }, [app.sessions, app.currentUser]);

  // ⭐ Détecter mode exploration : dans Memories mais venant de Chat
  const isInChat = currentPage === 'chat';
  const isExplorationMode = currentPage === 'memories' && navigationContext?.previousPage === 'chat';
  const showReturnButton = isInChat || isExplorationMode;

  const navItems = [
    { 
      id: 'sessions', 
      icon: MessageSquare, 
      label: 'Causeries', 
      badge: pendingSessionsCount 
    },
    { 
      id: 'memories', 
      icon: Sparkles, 
      label: 'Souvenirs' 
    }
  ];

  // Handler retour intelligent
  const handleReturn = () => {
    if (isExplorationMode) {
      // Retour au chat depuis exploration
      onPageChange('chat');
    } else {
      // Retour Session=causeries depuis chat
      onPageChange('sessions');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        
        {/* Boutons fixes : Sessions + Souvenirs */}
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

        {/* Bouton contextuel : Retour (si chat OU exploration) OU Jeux */}
        {showReturnButton ? (
          <button 
            onClick={handleReturn}
            className="flex flex-col items-center py-2 px-3 text-gray-600"
          >
            <ArrowLeft className="w-5 h-5 mb-1" />
            <span className="text-xs">Retour</span>
          </button>
        ) : (
          <button 
            disabled
            className="flex flex-col items-center py-2 px-3 text-gray-400 opacity-40 cursor-not-allowed"
          >
            <Gamepad2 className="w-5 h-5 mb-1" />
            <span className="text-xs">Jeux</span>
          </button>
        )}
        
      </div>
    </div>
  );
}