/**
 * StartupPage.jsx v2.0 - Phase 19F
 * Design unifié avec éléphant fil conducteur
 * 
 * FIX v2.0 :
 * - Bug première connexion corrigé (délégation currentUser à dataManager)
 * - Design unifié (une seule page qui évolue)
 * - Éléphant comme mascotte constante
 * 
 * ÉTATS :
 * 1. CHECKING_AUTH  → Éléphant attend (☁️)
 * 2. CONNECTING     → Éléphant attend + bouton connexion
 * 3. LOADING_DATA   → Éléphant marche + progression
 * 4. SELECTING_USER → Éléphant interroge + sélection user
 * 5. READY          → Transition vers app
 */

import React, { useState, useEffect } from 'react';
import { APP_VERSION } from '../../config/version.js';
import { connectionManager } from '../../core/ConnectionManager.js';
import { dataManager } from '../../core/dataManager.js';
import { stateManager } from '../../core/StateManager.js';

const STATES = {
  CHECKING_AUTH: 'checking_auth',
  CONNECTING: 'connecting',
  LOADING_DATA: 'loading_data',
  SELECTING_USER: 'selecting_user',
  READY: 'ready',
  ERROR: 'error'
};

const LOADING_STEPS = [
  { id: 'moments', perso:'🐵', label: 'Récupération des Souvenirs', icon:'☁️' },
  { id: 'sessions', perso:'🙊', label: 'Chargement des causeries', icon:'💬' },
  { id: 'links', perso:'🙉', label: 'Un peu de liant', icon:'✨' },
  { id: 'finalize', perso:'🙈', label: 'Petite touche finale...', icon:'⏳' }
];

