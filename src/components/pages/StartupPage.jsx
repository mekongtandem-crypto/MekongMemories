/**
 * StartupPage.jsx v2.1 - Dark mode
 * ✅ Support dark mode complet (déjà présent mais amélioré)
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
  
  const hasCheckedConnection = React.useRef(false);

  useEffect(() => {
    let isSubscribed = true;
    
    const startSequence = async () => {
      try {
        console.log('🚀 StartupPage v2.1: Démarrage séquence');
        
        setCurrentState(STATES.CHECKING_AUTH);
        await sleep(2500);
        
        if (!isSubscribed) return;
        
        const connectionState = connectionManager.getState();
        console.log('📊 État connexion:', connectionState);
        
        hasCheckedConnection.current = true;
        
        if (!connectionState.isOnline) {
          console.log('🔒 Connexion requise');
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

  useEffect(() => {
    const unsubscribe = connectionManager.subscribe((connectionState) => {
      console.log('📡 ConnectionManager event:', connectionState.state);
      
      if (!hasCheckedConnection.current) {
        console.log('⏸️ Check initial pas fait, ignorer event');
        return;
      }
      
      if (connectionState.isOnline && currentState === STATES.CONNECTING) {
        console.log('✅ Connexion détectée, passage chargement');
        proceedToDataLoading();
      }
      
      if (connectionState.hasError && currentState === STATES.CONNECTING) {
        console.error('❌ Erreur connexion:', connectionState.lastError);
        setErrorMessage(connectionState.lastError);
      }
    });
    
    return unsubscribe;
  }, [currentState]);

  useEffect(() => {
    const unsubscribe = dataManager.subscribe((appState) => {
      if (appState.isInitialized && currentState === STATES.LOADING_DATA) {
        console.log('✅ DataManager initialisé');
        
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

  const proceedToDataLoading = async () => {
    console.log('📦 Passage au chargement des données');
    setCurrentState(STATES.LOADING_DATA);
    setCurrentStep(0);
    setProgressPercent(0);
    
    animateProgress();
  };

  const animateProgress = async () => {
    const totalDuration = 4000;
    const stepDuration = totalDuration / LOADING_STEPS.length;
    
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setCurrentStep(i);
      
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

  const handleConnect = async () => {
    try {
      console.log('🔌 Connexion manuelle...');
      setErrorMessage(null);
      await connectionManager.connect();
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      setErrorMessage(error.message);
    }
  };

  const handleUserSelected = async (userId) => {
    console.log('👤 Utilisateur sélectionné:', userId);
    dataManager.setCurrentUser(userId);
  };

  if (currentState === STATES.ERROR) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black text-center p-4">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
          Erreur de chargement
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {errorMessage || 'Une erreur est survenue'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors duration-150"
        >
          Recharger l'application
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-4">
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          Mémoire du Mékong
        </h1>
        <p className="text-xs text-gray-400 dark:text-gray-500">Version {APP_VERSION}</p>
      </div>

      <div className="mb-4">
        {currentState === STATES.CHECKING_AUTH && (
          <div className="text-8xl animate-bounce-subtle">{LOADING_STEPS[currentStep]?.perso}</div>
        )}
        
        {currentState === STATES.CONNECTING && (
          <div className="text-8xl animate-pulse-soft">{LOADING_STEPS[currentStep]?.perso}</div>
        )}
        
        {currentState === STATES.LOADING_DATA && (
          <div className="relative inline-block">
            <div className="text-8xl animate-walk">{LOADING_STEPS[currentStep]?.perso}</div>
            {LOADING_STEPS[currentStep]?.icon && (
              <p className="absolute top-0 right-0 text-4xl font-medium">
                {LOADING_STEPS[currentStep]?.icon}
              </p>
            )}
          </div>
        )}
        
        {currentState === STATES.SELECTING_USER && (
          <div className="text-8xl">{LOADING_STEPS[currentStep]?.perso}</div>
        )}
        
        {currentState === STATES.READY && (
          <div className="text-8xl animate-bounce">{LOADING_STEPS[currentStep]?.perso}</div>
        )}
      </div>

      {currentState === STATES.CHECKING_AUTH && (
        <div className="text-center animate-fade-in">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
            Connexion au Drive...
          </p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      {currentState === STATES.CONNECTING && (
        <div className="text-center animate-fade-in w-full max-w-md">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
            Authentification requise
          </p>
          
          {errorMessage && (
            <p className="text-red-500 dark:text-red-400 text-sm mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded">
              {errorMessage}
            </p>
          )}
          
          <button
            onClick={handleConnect}
            className="px-8 py-4 bg-amber-500 text-white text-lg rounded-lg hover:bg-amber-600 transition-all duration-150 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Se connecter au Drive
          </button>
        </div>
      )}

      {currentState === STATES.LOADING_DATA && (
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-200 text-lg font-medium mb-4">
              {LOADING_STEPS[currentStep]?.label || 'Chargement...'}
            </p>            
          </div>
        
          <div className="mb-6">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              {progressPercent}%
            </p>
          </div>
        </div>
      )}

      {currentState === STATES.SELECTING_USER && (
        <div className="w-full max-w-md animate-fade-in">
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 text-center">
            Qui êtes-vous ?
          </p>

          <div className="flex flex-col gap-3">
            {[
              { id: 'lambert', name: 'Lambert', emoji: '🚴' },
              { id: 'tom', name: 'Tom', emoji: '🧘' },
              { id: 'duo', name: 'Duo', emoji: '🃏' }
            ].map(user => (
              <button
                key={user.id}
                onClick={() => handleUserSelected(user.id)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-150 border-2 border-transparent hover:border-amber-400"
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));