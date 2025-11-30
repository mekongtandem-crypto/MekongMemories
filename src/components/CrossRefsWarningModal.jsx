/**
 * CrossRefsWarningModal.jsx v2.9w - MODAL 2 : "Photos utilisées ailleurs"
 * ✅ Affiche cross-références cliquables
 * ✅ Navigation mémorisée vers moments/sessions
 * ✅ Actualisation dynamique après retour
 * ✅ Bouton "Supprimer du Drive" grisé si cross-refs, rouge si nettoyé
 * ✅ Instructions dépliables (CollapsibleHelp)
 * ✅ Dark mode support
 */
import React from 'react';
import { X, AlertTriangle, Calendar, MessageCircle, ExternalLink } from 'lucide-react';
import CollapsibleHelp from './CollapsibleHelp.jsx';

export default function CrossRefsWarningModal({
  isOpen,
  onClose,
  itemName,
  itemType = 'élément',
  crossRefsWarnings = [],  // Liste actualisée dynamiquement
  onConfirmMemoryOnly,     // "Laisser sur Drive" → Suppression mémoire seulement
  onConfirmWithDrive,      // "Supprimer du Drive" → Suppression complète (si plus de cross-refs)
  onNavigateToMoment,      // Navigation vers moment avec mémorisation
  onNavigateToSession      // Navigation vers session avec mémorisation
}) {
  if (!isOpen) return null;

  // Détection cross-refs actuels
  const hasCrossRefs = crossRefsWarnings && crossRefsWarnings.length > 0 &&
    (crossRefsWarnings.some(w => (w.crossRefs && w.crossRefs.length > 0) || (w.sessionRefs && w.sessionRefs.length > 0)));

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10001 }}  // Plus haut que Modal 1
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {hasCrossRefs ? 'Photos utilisées ailleurs' : 'Nettoyage terminé'}
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
          {hasCrossRefs ? (
            <>
              {/* Message d'information neutre - sans cadre */}
              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Les photos que vous voulez supprimer du cloud, sont encore utilisées dans d'autres souvenirs ou causeries.
                  Vous devez d'abord supprimer ces références suivantes :
                </p>
              </div>

              {/* Liste cross-refs cliquables */}
              <div className="space-y-3">
                {/* Cross-refs moments (rouge) */}
                {crossRefsWarnings.some(w => w.crossRefs && w.crossRefs.length > 0) && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      UTILISÉ DANS D'AUTRES MOMENTS
                    </p>
                    <div className="space-y-2 ml-4">
                      {crossRefsWarnings.filter(w => w.crossRefs && w.crossRefs.length > 0).map((warning, idx) => (
                        <div key={idx} className="text-xs">
                          <p className="font-semibold text-red-900 dark:text-red-200">
                            {warning.filename || warning.photoId?.substring(0, 30) + '...'}
                          </p>
                          <div className="ml-3 mt-1 space-y-0.5">
                            {warning.crossRefs.map((ref, refIdx) => (
                              <p
                                key={refIdx}
                                onClick={() => {
                                  if (onNavigateToMoment) {
                                    onNavigateToMoment(ref.momentId);
                                  }
                                }}
                                className="text-red-700 dark:text-red-300 flex items-center cursor-pointer hover:underline hover:text-red-900 dark:hover:text-red-100 transition-colors"
                                title="Cliquer pour aller au moment"
                              >
                                → {ref.momentTitle} ({ref.momentDate})
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cross-refs causeries (orange) */}
                {crossRefsWarnings.some(w => w.sessionRefs && w.sessionRefs.length > 0) && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg">
                    <p className="text-sm font-bold text-orange-900 dark:text-orange-200 mb-2 flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      UTILISÉ DANS DES CAUSERIES
                    </p>
                    <div className="space-y-2 ml-4">
                      {crossRefsWarnings.filter(w => w.sessionRefs && w.sessionRefs.length > 0).map((warning, idx) => (
                        <div key={idx} className="text-xs">
                          <p className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                            {warning.filename || warning.photoId?.substring(0, 30) + '...'}
                          </p>
                          <div className="ml-3 space-y-2">
                            {warning.sessionRefs.map((ref, refIdx) => {
                              // ⭐ v2.9w6+ : Extraire début du message (max 50 chars)
                              const messagePreview = ref.messageContent
                                ? ref.messageContent.substring(0, 50) + (ref.messageContent.length > 50 ? '...' : '')
                                : '';

                              return (
                                <div
                                  key={refIdx}
                                  onClick={() => {
                                    if (onNavigateToSession) {
                                      onNavigateToSession(ref.sessionId, ref.messageId);
                                    }
                                  }}
                                  className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 p-2 rounded transition-colors"
                                >
                                  <p className="text-orange-900 dark:text-orange-100 text-sm font-semibold leading-relaxed hover:underline flex items-start"
                                     title="Cliquer pour aller à la causerie">
                                    <MessageCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>
                                      {ref.sessionTitle} : <span className="italic font-normal text-orange-800 dark:text-orange-200">{messagePreview}</span> <span className="font-normal text-xs">({ref.messageAuthor}, {new Date(ref.messageDate).toLocaleDateString('fr-FR')})</span>
                                    </span>
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {/* Instructions dépliables */}
              <div className="mt-4">
                <CollapsibleHelp defaultOpen={false}>
                  <p className="font-medium mb-2">Instructions :</p>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>Cliquez sur les liens ci-dessus</strong> pour visiter les moments/causeries</li>
                    <li>• <strong>Supprimez les photos</strong> dans ces autres souvenirs</li>
                    <li>• <strong>Revenez ici</strong> via le bouton "← Souvenirs" (les liens seront actualisés)</li>
                    <li>• Quand tous les liens sont supprimés, le bouton rouge sera actif</li>
                  </ul>
                </CollapsibleHelp>
              </div>
            </>
          ) : (
            <>
              {/* Message succès - Plus de cross-refs */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg mb-4">
                <p className="text-sm font-bold text-green-900 dark:text-green-200 mb-2">
                  Toutes les références ont été supprimées
                </p>
                <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
                  Vous pouvez maintenant supprimer les fichiers physiques du cloud en toute sécurité.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer - Boutons adaptatifs */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {/* ⭐ v2.9t : Bouton Annuler tout (ferme modal sans action) */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors duration-150"
            title="Fermer sans action"
          >
            Annuler tout
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onConfirmMemoryOnly();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150"
              title="Supprime de la mémoire, garde les photos sur Drive"
            >
              Laisser sur Drive
            </button>

            <button
              onClick={() => {
                if (!hasCrossRefs) {
                  onConfirmWithDrive();
                  onClose();
                }
              }}
              disabled={hasCrossRefs}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-150 ${
                hasCrossRefs
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={hasCrossRefs ? "Désactivé : supprimez d'abord les références ci-dessus" : "Supprime aussi les fichiers du cloud"}
            >
              Supprimer du Drive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
