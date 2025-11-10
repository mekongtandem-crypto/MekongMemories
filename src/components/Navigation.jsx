/**
 * Navigation.jsx v5.2 - Phase 26 Dark mode
* ✅ Bottom Bar dynamique avec navigation contextuelle
 * ✅ Bouton retour intelligent selon previousPage
 * 
 * Logique :
 * - Chat venant de Memories → Retour vers Memories
 * - Memories venant de Chat → Retour vers Chat
 * - Chat sans contexte → Retour vers Sessions
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

  // ⭐ PHASE 19D : Détection contexte de navigation
  const isInChat = currentPage === 'chat';
  const isInMemories = currentPage === 'memories';
  const previousPage = navigationContext?.previousPage;
  
  // Afficher bouton retour si :
  // - Dans Chat (retour vers previousPage ou Sessions par défaut)
  // - Dans Memories venant de Chat (retour vers Chat)
  const showReturnButton = (isInChat && previousPage) || 
                           (isInMemories && previousPage === 'chat');

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

  // ⭐ PHASE 19D : Handler retour intelligent
  const handleReturn = () => {
    console.log('🔙 BottomBar Retour - currentPage:', currentPage, 'previousPage:', previousPage);
    
    // Cas 1 : Dans Memories, venant de Chat → Retour au Chat
    if (currentPage === 'memories' && previousPage === 'chat') {
      console.log('📍 Retour: Memories → Chat');
      onPageChange('chat');
      return;
    }
    
    // Cas 2 : Dans Chat, venant de Memories → Retour à Memories
    if (currentPage === 'chat' && previousPage === 'memories') {
      console.log('📍 Retour: Chat → Memories');
      onPageChange('memories');
      return;
    }
    
    // Cas 3 : Dans Chat, venant de Sessions (ou sans contexte) → Retour Sessions
    if (currentPage === 'chat' && (!previousPage || previousPage === 'sessions')) {
      console.log('📍 Retour: Chat → Sessions');
      onPageChange('sessions');
      return;
    }
    
    // Fallback : Retour Sessions par défaut
    console.log('📍 Retour fallback: → Sessions');
    onPageChange('sessions');
  };

  // Déterminer le label du bouton retour
  const getReturnLabel = () => {
    if (currentPage === 'memories' && previousPage === 'chat') {
      return 'Chat';
    }
    if (currentPage === 'chat' && previousPage === 'memories') {
      return 'Souvenirs';
    }
    if (currentPage === 'chat') {
      return 'Causeries';
    }
    return 'Retour';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-50 transition-colors duration-200">
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
                isActive 
                  ? 'text-amber-600 dark:text-amber-400 font-semibold' 
                  : 'text-amber-500 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-400'
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

        {/* Bouton contextuel : Retour intelligent OU Jeux */}
        {showReturnButton ? (
          <button 
            onClick={handleReturn}
            className="flex flex-col items-center py-2 px-3 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            title={`Retour vers ${getReturnLabel()}`}
          >
            <ArrowLeft className="w-5 h-5 mb-1" />
            <span className="text-xs">{getReturnLabel()}</span>
          </button>
        ) : (
          <button 
            disabled
            className="flex flex-col items-center py-2 px-3 text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
          >
            <Gamepad2 className="w-5 h-5 mb-1" />
            <span className="text-xs">Jeux</span>
          </button>
        )}
        
      </div>
    </div>
  );
}