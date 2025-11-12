/**
 * SessionsTopBar.jsx v2.3 - Option B : 4 badges simplifiés
 * 💬 Toutes | 🔔 Notifiées | 🆕 Nouvelles | ⏳ En attente
 */

import React, { useState, useMemo, useEffect } from 'react';
import { MoreVertical, ArrowUpDown } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';
import { SORT_OPTIONS, SESSION_STATUS, enrichSessionWithStatus } from '../../utils/sessionUtils.js';
import OverflowMenu from './OverflowMenu.jsx';

export default function SessionsTopBar() {
  
  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  
  // ✅ État local synchronisé avec SessionsPage
  const [activeFilter, setActiveFilter] = useState(null);
  const currentSort = window.sessionPageState?.currentSort || SORT_OPTIONS.URGENCY;
  
  // ✅ Exposer le setter pour que SessionsPage puisse mettre à jour
  useEffect(() => {
    window.sessionTopBarActions = {
      updateActiveFilter: (filter) => setActiveFilter(filter)
    };
    return () => {
      delete window.sessionTopBarActions;
    };
  }, []);
  
  // ✅ Synchroniser à l'initialisation
  useEffect(() => {
    const initialFilter = window.sessionPageState?.unreadFilter || null;
    setActiveFilter(initialFilter);
  }, []);
  
  // Tracking lecture
  const sessionReadStatus = useMemo(() => {
    const saved = localStorage.getItem(`mekong_sessionReadStatus_${app.currentUser?.id}`);
    return saved ? JSON.parse(saved) : {};
  }, [app.currentUser?.id]);
  
  // Calculer état lecture
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

  // ✅ Calcul stats avec enrichissement
  const sessionStats = useMemo(() => {
    if (!app.sessions || !app.currentUser?.id) {
      return { total: 0, notified: 0, new: 0, pending: 0 };
    }
    
    // Enrichir sessions avec statuts
    const enrichedSessions = app.sessions
      .map(s => enrichSessionWithStatus(s, app.currentUser.id))
      .filter(s => !s.completed && !s.archived);
    
    let notified = 0, newCount = 0, pending = 0;
    
    enrichedSessions.forEach(s => {
      const state = getReadState(s);
      
      // Compter notifiées (via statut enrichi)
      if (s.status === SESSION_STATUS.NOTIFIED) {
        notified++;
      }
      
      // Compter nouvelles (jamais ouvertes)
      if (state === 'new') {
        newCount++;
      }
      
      // Compter en attente (dernier message pas de moi)
      const lastMessage = s.notes?.[s.notes.length - 1];
      const lastAuthor = lastMessage?.author || s.user;
      if (lastAuthor !== app.currentUser?.id) {
        pending++;
      }
    });
    
    return { 
      total: enrichedSessions.length, 
      notified,
      new: newCount,
      pending
    };
  }, [app.sessions, app.currentUser?.id, sessionReadStatus]);
  
  // ✅ Handler toggle avec mise à jour locale ET SessionsPage
  const handleFilterToggle = (filterType) => {
    let newFilter;
    
    // Si on clique sur le filtre déjà actif → désactiver
    if (activeFilter === filterType) {
      newFilter = null;
    } else {
      // Sinon, activer le nouveau filtre
      newFilter = filterType;
    }
    
    // Mettre à jour l'état local immédiatement
    setActiveFilter(newFilter);
    
    // Propager à SessionsPage
    if (window.sessionPageFilters?.setUnreadFilter) {
      window.sessionPageFilters.setUnreadFilter(newFilter);
    }
    
    // Ouvrir sections si filtre actif
    if (newFilter && window.sessionPageActions?.openPendingSections) {
      window.sessionPageActions.openPendingSections();
    }
  };
  
  const handleResetFilters = () => {
    setActiveFilter(null);
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
      
      {/* GAUCHE : Badge "Toutes" */}
      <button
        onClick={handleResetFilters}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
          activeFilter === null
            ? 'bg-blue-600 text-white shadow-lg scale-105'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-100'
        }`}
        title={activeFilter === null ? '✓ Toutes affichées' : 'Afficher toutes'}
      >
        <span>💬</span>
        <span>{sessionStats.total}</span>
      </button>
      
      {/* CENTRE : Badges filtres (3 badges) */}
      <div className="flex items-center gap-1.5">
        
        {/* Badge 🔔 Notifiées (ORANGE FONCÉ) */}
        {sessionStats.notified > 0 && (
          <button
            onClick={() => handleFilterToggle('notified')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              activeFilter === 'notified'
                ? 'bg-orange-600 text-white shadow-lg scale-105'
                : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 hover:bg-orange-100'
            }`}
            title={activeFilter === 'notified' ? '✓ Filtre actif' : 'Filtrer : Notifiées'}
          >
            <span>🔔</span>
            <span>{sessionStats.notified}</span>
          </button>
        )}
        
        {/* Badge 🆕 Nouvelles (VERT) */}
        {sessionStats.new > 0 && (
          <button
            onClick={() => handleFilterToggle('new')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              activeFilter === 'new'
                ? 'bg-green-600 text-white shadow-lg scale-105'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-100'
            }`}
            title={activeFilter === 'new' ? '✓ Filtre actif' : 'Filtrer : Nouvelles'}
          >
            <span>🆕</span>
            <span>{sessionStats.new}</span>
          </button>
        )}
        
        {/* Badge ⏳ En attente (AMBRE) */}
        {sessionStats.pending > 0 && (
          <button
            onClick={() => handleFilterToggle('pending')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-lg scale-105'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100'
            }`}
            title={activeFilter === 'pending' ? '✓ Filtre actif' : 'Filtrer : En attente'}
          >
            <span>⏳</span>
            <span>{sessionStats.pending}</span>
          </button>
        )}
        
      </div>
      
      {/* DROITE : Tri + Menu */}
      <div className="flex items-center gap-2">
        
        {/* Bouton tri (desktop) */}
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