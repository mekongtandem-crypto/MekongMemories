/**
 * DeleteRequestMessage.jsx v2.24 - Message système demande suppression
 * ✅ Affiche demande de suppression avec boutons Accept/Reject
 * ✅ Visible uniquement pour l'autre user (pas le demandeur)
 * ✅ Design avec fond rouge pour distinction
 * ✅ Toast feedback sur refus
 * ✅ Identique à ArchiveRequestMessage mais pour suppression
 */
import React, { useState } from 'react';
import { Trash2, Check, X } from 'lucide-react';
import { useAppState } from '../hooks/useAppState.js';
import { userManager } from '../core/UserManager.js';
import { dataManager } from '../core/dataManager.js';
import Toast from './Toast.jsx';

export default function DeleteRequestMessage({ deleteRequest, sessionId }) {
  const app = useAppState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const requester = userManager.getUser(deleteRequest.requestedBy);
  const requesterStyle = userManager.getUserStyle(deleteRequest.requestedBy);

  const handleAccept = async () => {
    setIsProcessing(true);
    dataManager.setLoadingOperation(true, 'Suppression de la session...', 'Enregistrement sur Google Drive', 'monkey');

    try {
      const result = await app.acceptDeleteRequest(sessionId);
      dataManager.setLoadingOperation(false);

      if (result.success) {
        // Retour automatique vers SessionsPage
        dataManager.updateState({
          currentPage: 'sessions',
          currentChatSession: null
        });
      }
    } catch (error) {
      console.error('❌ Erreur acceptation suppression:', error);
      dataManager.setLoadingOperation(false);
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    dataManager.setLoadingOperation(true, 'Refus de la demande...', 'Enregistrement sur Google Drive', 'monkey');

    try {
      const result = await app.rejectDeleteRequest(sessionId);
      dataManager.setLoadingOperation(false);
      setIsProcessing(false);

      if (result.success) {
        const requesterName = requester?.name || deleteRequest.requestedBy;
        setToast({
          message: `Demande de ${requesterName} refusée`,
          variant: 'info'
        });
      }
    } catch (error) {
      console.error('❌ Erreur refus suppression:', error);
      dataManager.setLoadingOperation(false);
      setIsProcessing(false);
      setToast({
        message: 'Erreur lors du refus',
        variant: 'error'
      });
    }
  };

  return (
    <div className="flex justify-center my-6">
      <div className="max-w-md w-full bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-600 rounded-lg p-4 shadow-md">
        {/* En-tête avec icône */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Demande de suppression
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {new Date(deleteRequest.requestedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          <span
            className="font-semibold"
            style={{ color: requesterStyle?.textColor }}
          >
            {requester?.name || deleteRequest.requestedBy}
          </span>
          {' '}a demandé à supprimer cette session.
        </p>

        {/* Boutons d'action */}
        <div className="flex space-x-3">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>Accepter</span>
          </button>

          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            <span>Refuser</span>
          </button>
        </div>
      </div>

      {/* Toast feedback */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}
    </div>
  );
}
