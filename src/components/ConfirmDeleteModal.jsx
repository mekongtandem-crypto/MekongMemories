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
  cancelText = 'Annuler',
  // ⭐ v2.9 : Options pour suppression photos
  showDriveOption = false,
  deleteFromDrive = false,
  onToggleDriveOption = null
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    // ⭐ v2.9 : Passer l'option deleteFromDrive pour les photos
    if (showDriveOption && onConfirm) {
      onConfirm(deleteFromDrive);
    } else {
      onConfirm();
    }
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

          {/* ⭐ v2.9 : Option suppression Drive pour photos */}
          {showDriveOption && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteFromDrive}
                  onChange={(e) => onToggleDriveOption?.(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Effacer définitivement du cloud
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Supprimer aussi le fichier physique de Google Drive (recommandé pour économiser l'espace de stockage)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Avertissement */}
          <div className="mt-4 flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Cette action est <strong>irréversible</strong>. {showDriveOption && deleteFromDrive ? 'Le fichier sera supprimé du cloud et' : 'L\'élément'} sera définitivement supprimé{showDriveOption && !deleteFromDrive ? ' (le fichier restera dans le cloud)' : ''}.
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
