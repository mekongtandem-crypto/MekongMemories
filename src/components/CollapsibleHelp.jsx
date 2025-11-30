/**
 * CollapsibleHelp.jsx - Composant réutilisable pour sections 💡 Explications
 * ✅ Collapsible (dépliable/repliable)
 * ✅ Design cohérent pour tous les modals
 * ✅ Utilisation: <CollapsibleHelp>{children}</CollapsibleHelp>
 */
import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

export default function CollapsibleHelp({ children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg overflow-hidden">
      {/* ⭐ v2.9w3 : Header cliquable simplifié (pas de cadre coloré) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 rounded"
      >
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Explications
          </span>
        </div>

        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {/* Contenu dépliable - texte simple sans fond coloré */}
      {isOpen && (
        <div className="p-3 pt-0">
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
