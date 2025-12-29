/**
 * SaynetesTopBar.jsx v3.0b - Phase 3.0 : TopBar Catalogue Saynètes
 * 🎭 TopBar pour la page Saynètes
 * ✅ Menu lancement saynète
 * ✅ Statistiques saynètes actives (sessions avec gameContext)
 */

import React, { useState, useMemo } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState.js';

export default function SaynetesTopBar({ onLaunchSaynete }) {

  const app = useAppState();
  const [showMenu, setShowMenu] = useState(false);

  // ✅ Compter sessions avec gameContext (saynètes actives)
  const sayneteStats = useMemo(() => {
    if (!app.sessions) return { active: 0 };
    const activeSaynetes = app.sessions.filter(s => s.gameContext && !s.archived);
    return { active: activeSaynetes.length };
  }, [app.sessions]);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-12 flex items-center justify-between transition-colors duration-150">

      {/* GAUCHE : Titre */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🎭</span>
        <span className="text-purple-600 dark:text-purple-400 font-semibold">
          Jeux
        </span>
      </div>

      {/* CENTRE : Stats */}
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
          {sayneteStats.active} active{sayneteStats.active > 1 ? 's' : ''}
        </span>
      </div>

      {/* DROITE : Bouton + Menu */}
      <div className="flex items-center gap-2">

        {/* Bouton Lancer Jeu */}
        <button
          onClick={onLaunchSaynete}
          className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-150"
          title="Lancer un jeu"
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
