/**
 * ConfirmDeleteModal.jsx v2.9 - Modal de confirmation de suppression
 * ✅ Modal générique réutilisable
 * ✅ Dark mode support
 * ✅ Transitions 150ms
 * ✅ Bouton danger (rouge)
 */
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer la suppression',
  message = 'Êtes-vous sûr de vouloir supprimer cet élément ?',
  itemName = null,
  itemType = 'élément',
  confirmText = 'Supprimer',
  cancelText = 'Annuler'
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={handleCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>

          {/* Nom de l'élément à supprimer */}
          {itemName && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                {itemType} : <span className="font-bold">{itemName}</span>
              </p>
            </div>
          )}

          {/* Avertissement */}
          <div className="mt-4 flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Cette action est <strong>irréversible</strong>. L'élément sera définitivement supprimé.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-150"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-150"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
