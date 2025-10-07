/**
 * SettingsPage.jsx v3.6 - Améliorations UX des statistiques
 * ✅ Ajout des noms d'utilisateurs sur les graphiques d'engagement.
 * ✅ Les sessions mises en avant sont désormais cliquables pour une navigation rapide.
 */
import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { RefreshCw, Database, Users, Info, ChevronDown, Cloud, CloudOff, Smile, Palette } from 'lucide-react';

const AVAILABLE_AVATARS = [
  '🚴', '🧗', '🏃', '🚶', '🧘', '🏊', '🚣', '💩', '🕺',
  '😊', '😎', '🤓', '🧐', '🥳', '🤗', '🌟', '✨', '😽',
  '👨‍💻', '🤫', '😇', '🤓', '🤩', '🤡', '🤖', '🎃',
  '📸', '🎒', '🗺️', '🧭', '⛺', '🏕️', '🌏', '⛰️', '💡',
  '👥', '💞', '🍃', '👬', '🤝', '⚔️', '💭', '🥂', '👨‍❤️‍💋‍👨'
];

function generateUserActivityStats(sessions, masterIndex, users) {
  if (!masterIndex || !sessions || !users) return null;

  const totalMoments = masterIndex.moments?.length || 0;
  const exploredMomentIds = new Set(sessions.map(s => s.gameId));
  const exploredCount = exploredMomentIds.size;
  const explorationRate = totalMoments > 0 ? (exploredCount / totalMoments) * 100 : 0;
  const totalMessages = sessions.reduce((sum, s) => sum + (s.notes?.length || 0), 0);

  const userStats = {};
  users.filter(u => u.id !== 'duo').forEach(u => {
    userStats[u.id] = { messages: 0, sessionsCreated: 0 };
  });

  sessions.forEach(session => {
    if (userStats[session.user]) {
      userStats[session.user].sessionsCreated++;
    }
    session.notes?.forEach(note => {
      if (userStats[note.author]) {
        userStats[note.author].messages++;
      }
    });
  });

  let mostTalkativeSession = null;
  if (sessions.length > 0) {
    mostTalkativeSession = sessions
        .filter(s => s.notes && s.notes.length > 0)
        .reduce((max, current) => 
            (current.notes.length || 0) > (max.notes?.length || 0) ? current : max, sessions[0]
        );
  }
  
  const activeSessions = sessions.filter(s => !s.completed && !s.archived && s.notes?.length > 0);
  let oldestActiveSession = null;
  if (activeSessions.length > 0) {
    oldestActiveSession = activeSessions.reduce((min, current) => 
      new Date(current.notes[0].timestamp) < new Date(min.notes[0].timestamp) ? current : min
    );
  }

  return {
    explorationRate,
    totalMessages,
    userStats,
    mostTalkativeSession,
    oldestActiveSession
  };
}

