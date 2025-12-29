/**
 * GamesTopBar.jsx v3.0 - Phase 3.0 : Page Jeux
 * 🎮 TopBar pour la page Jeux
 * ✅ Menu création nouveau jeu
 * ✅ Statistiques jeux actifs/complétés
 */

import React, { useState } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';

export default function GamesTopBar({ onCreateGame }) {

  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);

  // TODO : Calculer stats depuis GamesManager
  const gameStats = {
    active: 0,
    completed: 0
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-between transition-colors duration-150">

      {/* GAUCHE : Titre */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🎮</span>
        <span className="text-amber-600 dark:text-amber-400 font-semibold">
          Jeux
        </span>
      </div>

      {/* CENTRE : Stats */}
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
          {gameStats.active} en cours
        </span>
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
          {gameStats.completed} complétés
        </span>
      </div>

      {/* DROITE : Bouton + Menu */}
      <div className="flex items-center gap-2">

        {/* Bouton Nouveau Jeu */}
        <button
          onClick={onCreateGame}
          className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-150"
          title="Créer un nouveau jeu"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Menu hamburger (placeholder) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(prev => !prev);
          }}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

      </div>

    </div>
  );
}
