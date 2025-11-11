/**
 * SessionsTopBar.jsx v2.0 - Phase 25 : Design minimaliste
 * ✅ Titre "💬 n causeries"
 * ✅ 3 badges filtres : 🔔 | 🆕 | 👀
 * ✅ Bouton tri (responsive : TopBar si place, sinon menu)
 * ✅ Menu hamburger avec "Nouvelle session"
 */

import React, { useState, useMemo } from 'react';
import { MoreVertical, MessageCirclePlus, ArrowUpDown } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';
import { SORT_OPTIONS, SESSION_STATUS } from '../../utils/sessionUtils.js';
import OverflowMenu from './OverflowMenu.jsx';

export default function SessionsTopBar() {
  
  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  
  // Récupération états depuis SessionsPage via window
  const currentFilter = window.sessionPageState?.activeFilter || null;
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
    if (!app.sessions) return { total: 0, notified: 0, new: 0, unread: 0 };
    
    const activeSessions = app.sessions.filter(s => !s.completed && !s.archived);
    
    let notified = 0, newCount = 0, unread = 0;
    
    activeSessions.forEach(s => {
      const state = getReadState(s);
      
      // Compter notifications (statut spécial)
      if (s.notificationSent && !s.notificationCleared) {
        notified++;
      }
      
      // Compter NEW et UNREAD
      if (state === 'new') newCount++;
      if (state === 'unread') unread++;
    });
    
    const pendingYou = activeSessions.filter(s => 
    s.status === SESSION_STATUS.PENDING_YOU || 
    s.status === SESSION_STATUS.NOTIFIED
  ).length;
    
    return { 
      total: activeSessions.length, 
      notified,
      new: newCount,
      unread,
      pendingYou
    };
  }, [app.sessions, app.currentUser, sessionReadStatus]);
  
  // Handlers filtres
  const handleFilterClick = (filterType) => {
    if (window.sessionPageFilters?.setGroupFilter) {
      const isActive = currentFilter === filterType;
      window.sessionPageFilters.setGroupFilter(isActive ? null : filterType);
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
      
      {/* GAUCHE : Titre */}
      <div className="flex items-center min-w-0 flex-1">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          💬 {sessionStats.total} causerie{sessionStats.total > 1 ? 's' : ''}
        </h1>
      </div>
      
      {/* CENTRE : Badges filtres */}
      <div className="flex items-center space-x-2 mx-4">
        
        {/* Badge 🔔 Notifications */}
        {sessionStats.notified > 0 && (
        <button
          onClick={() => handleFilterClick('notified')}
          disabled={sessionStats.notified === 0}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
            currentFilter === 'notified'
              ? 'bg-orange-500 text-white'
              : sessionStats.notified > 0
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <span className="text-sm">🔔</span>
          {sessionStats.notified > 0 && <span>{sessionStats.notified}</span>}
        </button>
        )}
        
        {/* Badge 🆕 Nouvelles */}
        {sessionStats.new > 0 && (
        <button
          onClick={() => window.sessionPageFilters?.setUnreadFilter('new')}
          disabled={sessionStats.new === 0}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
            window.sessionPageState?.unreadFilter === 'new'
              ? 'bg-blue-500 text-white'
              : sessionStats.new > 0
                ? 'bg-green-600 dark:bg-green-600 text-white dark:text-white hover:bg-green-200 dark:hover:bg-green-900/50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <span className="text-sm">🆕</span>
          {sessionStats.new > 0 && <span>{sessionStats.new}</span>}
        </button>
        )}
        
        {/* Badge 👀 Non lues */}
        {sessionStats.unread > 0 && (
        <button
          onClick={() => window.sessionPageFilters?.setUnreadFilter('unread')}
          disabled={sessionStats.unread === 0}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
            window.sessionPageState?.unreadFilter === 'unread'
              ? 'bg-amber-500 text-white'
              : sessionStats.unread > 0
                ? 'bg-orange-600 dark:bg-orange-600 text-white dark:text-white hover:bg-amber-200 dark:hover:bg-amber-900/50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <span className="text-sm">👀</span>
          {sessionStats.unread > 0 && <span>{sessionStats.unread}</span>}
        </button>
        )}
        
        {/* Badge ⏳ En attente */}
        {sessionStats.pendingYou > 0 && (
          <button
            onClick={() => handleFilterClick('pending_you')}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
              currentFilter === 'pending_you'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
            }`}
          >
            <span className="text-sm">⏳</span>
            <span>{sessionStats.pendingYou}</span>
          </button>
        )}
        
      </div>
      
      {/* DROITE : Tri (desktop) + Menu */}
      <div className="flex items-center gap-2">
        
        {/* Bouton tri (visible en desktop uniquement) */}
        <div className="hidden md:block">
          <button
            onClick={() => {
              const nextSort = currentSort === SORT_OPTIONS.MODIFIED 
                ? SORT_OPTIONS.CREATED 
                : SORT_OPTIONS.MODIFIED;
              handleSortChange(nextSort);
            }}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
            title={currentSort === SORT_OPTIONS.MODIFIED ? "Tri par modification" : "Tri par création"}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden lg:inline">
              {currentSort === SORT_OPTIONS.MODIFIED ? "Modif." : "Créa."}
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