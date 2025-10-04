/**
 * SettingsPage.jsx v3.2 - Sections dépliables + Connexion
 * ✅ Volets repliables pour chaque section
 * ✅ Section connexion avec email et bouton
 * ✅ Avatar modifiable seulement pour utilisateur actif
 */
import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { RefreshCw, Database, Users, Info, Smile, ChevronDown, Cloud, CloudOff, LogIn, LogOut } from 'lucide-react';

const AVAILABLE_AVATARS = [
  '🚴', '🧗', '🏃', '🚶', '🧘', '🏊', '🚣', '💩', '🕺',
 '😊', '😎', '🤓', '🧐', '🥳', '🤗', '🌟', '✨', '😽',
   '👨‍💻', '🤫', '😇', '🤓', '🤩', '🤡', '🤖', '🎃',
  '📸', '🎒', '🗺️', '🧭', '⛺', '🏕️', '🌏', '⛰️', '💡',
  '👥', '💞', '🍃', '👬', '🤝', '⚔️', '💭', '🥂', '👨‍❤️‍💋‍👨'
];

export default function SettingsPage() {
  const app = useAppState();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  
  const [openSections, setOpenSections] = useState({
    user: true,
    connection: false,
    avatar: false,
    stats: false,
    data: false
  });
  
  // ✅ NOUVEAUX states pour progression
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
    if (!confirm('Régénérer l\'index complet ? Cette opération peut prendre quelques minutes.')) {
      return;
    }

    // ✅ Initialiser progression
    setRegenerationProgress({
      isActive: true,
      step: 'init',
      message: 'Initialisation...',
      progress: 0,
      logs: ['🚀 Démarrage de la régénération...']
    });

    try {
      // ✅ Enregistrer callback de progression
      window.masterIndexGenerator.setProgressCallback((progressData) => {
        setRegenerationProgress(prev => ({
          isActive: true,
          step: progressData.step,
          message: progressData.message,
          progress: progressData.progress || prev.progress,
          logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${progressData.message}`].slice(-20) // Garder 20 dernières lignes
        }));
      });

      // ✅ Lancer régénération
      const result = await window.masterIndexGenerator.generateMomentsStructure();
      
      if (result?.success) {
        // ✅ Recharger l'index
        await app.regenerateMasterIndex();
        
        setRegenerationProgress(prev => ({
          ...prev,
          isActive: false,
          logs: [...prev.logs, '✅ Index rechargé avec succès !', '💡 Rechargez la page (F5) pour voir les changements']
        }));
        
        // Auto-fermer après 3s
        setTimeout(() => {
          setRegenerationProgress({
            isActive: false,
            step: '',
            message: '',
            progress: 0,
            logs: []
          });
        }, 5000);
        
      } else {
        throw new Error(result?.error || 'Erreur inconnue');
      }
      
    } catch (error) {
      console.error('❌ Erreur régénération:', error);
      setRegenerationProgress(prev => ({
        ...prev,
        isActive: false,
        logs: [...prev.logs, `❌ ERREUR : ${error.message}`]
      }));
    }
  };

  const handleChangeUser = (userId) => {
    app.setCurrentUser(userId);
  };

  const handleChangeAvatar = (newEmoji) => {
    if (!app.currentUser?.id) return;
    
    userManager.updateUserEmoji(app.currentUser.id, newEmoji);
    setEditingAvatar(false);
    
    // Force re-render
    const currentId = app.currentUser.id;
    app.setCurrentUser(null);
    setTimeout(() => app.setCurrentUser(currentId), 10);
  };

  const users = [
    { id: 'lambert', name: 'Lambert', emoji: '🚴' },
    { id: 'tom', name: 'Tom', emoji: '👨‍💻' },
    { id: 'duo', name: 'Duo', emoji: '👥' }
  ];

  const stats = {
  moments: app.masterIndex?.metadata?.total_moments || 0,
  posts: app.masterIndex?.metadata?.total_posts || 0,
  photos: app.masterIndex?.metadata?.total_photos || 0,
  sessions: app.sessions?.length || 0
};

  const isOnline = app.connection?.isOnline;
  const connectionEmail = 'mekongtandem@gmail.com'; // À adapter si tu as cette info ailleurs

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      
      {/* Section Utilisateur actif */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('user')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Utilisateur actif</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.user ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.user && (
          <div className="p-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              {users.map(user => {
                const isActive = app.currentUser?.id === user.id;
                const currentUserData = userManager.getUser(user.id) || user;
                const style = userManager.getUserStyle(user.id);
                
                return (
                  <button
                    key={user.id}
                    onClick={() => handleChangeUser(user.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isActive 
                        ? `${style.bg} ${style.border} ring-2 ring-offset-2 ${style.text}` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{currentUserData.emoji}</div>
                    <div className={`font-medium ${isActive ? '' : 'text-gray-700'}`}>
                      {user.name}
                    </div>
                  </button>
                );
              })}
            </div>
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
                  <LogOut className="w-4 h-4" />
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
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* Section Avatar */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('avatar')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Smile className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Personnaliser l'avatar</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.avatar ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.avatar && (
          <div className="p-4 border-t border-gray-100">
            {!app.currentUser ? (
              <p className="text-sm text-gray-500">Sélectionnez un utilisateur pour modifier son avatar</p>
            ) : editingAvatar ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Choisissez un avatar pour <span className="font-semibold">{app.currentUser.name}</span>
                  </p>
                  <button
                    onClick={() => setEditingAvatar(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Annuler
                  </button>
                </div>
                <div className="grid grid-cols-9 sm:grid-cols-12 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                  {AVAILABLE_AVATARS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChangeAvatar(emoji)}
                      className="text-3xl p-2 hover:bg-white hover:shadow-md rounded-lg transition-all"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingAvatar(true)}
                className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="text-4xl mb-2">{app.currentUser.emoji}</div>
                <div className="text-sm font-medium text-gray-700">{app.currentUser.name}</div>
                <div className="text-xs text-gray-500 mt-1">Cliquer pour modifier</div>
              </button>
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

      {/* Section Données - MODIFIÉE */}
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
            
            {/* ✅ NOUVEAU : Affichage progression */}
            {regenerationProgress.isActive && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                
                {/* Barre de progression */}
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

                {/* Logs déroulants */}
                <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs max-h-48 overflow-y-auto">
                  {regenerationProgress.logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton régénération */}
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
        <p>Mémoire du Mékong v2.0</p>
        <p className="text-xs mt-1">Phase 13B - Messages riches + TopBar unifiée</p>
      </section>
    </div>
  );
}