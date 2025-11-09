/**
 * SettingsTopBar.jsx v1.0 - Phase 25 : Refactoring TopBar
 * TopBar spécifique à la page Settings
 * 
 * Layout :
 * - Gauche : ← Retour (vers sessions)
 * - Centre : ⚙️ Réglages
 * - Droite : ... Menu (OverflowMenu minimal)
 */

import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Settings } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';
import OverflowMenu from './OverflowMenu.jsx';

export default function SettingsTopBar() {
  
  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);
  
  const handleBack = () => {
    app.updateCurrentPage('sessions');
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-between transition-colors duration-200">
      
      {/* Gauche : Bouton retour */}
      <div className="flex items-center">
        <button 
          onClick={handleBack}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      
      {/* Centre : Titre */}
      <div className="flex-1 flex items-center justify-center px-4 min-w-0">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Réglages
          </span>
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
          {/* Pas d'actions spécifiques pour Settings */}
        </OverflowMenu>
      </div>
      
    </div>
  );
}