/**
 * CrossRefsWarningModal.jsx v2.9p - Modal d'avertissement cross-références
 * ⚠️ Affiché quand une photo/post est utilisé(e) ailleurs
 * ✅ Liste des moments et causeries (info seulement)
 * 🔵 Option "Retirer seulement" (sûre)
 */
import React from 'react';
import { X, AlertTriangle, MessageCircle, Calendar } from 'lucide-react';

export default function CrossRefsWarningModal({
  isOpen,
  onClose,
  itemType = 'photo',  // 'photo' | 'post'
  itemName = '',
  crossRefs = [],      // Références dans d'autres moments
  sessionRefs = [],    // Références dans des causeries
  onRemoveOnly         // Handler pour retirer sans supprimer Drive
}) {
  if (!isOpen) return null;

  const hasCrossRefs = crossRefs.length > 0 || sessionRefs.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 text-orange-500" />
            ⚠️ {itemType === 'photo' ? 'Photo' : 'Post'} utilisé{itemType === 'photo' ? 'e' : ''} ailleurs
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Intro */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
            <p className="text-sm text-orange-900 dark:text-orange-200 font-medium">
              📸 "{itemName || 'Cet élément'}" est référencé{itemType === 'photo' ? 'e' : ''} dans d'autres endroits de vos souvenirs.
            </p>
            <p className="text-xs text-orange-800 dark:text-orange-300 mt-2">
              ℹ️ Pour supprimer du Google Drive, vous devez d'abord nettoyer toutes les références ci-dessous.
            </p>
          </div>

          {/* Section Moments */}
          {crossRefs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-red-500" />
                🗂️ Utilisé{itemType === 'photo' ? 'e' : ''} dans {crossRefs.length} autre{crossRefs.length > 1 ? 's' : ''} moment{crossRefs.length > 1 ? 's' : ''} :
              </h3>
              <div className="space-y-2 ml-6">
                {crossRefs.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
                  >
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                      • {ref.momentTitle}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {ref.momentDate}
                      {ref.postTitle && (
                        <span className="ml-2 italic">→ dans le post "{ref.postTitle}"</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-800 dark:text-red-300 mt-3 italic">
                ⚠️ Supprimer du Drive cassera ces moments !
              </p>
            </div>
          )}

          {/* Section Causeries */}
          {sessionRefs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <MessageCircle className="w-4 h-4 mr-2 text-purple-500" />
                💬 Utilisé{itemType === 'photo' ? 'e' : ''} dans {sessionRefs.length} causerie{sessionRefs.length > 1 ? 's' : ''} :
              </h3>
              <div className="space-y-2 ml-6">
                {sessionRefs.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg"
                  >
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                      • "{ref.sessionTitle}"
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      Message de <span className="font-semibold">{ref.messageAuthor}</span> le{' '}
                      {new Date(ref.messageDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-800 dark:text-purple-300 mt-3 italic">
                ⚠️ Supprimer du Drive empêchera l'affichage dans ces causeries !
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Annuler
          </button>

          {onRemoveOnly && (
            <button
              onClick={() => {
                onRemoveOnly();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg"
              title="Retirer de ce moment uniquement (sans supprimer du Drive)"
            >
              🔵 Retirer du moment seulement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
