/**
 * SuggestionsModal.jsx - Modal pour créer sessions depuis moments
 * ✅ Accessible via badge TopBar ✨
 * ✅ 3 modes de tri (Contenu/Chrono/Random)
 */
import React, { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, Calendar, Shuffle } from 'lucide-react';
import { useAppState } from '../hooks/useAppState.js';
import { suggestUnexploredMoments, SUGGESTION_MODES } from '../utils/sessionUtils.js';

export default function SuggestionsModal({ isOpen, onClose, onCreateSession }) {
  const app = useAppState();
  
  const [suggestionMode, setSuggestionMode] = useState(() => {
    return localStorage.getItem(`mekong_suggestionMode_${app.currentUser}`) || SUGGESTION_MODES.CONTENT;
  });
  
  // Sauvegarder mode
  useEffect(() => {
    localStorage.setItem(`mekong_suggestionMode_${app.currentUser}`, suggestionMode);
  }, [suggestionMode, app.currentUser]);
  
  if (!isOpen) return null;
  
  const unexploredMoments = (app.masterIndex?.moments?.length || 0) - new Set(app.sessions?.map(s => s.gameId)).size;
  const suggestions = suggestUnexploredMoments(app.masterIndex, app.sessions, suggestionMode, 12);
  
  const handleCreateAndClose = async (moment) => {
    await onCreateSession(moment);
    onClose();
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Créer une session</h2>
              <p className="text-sm text-gray-600">{unexploredMoments} moment{unexploredMoments > 1 ? 's' : ''} à explorer</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Modes de tri */}
        <div className="flex items-center justify-center space-x-2 p-4 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => setSuggestionMode(SUGGESTION_MODES.CONTENT)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              suggestionMode === SUGGESTION_MODES.CONTENT
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Plus de contenu</span>
          </button>
          
          <button
            onClick={() => setSuggestionMode(SUGGESTION_MODES.CHRONO)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              suggestionMode === SUGGESTION_MODES.CHRONO
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Chronologique</span>
          </button>
          
          <button
            onClick={() => {
              setSuggestionMode(SUGGESTION_MODES.RANDOM);
              setTimeout(() => setSuggestionMode(SUGGESTION_MODES.CONTENT), 100);
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            <span>Aléatoire</span>
          </button>
        </div>
        
        {/* Grid suggestions */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
          {suggestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tous les moments explorés !
              </h3>
              <p className="text-gray-600">
                Vous avez créé des sessions pour tous les moments du voyage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map(moment => (
                <MomentCard 
                  key={moment.id}
                  moment={moment}
                  onCreateSession={handleCreateAndClose}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            Cliquez sur un moment pour créer une session de conversation
          </p>
        </div>
        
      </div>
    </div>
  );
}

function MomentCard({ moment, onCreateSession }) {
  return (
    <button
      onClick={() => onCreateSession(moment)}
      className="bg-white border-2 border-gray-200 hover:border-purple-400 rounded-lg p-4 transition-all hover:shadow-lg text-left group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">
          {moment.displaySubtitle || `J${moment.dayStart}`}
        </span>
        <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
        {moment.title || moment.displayTitle}
      </h3>
      
      {moment.location && (
        <p className="text-xs text-gray-500 mb-3 truncate">
          📍 {moment.location}
        </p>
      )}
      
      <div className="flex items-center space-x-3 text-xs text-gray-600">
        {moment.dayPhotos?.length > 0 && (
          <span className="flex items-center space-x-1">
            <span>📸</span>
            <span>{moment.dayPhotos.length}</span>
          </span>
        )}
        {moment.posts?.length > 0 && (
          <span className="flex items-center space-x-1">
            <span>📝</span>
            <span>{moment.posts.length}</span>
          </span>
        )}
        {(moment.dayPhotos?.length === 0 && moment.posts?.length === 0) && (
          <span className="text-gray-400 italic">À découvrir</span>
        )}
      </div>
    </button>
  );
}