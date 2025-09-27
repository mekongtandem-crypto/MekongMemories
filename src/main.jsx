// src/main.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import './index.css';

// --- Import de TOUS les modules ---
import { connectionManager } from './core/ConnectionManager.js';
import { driveSync } from './core/DriveSync.js';
import { dataManager } from './core/dataManager.js';
import { photoDataV2 } from './core/PhotoDataV2.js';
import { mastodonData } from './core/MastodonData.js';
import { masterIndexGenerator } from './core/MasterIndexGenerator.js';
import { stateManager } from './core/StateManager.js';

console.log('🚀 Démarrage de Mémoire du Mékong (Version Stable)...');

// --- Injection de TOUTES les dépendances ---
driveSync.initialize({ connectionManager });
photoDataV2.initializeDependencies({ stateManager });

// Le bloc corrigé pour dataManager
dataManager.initializeDependencies({
  connectionManager,
  driveSync,
  stateManager // On injecte stateManager ici
});

masterIndexGenerator.initialize({
  driveSync,
  mastodonData,
});

connectionManager.initialize();

console.log('✅ Dépendances injectées. Prêt à démarrer.');

// --- Démarrage de React ---
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);