/**
 * GamesPage.jsx v3.0g - Phase 3.0 : Catalogue de Jeux avec SessionCreationModal
 * ⚔️ Catalogue de jeux ludiques pour échanger sur les souvenirs
 *
 * ARCHITECTURE v3.0g - WORKFLOW AVEC MODAL RÉUTILISÉ :
 * 1. Clic "Lancer jeu" → Modal "Te souviens-tu ?" (☁️ Cloud icon)
 * 2. Modal initial : Bouton "Sélectionner un souvenir"
 * 3. Clic bouton → MemoriesPage en mode sélection (moment/post/photo)
 * 4. Retour au modal SessionCreationModal avec contenu pré-sélectionné
 * 5. Remplir titre + message optionnel + case "Ouvrir maintenant"
 * 6. "Créer" → Session créée avec gameContext
 *
 * ⭐ PRINCIPE : Réutilisation de SessionCreationModal existant pour cohérence UX
 *
 * Types de jeux :
 * - Défis 🎯 : Tu te souviens, Vrai ou Faux, Photo floue
 * - Ateliers 🎨 : Top 3 Face à Face, Courbe Émotionnelle
 * - Échanges 🎾 : Caption Battle, Double Vision, Story Duel
 * - Rituel 📅 : Souvenir du Jour
 */

