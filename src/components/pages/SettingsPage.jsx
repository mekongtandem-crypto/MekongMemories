/**
 * SettingsPage.jsx v3.0 - Adaptation UnifiedTopBar
 * ✅ Suppression du header redondant
 * ✅ Mise en page simplifiée
 */
import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { RefreshCw, Database, Users, Info } from 'lucide-react';

export default function SettingsPage() {
  const app = useAppState();
  const [isRegenerating, setIsRegenerating] = useState(false);

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

  const users = [
    { id: 'lambert', name: 'Lambert', emoji: '🚴' },
    { id: 'tom', name: 'Tom', emoji: '🧗' },
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
            const isActive = app.currentUser === user.id;
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
                <div className="text-3xl mb-2">{user.emoji}</div>
                <div className={`font-medium ${isActive ? '' : 'text-gray-700'}`}>
                  {user.name}
                </div>
              </button>
            );
          })}
        </div>
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