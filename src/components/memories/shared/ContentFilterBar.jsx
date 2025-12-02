/**
 * ContentFilterBar.jsx v2.11
 * Barre de filtres de contenu additifs
 *
 * ✨ Moments | 📷 Photos | 🗒️ Textes | 🖼️ Images
 *
 * - Système additif : minimum 1 filtre actif obligatoire
 * - Persistance dans localStorage
 * - Feedback visuel si tentative de désactivation du dernier
 */

import React, { memo } from 'react';
import { Sparkles, Camera, FileText, Image as ImageIcon } from 'lucide-react';

const ContentFilterBar = memo(({ contentFilters, onToggle }) => {

  const filters = [
    {
      key: 'moments',
      icon: Sparkles,
      label: 'Moments',
      color: 'purple',
      bgActive: 'bg-purple-500 dark:bg-purple-600',
      bgHover: 'hover:bg-purple-600 dark:hover:bg-purple-500',
      bgInactive: 'bg-gray-200 dark:bg-gray-700',
      textActive: 'text-white',
      textInactive: 'text-gray-500 dark:text-gray-400'
    },
    {
      key: 'photos',
      icon: Camera,
      label: 'Photos',
      color: 'green',
      bgActive: 'bg-green-500 dark:bg-green-600',
      bgHover: 'hover:bg-green-600 dark:hover:bg-green-500',
      bgInactive: 'bg-gray-200 dark:bg-gray-700',
      textActive: 'text-white',
      textInactive: 'text-gray-500 dark:text-gray-400'
    },
    {
      key: 'textes',
      icon: FileText,
      label: 'Textes',
      color: 'blue',
      bgActive: 'bg-blue-500 dark:bg-blue-600',
      bgHover: 'hover:bg-blue-600 dark:hover:bg-blue-500',
      bgInactive: 'bg-gray-200 dark:bg-gray-700',
      textActive: 'text-white',
      textInactive: 'text-gray-500 dark:text-gray-400'
    },
    {
      key: 'images',
      icon: ImageIcon,
      label: 'Images',
      color: 'amber',
      bgActive: 'bg-amber-500 dark:bg-amber-600',
      bgHover: 'hover:bg-amber-600 dark:hover:bg-amber-500',
      bgInactive: 'bg-gray-200 dark:bg-gray-700',
      textActive: 'text-white',
      textInactive: 'text-gray-500 dark:text-gray-400'
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 transition-colors duration-150">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
          Afficher :
        </span>

        {filters.map(filter => {
          const Icon = filter.icon;
          const isActive = contentFilters[filter.key];

          return (
            <button
              key={filter.key}
              onClick={() => onToggle(filter.key)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg
                transition-all duration-150 font-medium text-sm
                ${isActive
                  ? `${filter.bgActive} ${filter.textActive} shadow-sm ${filter.bgHover}`
                  : `${filter.bgInactive} ${filter.textInactive} hover:bg-gray-300 dark:hover:bg-gray-600`
                }
              `}
              title={`${isActive ? 'Masquer' : 'Afficher'} les ${filter.label.toLowerCase()}`}
            >
              <Icon className="w-4 h-4" />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

ContentFilterBar.displayName = 'ContentFilterBar';

export default ContentFilterBar;