import React, { useState, useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { gamesManager } from '../../core/GamesManager.js';
import { MessageCircle, Clock, ArrowRight, Swords, Cloud } from 'lucide-react';
import SessionCreationModal from '../SessionCreationModal.jsx';

export default function GamesPage({ navigationContext: propsNavigationContext, onStartSelectionMode }) {

  const app = useAppState();

  // ⭐ v3.0g : États pour modal jeu (avec SessionCreationModal)
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);

  // Catalogue des jeux disponibles (depuis gamesManager)
  const catalog = useMemo(() => gamesManager.getCatalog(), []);
  const allGames = useMemo(() => gamesManager.getAllSaynetes(), []);

  // Sessions actives avec gameContext
  const activeSessions = useMemo(() => {
    if (!app.sessions) return [];
    return app.sessions.filter(s => s.gameContext && !s.archived);
  }, [app.sessions]);

  // Navigation context
  const navigationContext = propsNavigationContext || app.navigationContext || {};

  // ⭐ v3.0g : Gérer retour sélection contenu depuis MemoriesPage
  React.useEffect(() => {
    if (navigationContext.pendingLink) {
      const content = navigationContext.pendingLink;
      console.log('⚔️ Contenu sélectionné depuis MemoriesPage:', content);

      // Stocker le contenu et réouvrir le modal
      setSelectedContent(content);
      setShowGameModal(true);
    }
  }, [navigationContext.pendingLink]);

  // ⭐ v3.0g : Lancer jeu = Ouvrir modal directement
  const handleLaunchSaynete = (sayneteId) => {
    console.log('⚔️ Lancement jeu:', sayneteId);
    setSelectedGameId(sayneteId);
    setSelectedContent(null); // Pas de contenu pré-sélectionné
    setShowGameModal(true);
  };

  const handleSelectContent = () => {
    if (!onStartSelectionMode) {
      console.error('❌ onStartSelectionMode non fourni !');
      return;
    }

    // Fermer modal temporairement
    setShowGameModal(false);

    // Lancer mode sélection - accepter TOUS types de contenu
    onStartSelectionMode('all', null);
  };

  const handleCloseGameModal = () => {
    setShowGameModal(false);
    setSelectedGameId(null);
    setSelectedContent(null);
  };

  const handleCreateGameSession = async (options) => {
    if (!selectedContent) {
      console.error('❌ Pas de contenu sélectionné');
      return;
    }

    // Créer gameContext
    const gameContext = gamesManager.createGameContext(
      selectedGameId,
      app.currentUser,
      selectedContent.id,
      options.title
    );

    // Créer session avec gameContext
    const sessionId = await app.createSession(
      selectedContent,
      options.title,
      options.initialText || null,
      gameContext
    );

    // Ouvrir la session si demandé
    if (options.shouldOpen) {
      app.updateState({ currentChatSession: sessionId });
      app.navigateTo('chat', { previousPage: 'saynetes' });
    }

    // Fermer modal
    handleCloseGameModal();
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto transition-colors duration-200">

      {/* Container principal */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-6">

        {/* En-tête */}
        <div className="text-center">
          <Swords className="w-16 h-16 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Jeux de Remémoration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Des jeux ludiques pour faire remonter vos souvenirs
          </p>
        </div>

        {/* Section : Liste des jeux */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Catalogue ({allGames.length} jeux)
          </h2>

          <div className="space-y-3">
            {allGames.map(saynete => (
              <GameCard
                key={saynete.id}
                saynete={saynete}
                onLaunch={() => handleLaunchSaynete(saynete.id)}
              />
            ))}
          </div>
        </section>

        {/* Section : Jeux actifs (Sessions en cours) */}
        {activeSessions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              Jeux Actifs ({activeSessions.length})
            </h2>

            <div className="space-y-3">
              {activeSessions.map(session => (
                <ActiveSessionCard
                  key={session.id}
                  session={session}
                  onClick={() => {
                    app.updateState({ currentChatSession: session.id });
                    app.navigateTo('chat', { previousPage: 'saynetes' });
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Guide rapide */}
        <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🎯 Comment ça marche ?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[20px]">1.</span>
              <span>Choisissez un jeu dans le catalogue ci-dessus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[20px]">2.</span>
              <span>Cliquez sur <strong>Lancer</strong> pour créer une session de chat</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[20px]">3.</span>
              <span>Échangez en ping-pong pour faire remonter des souvenirs !</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[20px]">4.</span>
              <span>Les jeux actifs apparaissent dans Causeries avec badge ⚔️ Jeu</span>
            </li>
          </ul>
        </section>

      </div>

      {/* ⭐ v3.0g : Modal Jeu avec SessionCreationModal */}
      {showGameModal && (
        selectedContent ? (
          <SessionCreationModal
            source={selectedContent}
            contextMoment={selectedContent}
            currentUser={app.currentUser}
            onClose={handleCloseGameModal}
            onConfirm={handleCreateGameSession}
            gameMode={true}
            gameId={selectedGameId}
            onSelectContent={handleSelectContent}
          />
        ) : (
          <GameContentSelectionModal
            gameId={selectedGameId}
            onClose={handleCloseGameModal}
            onSelectContent={handleSelectContent}
          />
        )
      )}

    </div>
  );
}

/**
 * Carte de jeu du catalogue (sans regroupement par catégorie)
 */
function GameCard({ saynete, onLaunch }) {
  // Seule "tu_te_souviens" est disponible pour le moment
  const isAvailable = saynete.id === 'tu_te_souviens';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 transition-all duration-150 ${
        isAvailable
          ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          : 'border-gray-200 dark:border-gray-700 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{saynete.emoji}</span>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {saynete.name}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {saynete.description}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded ${
              saynete.difficulty === 'facile' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
              saynete.difficulty === 'moyen' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {saynete.difficulty}
            </span>
            {saynete.requiresMoment && (
              <span className="text-gray-500 dark:text-gray-400">
                📍 Requiert un moment
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onLaunch}
          disabled={!isAvailable}
          className={`px-4 py-2 text-white rounded-lg transition-colors duration-150 flex items-center gap-2 whitespace-nowrap ${
            isAvailable
              ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'
              : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
          }`}
        >
          {isAvailable ? (
            <>
              Lancer
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            'Bientôt'
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Carte de session active avec gameContext
 */
function ActiveSessionCard({ session, onClick }) {
  const gameContext = session.gameContext;
  const lastMessage = session.notes?.[session.notes.length - 1];
  const otherUserId = session.user === 'alice' ? 'bob' : 'alice';

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600 transition-colors text-left"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Swords className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {gameContext.sayneteName || session.gameTitle}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {gameContext.sayneteCategory} • Lancée le {new Date(gameContext.launchedAt).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
          Active
        </span>
      </div>

      {lastMessage && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          <strong>{lastMessage.author === 'alice' ? 'Alice' : 'Bob'}:</strong> {lastMessage.content}
        </p>
      )}

      <div className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1">
        Continuer la conversation →
      </div>
    </button>
  );
}

/**
 * Modal de Sélection de Contenu pour Jeu (v3.0g)
 * Permet de sélectionner un contenu (moment/post/photo) pour créer une session jeu
 */
function GameContentSelectionModal({ gameId, onClose, onSelectContent }) {
  // Nom et emoji du jeu
  const getGameInfo = () => {
    switch(gameId) {
      case 'tu_te_souviens':
        return { name: 'Te souviens-tu ?', emoji: <Cloud className="w-8 h-8" /> };
      default:
        return { name: 'Jeu', emoji: <Swords className="w-8 h-8" /> };
    }
  };

  const gameInfo = getGameInfo();

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-purple-600 dark:text-purple-400">
              {gameInfo.emoji}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {gameInfo.name}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Créer une session de jeu
          </p>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Pour commencer, sélectionnez un souvenir (moment, post ou photo)
            </p>

            <button
              onClick={onSelectContent}
              className="w-full px-6 py-4 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-100 rounded-lg transition-colors font-medium flex items-center justify-center gap-3 border-2 border-purple-300 dark:border-purple-700"
            >
              <span className="text-2xl">✨</span>
              <span>Sélectionner un souvenir</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

