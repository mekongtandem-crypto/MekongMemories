/**
 * SessionsTopBar.jsx v2.2 - Phase 25 : Filtres toggle fonctionnels
 */

import React, { useState, useMemo } from 'react';
import { MoreVertical, ArrowUpDown } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';
import { SORT_OPTIONS, SESSION_STATUS } from '../../utils/sessionUtils.js';
import OverflowMenu from './OverflowMenu.jsx';

export default function SessionsTopBar() {
  
  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  
  // ✅ CORRECTION : Utiliser unreadFilter comme activeFilter
  const activeFilter = window.sessionPageState?.unreadFilter || null;
  const currentSort = window.sessionPageState?.currentSort || SORT_OPTIONS.URGENCY;
  
  // Récupérer tracking lecture depuis localStorage
  const sessionReadStatus = useMemo(() => {
    const saved = localStorage.getItem(`mekong_sessionReadStatus_${app.currentUser?.id}`);
    return saved ? JSON.parse(saved) : {};
  }, [app.currentUser, app.sessions]);
  
  // Calculer état lecture pour chaque session
  const getReadState = (session) => {
    const tracking = sessionReadStatus[session.id];
    const lastMessage = session.notes?.[session.notes.length - 1];
    const lastMessageTime = lastMessage?.timestamp || session.createdAt;
    const lastMessageAuthor = lastMessage?.author || session.user;
    const sessionCreator = session.user;
    
    if (sessionCreator === app.currentUser?.id && !lastMessage) return 'read';
    if (lastMessageAuthor === app.currentUser?.id) return 'read';
    if (!tracking?.hasBeenOpened && sessionCreator !== app.currentUser?.id) return 'new';
    if (tracking?.hasBeenOpened && 
        tracking.lastOpenedAt && 
        new Date(lastMessageTime) > new Date(tracking.lastOpenedAt) &&
        lastMessageAuthor !== app.currentUser?.id) return 'unread';
    return 'read';
  };

  // Calcul des stats
  const sessionStats = useMemo(() => {
    if (!app.sessions) return { total: 0, notified: 0, new: 0, unread: 0, pendingYou: 0 };
    
    const activeSessions = app.sessions.filter(s => !s.completed && !s.archived);
    
    let notified = 0, newCount = 0, unread = 0;
    
    activeSessions.forEach(s => {
      const state = getReadState(s);
      
      // ✅ Compter notifications via statut enrichi
      if (s.status === SESSION_STATUS.NOTIFIED) {
        notified++;
      }
      
      // Compter NEW et UNREAD
      if (state === 'new') newCount++;
      if (state === 'unread') unread++;
    });
    
    // Compter sessions en attente
    const pendingYou = activeSessions.filter(s => {
      const lastMessage = s.notes?.[s.notes.length - 1];
      const lastAuthor = lastMessage?.author || s.user;
      return lastAuthor !== app.currentUser?.id;
    }).length;
    
    return { 
      total: activeSessions.length, 
      notified,
      new: newCount,
      unread,
      pendingYou
    };
  }, [app.sessions, app.currentUser, sessionReadStatus]);
  
  // ✅ Handler toggle filtre (exclusif + réinitialise si déjà actif)
  const handleFilterToggle = (filterType) => {
    const isActive = activeFilter === filterType;
    const newFilter = isActive ? null : filterType;
    
    if (window.sessionPageFilters?.setUnreadFilter) {
      window.sessionPageFilters.setUnreadFilter(newFilter);
    }
    
    // Ouvrir sections si filtre actif
    if (newFilter && window.sessionPageActions?.openPendingSections) {
      window.sessionPageActions.openPendingSections();
    }
  };
  
  // ✅ Handler réinitialiser tous filtres
  const handleResetFilters = () => {
    if (window.sessionPageFilters?.setUnreadFilter) {
      window.sessionPageFilters.setUnreadFilter(null);
    }
  };
  
  const handleSortChange = (sortOption) => {
    if (window.sessionPageFilters?.setSortBy) {
      window.sessionPageFilters.setSortBy(sortOption);
      localStorage.setItem(`mekong_sessionSort_${app.currentUser?.id}`, sortOption);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-between transition-colors duration-150">
      
      {/* GAUCHE : Titre = Bouton "Toutes" */}
      <button
        onClick={handleResetFilters}
        className={`flex items-center min-w-0 px-3 py-1.5 rounded-lg transition-all duration-150 ${
          activeFilter === null
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Afficher toutes les sessions"
      >
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          💬 {sessionStats.total}
        </h1>
      </button>
      
      {/* CENTRE : Badges filtres - Toggle exclusif */}
      <div className="flex items-center space-x-2 mx-4">
        
        {/* Badge 🔔 Notifications */}
        {sessionStats.notified > 0 && (
          <button
            onClick={() => handleFilterToggle('notified')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              activeFilter === 'notified'
                ? 'bg-orange-600 text-white border-2 border-orange-800 shadow-md scale-105'
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/50'
            }`}
            title={activeFilter === 'notified' ? '✓ Filtre actif - Cliquer pour désactiver' : 'Filtrer par notifications'}
          >
            <span className="text-sm">🔔</span>
            <span>{sessionStats.notified}</span>
          </button>
        )}
        
        {/* Badge 🆕 Nouvelles */}
        {sessionStats.new > 0 && (
          <button
            onClick={() => handleFilterToggle('new')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              activeFilter === 'new'
                ? 'bg-blue-600 text-white border-2 border-blue-800 shadow-md scale-105'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50'
            }`}
            title={activeFilter === 'new' ? '✓ Filtre actif - Cliquer pour désactiver' : 'Filtrer par nouvelles'}
          >
            <span className="text-sm">🆕</span>
            <span>{sessionStats.new}</span>
          </button>
        )}
        
        {/* Badge 👀 Non lues */}
        {sessionStats.unread > 0 && (
          <button
            onClick={() => handleFilterToggle('unread')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              activeFilter === 'unread'
                ? 'bg-amber-600 text-white border-2 border-amber-800 shadow-md scale-105'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50'
            }`}
            title={activeFilter === 'unread' ? '✓ Filtre actif - Cliquer pour désactiver' : 'Filtrer par non lues'}
          >
            <span className="text-sm">👀</span>
            <span>{sessionStats.unread}</span>
          </button>
        )}
        
        {/* Badge ⏳ En attente */}
        {sessionStats.pendingYou > 0 && (
          <button
            onClick={() => handleFilterToggle('pending')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              activeFilter === 'pending'
                ? 'bg-purple-600 text-white border-2 border-purple-800 shadow-md scale-105'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-900/50'
            }`}
            title={activeFilter === 'pending' ? '✓ Filtre actif - Cliquer pour désactiver' : 'Filtrer par en attente'}
          >
            <span className="text-sm">⏳</span>
            <span>{sessionStats.pendingYou}</span>
          </button>
        )}
        
      </div>
      
      {/* DROITE : Tri (desktop) + Menu */}
      <div className="flex items-center gap-2">
        
        {/* Bouton tri */}
        <div className="hidden md:block">
          <button
            onClick={() => {
              const sortCycle = {
                [SORT_OPTIONS.URGENCY]: SORT_OPTIONS.MODIFIED,
                [SORT_OPTIONS.MODIFIED]: SORT_OPTIONS.CREATED,
                [SORT_OPTIONS.CREATED]: SORT_OPTIONS.URGENCY
              };
              handleSortChange(sortCycle[currentSort]);
            }}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
            title={
              currentSort === SORT_OPTIONS.URGENCY ? "Tri : Importance" :
              currentSort === SORT_OPTIONS.MODIFIED ? "Tri : Modification" :
              "Tri : Création"
            }
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden lg:inline">
              {currentSort === SORT_OPTIONS.URGENCY ? "Importance" :
               currentSort === SORT_OPTIONS.MODIFIED ? "Modif." :
               "Créa."}
            </span>
          </button>
        </div>
        
        {/* Menu hamburger */}
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(prev => !prev);
            }}
            data-menu-trigger="sessions"
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          <OverflowMenu
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            pageSpecificActions={{
              newSession: true,
              sort: true,
              currentSort: currentSort,
              onSortChange: handleSortChange
            }}
          />
        </div>
      </div>
      
    </div>
  );
}