/**
 * ConfirmDeleteModal.jsx v2.9s - MODAL 1 : "Effacer le souvenir"
 * ✅ Modal simplifié de confirmation première étape
 * ✅ Liste informative des éléments fils (SANS checkboxes)
 * ✅ 3 boutons fixes : Annuler / Effacer de la mémoire / Supprimer du Drive
 * ✅ Dark mode support
 */
import React from 'react';
import { X, AlertTriangle, FileEdit, Camera, Info } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirmMemoryOnly,  // ⭐ Nouveau : Effacer de la mémoire seulement
  onConfirmWithDrive,   // ⭐ Nouveau : Demande suppression Drive (peut ouvrir Modal 2)
  itemName,
  itemType = 'élément',  // 'Moment' | 'Note de photo' | 'Photo'
  itemIcon = null,
  childrenDetails = null  // Liste informative seulement
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Effacer le souvenir
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
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Vous êtes sur le point de supprimer ce souvenir de votre mémoire.
          </p>

          {/* Élément à supprimer */}
          {itemName && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
              <div className="flex items-center space-x-2">
                {itemIcon && <span className="text-2xl">{itemIcon}</span>}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">
                    {itemType}
                  </p>
                  <p className="text-sm font-bold text-red-900 dark:text-red-200">
                    {itemName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ⭐ Liste informative des éléments qui seront supprimés (SANS checkboxes) */}
          {childrenDetails && (childrenDetails.notes?.length > 0 || childrenDetails.photos > 0) && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                CONTENU QUI SERA SUPPRIMÉ
              </p>

              {/* Notes */}
              {childrenDetails.notes && childrenDetails.notes.length > 0 && (
                <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center mb-2">
                    <FileEdit className="w-3 h-3 mr-1.5" />
                    NOTES ({childrenDetails.notes.length})
                  </p>
                  <div className="space-y-1 ml-5">
                    {childrenDetails.notes.map((note) => (
                      <div key={note.id} className="text-xs text-gray-700 dark:text-gray-300">
                        • "{note.title || 'Sans titre'}"
                        {note.photoCount > 0 && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {' '}(+ {note.photoCount} photo{note.photoCount > 1 ? 's' : ''})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {childrenDetails.photos > 0 && (
                <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center mb-2">
                    <Camera className="w-3 h-3 mr-1.5" />
                    PHOTOS ({childrenDetails.photos} total)
                  </p>
                  {childrenDetails.photosMoment > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-5">
                      • {childrenDetails.photosMoment} photo{childrenDetails.photosMoment > 1 ? 's' : ''} du moment seul
                    </p>
                  )}
                  {childrenDetails.photosNotes > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-5">
                      • {childrenDetails.photosNotes} photo{childrenDetails.photosNotes > 1 ? 's' : ''} dans les notes
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ⭐ Info box bleue */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-200 font-medium mb-2">
              💡 Que souhaitez-vous faire ?
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 ml-4">
              <li>• <strong className="text-blue-600 dark:text-blue-400">Effacer de la mémoire</strong> : Supprime du masterIndex, garde les photos sur Drive</li>
              <li>• <strong className="text-red-600 dark:text-red-400">Supprimer du Drive</strong> : Supprime aussi les fichiers physiques (si possible)</li>
            </ul>
          </div>
        </div>

        {/* Footer - ⭐ v2.9s : 3 boutons fixes */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-150"
          >
            Annuler
          </button>

          <button
            onClick={() => {
              onConfirmMemoryOnly();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150"
            title="Supprime du masterIndex, garde les photos sur Drive"
          >
            Effacer de la mémoire
          </button>

          <button
            onClick={() => {
              onConfirmWithDrive();
              // ⚠️ Ne pas fermer ici, le handler décidera (Modal 2 ou direct)
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-150"
            title="Supprime aussi les fichiers physiques du cloud"
          >
            Supprimer du Drive
          </button>
        </div>
      </div>
    </div>
  );
}
