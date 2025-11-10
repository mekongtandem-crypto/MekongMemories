/**
 * SessionListModal.jsx v1.1 - Dark mode + Design compact
 * ✅ Support dark mode complet
 * ✅ Titre compact : "n sessions liées à..." sur 2-3 lignes max
 * ✅ Ne couvre pas tout l'écran (max-h-[70vh])
 * ✅ Transitions 150ms
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

      {/* Modal - ✅ Ne couvre pas tout l'écran */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ✅ Header compact avec titre sur 2-3 lignes */}
          <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {sessions.length} session{sessions.length > 1 ? 's' : ''} liée{sessions.length > 1 ? 's' : ''} à :
                </h3>
              </div>
              {/* ✅ Titre du contenu avec line-clamp pour 2-3 lignes max */}
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium line-clamp-2 ml-7">
                {contentTitle}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  if (window.createSessionFromModal) {
                    window.createSessionFromModal();
                  }
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors duration-150 flex items-center gap-1"
                title="Créer nouvelle session"
              >
                <span>➕</span>
                <span className="hidden sm:inline">Nouvelle</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Liste sessions */}
          <div className="flex-1 overflow-y-auto p-3">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
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
                      className="w-full text-left p-3 bg-white dark:bg-gray-900 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 rounded-lg transition-colors duration-150"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {session.gameTitle}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
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