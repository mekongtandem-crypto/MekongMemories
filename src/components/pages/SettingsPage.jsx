/**
 * SettingsPage.jsx v3.4 - Section Utilisateurs compacte et corrigée
 * ✅ Correction de l'erreur de syntaxe.
 * ✅ Refactorisation de la section de personnalisation des utilisateurs.
 * ✅ Chaque utilisateur a sa propre ligne avec des boutons pour éditer l'avatar et la couleur.
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

export default function SettingsPage() {
  const app = useAppState();
  
  const [openSections, setOpenSections] = useState({
    users: true,
    connection: false,
    stats: false,
    data: false
  });
  
  const [regenerationProgress, setRegenerationProgress] = useState({
    isActive: false,
    step: '',
    message: '',
    progress: 0,
    logs: []
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

  const handleChangeUser = (userId) => {
    app.setCurrentUser(userId);
  };

  const forceUserUpdate = (userId) => {
    if (app.currentUser?.id === userId) {
      const currentId = app.currentUser.id;
      app.setCurrentUser(null);
      setTimeout(() => app.setCurrentUser(currentId), 10);
    }
    // Force un re-render global pour voir les changements de couleur/avatar partout
    app.refreshSessions();
  };
  
  const handleChangeAvatar = (userId, newEmoji) => {
    userManager.updateUserEmoji(userId, newEmoji);
    forceUserUpdate(userId);
  };

  const handleChangeColor = (userId, newColor) => {
    userManager.updateUserColor(userId, newColor);
    forceUserUpdate(userId);
  };

  const users = userManager.getAllUsers();
  const stats = {
    moments: app.masterIndex?.metadata?.total_moments || 0,
    posts: app.masterIndex?.metadata?.total_posts || 0,
    photos: app.masterIndex?.metadata?.total_photos || 0,
    sessions: app.sessions?.length || 0
  };
  const isOnline = app.connection?.isOnline;
  const connectionEmail = 'mekongtandem@gmail.com';

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      
      {/* Section Utilisateurs (regroupée) */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button onClick={() => toggleSection('users')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Utilisateurs</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.users ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.users && (
          <div className="p-4 border-t border-gray-100 space-y-6">
            
            {/* Utilisateur actif */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Utilisateur actif</h3>
              <div className="grid grid-cols-3 gap-3">
                {users.map(user => {
                  const isActive = app.currentUser?.id === user.id;
                  const currentUserData = userManager.getUser(user.id) || user;
                  const style = userManager.getUserStyle(user.id);
                  return (
                    <button key={user.id} onClick={() => handleChangeUser(user.id)} className={`p-4 rounded-lg border-2 transition-all ${ isActive ? `${style.bg} ${style.border} ring-2 ring-offset-2 ${style.ring}` : 'border-gray-200 hover:border-gray-300' }`}>
                      <div className="text-3xl mb-2">{currentUserData.emoji}</div>
                      <div className={`font-medium ${isActive ? style.text.replace('bg-', 'text-') : 'text-gray-700'}`}>{user.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* ✅ SECTION REFACTORISÉE */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Personnaliser les profils</h3>
              <div className="space-y-3">
                {users.map(user => (
                  <UserCustomization 
                    key={user.id} 
                    user={user}
                    onAvatarChange={handleChangeAvatar}
                    onColorChange={handleChangeColor}
                  />
                ))}
              </div>
            </div>
            
          </div>
        )}
      </section>

      {/* Section Connexion (inchangée) */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('connection')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Cloud className="w-5 h-5 text-green-600" />
            ) : (
              <CloudOff className="w-5 h-5 text-red-600" />
            )}
            <h2 className="text-lg font-semibold text-gray-900">Connexion</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.connection ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.connection && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            {isOnline ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Cloud className="w-4 h-4 text-green-500" />
                  <span>Connecté en tant que <span className="font-medium">{connectionEmail}</span></span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Se déconnecter ?')) {
                      app.disconnect();
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  <CloudOff className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <CloudOff className="w-4 h-4" />
                  <span>Non connecté à Google Drive</span>
                </div>
                <button
                  onClick={() => app.connect()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Se connecter</span>
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* Section Statistiques (inchangée) */}
            <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('stats')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Statistiques</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.stats ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.stats && (
          <div className="p-4 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.moments}</div>
                <div className="text-sm text-gray-600">Moments</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.posts}</div>
                <div className="text-sm text-gray-600">Articles</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.photos}</div>
                <div className="text-sm text-gray-600">Photos</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{stats.sessions}</div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section Données (inchangée) */}
            <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('data')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Données</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.data ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.data && (
          <div className="p-4 border-t border-gray-100 space-y-4">
            
            {regenerationProgress.isActive && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-900">
                      {regenerationProgress.message}
                    </span>
                    <span className="text-blue-600 font-mono">
                      {regenerationProgress.progress}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${regenerationProgress.progress}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs max-h-48 overflow-y-auto">
                  {regenerationProgress.logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleRegenerateIndex}
              disabled={regenerationProgress.isActive}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              {regenerationProgress.isActive ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Régénération en cours...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Régénérer l'index</span>
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500">
              Reconstruit l'index complet à partir des données sur Google Drive.
              {regenerationProgress.logs.length > 0 && !regenerationProgress.isActive && 
                ' Opération terminée avec succès !'
              }
            </p>
          </div>
        )}
      </section>
      
      {/* Version */}
      <section className="text-center text-sm text-gray-500 pt-4">
        <p>Mémoire du Mékong v2.3</p>
        <p className="text-xs mt-1">Phase 15 complète - Système notifications</p>
      </section>
    </div>
  );
}

// ✅ NOUVEAU SOUS-COMPOSANT POUR LA PERSONNALISATION
function UserCustomization({ user, onAvatarChange, onColorChange }) {
  const [editing, setEditing] = useState(null); // 'avatar', 'color', ou null
  
  const userData = userManager.getUser(user.id);
  const style = userManager.getUserStyle(user.id);

  return (
    <div className={`p-4 rounded-lg border-2 ${style.border} ${style.bg} transition-all duration-300`}>
      {/* Ligne principale compacte */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{userData.emoji}</span>
          <span className="font-semibold text-gray-900">{user.name}</span>
        </div>
        
        <div className="flex items-center space-x-2">
  <button 
    onClick={() => setEditing(editing === 'avatar' ? null : 'avatar')}
    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      editing === 'avatar' 
        ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    <Smile className="w-4 h-4" />
    <span>Avatar</span>
  </button>
  <button 
    onClick={() => setEditing(editing === 'color' ? null : 'color')}
    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      editing === 'color' 
        ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    <Palette className="w-4 h-4" />
    <span>Couleur</span>
  </button>
</div>
        
      </div>

      {/* Sélecteur d'avatar (conditionnel) */}
      {editing === 'avatar' && (
        <div className="mt-4 pt-4 border-t border-gray-300/50">
          <label className="block text-xs font-medium text-gray-600 mb-2">Choisir un nouvel avatar</label>
          <div className="grid grid-cols-9 sm:grid-cols-12 gap-1 max-h-32 overflow-y-auto p-2 bg-white rounded border border-gray-200">
            {AVAILABLE_AVATARS.map((emoji, idx) => (
              <button key={idx} onClick={() => { onAvatarChange(user.id, emoji); setEditing(null); }} className={`text-2xl p-1 rounded transition-all ${ userData.emoji === emoji ? 'bg-amber-100 ring-2 ring-amber-500' : 'hover:bg-gray-100' }`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sélecteur de couleur (conditionnel) */}
      {editing === 'color' && (
        <div className="mt-4 pt-4 border-t border-gray-300/50">
          <label className="block text-xs font-medium text-gray-600 mb-2">Choisir une nouvelle couleur</label>
          <div className="flex space-x-2">
            {['green', 'blue', 'amber', 'purple', 'red'].map(color => (
              <button key={color} onClick={() => { onColorChange(user.id, color); setEditing(null); }} className={`w-10 h-10 rounded-full border-2 transition-all ${ userData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : '' } ${ color === 'green' ? 'bg-green-500 border-green-700' : color === 'blue' ? 'bg-blue-500 border-blue-700' : color === 'amber' ? 'bg-amber-500 border-amber-700' : color === 'purple' ? 'bg-purple-500 border-purple-700' : 'bg-red-500 border-red-700' }`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}