export default function StartupPage({ onReady }) {
  const [currentState, setCurrentState] = useState(STATES.CHECKING_AUTH);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // ⚠️ CRITIQUE : Flag pour éviter double connexion
  const hasCheckedConnection = React.useRef(false);

  // ============================================
  // SÉQUENCE D'INITIALISATION
  // ============================================

  useEffect(() => {
    let isSubscribed = true;
    
    const startSequence = async () => {
      try {
        console.log('🚀 StartupPage v2.0: Démarrage séquence');
        
        // ========================================
        // ÉTAPE 1 : CHECKING_AUTH
        // ========================================
        setCurrentState(STATES.CHECKING_AUTH);
        await sleep(2500); // ⚠️ CRITIQUE : Attendre 2.5s pour que ConnectionManager finisse son init()
        
        if (!isSubscribed) return;
        
        const connectionState = connectionManager.getState();
        console.log('📊 État connexion:', connectionState);
        
        // ⚠️ MARQUER : Check initial fait
        hasCheckedConnection.current = true;
        
        if (!connectionState.isOnline) {
          console.log('🔑 Connexion requise');
          setCurrentState(STATES.CONNECTING);
          return;
        }
        
        console.log('✅ Connecté, continuation...');
        await proceedToDataLoading();
        
      } catch (error) {
        console.error('❌ Erreur séquence startup:', error);
        if (isSubscribed) {
          setErrorMessage(error.message);
          setCurrentState(STATES.ERROR);
        }
      }
    };
    
    startSequence();
    
    return () => {
      isSubscribed = false;
    };
  }, []);

  // ============================================
  // SUBSCRIPTION CONNECTIONMANAGER
  // ============================================
  
  useEffect(() => {
    const unsubscribe = connectionManager.subscribe((connectionState) => {
      console.log('📡 ConnectionManager event:', connectionState.state);
      
      // ⚠️ CRITIQUE : Ignorer si check initial pas encore fait
      if (!hasCheckedConnection.current) {
        console.log('⏭️ Check initial pas fait, ignorer event');
        return;
      }
      
      // Détecter connexion réussie
      if (connectionState.isOnline && currentState === STATES.CONNECTING) {
        console.log('✅ Connexion détectée, passage chargement');
        proceedToDataLoading();
      }
      
      // Détecter erreurs
      if (connectionState.hasError && currentState === STATES.CONNECTING) {
        console.error('❌ Erreur connexion:', connectionState.lastError);
        setErrorMessage(connectionState.lastError);
      }
    });
    
    return unsubscribe;
  }, [currentState]);

  // ============================================
  // SUBSCRIPTION DATAMANAGER
  // ============================================
  
  useEffect(() => {
    const unsubscribe = dataManager.subscribe((appState) => {
      // Détecter fin initialisation
      if (appState.isInitialized && currentState === STATES.LOADING_DATA) {
        console.log('✅ DataManager initialisé');
        
        // Vérifier si user déjà sélectionné
        if (appState.currentUser) {
          console.log('✅ User déjà défini:', appState.currentUser);
          setCurrentState(STATES.READY);
          setTimeout(() => {
            if (onReady) onReady();
          }, 500);
        } else {
          console.log('👤 Sélection utilisateur requise');
          setCurrentState(STATES.SELECTING_USER);
        }
      }
      
      // Détecter sélection user après coup
      if (appState.currentUser && currentState === STATES.SELECTING_USER) {
        console.log('✅ User sélectionné:', appState.currentUser);
        setCurrentState(STATES.READY);
        setTimeout(() => {
          if (onReady) onReady();
        }, 500);
      }
    });
    
    return unsubscribe;
  }, [currentState, onReady]);

  // ============================================
  // CONTINUATION APRÈS CONNEXION
  // ============================================
  
  const proceedToDataLoading = async () => {
    console.log('📦 Passage au chargement des données');
    setCurrentState(STATES.LOADING_DATA);
    setCurrentStep(0);
    setProgressPercent(0);
    
    // Animation progression (indépendante du vrai chargement)
    animateProgress();
    
    // Note: Le vrai chargement est géré par dataManager
    // qui se déclenche automatiquement via handleConnectionChange
  };

  const animateProgress = async () => {
    const totalDuration = 4000; // 4s
    const stepDuration = totalDuration / LOADING_STEPS.length;
    
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setCurrentStep(i);
      
      // Animer progression fluide
      const startPercent = (i / LOADING_STEPS.length) * 100;
      const endPercent = ((i + 1) / LOADING_STEPS.length) * 100;
      
      const steps = 20;
      for (let j = 0; j <= steps; j++) {
        const percent = startPercent + (endPercent - startPercent) * (j / steps);
        setProgressPercent(Math.round(percent));
        await sleep(stepDuration / steps);
      }
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleConnect = async () => {
    try {
      console.log('🔌 Connexion manuelle...');
      setErrorMessage(null);
      await connectionManager.connect();
      // Suite gérée par subscription
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      setErrorMessage(error.message);
    }
  };

  const handleUserSelected = async (userId) => {
    console.log('👤 Utilisateur sélectionné:', userId);
    
    // ✅ FIX v2.0: Laisser dataManager gérer
    dataManager.setCurrentUser(userId);
    
    // La transition vers READY est gérée par la subscription dataManager
  };

  // ============================================
  // RENDER
  // ============================================

  if (currentState === STATES.ERROR) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-black dark:to-gray-900 text-center p-4">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">
          Erreur de chargement
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {errorMessage || 'Une erreur est survenue'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Recharger l'application
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-black dark:to-gray-900 p-4">
      
      {/* ========================================
          HEADER FIXE
          ======================================== */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          Mémoire du Mékong
        </h1>
        <p className="text-xs text-gray-400">Version {APP_VERSION}</p>
      </div>

      {/* ========================================
          ÉLÉPHANT (ANIMATION SELON ÉTAT)
          ======================================== */}
      <div className="mb-8">
        {currentState === STATES.CHECKING_AUTH && (
          <div className="text-8xl animate-float">🙉</div>
        )}
        
        {currentState === STATES.CONNECTING && (
          <div className="text-8xl animate-pulse-soft">🙈</div>
        )}
        
        {currentState === STATES.LOADING_DATA && (
  <div className="relative inline-block">
    <div className="text-8xl animate-bounce-enhanced"> {LOADING_STEPS[currentStep]?.perso}</div>
    {LOADING_STEPS[currentStep]?.icon && (
      <p className="absolute top-0 right-0 text-4xl font-medium">
        {LOADING_STEPS[currentStep]?.icon}
      </p>
    )}
  </div>
)}
        
        {currentState === STATES.SELECTING_USER && (
          <div className="text-8xl">🙊</div>
        )}
        
        {currentState === STATES.READY && (
          <div className="text-8xl animate-bounce">🐵</div>
        )}
      </div>

      {/* ========================================
          CONTENU DYNAMIQUE SELON ÉTAT
          ======================================== */}
      
      {/* ÉTAT 1 : CHECKING_AUTH */}
      {currentState === STATES.CHECKING_AUTH && (
        <div className="text-center animate-fade-in">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
            Connexion au Drive...
          </p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      {/* ÉTAT 2 : CONNECTING */}
      {currentState === STATES.CONNECTING && (
        <div className="text-center animate-fade-in w-full max-w-md">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
            Authentification requise
          </p>
          
          {errorMessage && (
            <p className="text-red-500 text-sm mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded">
              {errorMessage}
            </p>
          )}
          
          <button
            onClick={handleConnect}
            className="px-8 py-4 bg-blue-500 text-white text-lg rounded-lg hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Se connecter au Drive
          </button>
        </div>
      )}

      {/* ÉTAT 3 : LOADING_DATA */}
      {currentState === STATES.LOADING_DATA && (
        <div className="w-full max-w-md animate-fade-in">
          {/* Barre de progression */}
          <div className="mb-6">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              {progressPercent}%
            </p>
          </div>

          {/* Étape actuelle */}
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-200 text-lg font-medium mb-4">
              {LOADING_STEPS[currentStep]?.label || 'Chargement...'}
            </p>            
          </div>
        </div>
      )}

      {/* ÉTAT 4 : SELECTING_USER */}
      {currentState === STATES.SELECTING_USER && (
        <div className="w-full max-w-md animate-fade-in">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 text-center">
            Qui êtes-vous ?
          </p>

          <div className="flex flex-col gap-3">
            {[
              { id: 'lambert', name: 'Lambert', emoji: '🚴' },
              { id: 'tom', name: 'Tom', emoji: '🧘' },
              { id: 'duo', name: 'Duo', emoji: '🍃' }
            ].map(user => (
              <button
                key={user.id}
                onClick={() => handleUserSelected(user.id)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-400"
              >
                <span className="text-4xl">{user.emoji}</span>
                <span className="text-xl font-medium text-gray-800 dark:text-gray-200">
                  {user.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ÉTAT 5 : READY */}
      {currentState === STATES.READY && (
        <div className="text-center animate-fade-in">
          <p className="text-green-600 dark:text-green-400 text-lg font-medium">
            ✓ Prêt !
          </p>
        </div>
      )}

    </div>
  );
}

// ============================================
// UTILITAIRES
// ============================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));