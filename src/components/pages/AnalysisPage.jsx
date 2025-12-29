/**
 * AnalysisPage.jsx v3.0 - Intelligence du Voyage
 * 🧠 Analyse automatique des souvenirs pour détecter thèmes, émotions, personnes
 *
 * Accessible depuis : Réglages → Intelligence du Voyage
 *
 * Fonctionnalités :
 * - Analyse textes (posts + messages) sans API externe
 * - Détection thèmes récurrents
 * - Extraction tons émotionnels
 * - Statistiques photos
 * - Personnes mentionnées
 * - Génération missions pour jeux
 */

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { analyzeAllContent, generateMissions } from '../../utils/contentAnalyzer.js';
import { ArrowLeft, RefreshCw, TrendingUp, Users, Image, Lightbulb } from 'lucide-react';

export default function AnalysisPage({ onBack }) {

  const app = useAppState();
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [missions, setMissions] = useState([]);

  // Analyser au chargement
  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const results = analyzeAllContent(app.masterIndex, app.sessions);
      setAnalysisResults(results);

      const suggestedMissions = generateMissions(results);
      setMissions(suggestedMissions);

      setIsAnalyzing(false);
    }, 500); // Délai pour animation
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto transition-colors duration-200">

      {/* Header avec bouton retour */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                🧠 Intelligence du Voyage
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Analyse automatique de vos souvenirs
              </p>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className={`p-2 rounded-lg transition-colors ${
              isAnalyzing
                ? 'text-gray-400 dark:text-gray-600 cursor-wait'
                : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }`}
            title="Relancer l'analyse"
          >
            <RefreshCw className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Loader */}
        {isAnalyzing && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4 animate-bounce">🧠</div>
            <p className="text-gray-600 dark:text-gray-400">
              Analyse en cours...
            </p>
          </div>
        )}

        {/* Résultats */}
        {analysisResults && !isAnalyzing && (
          <>
            {/* Stats globales */}
            <section className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Statistiques Globales
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Moments"
                  value={analysisResults.stats.totalMoments}
                  icon="✨"
                />
                <StatCard
                  label="Posts"
                  value={analysisResults.stats.totalPosts}
                  icon="📝"
                />
                <StatCard
                  label="Messages"
                  value={analysisResults.stats.totalMessages}
                  icon="💬"
                />
                <StatCard
                  label="Mots"
                  value={analysisResults.stats.totalWords.toLocaleString()}
                  icon="📖"
                />
              </div>
            </section>

            {/* Thèmes détectés */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                🏷️ Thèmes Détectés
              </h2>

              <div className="space-y-3">
                {Object.entries(analysisResults.themes)
                  .filter(([_, data]) => data.count > 0)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([key, data]) => (
                    <ThemeBar
                      key={key}
                      label={data.label}
                      count={data.count}
                      moments={data.moments.length}
                      max={Math.max(...Object.values(analysisResults.themes).map(t => t.count))}
                    />
                  ))}
              </div>
            </section>

            {/* Émotions */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                😊 Tons Émotionnels
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(analysisResults.emotions)
                  .filter(([_, data]) => data.count > 0)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([key, data]) => (
                    <EmotionCard
                      key={key}
                      label={data.label}
                      count={data.count}
                    />
                  ))}
              </div>
            </section>

            {/* Personnes mentionnées */}
            {analysisResults.people.length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Personnes Mentionnées
                </h2>

                <div className="flex flex-wrap gap-2">
                  {analysisResults.people.map((person, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Photos */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Photos
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {analysisResults.photos.total} photos
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Moyenne par jour</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {analysisResults.photos.byDay} photos/jour
                  </span>
                </div>

                {Object.entries(analysisResults.photos.byUser).length > 0 && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Par utilisateur :</p>
                    {Object.entries(analysisResults.photos.byUser).map(([user, count]) => (
                      <div key={user} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{user}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Missions suggérées */}
            {missions.length > 0 && (
              <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
                <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Missions Suggérées pour les Jeux
                </h2>

                <div className="space-y-2">
                  {missions.slice(0, 5).map((mission, i) => (
                    <div
                      key={i}
                      className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 text-sm"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {mission.label || mission.description}
                      </div>
                      {mission.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                          mission.difficulty === 'facile'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        }`}>
                          {mission.difficulty}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </>
        )}

      </div>

    </div>
  );
}

/**
 * Composant : Carte statistique
 */
function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 text-center">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {label}
      </div>
    </div>
  );
}

/**
 * Composant : Barre de thème avec progression
 */
function ThemeBar({ label, count, moments, max }) {
  const percentage = (count / max) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {count} mentions · {moments} moments
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-purple-600 dark:bg-purple-400 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Composant : Carte émotion
 */
function EmotionCard({ label, count }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
      <div className="text-2xl mb-1">{label.split(' ')[0]}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
        {count}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {label.split(' ').slice(1).join(' ')}
      </div>
    </div>
  );
}