export default function SettingsPage() {
  const app = useAppState();
  
  const [editingUser, setEditingUser] = useState({ id: null, type: null }); 
  const [openSections, setOpenSections] = useState({
    users: true,
    stats: true,
    connection: false,
    data: false
  });
  
  const [regenerationProgress, setRegenerationProgress] = useState({
    isActive: false, step: '', message: '', progress: 0, logs: []
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleRegenerateIndex = async () => {
    if (!confirm('Régénérer l\'index complet ? Cette opération peut prendre quelques minutes.')) return;
    setRegenerationProgress({ isActive: true, step: 'init', message: 'Initialisation...', progress: 0, logs: ['🚀 Démarrage...'] });
    try {
      window.masterIndexGenerator.setProgressCallback((progressData) => {
        setRegenerationProgress(prev => ({ ...prev, isActive: true, ...progressData, logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${progressData.message}`].slice(-20) }));
      });
      const result = await window.masterIndexGenerator.generateMomentsStructure();
      if (result?.success) {
        await app.regenerateMasterIndex();
        setRegenerationProgress(prev => ({ ...prev, isActive: false, logs: [...prev.logs, '✅ Index rechargé ! Rechargez la page (F5).'] }));
        setTimeout(() => setRegenerationProgress({ isActive: false, step: '', message: '', progress: 0, logs: [] }), 5000);
      } else { throw new Error(result?.error || 'Erreur inconnue'); }
    } catch (error) {
      console.error('❌ Erreur régénération:', error);
      setRegenerationProgress(prev => ({ ...prev, isActive: false, logs: [...prev.logs, `❌ ERREUR : ${error.message}`] }));
    }
  };

  const forceUserUpdate = () => {
    const currentId = app.currentUser.id;
    app.setCurrentUser(null);
    setTimeout(() => app.setCurrentUser(currentId), 10);
  };
  
  const handleChangeAvatar = (userId, newEmoji) => {
    userManager.updateUserEmoji(userId, newEmoji);
    forceUserUpdate();
  };

  const handleChangeColor = (userId, newColor) => {
    userManager.updateUserColor(userId, newColor);
    forceUserUpdate();
  };

  const users = userManager.getAllUsers();
  const isOnline = app.connection?.isOnline;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      
      {/* Section Utilisateurs */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('users')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Utilisateurs</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.users ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.users && (
          <div className="p-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              {users.map(user => {
                  const isActive = app.currentUser?.id === user.id;
                  const currentUserData = userManager.getUser(user.id) || user;
                  const style = userManager.getUserStyle(user.id);
                  return (
                    <button
                      key={`${user.id}-selector`}
                      onClick={() => app.setCurrentUser(user.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${ isActive ? `${style.bg} ${style.border} ring-2 ring-offset-2 ${style.ring}` : 'border-gray-200 hover:border-gray-300' }`}
                    >
                      <div className="text-3xl mb-2">{currentUserData.emoji}</div>
                      <div className={`font-medium ${isActive ? style.text.replace('bg-', 'text-') : 'text-gray-700'}`}>{user.name}</div>
                    </button>
                  );
              })}
              {users.map(user => (
                  <button key={`${user.id}-avatar`} onClick={() => setEditingUser(prev => prev.id === user.id && prev.type === 'avatar' ? { id: null, type: null } : { id: user.id, type: 'avatar' })} className="w-full p-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-sm rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <span className="text-2xl">{userManager.getUser(user.id).emoji}</span>
                    <span>Avatar</span>
                  </button>
              ))}
              {users.map(user => {
                const style = userManager.getUserStyle(user.id);
                return (
                  <button key={`${user.id}-color`} onClick={() => setEditingUser(prev => prev.id === user.id && prev.type === 'color' ? { id: null, type: null } : { id: user.id, type: 'color' })} className="w-full p-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-sm rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <div className={`w-5 h-5 rounded-full ${style.bg} border-2 ${style.border}`}></div>
                    <span>Couleur</span>
                  </button>
                )
              })}
            </div>
            {editingUser.id && (
              <div className="mt-6">
                {editingUser.type === 'avatar' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Changer l'avatar de {userManager.getUser(editingUser.id).name}</label>
                    <div className="grid grid-cols-9 sm:grid-cols-12 gap-1 p-2 bg-white rounded border border-gray-200">
                      {AVAILABLE_AVATARS.map((emoji, idx) => (
                        <button key={idx} onClick={() => { handleChangeAvatar(editingUser.id, emoji); setEditingUser({id: null, type: null}); }} className={`text-2xl p-1 rounded transition-all hover:bg-gray-100`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {editingUser.type === 'color' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Changer la couleur de {userManager.getUser(editingUser.id).name}</label>
                    <div className="flex space-x-2">
                      {['green', 'blue', 'amber', 'purple', 'red'].map(color => (
                        <button key={color} onClick={() => { handleChangeColor(editingUser.id, color); setEditingUser({id: null, type: null}); }} className={`w-10 h-10 rounded-full border-2 transition-all ${ color === 'green' ? 'bg-green-500 border-green-700' : color === 'blue' ? 'bg-blue-500 border-blue-700' : color === 'amber' ? 'bg-amber-500 border-amber-700' : color === 'purple' ? 'bg-purple-500 border-purple-700' : 'bg-red-500 border-red-700' }`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section Statistiques */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('stats')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Statistiques d'Activité</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.stats ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.stats && (
          <div className="p-4 border-t border-gray-100 space-y-6">
            {(() => {
              const userActivityStats = generateUserActivityStats(app.sessions, app.masterIndex, users);
              if (!userActivityStats) {
                return <p className="text-sm text-gray-500">Statistiques indisponibles.</p>;
              }
              const totalSessionsCreated = Object.values(userActivityStats.userStats).reduce((sum, s) => sum + s.sessionsCreated, 0);

              return (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Vue d'ensemble</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-800">🗺️ Exploration du voyage</span>
                          <span className="font-bold text-blue-600">{Math.round(userActivityStats.explorationRate)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${userActivityStats.explorationRate}%` }}></div></div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-amber-600">{userActivityStats.totalMessages}</div>
                        <div className="text-sm text-gray-600">Messages échangés</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Engagement des utilisateurs</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div>
                        {/* ✅ NOUVEAU : Labels au-dessus du graphique */}
                        <div className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1">
                          {Object.entries(userActivityStats.userStats).map(([userId, stats]) => (
                            <span key={userId}>{`${userManager.getUser(userId).name} (${stats.messages})`}</span>
                          ))}
                        </div>
                        <div className="w-full flex rounded-full h-4 overflow-hidden bg-gray-200">
                          {Object.entries(userActivityStats.userStats).map(([userId, stats]) => {
                            const user = userManager.getUser(userId);
                            const style = userManager.getUserStyle(userId);
                            const percentage = userActivityStats.totalMessages > 0 ? (stats.messages / userActivityStats.totalMessages) * 100 : 0;
                            return <div key={userId} className={`${style.strong_bg}`} style={{ width: `${percentage}%` }} title={`${user.name}: ${stats.messages} messages (${Math.round(percentage)}%)`}></div>;
                          })}
                        </div>
                      </div>
                      <div>
                        {/* ✅ NOUVEAU : Labels au-dessus du graphique */}
                        <div className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1">
                          {Object.entries(userActivityStats.userStats).map(([userId, stats]) => (
                            <span key={userId}>{`${userManager.getUser(userId).name} (${stats.sessionsCreated})`}</span>
                          ))}
                        </div>
                         <div className="w-full flex rounded-full h-4 overflow-hidden bg-gray-200">
                           {Object.entries(userActivityStats.userStats).map(([userId, stats]) => {
                            const user = userManager.getUser(userId);
                            const style = userManager.getUserStyle(userId);
                            const percentage = totalSessionsCreated > 0 ? (stats.sessionsCreated / totalSessionsCreated) * 100 : 50;
                            return <div key={userId} className={`${style.strong_bg}`} style={{ width: `${percentage}%` }} title={`${user.name}: ${stats.sessionsCreated} sessions créées (${Math.round(percentage)}%)`}></div>;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Pleins feux sur les sessions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ✅ NOUVEAU : La carte est maintenant un bouton cliquable */}
                      {userActivityStats.mostTalkativeSession ? (
                        <button onClick={() => app.openChatSession(userActivityStats.mostTalkativeSession)} className="text-left bg-gray-50 p-4 rounded-lg hover:bg-gray-100 hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer">
                          <div className="font-semibold text-gray-800">💬 La plus bavarde</div>
                          <p className="text-sm text-amber-700 truncate">{userActivityStats.mostTalkativeSession.gameTitle}</p>
                          <p className="text-xs text-gray-500">{userActivityStats.mostTalkativeSession.notes.length} messages</p>
                        </button>
                      ) : <div />}
                      {/* ✅ NOUVEAU : La carte est maintenant un bouton cliquable */}
                      {userActivityStats.oldestActiveSession ? (
                        <button onClick={() => app.openChatSession(userActivityStats.oldestActiveSession)} className="text-left bg-gray-50 p-4 rounded-lg hover:bg-gray-100 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer">
                           <div className="font-semibold text-gray-800">⏳ Le souvenir oublié</div>
                           <p className="text-sm text-blue-700 truncate">{userActivityStats.oldestActiveSession.gameTitle}</p>
                           <p className="text-xs text-gray-500">En attente depuis le {new Date(userActivityStats.oldestActiveSession.notes[0].timestamp).toLocaleDateString('fr-FR')}</p>
                        </button>
                      ) : <div />}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </section>

      {/* Section Connexion */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('connection')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isOnline ? <Cloud className="w-5 h-5 text-green-600" /> : <CloudOff className="w-5 h-5 text-red-600" />}
            <h2 className="text-lg font-semibold text-gray-900">Connexion</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.connection ? 'rotate-180' : ''}`} />
        </button>
        {openSections.connection && (
          <div className="p-4 border-t border-gray-100 text-sm text-gray-600">
            {isOnline ? (<p>Connecté à Google Drive.</p>) : (<p>Non connecté à Google Drive.</p>)}
          </div>
        )}
      </section>

      {/* Section Données */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('data')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Données Brutes</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.data ? 'rotate-180' : ''}`} />
        </button>
        {openSections.data && (
          <div className="p-4 border-t border-gray-100 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{app.masterIndex?.metadata?.total_moments || 0}</div>
                <div className="text-sm text-gray-600">Moments</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{app.masterIndex?.metadata?.total_posts || 0}</div>
                <div className="text-sm text-gray-600">Articles</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{app.masterIndex?.metadata?.total_photos || 0}</div>
                <div className="text-sm text-gray-600">Photos</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{app.sessions?.length || 0}</div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
            </div>
            {regenerationProgress.isActive && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">{regenerationProgress.message}</span>
                  <span className="text-blue-600 font-mono">{regenerationProgress.progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${regenerationProgress.progress}%` }}/></div>
              </div>
            )}
            <button
              onClick={handleRegenerateIndex}
              disabled={regenerationProgress.isActive}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${regenerationProgress.isActive ? 'animate-spin' : ''}`} />
              <span>{regenerationProgress.isActive ? 'Régénération en cours...' : "Régénérer l'index"}</span>
            </button>
          </div>
        )}
      </section>
      
      <section className="text-center text-sm text-gray-500 pt-4">
        <p>Mémoire du Mékong v2.3</p>
      </section>
    </div>
  );
}