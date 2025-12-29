/**
 * GamesPage.jsx v3.0 - Phase 3.0 : Page Jeux de Remémoration
 * 🎮 Page principale pour jeux asynchrones entre 2 users
 * ✅ Jeu #1 : Tu te souviens... ?
 * ✅ Jeu #3 : Top 3 Face à Face
 * ✅ Jeu #10 : Souvenir du Jour
 *
 * Objectifs :
 * - Faire remonter des souvenirs oubliés
 * - Créer dynamique d'échange ping-pong
 * - Explorer Souvenirs de manière ludique
 */

import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { MessageCircle, Trophy, Clock } from 'lucide-react';

export default function GamesPage() {

  const app = useAppState();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // TODO : Récupérer depuis GamesManager
  const activeGames = [];
  const completedGames = [];

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto transition-colors duration-200">

      {/* Container principal */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Section : Jeux en cours */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            Jeux en cours
          </h2>

          {activeGames.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-4">🎮</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Aucun jeu en cours
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-150"
              >
                Créer un jeu
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* TODO : Liste des jeux actifs */}
              {activeGames.map(game => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </section>

        {/* Section : Jeux complétés */}
        {completedGames.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Jeux complétés
            </h2>

            <div className="space-y-3">
              {completedGames.map(game => (
                <GameCard key={game.id} game={game} completed />
              ))}
            </div>
          </section>
        )}

        {/* Guide rapide (si pas de jeux) */}
        {activeGames.length === 0 && completedGames.length === 0 && (
          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              🎯 Comment ça marche ?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">1.</span>
                <span>Créez un jeu en cliquant sur le bouton <strong>+</strong> en haut</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">2.</span>
                <span>L'autre utilisateur reçoit une notification et répond</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">3.</span>
                <span>Échangez en ping-pong pour faire remonter des souvenirs !</span>
              </li>
            </ul>
          </section>
        )}

      </div>

      {/* Modal Création Jeu (TODO) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Créer un jeu
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Choisissez un type de jeu :
            </p>

            {/* Liste types de jeux */}
            <div className="space-y-2 mb-6">
              <button className="w-full text-left p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg border-2 border-purple-200 dark:border-purple-800 transition-colors">
                <div className="font-semibold text-purple-900 dark:text-purple-100">
                  💬 Tu te souviens... ?
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Posez une question sur un moment précis
                </div>
              </button>

              <button className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-50 cursor-not-allowed">
                <div className="font-semibold text-gray-700 dark:text-gray-300">
                  🏆 Top 3 Face à Face
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Bientôt disponible
                </div>
              </button>

              <button className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-50 cursor-not-allowed">
                <div className="font-semibold text-gray-700 dark:text-gray-300">
                  📅 Souvenir du Jour
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Bientôt disponible
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Composant carte de jeu (placeholder)
 */
function GameCard({ game, completed = false }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 transition-colors ${
      completed
        ? 'border-gray-300 dark:border-gray-600 opacity-75'
        : 'border-purple-300 dark:border-purple-700'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{game.emoji || '💬'}</span>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {game.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {game.type}
            </div>
          </div>
        </div>
        {!completed && (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
            En attente
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {game.preview}
      </p>

      <button className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
        Voir détails →
      </button>
    </div>
  );
}
