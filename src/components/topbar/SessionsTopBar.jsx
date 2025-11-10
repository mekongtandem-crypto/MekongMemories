/**
 * SessionsTopBar.jsx v1.2 - Phase 25 : Stats enrichies
 * ✅ "n causeries" (total actives)
 * ✅ "p non lues" (cliquable → filtre)
 * ✅ "r en attente" (ouvre volets)
 * 
 * Layout :
 * - Gauche : + Nouvelle causerie
 * - Centre : Stats (causeries | non lues | en attente)
 * - Droite : ... Menu
 */

import React, { useState, useMemo } from 'react';
import { MessageCirclePlus, MoreVertical } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';
import OverflowMenu from './OverflowMenu.jsx';

export default function SessionsTopBar() {
  
  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadFilter, setUnreadFilter] = useState(false);
  
  // ✅ Récupérer tracking lecture depuis localStorage
  const sessionReadStatus = useMemo(() => {
    const saved = localStorage.getItem(`mekong_sessionReadStatus_${app.currentUser?.id}`);
    return saved ? JSON.parse(saved) : {};
  }, [app.currentUser, app.sessions]); // Dépend de sessions pour recalculer
  
  // ✅ Calculer état lecture pour chaque session
  const getReadState = (session) => {
    const tracking = sessionReadStatus[session.id];
    const lastMessage = session.notes?.[session.notes.length - 1];
    const lastMessageTime = lastMessage?.timestamp || session.createdAt;
    const lastMessageAuthor = lastMessage?.author || session.user;
    const sessionCreator = session.user;
    
    // ⚠️ IMPORTANT : Une session/message créé par le user courant ne peut pas être "non lu" pour lui
    
    // Si je suis le créateur et pas de message, c'est READ pour moi
    if (sessionCreator === app.currentUser?.id && !lastMessage) {
      return 'read';
    }
    
    // Si je suis l'auteur du dernier message, c'est READ pour moi
    if (lastMessageAuthor === app.currentUser?.id) {
      return 'read';
    }
    
    // NEW : jamais ouverte PAR MOI + créée par quelqu'un d'autre
    if (!tracking?.hasBeenOpened && sessionCreator !== app.currentUser?.id) {
      return 'new';
    }
    
    // UNREAD : nouveau message depuis dernière ouverture + message de quelqu'un d'autre
    if (tracking?.hasBeenOpened && 
        tracking.lastOpenedAt && 
        new Date(lastMessageTime) > new Date(tracking.lastOpenedAt) &&
        lastMessageAuthor !== app.currentUser?.id) {
      return 'unread';
    }
    
    return 'read';
  };
  
  // ✅ Calcul des stats
  const sessionStats = useMemo(() => {
    if (!app.sessions) return { total: 0, unread: 0, pending: 0 };
    
    const activeSessions = app.sessions.filter(s => !s.completed && !s.archived);
    
    const unreadCount = activeSessions.filter(s => {
      const state = getReadState(s);
      return state === 'new' || state === 'unread';
    }).length;
    
    // Sessions en attente (Notifications + En attente de vous)
    const pendingCount = activeSessions.filter(s => {
      // À adapter selon votre logique de statut
      // Exemple : sessions avec dernier message != currentUser
      const lastMessage = s.notes?.[s.notes.length - 1];
      return lastMessage && lastMessage.author !== app.currentUser?.id;
    }).length;
    
    return { 
      total: activeSessions.length, 
      unread: unreadCount,
      pending: pendingCount
    };
  }, [app.sessions, app.currentUser, sessionReadStatus]);
  
  // ✅ Handlers
  const handleNewSession = () => {
    console.log('⚠️ Création session ad hoc : modal à implémenter');
  };
  
  const handleToggleUnreadFilter = () => {
    const newFilter = !unreadFilter;
    setUnreadFilter(newFilter);
    
    // Appliquer filtre via window callback
    if (window.sessionPageFilters?.setUnreadFilter) {
      window.sessionPageFilters.setUnreadFilter(newFilter);
    }
  };
  
  const handleOpenPendingSections = () => {
    // Ouvrir les volets "Notifications" et "En attente"
    if (window.sessionPageActions?.openPendingSections) {
      window.sessionPageActions.openPendingSections();
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-between transition-colors duration-150">
      
      {/* ========================================
          GAUCHE : Nouvelle causerie
      ======================================== */}
      <div className="flex items-center">
        <button 
          onClick={handleNewSession}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
          title="Nouvelle causerie (à implémenter)"
        >
          <MessageCirclePlus className="w-5 h-5" />
        </button>
      </div>
      
      {/* ========================================
          CENTRE : Stats
      ======================================== */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        <div className="flex items-center space-x-4 text-sm">
          
          {/* Total causeries */}
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              {sessionStats.total} causerie{sessionStats.total > 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Séparateur */}
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          
          {/* ✅ Non lues (cliquable → filtre) */}
          <button
            onClick={handleToggleUnreadFilter}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition-colors duration-150 ${
              unreadFilter
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Afficher seulement les non lues"
          >
            <div className={`w-2 h-2 rounded-full ${
              sessionStats.unread > 0 ? 'bg-orange-500' : 'bg-gray-400'
            }`} />
            <span className={`${
              sessionStats.unread > 0 
                ? 'text-orange-600 dark:text-orange-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {sessionStats.unread} non lu{sessionStats.unread > 1 ? 'es' : 'e'}
            </span>
          </button>
          
          {/* Séparateur (si assez de place - visible en tablette/desktop) */}
          <div className="hidden md:block w-px h-4 bg-gray-300 dark:bg-gray-600" />
          
          {/* ✅ En attente (ouvre volets - visible en tablette/desktop) */}
          <button
            onClick={handleOpenPendingSections}
            className="hidden md:flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            title="Ouvrir les sections en attente"
          >
            <div className={`w-2 h-2 rounded-full ${
              sessionStats.pending > 0 ? 'bg-amber-500' : 'bg-gray-400'
            }`} />
            <span className={`${
              sessionStats.pending > 0 
                ? 'text-amber-600 dark:text-amber-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {sessionStats.pending} en attente
            </span>
          </button>
          
        </div>
      </div>
      
      {/* ========================================
          DROITE : Menu overflow
      ======================================== */}
      <div className="flex items-center justify-end relative">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(prev => !prev);
          }}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
          title="Menu"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        
        <OverflowMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
        >
          {/* Pas d'actions spécifiques pour Sessions pour l'instant */}
        </OverflowMenu>
      </div>
      
    </div>
  );
}