/**
 * DeletePhotoChoiceModal.jsx v2.9u - Modal simple suppression photo
 * ✅ Choix : Supprimer message seul OU message + photo Drive
 * ✅ Pour photos importées NON utilisées ailleurs
 * ✅ Utilisé dans ChatPage cas 1A
 */
import React from 'react';
import { X, Trash2, Archive } from 'lucide-react';

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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Supprimer le message avec photo
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Cette photo importée <strong>"{photoFilename}"</strong> n'est utilisée nulle part d'autre.
          </p>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Que voulez-vous faire ?
          </p>

          <div className="space-y-3">
            {/* Option 1 : Message seulement */}
            <button
              onClick={() => {
                onDeleteMessageOnly();
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <Archive className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">
                    Supprimer le message seulement
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    La photo reste sur Google Drive
                  </p>
                </div>
              </div>
            </button>

            {/* Option 2 : Message + Drive */}
            <button
              onClick={() => {
                onDeleteMessageAndDrive();
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-200 text-sm">
                    Supprimer message + photo du Drive
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    ⚠️ Suppression définitive du cloud
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
