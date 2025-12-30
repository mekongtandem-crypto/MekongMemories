/**
 * SaynetesManager.js v3.0b - Phase 3.0 : Catalogue de Jeux
 * ⚔️ Manager centralisé pour le catalogue des jeux de remémoration
 *
 * ARCHITECTURE v3.0b :
 * ✅ Jeux = Catalogue de types de jeux disponibles (PAS de tracking)
 * ✅ Lancer jeu → Crée session avec gameContext
 * ✅ Sessions avec gameContext apparaissent dans SessionsPage avec badge ⚔️ Jeu
 *
 * Responsabilités :
 * - Fournir catalogue de saynètes disponibles
 * - Créer sessions avec gameContext approprié
 * - PAS de persistance Drive (juste catalogue en mémoire)
 *
 * Types de saynètes :
 * - Défis 🎯 : tu_te_souviens, vrai_faux, photo_floue
 * - Ateliers 🎨 : top3, courbe_emotionnelle
 * - Échanges 🎾 : caption_battle, double_vision, story_duel
 * - Rituel 📅 : souvenir_du_jour
 */

import { logger } from '../utils/logger.js';

class GamesManager {
  constructor() {
    this.isLoaded = false;

    // Catalogue des saynètes disponibles
    this.catalog = this._buildCatalog();
  }

  /**
   * Initialisation - Juste marquer comme chargé (pas de Drive)
   */
  async init() {
    logger.info('⚔️ GamesManager: Catalogue de jeux initialisé');
    this.isLoaded = true;
  }

  /**
   * Construire le catalogue de saynètes disponibles
   */
  _buildCatalog() {
    return {
      defis: {
        category: 'defis',
        label: 'Défis',
        emoji: '🎯',
        color: 'red',
        saynetes: [
          {
            id: 'tu_te_souviens',
            name: 'Tu te souviens ?',
            emoji: '🤔',
            description: 'Pose une question sur un souvenir précis',
            requiresMoment: true,
            difficulty: 'facile'
          },
          {
            id: 'vrai_faux',
            name: 'Vrai ou Faux',
            emoji: '❓',
            description: 'Devine si l\'anecdote est vraie ou inventée',
            requiresMoment: false,
            difficulty: 'moyen'
          },
          {
            id: 'photo_floue',
            name: 'Photo Floue',
            emoji: '🔍',
            description: 'Devine le lieu/moment d\'une photo cachée',
            requiresMoment: false,
            difficulty: 'difficile'
          }
        ]
      },
      ateliers: {
        category: 'ateliers',
        label: 'Ateliers',
        emoji: '🎨',
        color: 'purple',
        saynetes: [
          {
            id: 'top3',
            name: 'Top 3 Face à Face',
            emoji: '🏆',
            description: 'Chacun propose son Top 3 sur un thème',
            requiresMoment: false,
            difficulty: 'facile'
          },
          {
            id: 'courbe_emotionnelle',
            name: 'Courbe Émotionnelle',
            emoji: '📈',
            description: 'Trace l\'évolution de tes émotions jour par jour',
            requiresMoment: false,
            difficulty: 'moyen'
          }
        ]
      },
      echanges: {
        category: 'echanges',
        label: 'Échanges',
        emoji: '🎾',
        color: 'blue',
        saynetes: [
          {
            id: 'caption_battle',
            name: 'Caption Battle',
            emoji: '💬',
            description: 'Trouve la meilleure légende pour une photo',
            requiresMoment: false,
            difficulty: 'facile'
          },
          {
            id: 'double_vision',
            name: 'Double Vision',
            emoji: '👥',
            description: 'Comparez vos souvenirs du même moment',
            requiresMoment: true,
            difficulty: 'moyen'
          },
          {
            id: 'story_duel',
            name: 'Story Duel',
            emoji: '⚔️',
            description: 'Raconte la meilleure anecdote sur un thème',
            requiresMoment: false,
            difficulty: 'moyen'
          }
        ]
      },
      rituel: {
        category: 'rituel',
        label: 'Rituel',
        emoji: '📅',
        color: 'green',
        saynetes: [
          {
            id: 'souvenir_du_jour',
            name: 'Souvenir du Jour',
            emoji: '🌅',
            description: 'Partage quotidien d\'un souvenir marquant',
            requiresMoment: false,
            difficulty: 'facile'
          }
        ]
      }
    };
  }

  /**
   * Récupérer tout le catalogue
   */
  getCatalog() {
    return this.catalog;
  }

  /**
   * Récupérer toutes les saynètes (format plat)
   */
  getAllSaynetes() {
    const allSaynetes = [];
    Object.values(this.catalog).forEach(category => {
      category.saynetes.forEach(saynete => {
        allSaynetes.push({
          ...saynete,
          category: category.category,
          categoryLabel: category.label,
          categoryEmoji: category.emoji,
          categoryColor: category.color
        });
      });
    });
    return allSaynetes;
  }

  /**
   * Récupérer saynètes par catégorie
   */
  getSaynetesByCategory(category) {
    return this.catalog[category]?.saynetes || [];
  }

  /**
   * Récupérer une saynète par ID
   */
  getSayneteById(sayneteId) {
    const allSaynetes = this.getAllSaynetes();
    return allSaynetes.find(s => s.id === sayneteId);
  }

  /**
   * Créer gameContext pour une session de saynète
   * @param {string} sayneteId - ID de la saynète
   * @param {string} launchedBy - User ID qui lance
   * @param {string} momentId - ID du moment (optionnel)
   * @param {string} initialQuestion - Question initiale (optionnel)
   * @returns {Object} gameContext
   */
  createGameContext(sayneteId, launchedBy, momentId = null, initialQuestion = null) {
    const saynete = this.getSayneteById(sayneteId);
    if (!saynete) {
      logger.error('❌ Saynète introuvable:', sayneteId);
      return null;
    }

    return {
      sayneteType: sayneteId,
      sayneteCategory: saynete.category,
      sayneteName: saynete.name,
      sayneteEmoji: saynete.categoryEmoji,
      momentId: momentId,
      initialQuestion: initialQuestion,
      launchedAt: new Date().toISOString(),
      launchedBy: launchedBy
    };
  }

  /**
   * Obtenir statistiques du catalogue
   */
  getStats() {
    const stats = {
      totalCategories: Object.keys(this.catalog).length,
      totalSaynetes: this.getAllSaynetes().length,
      byCategory: {}
    };

    Object.entries(this.catalog).forEach(([key, category]) => {
      stats.byCategory[key] = category.saynetes.length;
    });

    return stats;
  }
}

// Singleton
export const gamesManager = new GamesManager();

// Exposer pour debug
if (typeof window !== 'undefined') {
  window.gamesManager = gamesManager;
}
