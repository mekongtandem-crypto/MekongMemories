/**
 * SettingsPage.jsx v3.0 - COMPLET avec régénération d'index
 * ✅ AJOUT: Bouton de régénération d'index master
 * ✅ CORRECTION: Gestion d'état cohérente avec les opérations longues
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { CheckCircle, RefreshCw, Wrench, Database, BookOpen, HardDrive, Camera, ImageIcon, Zap, AlertTriangle } from 'lucide-react';

// Import des modules nécessaires pour la régénération
import { masterIndexGenerator } from '../../core/MasterIndexGenerator.js';
import { mastodonData } from '../../core/MastodonData.js';
import { dataManager } from '../../core/dataManager.js';

export default function SettingsPage() {
  const app = useAppState();
  const { currentUser, setCurrentUser, updateCurrentPage } = app;
  const allUsers = userManager.getAllUsers();
  
  // États pour les opérations longues
  const [operations, setOperations] = useState({
    regenerating: false,
    currentStep: '',
    error: null
  });

  // États pour les statistiques
  const [dataStatus, setDataStatus] = useState({
    mastodonCount: 0,
    momentCount: 0,
    photosFromDays: 0,
    photosFromPosts: 0,
    totalPhotos: 0,
  });

  const loadDataStatus = useCallback(() => {
    const mastodonStats = mastodonData.getStats();
    const metadata = app.masterIndex?.metadata || {};
    
    setDataStatus({
      mastodonCount: mastodonStats.totalPosts || 0,
      momentCount: metadata.total_moments || 0,
      photosFromDays: metadata.total_photos_from_days || 0,
      photosFromPosts: metadata.total_photos_from_posts || 0,
      totalPhotos: metadata.total_photos || 0,
    });
  }, [app.masterIndex]);

  useEffect(() => {
    loadDataStatus();
  }, [loadDataStatus, app.masterIndex]);

  const handleSelectUser = (userId) => {
    setCurrentUser(userId);
    updateCurrentPage('memories'); 
  };

  // ✅ FONCTION PRINCIPALE: Régénération complète de l'index
  const handleIndexRegeneration = async () => {
    if (!app.connection?.isOnline) {
      setOperations({ 
        regenerating: false, 
        currentStep: '❌ Connexion Google Drive requise',
        error: 'Veuillez vous connecter à Google Drive' 
      });
      return;
    }

    setOperations({ regenerating: true, currentStep: 'Préparation...', error: null });
    
    try {
      // Étape 1: Import des posts Mastodon
      setOperations({ 
        regenerating: true, 
        currentStep: '📥 Importation des posts Mastodon depuis Google Drive...',
        error: null 
      });
      
      await mastodonData.importFromGoogleDrive();
      console.log('✅ Posts Mastodon importés');

      // Étape 2: Génération du nouvel index
      setOperations({ 
        regenerating: true, 
        currentStep: '🏗️ Analyse des dossiers photos et génération de l\'index unifié...',
        error: null 
      });
      
      const generateResult = await masterIndexGenerator.generateMomentsStructure();
      
      if (!generateResult.success) {
        throw new Error(generateResult.error || 'Échec de la génération');
      }
      
      console.log('✅ Index unifié généré');

      // Étape 3: Rechargement dans l'application
      setOperations({ 
        regenerating: true, 
        currentStep: '🔄 Mise à jour de l\'application...',
        error: null 
      });
      
      const reloadResult = await dataManager.reloadMasterIndex();
      
      if (!reloadResult.success) {
        throw new Error('Échec du rechargement dans l\'application');
      }

      // ✅ Succès
      setOperations({ 
        regenerating: false, 
        currentStep: '✅ Régénération terminée avec succès !',
        error: null 
      });
      
      // Rafraîchir les statistiques
      loadDataStatus();
      
      // Effacer le message de succès après 5 secondes
      setTimeout(() => {
        setOperations({ regenerating: false, currentStep: '', error: null });
      }, 5000);

    } catch (error) {
      console.error('❌ Erreur régénération complète:', error);
      setOperations({ 
        regenerating: false, 
        currentStep: '',
        error: `Erreur: ${error.message}` 
      });
      
      // Effacer l'erreur après 10 secondes
      setTimeout(() => {
        setOperations({ regenerating: false, currentStep: '', error: null });
      }, 10000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      
      {/* Section Profils */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profils</h1>
        <p className="text-gray-600 mt-2">Sélectionnez le profil actif pour la session.</p>
      </div>

      <div className="space-y-4">
        {allUsers.map((user) => {
          const style = userManager.getUserStyle(user.id);
          const isActive = currentUser && currentUser.id === user.id;

          return (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user.id)}
              className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all transform hover:scale-105 ${
                isActive ? 'ring-2 ring-offset-2 ring-amber-500' : ''
              } ${style.bg} ${style.border}`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{user.emoji}</span>
                <div>
                  <span className={`text-xl font-bold ${style.text}`}>{user.name}</span>
                  <p className={`text-sm ${style.text} opacity-80`}>{user.description}</p>
                </div>
              </div>
              
              {isActive && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Section Statut des Données */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Database className="w-6 h-6 mr-3 text-purple-500" /> 
          Statut des Données
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={BookOpen} color="text-blue-500" title="Posts Mastodon" value={dataStatus.mastodonCount} />
          <StatCard icon={HardDrive} color="text-gray-500" title="Moments Unifiés" value={dataStatus.momentCount} />
          <StatCard icon={ImageIcon} color="text-purple-500" title="Photos d'Article" value={dataStatus.photosFromPosts} />
          <StatCard icon={Camera} color="text-green-500" title="Photos de Moment" value={dataStatus.photosFromDays} />
          <div className="lg:col-span-3">
            <StatCard icon={Database} color="text-red-500" title="Total Photos" value={dataStatus.totalPhotos} isLarge={true} />
          </div>
        </div>
      </div>

      {/* ✅ SECTION PRINCIPALE: Régénération d'Index */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Zap className="w-6 h-6 mr-3 text-amber-500" />
          Régénération de l'Index Master
        </h2>
        
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Processus complet de synchronisation</h3>
                <p className="text-amber-700 text-sm mb-3">
                  Cette opération va :
                </p>
                <ul className="text-amber-700 text-sm space-y-1 list-disc list-inside">
                  <li>Importer les derniers posts depuis Mastodon</li>
                  <li>Scanner tous les dossiers de photos sur Google Drive</li>
                  <li>Générer un nouvel index unifié des moments</li>
                  <li>Recharger les données dans l'application</li>
                </ul>
                <p className="text-amber-600 text-xs mt-3 font-medium">
                  ⏱️ Durée estimée : 2-5 minutes selon la taille des données
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleIndexRegeneration}
            disabled={operations.regenerating || !app.connection?.isOnline}
            className={`w-full font-bold py-4 px-6 rounded-lg text-lg transition-all flex items-center justify-center space-x-3 ${
              operations.regenerating 
                ? 'bg-amber-400 text-amber-900 cursor-not-allowed' 
                : app.connection?.isOnline
                  ? 'bg-amber-500 hover:bg-amber-600 text-white transform hover:scale-105'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-6 h-6 ${operations.regenerating ? 'animate-spin' : ''}`} />
            <span>
              {operations.regenerating 
                ? 'Régénération en cours...' 
                : !app.connection?.isOnline
                  ? 'Connexion Google Drive requise'
                  : 'Lancer la Régénération Complète'
              }
            </span>
          </button>

          {/* Affichage de l'état */}
          {(operations.currentStep || operations.error) && (
            <div className={`p-4 rounded-lg text-center ${
              operations.error 
                ? 'bg-red-50 border border-red-200' 
                : operations.currentStep.includes('✅')
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`font-medium ${
                operations.error 
                  ? 'text-red-800' 
                  : operations.currentStep.includes('✅')
                    ? 'text-green-800'
                    : 'text-blue-800'
              }`}>
                {operations.error || operations.currentStep}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Section État de la Connexion */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Wrench className="w-6 h-6 mr-3 text-blue-500" />
          État de la Connexion
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Statut Google Drive</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              app.connection?.isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {app.connection?.isOnline ? '✅ Connecté' : '❌ Déconnecté'}
            </span>
          </div>
          
          {app.connection?.userInfo && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Utilisateur connecté</span>
              <span className="text-sm text-gray-600">{app.connection.userInfo.email}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Sessions actives</span>
            <span className="text-sm text-gray-600">{app.sessions?.length || 0} session(s)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// COMPOSANT UTILITAIRE: Carte de statistique
// ====================================================================
const StatCard = ({ icon: Icon, color, title, value, isLarge = false }) => (
  <div className={`bg-gray-50 p-4 rounded-lg ${isLarge ? 'text-center' : ''}`}>
    <h3 className={`font-semibold flex items-center ${isLarge ? 'justify-center' : ''}`}>
      <Icon className={`w-5 h-5 mr-2 ${color}`} />
      {title}
    </h3>
    <p className={`font-bold ${isLarge ? 'text-3xl mt-1' : 'text-2xl'}`}>{value}</p>
  </div>
);