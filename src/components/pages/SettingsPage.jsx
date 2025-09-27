// SettingsPage.jsx - Version Améliorée 2.9

import React, { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager';
import { CheckCircle } from 'lucide-react';

import { masterIndexGenerator } from '../../core/MasterIndexGenerator.js';
import { mastodonData } from '../../core/MastodonData.js';
import { dataManager } from '../../core/dataManager.js';
import { RefreshCw, Wrench, Database, BookOpen, HardDrive, Camera, ImageIcon } from 'lucide-react';

export default function SettingsPage() {
  const { currentUser, setCurrentUser, updateCurrentPage } = useAppState();
  const allUsers = userManager.getAllUsers();
  
  const handleSelectUser = (userId) => {
    // 1. On change l'utilisateur actif
    setCurrentUser(userId);
    
    // 2. Pour une meilleure expérience, on retourne à la page principale
    updateCurrentPage('memories'); 
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
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
              className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all transform hover:scale-105 ${isActive ? 'ring-2 ring-offset-2 ring-amber-500' : ''} ${style.bg} ${style.border}`}
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
    </div>
  );

  

  // L'état va maintenant contenir les stats détaillées
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
  }, [loadDataStatus, app.masterIndex]); // On réagit aussi au changement de masterIndex

  const handleIndexRegeneration = async () => {
    setOperations({ generating: true, currentStep: 'Importation des posts Mastodon...' });
    try {
      await mastodonData.importFromGoogleDrive();
      
      setOperations({ generating: true, currentStep: 'Génération du nouvel index...' });
      const generateResult = await masterIndexGenerator.generateMomentsStructure();
      if (!generateResult.success) throw new Error(generateResult.error);

      setOperations({ generating: true, currentStep: 'Mise à jour de l\'application...' });
      await dataManager.reloadMasterIndex();

      setOperations({ generating: false, currentStep: '✅ Régénération terminée !' });
      // Pas besoin d'appeler loadDataStatus ici car le useEffect s'en chargera
    } catch (error) {
      console.error('❌ Erreur de régénération:', error);
      setOperations({ generating: false, currentStep: `❌ Erreur: ${error.message}` });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Réglages et Synchronisation</h1>
      </div>

       <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center"><Database className="w-6 h-6 mr-3 text-purple-500" /> Statut des Données</h2>
          
          {/* --- NOUVEL AFFICHAGE DES STATS --- */}
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

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center"><Wrench className="w-6 h-6 mr-3 text-amber-500" />Actions</h2>
        <button
          onClick={handleIndexRegeneration}
          disabled={operations.generating || !app.connection.isOnline}
          className="w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 disabled:bg-gray-400 flex items-center justify-center text-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 mr-3 ${operations.generating ? 'animate-spin' : ''}`} />
          {operations.generating ? 'Synchronisation en cours...' : 'Lancer la Synchronisation Complète'}
        </button>
        {operations.currentStep && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
                <p className="text-sm font-medium">{operations.currentStep}</p>
            </div>
        )}
      </div>
    </div>
  );
}

// Petit composant pour afficher les cartes de statistiques
const StatCard = ({ icon: Icon, color, title, value, isLarge = false }) => (
  <div className={`bg-gray-50 p-4 rounded-lg ${isLarge ? 'text-center' : ''}`}>
    <h3 className={`font-semibold flex items-center ${isLarge ? 'justify-center' : ''}`}>
      <Icon className={`w-5 h-5 mr-2 ${color}`} />
      {title}
    </h3>
    <p className={`font-bold ${isLarge ? 'text-3xl mt-1' : 'text-2xl'}`}>{value}</p>
  </div>
);
