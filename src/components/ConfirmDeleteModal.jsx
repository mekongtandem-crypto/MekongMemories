/**
 * ConfirmDeleteModal.jsx v2.9q - Modal de confirmation de suppression unifié
 * ✅ Modal générique pour Moment / Note / Photo
 * ✅ Dark mode support
 * ✅ Scrollbar automatique (max-height 90vh)
 * ✅ Checkboxes intégrées pour cascade
 * ✅ Warnings cross-références intégrés (pas de modal séparé)
 * ✅ Boutons adaptatifs selon cross-refs
 * ✅ v2.9q : Double confirmation "Supprimer PARTOUT"
 * ✅ v2.9q : Cross-refs cliquables avec navigation
 */
import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileEdit, Camera, Info, Calendar, MessageCircle, ExternalLink } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer la suppression',
  message = 'Êtes-vous sûr de vouloir supprimer cet élément ?',
  itemName = null,
  itemType = 'élément',  // 'moment' | 'post' | 'photo'
  itemIcon = null,  // ⭐ v2.9p : Icône de l'élément
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  // Options pour suppression photos simples
  showDriveOption = false,
  deleteFromDrive = false,
  onToggleDriveOption = null,
  // Options pour suppression en cascade
  childrenDetails = null,
  cascadeOptions = null,
  onToggleCascadeOption = null,
  // ⭐ v2.9p : Cross-refs warnings intégrés
  crossRefsWarnings = null,
  // eslint-disable-next-line no-unused-vars
  showRemoveOnlyButton = false,  // Accepté pour compatibilité (auto-détecté via hasCrossRefs)
  onRemoveOnly = null,
  // ⭐ v2.9q : Nouvelles props pour suppression globale et navigation
  onCleanEverywhere = null,  // Callback pour "Supprimer PARTOUT"
  onNavigateToMoment = null,  // Callback navigation vers moment
  onNavigateToSession = null  // Callback navigation vers session
}) {
  // ⭐ v2.9q : État double confirmation
  const [confirmCleanEverywhere, setConfirmCleanEverywhere] = useState(false);

  // Réinitialiser à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setConfirmCleanEverywhere(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ⭐ v2.9p : Détection automatique des cross-refs
  const hasCrossRefs = crossRefsWarnings && crossRefsWarnings.length > 0 &&
    (crossRefsWarnings.some(w => (w.crossRefs && w.crossRefs.length > 0) || (w.sessionRefs && w.sessionRefs.length > 0)));

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
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {message}
          </p>

          {/* ⭐ v2.9p : Élément à supprimer avec icône */}
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

          {/* ⭐ v2.9p : Warnings cross-références (moments + causeries) */}
          {crossRefsWarnings && crossRefsWarnings.length > 0 && (
            <div className="mt-4 space-y-3">
              {/* Warning moments (rouge) */}
              {crossRefsWarnings.some(w => w.crossRefs && w.crossRefs.length > 0) && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    ⚠️ UTILISÉ DANS D'AUTRES MOMENTS
                  </p>
                  <div className="space-y-2 ml-4">
                    {crossRefsWarnings.filter(w => w.crossRefs && w.crossRefs.length > 0).map((warning, idx) => (
                      <div key={idx} className="text-xs">
                        <p className="font-semibold text-red-900 dark:text-red-200">
                          📸 {warning.filename || warning.photoId?.substring(0, 30) + '...'}
                        </p>
                        <div className="ml-3 mt-1 space-y-0.5">
                          {warning.crossRefs.map((ref, refIdx) => (
                            <p
                              key={refIdx}
                              onClick={() => {
                                if (onNavigateToMoment) {
                                  onNavigateToMoment(ref.momentId);
                                  onClose();
                                }
                              }}
                              className={`text-red-700 dark:text-red-300 flex items-center ${onNavigateToMoment ? 'cursor-pointer hover:underline hover:text-red-900 dark:hover:text-red-100' : ''}`}
                              title={onNavigateToMoment ? 'Cliquer pour aller au moment' : ''}
                            >
                              → {ref.momentTitle} ({ref.momentDate})
                              {onNavigateToMoment && <ExternalLink className="w-3 h-3 ml-1" />}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning causeries (orange) */}
              {crossRefsWarnings.some(w => w.sessionRefs && w.sessionRefs.length > 0) && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg">
                  <p className="text-sm font-bold text-orange-900 dark:text-orange-200 mb-2 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    💬 UTILISÉ DANS DES CAUSERIES
                  </p>
                  <div className="space-y-2 ml-4">
                    {crossRefsWarnings.filter(w => w.sessionRefs && w.sessionRefs.length > 0).map((warning, idx) => (
                      <div key={idx} className="text-xs">
                        <p className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                          📸 {warning.filename || warning.photoId?.substring(0, 30) + '...'}
                        </p>
                        <div className="ml-3 space-y-1">
                          {warning.sessionRefs.map((ref, refIdx) => (
                            <div
                              key={refIdx}
                              onClick={() => {
                                if (onNavigateToSession) {
                                  onNavigateToSession(ref.sessionId);
                                  onClose();
                                }
                              }}
                              className={onNavigateToSession ? 'cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 p-1 rounded transition-colors' : ''}
                            >
                              <p className={`text-orange-800 dark:text-orange-300 font-medium flex items-center ${onNavigateToSession ? 'hover:underline' : ''}`}
                                 title={onNavigateToSession ? 'Cliquer pour aller à la causerie' : ''}>
                                → "{ref.sessionTitle}"
                                {onNavigateToSession && <ExternalLink className="w-3 h-3 ml-1" />}
                              </p>
                              <p className="text-xs text-orange-700 dark:text-orange-400 ml-3">
                                Message de {ref.messageAuthor}, {new Date(ref.messageDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ⭐ v2.9q : Double confirmation si cross-refs + deleteFiles (ou cascade deleteFiles) */}
          {hasCrossRefs && (cascadeOptions?.deleteFiles || deleteFromDrive) && onCleanEverywhere && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-600 rounded-lg">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmCleanEverywhere}
                  onChange={(e) => setConfirmCleanEverywhere(e.target.checked)}
                  className="mt-1 w-5 h-5 text-red-600 border-red-400 rounded focus:ring-red-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900 dark:text-red-100 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    ⚠️ JE VEUX SUPPRIMER CETTE PHOTO DE PARTOUT
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-200 mt-2 leading-relaxed">
                    Cette action va supprimer la photo de :
                  </p>
                  <ul className="text-xs text-red-800 dark:text-red-200 mt-1 ml-4 space-y-0.5">
                    {crossRefsWarnings.some(w => w.crossRefs?.length > 0) && (
                      <li>
                        • <strong>
                          {crossRefsWarnings.filter(w => w.crossRefs?.length > 0)
                            .reduce((sum, w) => sum + w.crossRefs.length, 0)} moment(s)
                        </strong>
                      </li>
                    )}
                    {crossRefsWarnings.some(w => w.sessionRefs?.length > 0) && (
                      <li>
                        • <strong>
                          {crossRefsWarnings.filter(w => w.sessionRefs?.length > 0)
                            .reduce((sum, w) => sum + w.sessionRefs.length, 0)} causerie(s)
                        </strong>
                      </li>
                    )}
                    <li>• <strong>Fichier cloud</strong> (suppression définitive)</li>
                  </ul>
                  <p className="text-xs text-red-800 dark:text-red-200 mt-2 font-semibold">
                    ⚠️ Cette action est IRRÉVERSIBLE
                  </p>
                </div>
              </label>
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
        </div>

        {/* Footer - ⭐ v2.9q : Adaptatif selon cross-refs avec "Supprimer PARTOUT" */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-150"
          >
            {cancelText}
          </button>

          {/* ⭐ v2.9q : Logique boutons selon contexte */}
          {hasCrossRefs && (cascadeOptions?.deleteFiles || deleteFromDrive) && onCleanEverywhere ? (
            // Scénario 3 : Cross-refs + deleteFiles → Bouton "Supprimer PARTOUT" avec double confirmation
            <button
              onClick={() => {
                if (confirmCleanEverywhere) {
                  onCleanEverywhere();
                  onClose();
                }
              }}
              disabled={!confirmCleanEverywhere}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 ${
                confirmCleanEverywhere
                  ? 'bg-red-700 hover:bg-red-800 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
              title={!confirmCleanEverywhere ? 'Cochez la case ci-dessus pour activer' : 'Supprimer de partout (irréversible)'}
            >
              🔴 Supprimer PARTOUT
            </button>
          ) : hasCrossRefs && onRemoveOnly ? (
            // Scénario 2 : Cross-refs MAIS pas deleteFiles → Bouton "Retirer" safe
            <button
              onClick={() => {
                onRemoveOnly();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150"
              title="Retirer de la mémoire sans supprimer du cloud (action sûre)"
            >
              🔵 Retirer du moment
            </button>
          ) : (
            // Scénario 1 : Pas de cross-refs → Bouton "Supprimer" normal
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-150"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
