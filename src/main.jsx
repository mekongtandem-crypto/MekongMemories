/**
 * main.jsx v2.6 - Phase 18b : Injection ContentLinks
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import { themeAssignments } from './core/ThemeAssignments.js';
import { contentLinks } from './core/ContentLinks.js';  // ⭐ AJOUT
import { saynetesManager } from './core/SaynetesManager.js';  // ⭐ v3.0 : AJOUT
import './index.css';

// --- Import de TOUS les modules ---
import { connectionManager } from './core/ConnectionManager.js';
import { driveSync } from './core/DriveSync.js';
import { dataManager } from './core/dataManager.js';
import { photoDataV2 } from './core/PhotoDataV2.js';
import { mastodonData } from './core/MastodonData.js';
import { masterIndexGenerator } from './core/MasterIndexGenerator.js';
import { stateManager } from './core/StateManager.js';
import { notificationManager } from './core/NotificationManager.js';

console.log('🚀 Démarrage de Mémoire du Mékong v2.6 (Phase 18b)...');

// --- Injection de TOUTES les dépendances ---
driveSync.initialize({ connectionManager });
photoDataV2.initializeDependencies({ stateManager });

dataManager.initializeDependencies({
  connectionManager,
  driveSync,
  stateManager,
  notificationManager,
  themeAssignments,
  contentLinks,  // ⭐ AJOUT
  saynetesManager   // ⭐ v3.0 : AJOUT
});

masterIndexGenerator.initialize({
  driveSync,
  mastodonData,
});

// Init themeAssignments, contentLinks et saynetesManager au démarrage
connectionManager.subscribe(async (connectionState) => {
  if (connectionState.isOnline) {
    if (!themeAssignments.isLoaded) {
      await themeAssignments.init();
    }
    if (!contentLinks.isLoaded) {  // ⭐ AJOUT
      await contentLinks.init();
    }
    if (!saynetesManager.isLoaded) {  // ⭐ v3.0 : AJOUT
      await saynetesManager.init();
    }
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