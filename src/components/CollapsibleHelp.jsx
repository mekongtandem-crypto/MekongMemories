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
    <div className="rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800">
      {/* Header cliquable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-150"
      >
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
            💡 Explications
          </span>
        </div>

        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        )}
      </button>

      {/* Contenu dépliable */}
      {isOpen && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
