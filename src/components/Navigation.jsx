/**
 * Navigation.jsx v6.1 - v2.25 : Badge nouveaux souvenirs
 * ✅ Bottom Bar dynamique avec navigation contextuelle
 * ✅ Bouton retour intelligent selon previousPage
 * ✅ Badge nouveaux souvenirs (moments créés par autre user, non consultés)
 * ✅ Badge actualisation temps réel sur changement de page
 *
 * Logique :
 * - Chat venant de Memories → Retour vers Memories
 * - Memories venant de Chat → Retour vers Chat
 * - Chat sans contexte → Retour vers Sessions
 */
import React from 'react';
import { Sparkles, MessageSquare, ArrowLeft, Drama } from 'lucide-react';
import { enrichSessionWithStatus, SESSION_STATUS } from '../utils/sessionUtils.js';
import { countNewMemories } from '../utils/memoryUtils.js';

export function BottomNavigation({ currentPage, onPageChange, app, navigationContext }) {
  const urgentSessionsCount = React.useMemo(() => {
    if (!app.sessions || !app.currentUser) return 0;

    // Récupérer tracking lecture
    const sessionReadStatus = JSON.parse(
      localStorage.getItem(`mekong_sessionReadStatus_${app.currentUser.id}`) || '{}'
    );

    // ✨ Filter seulement archived (completed supprimé)
    const activeSessions = app.sessions.filter(s => !s.archived);

    let notifiedCount = 0;
    let newCount = 0;
    let unreadCount = 0;

    activeSessions.forEach(session => {
      // 1. Compter notifiées (via enrichissement)
      const enriched = enrichSessionWithStatus(session, app.currentUser.id);

      if (enriched.status === SESSION_STATUS.NOTIFIED) {
        notifiedCount++;
        return; // Pas besoin de vérifier "new"/"unread" si déjà notifiée
      }

      // 2. Compter nouvelles (jamais ouvertes + créées par quelqu'un d'autre)
      const tracking = sessionReadStatus[session.id];
      if (!tracking?.hasBeenOpened && session.user !== app.currentUser.id) {
        newCount++;
        return; // Pas besoin de vérifier "unread" si "new"
      }

      // 3. ⭐ v2.9x : Compter unread (nouveau message depuis dernière ouverture)
      const lastMessage = session.notes?.[session.notes.length - 1];
      const lastMessageTime = lastMessage?.timestamp || session.createdAt;
      const lastMessageAuthor = lastMessage?.author || session.user;

      if (tracking?.hasBeenOpened &&
          tracking.lastOpenedAt &&
          new Date(lastMessageTime) > new Date(tracking.lastOpenedAt) &&
          lastMessageAuthor !== app.currentUser.id) {
        unreadCount++;
      }
    });

    return notifiedCount + newCount + unreadCount;
  }, [app.sessions, app.currentUser, currentPage]); // ⭐ v2.24c : currentPage force recalcul au changement de page

  // ⭐ v2.25 : Compter nouveaux souvenirs
  const newMemoriesCount = React.useMemo(() => {
    if (!app.masterIndex?.moments || !app.currentUser) return 0;

    return countNewMemories(app.masterIndex.moments, app.currentUser.id);
  }, [app.masterIndex, app.currentUser, currentPage]); // ⭐ Recalcul au changement de page

  // ⭐ PHASE 19D : Détection contexte de navigation
  const isInChat = currentPage === 'chat';
  const isInMemories = currentPage === 'memories';
  const previousPage = navigationContext?.previousPage;

  // ⭐ v2.9s : Détecter returnContext depuis modal cross-refs
  const hasReturnContext = navigationContext?.returnContext?.type === 'cross_refs_modal';
  const returnPage = navigationContext?.returnContext?.returnPage;

  // Afficher bouton retour si :
  // - Dans Chat (retour vers previousPage ou Sessions par défaut)
  // - Dans Memories venant de Chat (retour vers Chat)
  // - Dans Chat/Memories avec returnContext (retour modal cross-refs)
  const showReturnButton = (isInChat && (previousPage || hasReturnContext)) ||
                           (isInMemories && previousPage === 'chat');

  const navItems = [
    {
      id: 'sessions',
      icon: MessageSquare,
      label: 'Causeries',
      badge: urgentSessionsCount
    },
    {
      id: 'memories',
      icon: Sparkles,
      label: 'Souvenirs',
      badge: newMemoriesCount  // ⭐ v2.25 : Badge nouveaux souvenirs
    }
  ];

  // ⭐ PHASE 19D : Handler retour intelligent
  const handleReturn = () => {
    console.log('🔙 BottomBar Retour - currentPage:', currentPage, 'previousPage:', previousPage, 'returnContext:', hasReturnContext);

    // ⭐ v2.9s : Cas prioritaire - Retour depuis modal cross-refs
    if (hasReturnContext && returnPage) {
      console.log('📍 Retour modal cross-refs: → ', returnPage);
      onPageChange(returnPage);
      // Le useEffect dans MemoriesPage va détecter returnContext et rouvrir le modal
      return;
    }

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
    // ⭐ v2.9s : Retour depuis modal cross-refs
    if (hasReturnContext && returnPage) {
      if (returnPage === 'memories') return 'Souvenirs';
      if (returnPage === 'chat') return 'Chat';
      if (returnPage === 'sessions') return 'Causeries';
    }

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

        {/* Bouton contextuel : Retour intelligent OU Saynètes */}
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
            onClick={() => onPageChange('saynetes')}
            className={`flex flex-col items-center py-2 px-3 transition-colors ${
              currentPage === 'saynetes'
                ? 'text-purple-600 dark:text-purple-400 font-semibold'
                : 'text-purple-500 dark:text-purple-500 hover:text-purple-600 dark:hover:text-purple-400'
            }`}
            title="Saynètes ludiques"
          >
            <span className="text-lg mb-1">🎭</span>
            <span className="text-xs">Saynètes</span>
          </button>
        )}
        
      </div>
    </div>
  );
}