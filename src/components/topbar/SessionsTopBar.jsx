/**
 * SessionsTopBar.jsx v1.0 - Phase 25 : Refactoring TopBar
 * TopBar spécifique à la page Sessions
 * 
 * Layout :
 * - Gauche : + Nouvelle causerie
 * - Centre : Stats (n actives / n en attente)
 * - Droite : ... Menu
 */

import React, { useState, useMemo } from 'react';
import { MessageCirclePlus, MoreVertical } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';
import OverflowMenu from './OverflowMenu.jsx';

export default function SessionsTopBar() {
  
  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  
  // Calcul des stats sessions
  const sessionStats = useMemo(() => {
    if (!app.sessions) return { active: 0, pending: 0 };
    
    const active = app.sessions.filter(s => 
      !s.completed && !s.archived && s.notes?.length > 0
    ).length;
    
    const pending = app.sessions.filter(s => 
      !s.completed && !s.archived && (!s.notes || s.notes.length === 0)
    ).length;
    
    return { active, pending };
  }, [app.sessions]);
  
  const handleNewSession = () => {
    // Bouton présent mais sans action pour l'instant
    // TODO : Implémenter modal création session
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-between transition-colors duration-200">
      
      {/* Gauche : Nouvelle causerie */}
      <div className="flex items-center">
        <button 
          onClick={handleNewSession}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Nouvelle causerie"
        >
          <MessageCirclePlus className="w-5 h-5" />
        </button>
      </div>
      
      {/* Centre : Stats */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        <div className="flex items-center space-x-4 text-sm">
          
          {/* Actives */}
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              {sessionStats.active} active{sessionStats.active > 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Séparateur */}
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          
          {/* En attente */}
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">
              {sessionStats.pending} en attente
            </span>
          </div>
          
        </div>
      </div>
      
      {/* Droite : Menu overflow */}
      <div className="flex items-center justify-end relative">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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