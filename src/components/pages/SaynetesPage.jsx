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
import { MessageCircle, Clock, ArrowRight } from 'lucide-react';

export default function SaynetesPage() {

  const app = useAppState();
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Catalogue des saynètes disponibles (depuis saynetesManager)
  const catalog = useMemo(() => saynetesManager.getCatalog(), []);
  const allSaynetes = useMemo(() => saynetesManager.getAllSaynetes(), []);

  // Sessions actives avec gameContext
  const activeSessions = useMemo(() => {
    if (!app.sessions) return [];
    return app.sessions.filter(s => s.gameContext && !s.archived);
  }, [app.sessions]);

  const handleLaunchSaynete = (sayneteId) => {
    console.log('🎭 Lancement saynète:', sayneteId);
    // TODO : Implémenter le lancement selon le type de saynète
    // Pour "tu_te_souviens" → Modal sélection moment + question
    // Pour autres → Flow spécifique
    setShowLaunchModal(false);
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto transition-colors duration-200">

      {/* Container principal */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-6">

        {/* En-tête */}
        <div className="text-center">
          <div className="text-6xl mb-3">🎭</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Saynètes Ludiques
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Des jeux de remémoration pour faire remonter vos souvenirs
          </p>
        </div>

        {/* Section : Catalogue par catégories */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Catalogue ({allSaynetes.length} saynètes)
          </h2>

          <div className="space-y-4">
            {Object.entries(catalog).map(([key, category]) => (
              <CategorySection
                key={key}
                category={category}
                onLaunchSaynete={handleLaunchSaynete}
              />
            ))}
          </div>
        </section>

        {/* Section : Saynètes actives (Sessions en cours) */}
        {activeSessions.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              Saynètes Actives ({activeSessions.length})
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
              <span>Choisissez une saynète dans le catalogue ci-dessus</span>
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
              <span>Les saynètes actives apparaissent dans Causeries avec badge 🎭</span>
            </li>
          </ul>
        </section>

      </div>

    </div>
  );
}

/**
 * Section de catégorie avec ses saynètes
 */
function CategorySection({ category, onLaunchSaynete }) {
  const colorClasses = {
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
  };

  const color = colorClasses[category.color] || colorClasses.purple;

  return (
    <div className={`rounded-lg p-4 border ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{category.emoji}</span>
        <h3 className="font-bold text-lg">{category.label}</h3>
        <span className="text-xs opacity-75">({category.saynetes.length})</span>
      </div>

      <div className="space-y-2">
        {category.saynetes.map(saynete => (
          <SayneteCard
            key={saynete.id}
            saynete={saynete}
            categoryColor={category.color}
            onLaunch={() => onLaunchSaynete(saynete.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Carte de saynète du catalogue
 */
function SayneteCard({ saynete, categoryColor, onLaunch }) {
  const [isHovered, setIsHovered] = useState(false);

  const buttonColors = {
    red: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
    purple: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600',
    blue: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
    green: 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
  };

  const buttonColor = buttonColors[categoryColor] || buttonColors.purple;

  // Seule "tu_te_souviens" est disponible pour le moment
  const isAvailable = saynete.id === 'tu_te_souviens';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 transition-all duration-150 ${
        isAvailable
          ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          : 'border-gray-200 dark:border-gray-700 opacity-60'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
              ? buttonColor
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
