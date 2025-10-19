/**
 * Navigation.jsx v4.1 - BottomNavigation toujours visible
 * ✅ Suppression md:hidden pour être visible sur tous écrans
 */
import React from 'react';
import { Sparkles, MessageSquare, Settings } from 'lucide-react';

export function BottomNavigation({ currentPage, onPageChange, app }) {
  const pendingSessionsCount = React.useMemo(() => {
    if (!app.sessions || !app.currentUser) return 0;
    
    return app.sessions.filter(session => {
      if (session.user !== app.currentUser?.id) return false;
      if (!session.notes || session.notes.length === 0) return true;
      
      const lastMessage = session.notes[session.notes.length - 1];
      return lastMessage.author !== app.currentUser?.id;
    }).length;
  }, [app.sessions, app.currentUser]);

  const navItems = [
    { id: 'memories', icon: Sparkles, label: 'Souvenirs' },
    { id: 'sessions', icon: MessageSquare, label: 'Sessions', badge: pendingSessionsCount },
    { id: 'settings', icon: Settings, label: 'Réglages' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50">
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