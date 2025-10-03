/**
 * SettingsPage.jsx v3.1 - Sélection avatars
 * ✅ Ajout choix d'avatar par utilisateur
 */
import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { RefreshCw, Database, Users, Info, Smile } from 'lucide-react';

// Liste d'avatars disponibles
const AVAILABLE_AVATARS = [
  '🚴', '🧗', '🏃', '🚶', '🧘', '🏊', '🚣', '🏔️', '⛰️',
  '👨‍💻', '👩‍💻', '🧑‍💼', '👨‍🎨', '👩‍🎨', '🧑‍🔬', '👨‍🏫', '👩‍🏫',
  '😊', '😎', '🤓', '🧐', '🥳', '🤗', '🌟', '✨', '🎨',
  '📸', '🎒', '🗺️', '🧭', '⛺', '🏕️', '🌏', '🌍', '🌎',
  '👥', '👫', '👬', '👭', '🤝', '💩', '💭', '🗨️', '💡'
];

export default function SettingsPage() {
  const app = useAppState();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(null);

  const handleRegenerateIndex = async () => {
    if (!confirm('Régénérer l\'index complet ? Cette opération peut prendre quelques secondes.')) {
      return;
    }

    setIsRegenerating(true);
    try {
      const result = await app.dataManager?.reloadMasterIndex();
      if (result?.success) {
        alert('✅ Index régénéré avec succès !');
      } else {
        alert('❌ Erreur lors de la régénération de l\'index.');
      }
    } catch (error) {
      console.error('Erreur régénération:', error);
      alert('❌ Erreur lors de la régénération de l\'index.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleChangeUser = (userId) => {
    app.setCurrentUser(userId);
  };

  const handleChangeAvatar = (userId, newEmoji) => {
    userManager.updateUserEmoji(userId, newEmoji);
    setEditingAvatar(null);
    // Force un re-render en changeant temporairement puis revenant
    const currentId = app.currentUser?.id;
    if (currentId === userId) {
      app.setCurrentUser(null);
      setTimeout(() => app.setCurrentUser(userId), 10);
    }
  };

  const users = [
    { id: 'lambert', name: 'Lambert', emoji: '🚴' },
    { id: 'tom', name: 'Tom', emoji: '👨‍💻' },
    { id: 'duo', name: 'Duo', emoji: '👥' }
  ];

  const stats = {
    moments: app.masterIndex?.moments?.length || 0,
    posts: app.masterIndex?.metadata?.stats?.postCount || 0,
    photos: app.masterIndex?.metadata?.stats?.photoCount || 0,
    sessions: app.sessions?.length || 0
  };

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      
      {/* Sélection utilisateur */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Utilisateur actif</h2>
        </div>
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
      </section>

      {/* Choix d'avatar */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Smile className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Personnaliser l'avatar</h2>
        </div>
        
        {editingAvatar ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Choisissez un avatar pour <span className="font-semibold">{editingAvatar.name}</span>
              </p>
              <button
                onClick={() => setEditingAvatar(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
            </div>
            <div className="grid grid-cols-9 sm:grid-cols-12 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {AVAILABLE_AVATARS.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChangeAvatar(editingAvatar.id, emoji)}
                  className="text-3xl p-2 hover:bg-white hover:shadow-md rounded-lg transition-all"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {users.map(user => {
              const currentUserData = userManager.getUser(user.id) || user;
              return (
                <button
                  key={user.id}
                  onClick={() => setEditingAvatar(user)}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="text-4xl mb-2">{currentUserData.emoji}</div>
                  <div className="text-sm font-medium text-gray-700">{user.name}</div>
                  <div className="text-xs text-gray-500 mt-1">Cliquer pour modifier</div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Statistiques */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Statistiques</h2>
        </div>
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
      </section>

      {/* Actions système */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Database className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Données</h2>
        </div>
        <button
          onClick={handleRegenerateIndex}
          disabled={isRegenerating}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
        >
          {isRegenerating ? (
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
        <p className="text-xs text-gray-500 mt-2">
          Reconstruit l'index complet à partir des données sur Google Drive.
        </p>
      </section>

      {/* Version */}
      <section className="text-center text-sm text-gray-500">
        <p>Mémoire du Mékong v2.0</p>
        <p className="text-xs mt-1">Phase 13B - Messages riches + TopBar unifiée</p>
      </section>
    </div>
  );
}