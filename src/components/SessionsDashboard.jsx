/**
 * SessionsDashboard.jsx v2.0 - Sections dépliables
 * ✅ Volets avec mémorisation état
 * ✅ Ordre : À traiter → Suggestions → Stats
 */
import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState.js';
import { 
  calculateSessionStats, 
  getActivitySinceLastVisit,
  suggestUnexploredMoments,
  SUGGESTION_MODES,
  formatRelativeTime,
  SESSION_STATUS
} from '../utils/sessionUtils.js';
import { 
  Target, AlertCircle, CheckCircle, MessageCircle, 
  Bell, Sparkles, TrendingUp, Calendar, Shuffle, ChevronDown
} from 'lucide-react';

export default function SessionsDashboard({ sessions, onCreateSession, onOpenSession }) {
  const app = useAppState();
  
  // États volets avec mémorisation
  const [openSections, setOpenSections] = useState(() => {
    const saved = localStorage.getItem(`mekong_dashboardSections_${app.currentUser}`);
    return saved ? JSON.parse(saved) : {
      pending: true,      // À traiter - ouvert par défaut
      suggestions: true,  // Suggestions - ouvert par défaut
      stats: false,       // Stats - fermé par défaut
      activity: true      // Activité - ouvert par défaut
    };
  });
  
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
  
  // Sauvegarder état volets
  useEffect(() => {
    localStorage.setItem(`mekong_dashboardSections_${app.currentUser}`, JSON.stringify(openSections));
  }, [openSections, app.currentUser]);
  
  // Sauvegarder mode suggestions
  useEffect(() => {
    localStorage.setItem(`mekong_suggestionMode_${app.currentUser}`, suggestionMode);
  }, [suggestionMode, app.currentUser]);
  
  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Calculs
  const stats = calculateSessionStats(sessions, app.currentUser, app.masterIndex);
  const activity = lastVisit ? getActivitySinceLastVisit(sessions, app.currentUser, lastVisit) : null;
  const suggestions = suggestUnexploredMoments(app.masterIndex, sessions, suggestionMode, 5);
  
  // Sessions à traiter (pending_you + stale)
  const pendingSessions = sessions.filter(s => {
    const enriched = { ...s };
    const lastMsg = s.notes?.[s.notes.length - 1];
    const isPendingYou = lastMsg && lastMsg.author !== app.currentUser;
    const daysSince = lastMsg ? (Date.now() - new Date(lastMsg.timestamp)) / (1000*60*60*24) : 0;
    const isStale = isPendingYou && daysSince > 7;
    return isPendingYou || isStale;
  }).slice(0, 5); // Max 5
  
  return (
    <div className="space-y-3 mb-6">
      
      {/* 1. À TRAITER (Priority #1) */}
      {(stats.pendingYou + stats.stale) > 0 && (
        <DashboardSection
          title="À traiter"
          count={stats.pendingYou + stats.stale}
          icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
          isOpen={openSections.pending}
          onToggle={() => toggleSection('pending')}
          color="amber"
          highlight={stats.stale > 0}
        >
          <div className="space-y-2">
            {pendingSessions.map(session => {
              const lastMsg = session.notes?.[session.notes.length - 1];
              const daysSince = lastMsg ? Math.floor((Date.now() - new Date(lastMsg.timestamp)) / (1000*60*60*24)) : 0;
              const isUrgent = daysSince > 7;
              
              return (
                <button
                  key={session.id}
                  onClick={() => onOpenSession(session)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                    isUrgent 
                      ? 'bg-orange-50 border-orange-300 hover:border-orange-400' 
                      : 'bg-white border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {isUrgent && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">URGENT</span>}
                        <span className="font-medium text-gray-900 truncate">{session.gameTitle}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {daysSince === 0 ? "Aujourd'hui" : `Il y a ${daysSince} jour${daysSince > 1 ? 's' : ''}`}
                        {' • '}
                        {session.notes?.length || 0} messages
                      </div>
                    </div>
                    <span className="text-xl ml-2">🟡</span>
                  </div>
                </button>
              );
            })}
            
            {pendingSessions.length < (stats.pendingYou + stats.stale) && (
              <div className="text-xs text-center text-gray-500 pt-2">
                + {(stats.pendingYou + stats.stale) - pendingSessions.length} autres sessions
              </div>
            )}
          </div>
        </DashboardSection>
      )}
      
      {/* 2. SUGGESTIONS MOMENTS (Priority #2) */}
      {stats.unexploredMoments > 0 && suggestions.length > 0 && (
        <DashboardSection
          title="Suggestions"
          subtitle={`${stats.unexploredMoments} moment${stats.unexploredMoments > 1 ? 's' : ''} non exploré${stats.unexploredMoments > 1 ? 's' : ''}`}
          icon={<Sparkles className="w-5 h-5 text-purple-600" />}
          isOpen={openSections.suggestions}
          onToggle={() => toggleSection('suggestions')}
          color="purple"
        >
          {/* Sélecteur mode */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-purple-600">
              {suggestionMode === SUGGESTION_MODES.CONTENT && '📈 Triés par richesse de contenu'}
              {suggestionMode === SUGGESTION_MODES.CHRONO && '📅 Par ordre chronologique du voyage'}
              {suggestionMode === SUGGESTION_MODES.RANDOM && '🎲 Ordre aléatoire pour découvrir'}
            </div>
            
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 border border-purple-200">
              <button
                onClick={() => setSuggestionMode(SUGGESTION_MODES.CONTENT)}
                className={`p-1.5 rounded transition-colors ${
                  suggestionMode === SUGGESTION_MODES.CONTENT 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Par contenu"
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => setSuggestionMode(SUGGESTION_MODES.CHRONO)}
                className={`p-1.5 rounded transition-colors ${
                  suggestionMode === SUGGESTION_MODES.CHRONO 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Chronologique"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => setSuggestionMode(SUGGESTION_MODES.RANDOM)}
                className={`p-1.5 rounded transition-colors ${
                  suggestionMode === SUGGESTION_MODES.RANDOM 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Aléatoire"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {suggestions.map(moment => (
              <div 
                key={moment.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                      {moment.displaySubtitle || `J${moment.dayStart}`}
                    </span>
                    <span className="font-medium text-gray-900 truncate">
                      {moment.title || moment.displayTitle}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1 flex items-center space-x-3">
                    {moment.dayPhotos?.length > 0 && (
                      <span>📸 {moment.dayPhotos.length}</span>
                    )}
                    {moment.posts?.length > 0 && (
                      <span>📝 {moment.posts.length}</span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => onCreateSession(moment, moment)}
                  className="ml-3 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Créer
                </button>
              </div>
            ))}
          </div>
        </DashboardSection>
      )}
      
      {/* 3. ACTIVITÉ RÉCENTE (si existe) */}
      {activity && (activity.newSessions.length > 0 || activity.newMessages.length > 0) && (
        <DashboardSection
          title="Depuis votre dernière visite"
          subtitle={formatRelativeTime(lastVisit)}
          icon={<Bell className="w-5 h-5 text-blue-600" />}
          isOpen={openSections.activity}
          onToggle={() => toggleSection('activity')}
          color="blue"
        >
          <div className="space-y-2 text-sm">
            {activity.newMessages.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-2 bg-white rounded p-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="text-blue-800">
                  <span className="font-medium">{getUserName(item.session.notes[item.session.notes.length - 1].author)}</span>
                  {' '}a répondu dans "{item.session.gameTitle}" 
                  {item.newCount > 1 && ` (${item.newCount} msg)`}
                </span>
              </div>
            ))}
            
            {activity.newSessions.length > 0 && (
              <div className="flex items-start space-x-2 bg-white rounded p-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="text-blue-800">
                  <span className="font-medium">{activity.newSessions.length}</span>
                  {' '}nouvelle{activity.newSessions.length > 1 ? 's' : ''} session{activity.newSessions.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </DashboardSection>
      )}
      
      {/* 4. STATISTIQUES GLOBALES (Priority #3) */}
      <DashboardSection
        title="Statistiques globales"
        icon={<Target className="w-5 h-5 text-gray-600" />}
        isOpen={openSections.stats}
        onToggle={() => toggleSection('stats')}
        color="gray"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          <StatCard
            icon={<Target className="w-5 h-5 text-blue-600" />}
            value={`${stats.exploredMoments}/${stats.totalMoments}`}
            label="Moments explorés"
            bgColor="bg-blue-50"
            textColor="text-blue-600"
          />
          
          <StatCard
            icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
            value={stats.pendingYou + stats.stale}
            label="À traiter"
            bgColor="bg-amber-50"
            textColor="text-amber-600"
          />
          
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            value={stats.completed}
            label="Terminées"
            bgColor="bg-green-50"
            textColor="text-green-600"
          />
          
          <StatCard
            icon={<MessageCircle className="w-5 h-5 text-purple-600" />}
            value={stats.totalMessages}
            label="Messages total"
            bgColor="bg-purple-50"
            textColor="text-purple-600"
          />
          
        </div>
      </DashboardSection>
      
    </div>
  );
}

// ========================================
// COMPOSANTS HELPERS
// ========================================

function DashboardSection({ title, subtitle, icon, isOpen, onToggle, children, color = 'gray', count, highlight }) {
  const colorClasses = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', hover: 'hover:bg-amber-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', hover: 'hover:bg-purple-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', hover: 'hover:bg-blue-100' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', hover: 'hover:bg-gray-100' }
  };
  
  const colors = colorClasses[color];
  
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg overflow-hidden ${highlight ? 'ring-2 ring-orange-400' : ''}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 ${colors.hover} transition-colors`}
      >
        <div className="flex items-center space-x-3">
          {icon}
          <div className="text-left">
            <div className={`font-semibold ${colors.text} flex items-center space-x-2`}>
              <span>{title}</span>
              {count > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  color === 'amber' ? 'bg-amber-200 text-amber-800' : 
                  color === 'purple' ? 'bg-purple-200 text-purple-800' :
                  color === 'blue' ? 'bg-blue-200 text-blue-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {count}
                </span>
              )}
            </div>
            {subtitle && (
              <div className="text-xs text-gray-600 mt-0.5">{subtitle}</div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, bgColor, textColor }) {
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className={`text-2xl font-bold ${textColor}`}>
          {value}
        </span>
      </div>
      <div className="text-xs text-gray-600 font-medium">
        {label}
      </div>
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