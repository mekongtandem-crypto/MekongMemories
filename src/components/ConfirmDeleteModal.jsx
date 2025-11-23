/**
 * ConfirmDeleteModal.jsx v2.9n - Modal de confirmation de suppression amélioré
 * ✅ Modal générique réutilisable
 * ✅ Dark mode support
 * ✅ Transitions 150ms
 * ✅ Bouton danger (rouge)
 * ⭐ v2.9n : Warnings cross-références + bouton "Retirer seulement"
 */
import React from 'react';
import { X, AlertTriangle, FileEdit, Camera, Info } from 'lucide-react';

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
  onToggleDriveOption = null,
  // ⭐ v2.9j : Options pour suppression en cascade
  childrenCounts = null,  // { notes: 2, photos: 5 }
  cascadeOptions = null,  // { deleteNotes: false, deletePhotos: false, deleteFiles: false }
  onToggleCascadeOption = null,
  // ⭐ v2.9n : Détails des enfants + cross-refs warnings
  childrenDetails = null,  // { notes: [{id, title, photoCount}], photos: 6 }
  crossRefsWarnings = null, // [{ photoId, crossRefs: [...] }]
  showRemoveOnlyButton = false, // Afficher bouton "Retirer du moment seulement"
  onRemoveOnly = null  // Handler pour retirer sans supprimer Drive
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    // ⭐ v2.9j : Passer les options de suppression (Drive + cascade)
    if (showDriveOption && onConfirm) {
      onConfirm(deleteFromDrive);
    } else if (cascadeOptions && onConfirm) {
      // Suppression en cascade (moment avec enfants)
      onConfirm(cascadeOptions);
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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

        {/* Body - Scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
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
                    Supprimer le fichier image du cloud
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Effacer aussi le fichier physique de Google Drive (recommandé pour économiser l'espace de stockage)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* ⭐ v2.9o : Contenu avec checkboxes intégrées */}
          {childrenDetails && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                CONTENU À SUPPRIMER
              </p>

              {/* Notes avec checkbox intégrée */}
              {childrenDetails.notes && childrenDetails.notes.length > 0 && (
                <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cascadeOptions?.deleteNotes || false}
                      onChange={(e) => onToggleCascadeOption?.('deleteNotes', e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center">
                        <FileEdit className="w-3 h-3 mr-1.5" />
                        NOTES ({childrenDetails.notes.length}) - Cocher pour supprimer
                      </p>
                      <div className="space-y-1 ml-5 mt-1">
                        {childrenDetails.notes.map((note, idx) => (
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

              {/* Photos avec checkbox intégrée */}
              {childrenDetails.photos > 0 && (
                <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cascadeOptions?.deletePhotos || false}
                      onChange={(e) => onToggleCascadeOption?.('deletePhotos', e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center">
                        <Camera className="w-3 h-3 mr-1.5" />
                        PHOTOS ({childrenDetails.photos} total) - Cocher pour supprimer
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-5 mt-1">
                        • {childrenDetails.photosMoment || 0} photo{(childrenDetails.photosMoment || 0) > 1 ? 's' : ''} du moment seul
                      </p>
                      {childrenDetails.photosNotes > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 ml-5">
                          • {childrenDetails.photosNotes} photo{childrenDetails.photosNotes > 1 ? 's' : ''} dans les notes
                        </p>
                      )}

                      {/* Sous-checkbox : Supprimer fichiers Drive */}
                      {cascadeOptions?.deletePhotos && (
                        <div className="ml-5 mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
                          <label className="flex items-start space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cascadeOptions?.deleteFiles || false}
                              onChange={(e) => onToggleCascadeOption?.('deleteFiles', e.target.checked)}
                              className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                ☁️ Supprimer fichiers du cloud ({childrenDetails.photos * 2} fichiers)
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                {childrenDetails.photos} originaux + {childrenDetails.photos} thumbnails
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
          )}

          {/* ⭐ v2.9n : Warnings cross-références */}
          {crossRefsWarnings && crossRefsWarnings.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                ⚠️ ATTENTION - PHOTOS UTILISÉES AILLEURS
              </p>
              <p className="text-xs text-red-800 dark:text-red-300 mb-3">
                {crossRefsWarnings.length} photo{crossRefsWarnings.length > 1 ? 's sont' : ' est'} également utilisée{crossRefsWarnings.length > 1 ? 's' : ''} dans d'autres moments :
              </p>
              <div className="space-y-2 ml-4">
                {crossRefsWarnings.map((warning, idx) => (
                  <div key={idx} className="text-xs">
                    <p className="font-semibold text-red-900 dark:text-red-200">
                      Photo {idx + 1} : {warning.filename || warning.photoId.substring(0, 20) + '...'}
                    </p>
                    <div className="ml-3 mt-1 space-y-0.5">
                      {warning.crossRefs.map((ref, refIdx) => (
                        <p key={refIdx} className="text-red-700 dark:text-red-300">
                          → {ref.momentTitle} ({ref.momentDate})
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-800 dark:text-red-300 mt-3 font-medium">
                ⚠️ La suppression du Drive cassera ces autres moments !
              </p>
            </div>
          )}

          {/* ⭐ v2.9n3 : Warnings sessions/causeries */}
          {crossRefsWarnings && crossRefsWarnings.some(w => w.sessionRefs && w.sessionRefs.length > 0) && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg">
              <p className="text-sm font-bold text-orange-900 dark:text-orange-200 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                💬 ATTENTION - PHOTOS UTILISÉES DANS DES CAUSERIES
              </p>
              <div className="space-y-3 ml-4">
                {crossRefsWarnings.filter(w => w.sessionRefs && w.sessionRefs.length > 0).map((warning, idx) => (
                  <div key={idx} className="text-xs">
                    <p className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                      Photo : {warning.filename || warning.photoId.substring(0, 20) + '...'}
                    </p>
                    <p className="text-orange-800 dark:text-orange-300 mb-1">
                      Utilisée dans {warning.sessionRefs.length} causerie{warning.sessionRefs.length > 1 ? 's' : ''} :
                    </p>
                    <div className="ml-3 space-y-1">
                      {warning.sessionRefs.map((ref, refIdx) => (
                        <div key={refIdx} className="text-orange-700 dark:text-orange-300">
                          <p className="font-medium">
                            → "{ref.sessionTitle}"
                          </p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 ml-3">
                            Message de {ref.messageAuthor} le {new Date(ref.messageDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-orange-800 dark:text-orange-300 mt-3 font-medium">
                ⚠️ La suppression du Drive empêchera l'affichage de la photo dans ces causeries !
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-150"
          >
            {cancelText}
          </button>

          {/* ⭐ v2.9n : Bouton "Retirer du moment seulement" (si cross-refs détectées) */}
          {showRemoveOnlyButton && onRemoveOnly && (
            <button
              onClick={() => {
                onRemoveOnly();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800 border border-blue-300 dark:border-blue-700 rounded-lg transition-colors duration-150"
              title="Retirer du moment sans supprimer les fichiers Drive"
            >
              Retirer du moment seulement
            </button>
          )}

          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-150"
            disabled={crossRefsWarnings && crossRefsWarnings.length > 0 && cascadeOptions?.deleteFiles}
            title={crossRefsWarnings && crossRefsWarnings.length > 0 && cascadeOptions?.deleteFiles ? 'Suppression bloquée : photos utilisées ailleurs' : ''}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
