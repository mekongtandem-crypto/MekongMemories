/**
 * DeletePhotoChoiceModal.jsx v2.9w - Modal suppression message avec photo
 * ✅ Design amélioré : titre + info + question + 💡 explications
 * ✅ 3 boutons : Annuler / Message seul (bleu) / Message + fichier (rouge)
 * ✅ Explications dépliables (CollapsibleHelp)
 * ✅ Pour photos importées NON utilisées ailleurs
 * ✅ Utilisé dans ChatPage cas 1A
 */
import React from 'react';
import { X, Trash2, MessageCircle, AlertCircle } from 'lucide-react';
import CollapsibleHelp from './CollapsibleHelp.jsx';

export default function DeletePhotoChoiceModal({
  isOpen,
  onClose,
  photoFilename,
  onDeleteMessageOnly,
  onDeleteMessageAndDrive
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Supprimer le message avec photo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Information */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Cette photo importée <strong className="text-gray-900 dark:text-gray-100">"{photoFilename}"</strong> n'est utilisée nulle part ailleurs.
            </p>
          </div>

          {/* Question */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Que voulez-vous supprimer ?
            </p>
          </div>

          {/* Explications dépliables */}
          <CollapsibleHelp defaultOpen={false}>
            <ul className="ml-4 space-y-1 text-blue-800 dark:text-blue-300">
              <li>• <strong>Message seulement</strong> : Le message disparaît de la causerie, mais la photo reste disponible sur Google Drive pour d'autres usages</li>
              <li>• <strong>Message + fichier photo</strong> : Le message ET le fichier physique sont supprimés définitivement du cloud (⚠️ action irréversible)</li>
            </ul>
          </CollapsibleHelp>
        </div>

        {/* Footer - 3 boutons */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {/* Bouton Annuler */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors duration-150"
            title="Fermer sans supprimer"
          >
            Annuler
          </button>

          <div className="flex items-center space-x-3">
            {/* Bouton Message seulement (bleu) */}
            <button
              onClick={() => {
                onDeleteMessageOnly();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150 flex items-center space-x-1.5"
              title="Supprimer le message uniquement, garder la photo sur Drive"
            >
              <MessageCircle className="w-4 h-4" />
              <span>💬 Supprimer message seulement</span>
            </button>

            {/* Bouton Message + fichier (rouge) */}
            <button
              onClick={() => {
                onDeleteMessageAndDrive();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-150 flex items-center space-x-1.5"
              title="Supprimer le message ET le fichier physique du cloud (irréversible)"
            >
              <Trash2 className="w-4 h-4" />
              <span>🗑️ Supprimer aussi le fichier photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
