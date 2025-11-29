/**
 * CascadeOptionsModal.jsx v2.9r - Sélection éléments cascade AVANT confirmation
 * ✅ Modal préalable pour choisir quoi supprimer
 * ✅ Affichage détaillé des éléments imbriqués
 * ✅ Checkboxes : Notes, Photos, Fichiers Drive
 * ✅ Validation → ouvre ConfirmDeleteModal
 * ✅ Dark mode support
 */
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileEdit, Camera, Cloud, Info } from 'lucide-react';

export default function CascadeOptionsModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'moment',
  itemIcon = '📅',
  childrenDetails,
  // Pré-cochage initial
  initialOptions = {
    deleteNotes: true,
    deletePhotos: true,
    deleteFiles: false
  }
}) {
  const [options, setOptions] = useState(initialOptions);

  // Réinitialiser à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setOptions(initialOptions);
    }
  }, [isOpen, initialOptions]);

  if (!isOpen) return null;

  const handleToggle = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value,
      // Si deletePhotos = false, forcer deleteFiles = false
      ...(key === 'deletePhotos' && !value ? { deleteFiles: false } : {})
    }));
  };

  const handleConfirm = () => {
    onConfirm(options);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10001 }}
      onClick={handleCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Que voulez-vous supprimer ?
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
        <div className="p-4 space-y-4">
          {/* Élément à supprimer */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              {itemIcon && <span className="text-2xl">{itemIcon}</span>}
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  {itemType}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {itemName}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300">
            Ce {itemType} contient des éléments. Choisissez ce que vous souhaitez supprimer :
          </p>

          {/* Options de cascade */}
          <div className="space-y-3">

            {/* Notes */}
            {childrenDetails?.notes && childrenDetails.notes.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.deleteNotes}
                    onChange={(e) => handleToggle('deleteNotes', e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center">
                      <FileEdit className="w-4 h-4 mr-2" />
                      Supprimer les notes ({childrenDetails.notes.length})
                    </p>
                    <div className="ml-6 mt-2 space-y-1">
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
                </label>
              </div>
            )}

            {/* Photos */}
            {childrenDetails?.photos > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.deletePhotos}
                    onChange={(e) => handleToggle('deletePhotos', e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-200 flex items-center">
                      <Camera className="w-4 h-4 mr-2" />
                      Supprimer les photos ({childrenDetails.photos})
                    </p>
                    <div className="ml-6 mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                      <p>• {childrenDetails.photosMoment || 0} photo{(childrenDetails.photosMoment || 0) > 1 ? 's' : ''} du moment</p>
                      {childrenDetails.photosNotes > 0 && (
                        <p>• {childrenDetails.photosNotes} photo{childrenDetails.photosNotes > 1 ? 's' : ''} dans les notes</p>
                      )}
                    </div>

                    {/* Sous-option : Fichiers Drive */}
                    {options.deletePhotos && (
                      <div className="ml-6 mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
                        <label className="flex items-start space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.deleteFiles}
                            onChange={(e) => handleToggle('deleteFiles', e.target.checked)}
                            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center">
                              <Cloud className="w-3 h-3 mr-1.5" />
                              Supprimer aussi les fichiers du cloud
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {childrenDetails.photos * 2} fichiers ({childrenDetails.photos} originaux + {childrenDetails.photos} thumbnails)
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 font-medium">
                              ⚠️ La suppression sera bloquée si les photos sont utilisées ailleurs
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            )}

          </div>

          {/* Avertissement si aucune option cochée */}
          {!options.deleteNotes && !options.deletePhotos && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Seul le {itemType} sera supprimé, sans ses notes ni photos
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-150"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
