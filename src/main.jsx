// src/main.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import { themeAssignments } from './core/ThemeAssignments.js';
import './index.css';

// --- Import de TOUS les modules ---
import { connectionManager } from './core/ConnectionManager.js';
import { driveSync } from './core/DriveSync.js';
import { dataManager } from './core/dataManager.js';
import { photoDataV2 } from './core/PhotoDataV2.js';
import { mastodonData } from './core/MastodonData.js';
import { masterIndexGenerator } from './core/MasterIndexGenerator.js';
import { stateManager } from './core/StateManager.js';
import { notificationManager } from './core/NotificationManager.js'; // ✅ NOUVEAU

console.log('🚀 Démarrage de Mémoire du Mékong v2.4 (Phase 15a)...');

// --- Injection de TOUTES les dépendances ---
driveSync.initialize({ connectionManager });
photoDataV2.initializeDependencies({ stateManager });

// ✅ NOUVEAU : Initialiser themeAssignments
dataManager.initializeDependencies({
  connectionManager,
  driveSync,
  stateManager,
  notificationManager,
  themeAssignments  // ✅ AJOUTÉ
});

masterIndexGenerator.initialize({
  driveSync,
  mastodonData,
});

console.log('✅ Dépendances injectées. Prêt à démarrer.');

// ✅ AJOUTER CES LIGNES :
// Init themeAssignments au démarrage
connectionManager.subscribe(async (connectionState) => {
  if (connectionState.isOnline && !themeAssignments.isLoaded) {
    await themeAssignments.init();
  }
});

console.log('✅ Dépendances injectées. Prêt à démarrer.');

// --- Démarrage de React ---
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);