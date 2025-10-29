/**
 * SessionListModal.jsx - Phase 19D
 * Liste sessions liées à un contenu
 */

import React from 'react';
import { X, MessageCircle, Calendar } from 'lucide-react';
import { getOriginIcon, formatOriginTitle } from '../utils/sessionUtils.js';
import { userManager } from '../core/UserManager.js';

export default function SessionListModal({ 
  isOpen, 
  onClose, 
  sessions,
  contentTitle,
  onSelectSession 
}) {
  if (!isOpen) return null;

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">
                Sessions ({sessions.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
            
            {/* AJOUTER ce bouton */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClose();
        // Callback pour créer nouvelle session
        if (window.createSessionFromModal) {
          window.createSessionFromModal();
        }
      }}
      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
      title="Créer nouvelle session"
    >
      <span>➕</span>
      <span>Créer</span>
    </button>
    <button
      onClick={onClose}
      className="p-1 hover:bg-gray-100 rounded transition-colors"
    >
      <X className="w-5 h-5 text-gray-600" />
    </button>

            
            
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  if (window.createSessionFromModal) {
                    window.createSessionFromModal();
                  }
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                title="Créer nouvelle session"
              >
                <span>➕</span>
                <span className="hidden sm:inline">Créer</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Contenu origine */}
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">
              Sessions liées à : <span className="font-medium text-gray-900">{contentTitle}</span>
            </p>
          </div>

          {/* Liste sessions */}
          <div className="flex-1 overflow-y-auto p-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune session</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map(session => {
                  const messageCount = session.notes?.length || 0;
                  const creator = userManager.getUser(session.user)?.name || 'N/A';
                  
                  return (
                    <button
                      key={session.id}
                      onClick={() => onSelectSession(session)}
                      className="w-full text-left p-3 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {session.gameTitle}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {messageCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(session.createdAt)}
                            </span>
                            <span>par {creator}</span>
                          </div>
                        </div>
                        <div className="text-2xl">
                          💬
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}