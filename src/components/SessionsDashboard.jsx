/**
 * SessionsDashboard.jsx v3.0 - Option A+ niveau 3
 * ✅ 1 volet Activité avec toggle À traiter/Historique
 * ✅ Suggestions ultra-compactes
 * ✅ Design épuré
 */
import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState.js';
import { 
  getActivitySinceLastVisit,
  suggestUnexploredMoments,
  SUGGESTION_MODES,
  formatRelativeTime
} from '../utils/sessionUtils.js';
import { 
  Zap, Clock, Sparkles, Calendar, Shuffle, ChevronDown
} from 'lucide-react';

export default function SessionsDashboard({ sessions, onCreateSession, onOpenSession }) {
  const app = useAppState();
  
  // États
  const [activityMode, setActivityMode] = useState(() => {
    return localStorage.getItem(`mekong_activityMode_${app.currentUser}`) || 'pending';
  });
  
  const [isActivityOpen, setIsActivityOpen] = useState(true);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  
  const [lastVisit, setLastVisit] = useState(null);
  const [suggestionMode, setSuggestionMode] = useState(() => {
    return localStorage.getItem(`mekong_suggestionMode_${app.currentUser}`) || SUGGESTION_MODES.CONTENT;
  });
  
  // Charger dernière visite
  useEffect(() => {
    const saved = localStorage.getItem(`mekong_lastVisit_${app.currentUser}`);
    if (saved) {
      setLastVisit(saved);
    }
    
    const now = new Date().toISOString();
    localStorage.setItem(`mekong_lastVisit_${app.currentUser}`, now);
  }, [app.currentUser]);
  
  // Sauvegarder préférences
  useEffect(() => {
    localStorage.setItem(`mekong_activityMode_${app.currentUser}`, activityMode);
  }, [activityMode, app.currentUser]);
  
  useEffect(() => {
    localStorage.setItem(`mekong_suggestionMode_${app.currentUser}`, suggestionMode);
  }, [suggestionMode, app.currentUser]);
  
  // Calculs
  const activity = lastVisit ? getActivitySinceLastVisit(sessions, app.currentUser, lastVisit) : null;
  const suggestions = suggestUnexploredMoments(app.masterIndex, sessions, suggestionMode, 5);
  
  // Sessions à traiter
  const pendingSessions = sessions
    .map(s => {
      const lastMsg = s.notes?.[s.notes.length - 1];
      const isPendingYou = lastMsg && lastMsg.author !== app.currentUser;
      const daysSince = lastMsg ? (Date.now() - new Date(lastMsg.timestamp)) / (1000*60*60*24) : 0;
      const isUrgent = isPendingYou && daysSince > 7;
      return { ...s, isPendingYou, isUrgent, daysSince };
    })
    .filter(s => s.isPendingYou)
    .sort((a, b) => b.isUrgent - a.isUrgent || b.daysSince - a.daysSince)
    .slice(0, 5);
  
  const totalPending = sessions.filter(s => {
    const lastMsg = s.notes?.[s.notes.length - 1];
    return lastMsg && lastMsg.author !== app.currentUser;
  }).length;
  
  const urgentCount = pendingSessions.filter(s => s.isUrgent).length;
  
  const unexploredMoments = (app.masterIndex?.moments?.length || 0) - new Set(sessions.map(s => s.gameId)).size;
  
  return (
    <div className="space-y-3 mb-6">
      
      {/* VOLET ACTIVITÉ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        
        {/* Header */}
        <button
          onClick={() => setIsActivityOpen(!isActivityOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 flex items-center space-x-2">
                <span>Activité</span>
                {totalPending > 0 && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {totalPending}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {activityMode === 'pending' ? 'Sessions en attente' : `Depuis ${formatRelativeTime(lastVisit)}`}
              </div>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isActivityOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Contenu */}
        {isActivityOpen && (
          <div className="border-t border-gray-200">
            
            {/* Toggle mode */}
            <div className="flex p-2 bg-gray-50 border-b border-gray-200">
              <button
                onClick={() => setActivityMode('pending')}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activityMode === 'pending'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>À traiter</span>
                {totalPending > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    {totalPending}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActivityMode('history')}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activityMode === 'history'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Historique</span>
                {activity && (activity.newSessions.length + activity.newMessages.length) > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                    {activity.newSessions.length + activity.newMessages.length}
                  </span>
                )}
              </button>
            </div>
            
            {/* Contenu selon mode */}
            <div className="p-4">
              
              {activityMode === 'pending' ? (
                // MODE À TRAITER
                totalPending === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-sm">Aucune session en attente</p>
                    <p className="text-xs mt-1">Toutes vos sessions sont à jour !</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {urgentCount > 0 && (
                      <div className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full inline-block mb-2">
                        🔥 {urgentCount} urgent{urgentCount > 1 ? 's' : ''} (plus de 7 jours)
                      </div>
                    )}
                    
                    {pendingSessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => onOpenSession(session)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                          session.isUrgent
                            ? 'bg-orange-50 border-orange-300 hover:border-orange-400'
                            : 'bg-white border-gray-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate mb-1">
                              {session.gameTitle}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center space-x-2">
                              <span>
                                {session.daysSince < 1 
                                  ? "Aujourd'hui" 
                                  : `Il y a ${Math.floor(session.daysSince)} jour${Math.floor(session.daysSince) > 1 ? 's' : ''}`
                                }
                              </span>
                              <span>•</span>
                              <span>{session.notes?.length || 0} messages</span>
                            </div>
                          </div>
                          <span className="text-xl ml-2">
                            {session.isUrgent ? '🔴' : '🟡'}
                          </span>
                        </div>
                      </button>
                    ))}
                    
                    {pendingSessions.length < totalPending && (
                      <div className="text-xs text-center text-gray-500 pt-2">
                        + {totalPending - pendingSessions.length} autres sessions
                      </div>
                    )}
                  </div>
                )
              ) : (
                // MODE HISTORIQUE
                activity && (activity.newSessions.length > 0 || activity.newMessages.length > 0) ? (
                  <div className="space-y-2">
                    {activity.newMessages.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start space-x-2 bg-blue-50 rounded-lg p-3 border border-blue-100"
                      >
                        <span className="text-blue-600 mt-0.5 text-lg">💬</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-blue-900">
                            <span className="font-medium">{getUserName(item.session.notes[item.session.notes.length - 1].author)}</span>
                            {' '}a répondu dans{' '}
                            <button
                              onClick={() => onOpenSession(item.session)}
                              className="font-medium hover:underline"
                            >
                              "{item.session.gameTitle}"
                            </button>
                            {item.newCount > 1 && ` (${item.newCount} messages)`}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {activity.newSessions.length > 0 && (
                      <div className="flex items-start space-x-2 bg-green-50 rounded-lg p-3 border border-green-100">
                        <span className="text-green-600 mt-0.5 text-lg">✨</span>
                        <span className="text-sm text-green-900">
                          <span className="font-medium">{activity.newSessions.length}</span>
                          {' '}nouvelle{activity.newSessions.length > 1 ? 's' : ''} session{activity.newSessions.length > 1 ? 's' : ''} créée{activity.newSessions.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-sm">Aucune nouvelle activité</p>
                    <p className="text-xs mt-1">depuis votre dernière visite</p>
                  </div>
                )
              )}
              
            </div>
          </div>
        )}
      </div>
      
      {/* SUGGESTIONS COMPACTES */}
      {unexploredMoments > 0 && suggestions.length > 0 && (
        <div id="suggestions-section" className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          
          {/* Header compact */}
          <button
            onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-gray-900 text-sm">
                Moments à explorer
              </span>
              <span className="text-xs text-gray-500">
                ({unexploredMoments})
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Dropdown tri */}
              <select
                value={suggestionMode}
                onChange={(e) => {
                  e.stopPropagation();
                  setSuggestionMode(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500"
              >
                <option value={SUGGESTION_MODES.CONTENT}>Tri: Contenu</option>
                <option value={SUGGESTION_MODES.CHRONO}>Tri: Chronologique</option>
              </select>
              
              {/* Bouton random */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSuggestionMode(SUGGESTION_MODES.RANDOM);
                  setTimeout(() => setSuggestionMode(SUGGESTION_MODES.CONTENT), 100);
                }}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Aléatoire"
              >
                <Shuffle className="w-3.5 h-3.5 text-gray-600" />
              </button>
              
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSuggestionsOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
          
          {/* Contenu */}
          {isSuggestionsOpen && (
            <div className="border-t border-gray-200 p-3">
              <div className="space-y-2">
                {suggestions.map(moment => (
                  <div 
                    key={moment.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                          {moment.displaySubtitle || `J${moment.dayStart}`}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {moment.title || moment.displayTitle}
                        </span>
                      </div>
                      
                      {(moment.dayPhotos?.length > 0 || moment.posts?.length > 0) && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                          {moment.dayPhotos?.length > 0 && <span>📸 {moment.dayPhotos.length}</span>}
                          {moment.posts?.length > 0 && <span>📝 {moment.posts.length}</span>}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => onCreateSession(moment, moment)}
                      className="ml-2 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Créer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}

function getUserName(userId) {
  const names = {
    'lambert': 'Lambert',
    'tom': 'Tom',
    'duo': 'Duo'
  };
  return names[userId] || userId;
}