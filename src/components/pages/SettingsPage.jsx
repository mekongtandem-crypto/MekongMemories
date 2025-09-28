/**
 * SettingsPage.jsx v4.0 - SECTIONS COLLAPSIBLES
 * ✅ AMÉLIORATION: Organisation en sections pliables/dépliables
 * ✅ UX: Interface plus compacte et organisée
 * ✅ ÉTAT: Mémorisation des sections ouvertes/fermées
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { 
  CheckCircle, RefreshCw, Wrench, Database, BookOpen, HardDrive, Camera, ImageIcon, 
  Zap, AlertTriangle, ChevronDown, Users, Cloud, BarChart3
} from 'lucide-react';

// Import des modules nécessaires pour la régénération
import { masterIndexGenerator } from '../../core/MasterIndexGenerator.js';
import { mastodonData } from '../../core/MastodonData.js';
import { dataManager } from '../../core/dataManager.js';

export default function SettingsPage() {
  const app = useAppState();
  const { currentUser, setCurrentUser, updateCurrentPage } = app;
  const allUsers = userManager.getAllUsers();
  
  // ✅ État des sections (ouvertes/fermées)
  const [openSections, setOpenSections] = useState({
    profiles: true,    // Profils toujours ouverts par défaut
    connection: false, // Connexion fermée par défaut
    data: false,       // Données fermées par défaut
    regeneration: false // Régénération fermée par défaut
  });
  
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

  // ✅ FONCTION: Toggle section
  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
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
    <div className="max-w-2xl mx-auto py-6 space-y-4">
      
      {/* En-tête */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Réglages</h1>
        <p className="text-gray-600 mt-1">Configuration et synchronisation de l'application</p>
      </div>

      {/* ✅ SECTION 1: PROFILS (toujours visible) */}
      <CollapsibleSection
        title="Profils Utilisateurs"
        icon={Users}
        isOpen={openSections.profiles}
        onToggle={() => toggleSection('profiles')}
        color="text-blue-500"
        badge={currentUser ? currentUser.name : 'Aucun'}
      >
        <div className="space-y-3">
          {allUsers.map((user) => {
            const style = userManager.getUserStyle(user.id);
            const isActive = currentUser && currentUser.id === user.id;

            return (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className={`w-full flex items-center justify-between p-3 border rounded-lg transition-all transform hover:scale-[1.02] ${
                  isActive ? 'ring-2 ring-offset-2 ring-amber-500' : ''
                } ${style.bg} ${style.border}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{user.emoji}</span>
                  <div>
                    <span className={`text-lg font-bold ${style.text}`}>{user.name}</span>
                    <p className={`text-sm ${style.text} opacity-80`}>{user.description}</p>
                  </div>
                </div>
                
                {isActive && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* ✅ SECTION 2: DONNÉES */}
      <CollapsibleSection
        title="Statut des Données"
        icon={BarChart3}
        isOpen={openSections.data}
        onToggle={() => toggleSection('data')}
        color="text-purple-500"
        badge={`${dataStatus.totalPhotos} photos`}
      >
        <div className="grid md:grid-cols-2 gap-3">
          <StatCard icon={BookOpen} color="text-blue-500" title="Posts Mastodon" value={dataStatus.mastodonCount} />
          <StatCard icon={HardDrive} color="text-gray-500" title="Moments" value={dataStatus.momentCount} />
          <StatCard icon={ImageIcon} color="text-purple-500" title="Photos articles" value={dataStatus.photosFromPosts} />
          <StatCard icon={Camera} color="text-green-500" title="Photos moments" value={dataStatus.photosFromDays} />
        </div>
        <div className="mt-3">
          <StatCard icon={Database} color="text-red-500" title="Total Photos" value={dataStatus.totalPhotos} isLarge={true} />
        </div>
      </CollapsibleSection>

      {/* ✅ SECTION 3: RÉGÉNÉRATION */}
      <CollapsibleSection
        title="Régénération de l'Index"
        icon={Zap}
        isOpen={openSections.regeneration}
        onToggle={() => toggleSection('regeneration')}
        color="text-amber-500"
        badge={operations.regenerating ? 'En cours...' : 'Prêt'}
        urgent={operations.error}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Synchronisation complète</h3>
                <ul className="text-amber-700 text-sm space-y-1 list-disc list-inside">
                  <li>Import des posts Mastodon</li>
                  <li>Scan des dossiers photos Drive</li>
                  <li>Génération de l'index unifié</li>
                  <li>Rechargement de l'application</li>
                </ul>
                <p className="text-amber-600 text-xs mt-2 font-medium">
                  ⏱️ Durée : 2-5 minutes
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleIndexRegeneration}
            disabled={operations.regenerating || !app.connection?.isOnline}
            className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-all flex items-center justify-center space-x-3 ${
              operations.regenerating 
                ? 'bg-amber-400 text-amber-900 cursor-not-allowed' 
                : app.connection?.isOnline
                  ? 'bg-amber-500 hover:bg-amber-600 text-white transform hover:scale-105'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${operations.regenerating ? 'animate-spin' : ''}`} />
            <span>
              {operations.regenerating 
                ? 'Régénération...' 
                : !app.connection?.isOnline
                  ? 'Connexion requise'
                  : 'Lancer la Régénération'
              }
            </span>
          </button>

          {/* Affichage de l'état */}
          {(operations.currentStep || operations.error) && (
            <div className={`p-3 rounded-lg text-center text-sm ${
              operations.error 
                ? 'bg-red-50 border border-red-200 text-red-800' 
                : operations.currentStep.includes('✅')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <p className="font-medium">
                {operations.error || operations.currentStep}
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ✅ SECTION 4: CONNEXION */}
      <CollapsibleSection
        title="État de la Connexion"
        icon={Cloud}
        isOpen={openSections.connection}
        onToggle={() => toggleSection('connection')}
        color="text-blue-500"
        badge={app.connection?.isOnline ? 'Connecté' : 'Déconnecté'}
        urgent={!app.connection?.isOnline}
      >
        <div className="space-y-3">
          <InfoRow 
            label="Statut Google Drive"
            value={app.connection?.isOnline ? '✅ Connecté' : '❌ Déconnecté'}
            status={app.connection?.isOnline ? 'success' : 'error'}
          />
          
          {app.connection?.userInfo && (
            <InfoRow 
              label="Utilisateur connecté"
              value={app.connection.userInfo.email}
              status="neutral"
            />
          )}
          
          <InfoRow 
            label="Sessions actives"
            value={`${app.sessions?.length || 0} session(s)`}
            status="neutral"
          />
          
          {app.connection?.lastError && (
            <InfoRow 
              label="Dernière erreur"
              value={app.connection.lastError}
              status="error"
            />
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ====================================================================
// COMPOSANT : SECTION COLLAPSIBLE
// ====================================================================
const CollapsibleSection = ({ 
  title, icon: Icon, isOpen, onToggle, children, color, badge, urgent 
}) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <button
      onClick={onToggle}
      className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
        isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {badge && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            urgent 
              ? 'bg-red-100 text-red-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {badge}
          </span>
        )}
      </div>
      
      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
        isOpen ? 'rotate-180' : ''
      }`} />
    </button>
    
    {isOpen && (
      <div className="p-4 border-t border-gray-100">
        {children}
      </div>
    )}
  </div>
);

// ====================================================================
// COMPOSANT : CARTE DE STATISTIQUE
// ====================================================================
const StatCard = ({ icon: Icon, color, title, value, isLarge = false }) => (
  <div className={`bg-gray-50 p-3 rounded-lg ${isLarge ? 'text-center' : ''}`}>
    <h3 className={`font-semibold flex items-center text-sm ${isLarge ? 'justify-center' : ''}`}>
      <Icon className={`w-4 h-4 mr-2 ${color}`} />
      {title}
    </h3>
    <p className={`font-bold ${isLarge ? 'text-2xl mt-1' : 'text-xl'}`}>{value}</p>
  </div>
);

// ====================================================================
// COMPOSANT : LIGNE D'INFORMATION
// ====================================================================
const InfoRow = ({ label, value, status }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <span className="font-medium text-gray-700 text-sm">{label}</span>
    <span className={`text-sm font-medium ${
      status === 'success' ? 'text-green-700' :
      status === 'error' ? 'text-red-700' :
      'text-gray-600'
    }`}>
      {value}
    </span>
  </div>
);