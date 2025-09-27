/**
 * SimplePagesCollection.jsx - Version CORRIGÉE PhotoDataV2
 * ✅ Caractères UTF-8 corrigés
 * ✅ Migration PhotoDataV2 complète
 * ✅ Suppression références obsolètes (photoData, fileIdCache)
 */

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { 
  Home, 
  Settings, 
  Users, 
  BookOpen, 
  MessageCircle, 
  FileText,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle2,
  X,
  Zap, 
  Rocket, 
  AlertCircle, 
  Clock,
  Camera,
  Cloud
} from 'lucide-react';

import { userManager } from '../../core/UserManager.js';
import { mastodonData } from '../../core/MastodonData.js';
import { photoDataV2 } from '../../core/PhotoDataV2.js';
import { masterIndexGenerator } from '../../core/MasterIndexGenerator.js';

export default function SimplePagesCollection({ app }) {
  const renderCurrentPage = () => {
    switch (app.currentPage) {
      case 'home': return <HomePage app={app} />;
      case 'memories': return <MemoriesPage app={app} />;
      case 'sessions': return <SessionsPage app={app} />;
      case 'chat': return <ChatPage app={app} />;
      case 'settings': return <SettingsPage />;
      case 'test': return <TestPage app={app} />;
      default: return <HomePage app={app} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {renderCurrentPage()}
    </div>
  );
}

// ========================================
// EXPORTS NOMMÉS POUR COMPATIBILITÉ APP.JSX
// ========================================

export { HomePage, SettingsPage };

// ========================================
// PAGE RÉGLAGES - VERSION CORRIGÉE PhotoDataV2
// ========================================

function SettingsPage() {
  const app = useAppState();
  const [currentUser, setCurrentUser] = useState(null);
  const [photoStats, setPhotoStats] = useState(null);
  const [mastodonStats, setMastodonStats] = useState(null);
  
  // États pour l'import photos
  const [isImportingPhotos, setIsImportingPhotos] = useState(false);
  const [photoImportStatus, setPhotoImportStatus] = useState('');
  
  // États pour Mastodon
  const [isImportingMastodon, setIsImportingMastodon] = useState(false);
  const [mastodonImportStatus, setMastodonImportStatus] = useState('');

  // Charger les stats au montage
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    setCurrentUser(userManager.getUser(app.currentUser));
    // CORRECTION: Utiliser photoDataV2 au lieu de photoData
    setPhotoStats(photoDataV2.getStats());
    setMastodonStats(mastodonData.getStats());
  };

  // ========================================
  // GESTION IMPORT MASTODON
  // ========================================

  const handleMastodonImport = async () => {
    if (!app.isOnline) {
      setMastodonImportStatus("Veuillez vous connecter à Google Drive d'abord.");
      return;
    }
    
    setIsImportingMastodon(true);
    setMastodonImportStatus('📥 Import outbox.json depuis Google Drive...');
    
    try {
      const result = await mastodonData.importFromGoogleDrive();
      
      if (result.success) {
        setMastodonImportStatus(`✅ Import réussi: ${result.postsCount} posts`);
        loadStats();
        setTimeout(() => setMastodonImportStatus(''), 3000);
      } else {
        setMastodonImportStatus(`❌ Erreur: ${result.error}`);
      }
      
    } catch (error) {
      setMastodonImportStatus(`❌ Erreur import: ${error.message}`);
    } finally {
      setIsImportingMastodon(false);
    }
  };

  const handleClearMastodon = async () => {
    if (confirm('Supprimer tous les posts Mastodon importés ?')) {
      await mastodonData.reset();
      loadStats();
    }
  };

  // ========================================
  // GESTION IMPORT PHOTOS AVEC PhotoDataV2
  // ========================================

  const handleImportPhotos = async () => {
    if (!app.isOnline) {
      setPhotoImportStatus("Veuillez vous connecter à Google Drive d'abord.");
      return;
    }
    
    setIsImportingPhotos(true);
    setPhotoImportStatus('📥 Chargement du fichier maître depuis Google Drive...');
    
    try {
      // CORRECTION: Utiliser PhotoDataV2
      const result = await photoDataV2.loadMasterIndex();
      
      if (result.success) {
        setPhotoImportStatus(`✅ Import réussi: ${result.stats.totalPhotos} photos indexées`);
        loadStats();
        setTimeout(() => setPhotoImportStatus(''), 3000);
      } else {
        setPhotoImportStatus(`❌ Erreur: ${result.error}`);
      }
      
    } catch (error) {
      setPhotoImportStatus(`❌ Erreur import: ${error.message}`);
    } finally {
      setIsImportingPhotos(false);
    }
  };

  const handleGenerateUnifiedIndex = async () => {
    setIsImportingPhotos(true);
    setPhotoImportStatus('🎯 Génération fichier maître...');
    
    try {
      // CORRECTION: Utiliser masterIndexGenerator
      const result = await masterIndexGenerator.generateMasterIndex();
      
      if (result.success) {
        setPhotoImportStatus(`✅ Fichier maître généré: ${result.stats.total_photos} photos`);
        // Recharger PhotoDataV2 après génération
        await photoDataV2.loadMasterIndex();
        loadStats();
        setTimeout(() => setPhotoImportStatus(''), 3000);
      } else {
        setPhotoImportStatus(`❌ Erreur: ${result.error}`);
      }
      
    } catch (error) {
      setPhotoImportStatus(`❌ Erreur génération: ${error.message}`);
    } finally {
      setIsImportingPhotos(false);
    }
  };

  const handleClearPhotos = async () => {
    if (confirm('Supprimer toutes les données photos importées ?')) {
      // CORRECTION: Utiliser PhotoDataV2
      await photoDataV2.clearAll();
      loadStats();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">Réglages</h1>
        <p className="text-amber-700">Configuration de l'application</p>
      </div>
      
      <div className="space-y-6">
        {/* Utilisateur actuel */}
        <SettingsSection title="Utilisateur" icon={<Users className="w-5 h-5" />}>
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{currentUser.emoji}</div>
              <div>
                <div className="font-medium text-gray-900">{currentUser.name}</div>
                <div className="text-sm text-gray-600">{currentUser.description}</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Aucun utilisateur sélectionné</p>
          )}
        </SettingsSection>

        {/* Connexion Google Drive */}
        <SettingsSection title="Google Drive" icon={<Cloud className="w-5 h-5" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">
                Statut: <span className={app.isOnline ? 'text-green-600' : 'text-red-600'}>
                  {app.isOnline ? 'Connecté' : 'Déconnecté'}
                </span>
              </span>
              <button
                onClick={app.isOnline ? app.syncWithCloud : app.connect}
                disabled={app.loading || app.syncing}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {app.loading || app.syncing ? 'Sync...' :
                 app.isOnline ? 'Synchroniser' : 'Se connecter'}
              </button>
            </div>
            
            {app.lastSync && (
              <p className="text-xs text-amber-600">
                Dernière synchronisation : {new Date(app.lastSync).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        </SettingsSection>

        {/* Posts Mastodon - SECTION AJOUTÉE */}
        <SettingsSection title="Posts Mastodon" icon={<BookOpen className="w-5 h-5" />}>
          <div className="space-y-4">
            {mastodonStats?.isImported ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-900">Posts importés</div>
                    <div className="text-sm text-green-700">
                      {mastodonStats.totalPosts} posts • {mastodonStats.postsWithPhotos} avec photos
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Importé le {new Date(mastodonStats.importedAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleMastodonImport}
                      disabled={isImportingMastodon}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm flex items-center"
                      title="Re-importer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleClearMastodon}
                      disabled={isImportingMastodon}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm flex items-center"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Info className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="text-gray-700">Aucun post Mastodon importé</span>
                  </div>
                </div>
                <button
                  onClick={handleMastodonImport}
                  disabled={isImportingMastodon || !app.isOnline}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {isImportingMastodon ? 
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> :
                    <Download className="w-5 h-5" />
                  }
                  <span>Importer depuis Google Drive</span>
                </button>
              </div>
            )}
            
            {mastodonImportStatus && (
              <div className={`p-3 rounded-lg text-sm ${
                mastodonImportStatus.includes('✅') ? 'bg-green-50 text-green-800' :
                mastodonImportStatus.includes('❌') ? 'bg-red-50 text-red-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                {mastodonImportStatus}
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Photos - VERSION PhotoDataV2 */}
        <SettingsSection title="Photos (PhotoDataV2)" icon={<Camera className="w-5 h-5" />}>
          <div className="space-y-4">
            {photoStats?.isLoaded ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-900">Fichier maître chargé</div>
                    <div className="text-sm text-green-700">
                      {photoStats.totalPhotos} photos • {photoStats.totalDays} jours • {photoStats.totalPosts} posts
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Version {photoStats.version} • Chargé le {photoStats.loadedAt ? new Date(photoStats.loadedAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleImportPhotos}
                      disabled={isImportingPhotos}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm flex items-center"
                      title="Re-charger"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleClearPhotos}
                      disabled={isImportingPhotos}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm flex items-center"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 mb-3">Aucun fichier maître chargé</p>
                  <button
                    onClick={handleImportPhotos}
                    disabled={isImportingPhotos}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {isImportingPhotos ? 
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> :
                      <Upload className="w-5 h-5" />
                    }
                    <span>Charger Fichier Maître</span>
                  </button>
                </div>
              </div>
            )}
            
            {photoImportStatus && (
              <div className={`p-3 rounded-lg text-sm ${
                photoImportStatus.includes('✅') ? 'bg-green-50 text-green-800' :
                photoImportStatus.includes('❌') ? 'bg-red-50 text-red-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                {photoImportStatus}
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Génération fichier maître */}
        <SettingsSection title="Génération Fichier Maître" icon={<RefreshCw className="w-5 h-5" />}>
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800 mb-3">
                Générer un nouveau fichier maître à partir des données Mastodon
              </p>
              <button
                onClick={handleGenerateUnifiedIndex}
                disabled={isImportingPhotos || !app.isOnline}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {isImportingPhotos ? 
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> :
                  <RefreshCw className="w-5 h-5" />
                }
                <span>Générer Nouveau Fichier Maître</span>
              </button>
              <p className="text-xs text-purple-600 mt-2">
                ⚠️ Cette opération peut prendre quelques minutes
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* Données */}
        <SettingsSection title="Données" icon={<BookOpen className="w-5 h-5" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-medium text-amber-900">{app.sessions.length}</p>
                <p className="text-sm text-amber-600">Sessions</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="font-medium text-blue-900">
                  {app.sessions.reduce((total, session) => total + (session.notes?.length || 0), 0)}
                </p>
                <p className="text-sm text-blue-600">Messages</p>
              </div>
            </div>
            
            <button
              onClick={app.resetApp}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              ⚠️ Réinitialiser l'application
            </button>
          </div>
        </SettingsSection>

        {/* Debug Info - VERSION PhotoDataV2 */}
        <SettingsSection title="Informations de Debug" icon={<Info className="w-5 h-5" />}>
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono">
            <div>Version: v0.8.4 - Phase 10.3 PhotoDataV2</div>
            <div>Architecture: useAppState Hook + PhotoDataV2 + MasterIndexGenerator</div>
            <div>Modules: StateManager + ConnectionManager + DriveSync + MastodonData + PhotoDataV2</div>
            <div>Photos: {photoStats?.isLoaded ? 
              `${photoStats.totalPhotos} photos (${photoStats.totalDays} jours)` : 
              'Non chargées'
            }</div>
            <div>Posts: {mastodonStats?.totalPosts || 0} posts Mastodon</div>
            <div>Cache URL: {photoStats ? 'PhotoDataV2 ⚡' : 'Non initialisé'}</div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

// ========================================
// PAGE ACCUEIL
// ========================================

function HomePage() {
  const app = useAppState();
  const currentUser = userManager.getUser(app.currentUser);
  
  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <UserSelector app={app} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{currentUser.emoji}</div>
        <h1 className="text-4xl font-bold text-amber-900 mb-2">Mémoire du Mékong</h1>
        <p className="text-xl text-amber-700 mb-4">Bonjour {currentUser.name} !</p>
        <p className="text-amber-600">{currentUser.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <QuickAction 
          title="Mes Mémoires"
          description="Parcourir vos souvenirs"
          icon="🎭"
          page="memories"
          app={app}
        />
        <QuickAction 
          title="Chat Sessions"
          description="Conversations avec vos souvenirs"
          icon="💬"
          page="sessions"
          app={app}
        />
      </div>

      <div className="bg-white/60 backdrop-blur rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-amber-900 mb-4">Fonctionnalités à venir</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeaturePreview title="Timeline" description="Navigation chronologique" icon="📅" />
          <FeaturePreview title="Jeux" description="Quiz et mini-jeux" icon="🎮" />
          <FeaturePreview title="Export" description="Sauvegarde complète" icon="📦" />
        </div>
      </div>
    </div>
  );
}

// ========================================
// COMPOSANTS HELPERS
// ========================================

function SettingsSection({ title, icon, children }) {
  return (
    <div className="bg-white/60 backdrop-blur rounded-lg border border-amber-200 overflow-hidden shadow-sm">
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
        <div className="flex items-center space-x-2">
          {icon}
          <h2 className="text-lg font-semibold text-amber-900">{title}</h2>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function FeaturePreview({ title, description, icon }) {
  return (
    <div className="bg-white/60 backdrop-blur border border-amber-200 rounded-lg p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-amber-900 mb-1">{title}</h3>
      <p className="text-sm text-amber-600">{description}</p>
    </div>
  );
}

function QuickAction({ title, description, icon, page, app }) {
  return (
    <button
      onClick={() => app.updateCurrentPage(page)}
      className="bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg p-4 text-center transition-colors"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-medium text-amber-900">{title}</h3>
      <p className="text-xs text-amber-600">{description}</p>
    </button>
  );
}

function UserSelector({ app }) {
  const users = userManager.getAllUsers();
  
  return (
    <div className="bg-white/80 backdrop-blur rounded-lg p-6 shadow-md">
      <h2 className="text-xl font-semibold text-amber-900 mb-4">Choisir un utilisateur</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => app.updateCurrentUser(user.id)}
            className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg p-4 text-center transition-colors"
          >
            <div className="text-4xl mb-2">{user.emoji}</div>
            <h3 className="font-medium text-amber-900">{user.name}</h3>
            <p className="text-xs text-amber-600">{user.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}