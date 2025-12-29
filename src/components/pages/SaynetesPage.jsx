/**
 * SaynetesPage.jsx v3.0b - Phase 3.0 : Catalogue de Saynètes
 * 🎭 Catalogue de saynètes ludiques pour échanger sur les souvenirs
 *
 * ARCHITECTURE v3.0b :
 * ✅ Affiche CATALOGUE de saynètes disponibles (depuis saynetesManager)
 * ✅ Bouton "Lancer" → Ouvre modal pour créer session avec gameContext
 * ✅ Section "Actives" → Sessions avec gameContext (depuis app.sessions)
 *
 * Types de saynètes :
 * - Défis 🎯 : Tu te souviens, Vrai ou Faux, Photo floue
 * - Ateliers 🎨 : Top 3 Face à Face, Courbe Émotionnelle
 * - Échanges 🎾 : Caption Battle, Double Vision, Story Duel
 * - Rituel 📅 : Souvenir du Jour
 */

import React, { useState, useMemo } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { saynetesManager } from '../../core/SaynetesManager.js';
import { MessageCircle, Clock, ArrowRight, Eye } from 'lucide-react';

export default function SaynetesPage() {

  const app = useAppState();
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [selectedSayneteId, setSelectedSayneteId] = useState(null);
  const [restoredMomentId, setRestoredMomentId] = useState(null);
  const [restoredQuestion, setRestoredQuestion] = useState('');

  // Catalogue des saynètes disponibles (depuis saynetesManager)
  const catalog = useMemo(() => saynetesManager.getCatalog(), []);
  const allSaynetes = useMemo(() => saynetesManager.getAllSaynetes(), []);

  // Sessions actives avec gameContext
  const activeSessions = useMemo(() => {
    if (!app.sessions) return [];
    return app.sessions.filter(s => s.gameContext && !s.archived);
  }, [app.sessions]);

  // Moments disponibles pour sélection
  const availableMoments = useMemo(() => {
    if (!app.masterIndex?.moments) return [];
    return app.masterIndex.moments.filter(m => m.title); // Moments avec titre
  }, [app.masterIndex]);

  // ✅ Restauration contexte au retour depuis MemoriesPage
  const navigationContext = app.navigationContext || {};
  const returnContext = navigationContext.returnContext;

  // Restaurer modal si retour avec contexte
  React.useEffect(() => {
    if (returnContext?.modalOpen && returnContext.selectedMomentId) {
      setSelectedSayneteId('tu_te_souviens');
      setRestoredMomentId(returnContext.selectedMomentId);
      setRestoredQuestion(returnContext.question || '');
      setShowLaunchModal(true);
    }
  }, [returnContext]);

  const handleLaunchSaynete = (sayneteId) => {
    console.log('🎭 Lancement saynète:', sayneteId);
    setSelectedSayneteId(sayneteId);
    setShowLaunchModal(true);
  };

  const handleCloseModal = () => {
    setShowLaunchModal(false);
    setSelectedSayneteId(null);
    setRestoredMomentId(null);
    setRestoredQuestion('');
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto transition-colors duration-200">

      {/* Container principal */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-6">

        {/* En-tête */}
        <div className="text-center">
          <div className="text-6xl mb-3">🎭</div>
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
            Catalogue ({allSaynetes.length} jeux)
          </h2>

          <div className="space-y-3">
            {allSaynetes.map(saynete => (
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
              <span>Les jeux actifs apparaissent dans Causeries avec badge 🎭</span>
            </li>
          </ul>
        </section>

      </div>

      {/* Modal Lancement Saynète */}
      {showLaunchModal && selectedSayneteId === 'tu_te_souviens' && (
        <TuTeSouviensModal
          moments={availableMoments}
          currentUserId={app.currentUser}
          initialMomentId={restoredMomentId}
          initialQuestion={restoredQuestion}
          onClose={handleCloseModal}
          onLaunch={async (momentId, question) => {
            // Créer gameContext
            const gameContext = saynetesManager.createGameContext(
              'tu_te_souviens',
              app.currentUser,
              momentId,
              question
            );

            // Récupérer le moment sélectionné
            const moment = availableMoments.find(m => m.id === momentId);

            // Créer session avec gameContext
            await app.createSession(
              { id: momentId, title: moment.title },
              question,
              null, // pas de photo
              gameContext
            );

            // Rediriger vers la session créée
            app.navigateTo('sessions');
            handleCloseModal();
          }}
        />
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
          <span className="text-2xl">🎭</span>
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
 * Modal "Tu te souviens ?" - Sélection moment + question
 */
function TuTeSouviensModal({ moments, currentUserId, initialMomentId, initialQuestion, onClose, onLaunch }) {
  const app = useAppState();
  const [selectedMomentId, setSelectedMomentId] = useState(initialMomentId || null);
  const [question, setQuestion] = useState(initialQuestion || '');
  const [isLaunching, setIsLaunching] = useState(false);

  const selectedMoment = moments.find(m => m.id === selectedMomentId);
  const canLaunch = selectedMomentId && question.trim();

  // Navigation vers moment dans MemoriesPage
  const handleViewMoment = (momentId) => {
    onClose(); // Fermer modal
    app.navigateTo('memories', {
      previousPage: 'saynetes',
      targetMomentId: momentId,
      scrollToMoment: true,
      returnContext: {
        selectedMomentId: selectedMomentId, // Moment sélectionné dans modal
        question: question, // Question en cours de saisie
        modalOpen: true // Réouvrir modal au retour
      }
    });
  };

  const handleLaunch = async () => {
    if (!canLaunch) return;
    setIsLaunching(true);
    try {
      await onLaunch(selectedMomentId, question.trim());
    } catch (error) {
      console.error('Erreur lancement saynète:', error);
      setIsLaunching(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🤔</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Tu te souviens ?
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choisissez un moment et posez une question pour lancer la saynète
          </p>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">

          {/* Sélection moment */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              1. Choisissez un moment
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {moments.map(moment => (
                <div
                  key={moment.id}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    selectedMomentId === moment.id
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône moment ✨ */}
                    <button
                      onClick={() => setSelectedMomentId(moment.id)}
                      className="flex-shrink-0"
                    >
                      <span className="text-xl">✨</span>
                    </button>

                    {/* Contenu cliquable */}
                    <button
                      onClick={() => setSelectedMomentId(moment.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {moment.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {moment.date ? new Date(moment.date).toLocaleDateString('fr-FR') : ''}
                        {moment.jnnn && ` • ${moment.jnnn}`}
                      </div>
                    </button>

                    {/* Bouton "Voir ce moment" */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMoment(moment.id);
                      }}
                      className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="Voir ce moment dans Souvenirs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Checkmark si sélectionné */}
                    {selectedMomentId === moment.id && (
                      <span className="text-red-500 text-xl flex-shrink-0">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              2. Posez votre question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Te souviens-tu du nom du restaurant où nous avons mangé ?"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 dark:focus:border-red-400 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/30 transition-colors resize-none"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {question.length}/500 caractères
            </div>
          </div>

          {/* Aperçu */}
          {selectedMoment && question.trim() && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📋 Aperçu
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Moment :</strong> {selectedMoment.title}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                <strong>Question :</strong> {question}
              </div>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleLaunch}
            disabled={!canLaunch || isLaunching}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
              canLaunch && !isLaunching
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLaunching ? '🎭 Lancement...' : '🎭 Lancer la saynète'}
          </button>
        </div>
      </div>
    </div>
  );
}
