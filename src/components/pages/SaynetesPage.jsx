/**
 * SaynetesPage.jsx v3.0 - Phase 3.0 : Page Saynètes de Remémoration
 * 🎭 Catalogue de saynètes ludiques pour échanger sur les souvenirs
 *
 * Types de saynètes :
 * - Défis 🎯 : Tu te souviens, Vrai ou Faux, Photo floue
 * - Ateliers 🎨 : Top 3 Face à Face, Courbe Émotionnelle
 * - Échanges 🎾 : Caption Battle, Double Vision, Story Duel
 * - Rituel 📅 : Souvenir du Jour
 *
 * Architecture :
 * - Lancer saynète → Crée session de chat avec gameContext
 * - Saynètes actives visibles dans SessionsPage avec badge 🎭
 */

import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { MessageCircle, Trophy, Clock } from 'lucide-react';

export default function SaynetesPage() {

  const app = useAppState();
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  // TODO : Liste des types de saynètes disponibles (catalogue)
  const availableSaynetes = [];
  const activeSessions = [];  // Sessions avec gameContext

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto transition-colors duration-200">

      {/* Container principal */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Section : Saynètes disponibles (Catalogue) */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Saynètes Disponibles
          </h2>

          {availableSaynetes.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-6xl mb-4">🎭</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Catalogue de saynètes ludiques
              </p>
              <button
                onClick={() => setShowLaunchModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-150"
              >
                🎭 Lancer une saynète
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* TODO : Liste des types de saynètes */}
              {availableSaynetes.map(saynete => (
                <SayneteCard key={saynete.type} saynete={saynete} />
              ))}
            </div>
          )}
        </section>

        {/* Section : Saynètes actives (Sessions en cours) */}
        {activeSessions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              Saynètes Actives
            </h2>

            <div className="space-y-3">
              {activeSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </section>
        )}

        {/* Guide rapide (si pas de saynètes) */}
        {availableSaynetes.length === 0 && activeSessions.length === 0 && (
          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              🎯 Comment ça marche ?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">1.</span>
                <span>Lancez une saynète en cliquant sur <strong>🎭 Lancer</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">2.</span>
                <span>Une session de chat est créée avec le contexte de la saynète</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">3.</span>
                <span>Échangez en ping-pong pour faire remonter des souvenirs !</span>
              </li>
            </ul>
          </section>
        )}

      </div>

      {/* Modal Lancement Saynète (TODO) */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              🎭 Lancer une saynète
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Choisissez un type de saynète :
            </p>

            {/* Liste types de saynètes */}
            <div className="space-y-2 mb-6">
              <button className="w-full text-left p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg border-2 border-purple-200 dark:border-purple-800 transition-colors">
                <div className="font-semibold text-purple-900 dark:text-purple-100">
                  🎯 Défi : Tu te souviens... ?
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Posez une question sur un moment précis
                </div>
              </button>

              <button className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-50 cursor-not-allowed">
                <div className="font-semibold text-gray-700 dark:text-gray-300">
                  🎨 Atelier : Top 3 Face à Face
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Bientôt disponible
                </div>
              </button>

              <button className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-50 cursor-not-allowed">
                <div className="font-semibold text-gray-700 dark:text-gray-300">
                  📅 Rituel : Souvenir du Jour
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Bientôt disponible
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowLaunchModal(false)}
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
 * Composant carte de saynète (placeholder)
 */
function SayneteCard({ saynete }) {
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
