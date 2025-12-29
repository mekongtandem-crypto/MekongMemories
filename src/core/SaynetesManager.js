/**
 * SaynetesManager.js v3.0 - Phase 3.0 : Gestionnaire de Saynètes
 * 🎭 Manager centralisé pour toutes les saynètes de remémoration
 *
 * Responsabilités :
 * - CRUD saynètes (Create, Read, Update, Delete)
 * - Persistance Drive (saynetes.json)
 * - Index rapides (par user, status, type, moment)
 * - Notifications entre users
 *
 * Types de saynètes supportés :
 * - Défis 🎯 : tu_te_souviens, vrai_faux, photo_floue
 * - Ateliers 🎨 : top3, courbe_emotionnelle
 * - Échanges 🎾 : caption_battle, double_vision, story_duel
 * - Rituel 📅 : souvenir_du_jour
 */

import { driveSync } from './DriveSync.js';
import { logger } from '../utils/logger.js';

const SAYNETES_FILE = 'saynetes.json';

class SaynetesManager {
  constructor() {
    this.games = new Map();               // gameId → game object
    this.userIndex = new Map();           // userId → Set<gameId>
    this.statusIndex = new Map();         // status → Set<gameId>
    this.typeIndex = new Map();           // gameType → Set<gameId>
    this.momentIndex = new Map();         // momentId → Set<gameId>
    this.isLoaded = false;

    // Statistiques
    this.stats = {
      total: 0,
      active: 0,
      completed: 0,
      byType: {}
    };
  }

  /**
   * Initialisation - Charger depuis Drive
   */
  async init() {
    logger.info('🎭 SaynetesManager: Initialisation...');

    try {
      const data = await driveSync.loadFile(SAYNETES_FILE);

      if (data && data.games) {
        logger.info(`✅ SaynetesManager: ${data.games.length} saynètes chargées`);

        // Rebuild indexes
        data.games.forEach(game => {
          this._addToIndexes(game);
        });

        this._updateStats();
        this.isLoaded = true;
      } else {
        logger.info('ℹ️ SaynetesManager: Fichier inexistant, création structure vide');
        await this._saveToFile();
        this.isLoaded = true;
      }
    } catch (error) {
      logger.error('❌ Erreur init SaynetesManager:', error);

      // Créer fichier vide si erreur
      try {
        await this._saveToFile();
        this.isLoaded = true;
        logger.success('✅ SaynetesManager: Fichier créé (vide)');
      } catch (saveError) {
        logger.error('❌ Impossible de créer le fichier saynetes.json:', saveError);
        this.isLoaded = false;
      }
    }
  }

  /**
   * Créer une nouvelle saynète
   * @param {string} type - Type de saynète
   * @param {string} createdBy - User ID créateur
   * @param {object} data - Données spécifiques à la saynète
   * @returns {Promise<object>} - Saynète créée
   */
  async createGame(type, createdBy, data = {}) {
    const gameId = `game_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const game = {
      id: gameId,
      type: type,
      status: this._getInitialStatus(type),
      createdAt: new Date().toISOString(),
      createdBy: createdBy,
      updatedAt: new Date().toISOString(),

      // Données spécifiques au jeu
      data: data,

      // Fil de discussion (ping-pong)
      thread: []
    };

    // Ajouter aux index
    this._addToIndexes(game);
    this._updateStats();

    // Sauvegarder
    await this._saveToFile();
    logger.success('✅ Saynète créée:', gameId, type);

    return game;
  }

  /**
   * Récupérer une saynète par ID
   */
  getGame(gameId) {
    return this.games.get(gameId);
  }

  /**
   * Récupérer toutes les saynètes
   */
  getAllGames() {
    return Array.from(this.games.values());
  }

  /**
   * Récupérer saynètes d'un user (créées OU en attente de réponse)
   */
  getGamesForUser(userId) {
    const gameIds = this.userIndex.get(userId);
    if (!gameIds) return [];

    return Array.from(gameIds)
      .map(id => this.games.get(id))
      .filter(Boolean);
  }

  /**
   * Récupérer jeux actifs (non complétés)
   */
  getActiveGames() {
    const activeIds = this.statusIndex.get('waiting_answer') || new Set();
    const answeredIds = this.statusIndex.get('answered') || new Set();

    const allActiveIds = new Set([...activeIds, ...answeredIds]);

    return Array.from(allActiveIds)
      .map(id => this.games.get(id))
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Récupérer jeux complétés
   */
  getCompletedGames() {
    const completedIds = this.statusIndex.get('completed') || new Set();

    return Array.from(completedIds)
      .map(id => this.games.get(id))
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Récupérer jeux par type
   */
  getGamesByType(type) {
    const gameIds = this.typeIndex.get(type);
    if (!gameIds) return [];

    return Array.from(gameIds)
      .map(id => this.games.get(id))
      .filter(Boolean);
  }

  /**
   * Récupérer jeux associés à un moment
   */
  getGamesForMoment(momentId) {
    const gameIds = this.momentIndex.get(momentId);
    if (!gameIds) return [];

    return Array.from(gameIds)
      .map(id => this.games.get(id))
      .filter(Boolean);
  }

  /**
   * Mettre à jour un jeu
   * @param {string} gameId
   * @param {object} updates - Propriétés à mettre à jour
   */
  async updateGame(gameId, updates) {
    const game = this.games.get(gameId);
    if (!game) {
      logger.error('❌ Jeu introuvable:', gameId);
      return null;
    }

    // Retirer des anciens index si status change
    if (updates.status && updates.status !== game.status) {
      this._removeFromStatusIndex(game);
    }

    // Appliquer updates
    Object.assign(game, updates, {
      updatedAt: new Date().toISOString()
    });

    // Ré-indexer si nécessaire
    if (updates.status) {
      this._addToStatusIndex(game);
    }

    this._updateStats();
    await this._saveToFile();

    logger.success('✅ Jeu mis à jour:', gameId);
    return game;
  }

  /**
   * Ajouter message au thread d'un jeu
   * @param {string} gameId
   * @param {string} author - User ID
   * @param {string} content - Contenu du message
   */
  async addThreadMessage(gameId, author, content) {
    const game = this.games.get(gameId);
    if (!game) {
      logger.error('❌ Jeu introuvable:', gameId);
      return null;
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author: author,
      content: content,
      timestamp: new Date().toISOString()
    };

    game.thread.push(message);
    game.updatedAt = new Date().toISOString();

    await this._saveToFile();
    logger.info('✅ Message ajouté au thread:', gameId);

    return message;
  }

  /**
   * Supprimer un jeu
   */
  async deleteGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      logger.error('❌ Jeu introuvable:', gameId);
      return false;
    }

    // Retirer de tous les index
    this._removeFromIndexes(game);
    this._updateStats();

    await this._saveToFile();
    logger.success('✅ Jeu supprimé:', gameId);

    return true;
  }

  /**
   * Obtenir statistiques
   */
  getStats() {
    return { ...this.stats };
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  /**
   * Ajouter jeu à tous les index
   */
  _addToIndexes(game) {
    // Map principale
    this.games.set(game.id, game);

    // Index user (créateur + participant si réponse)
    if (!this.userIndex.has(game.createdBy)) {
      this.userIndex.set(game.createdBy, new Set());
    }
    this.userIndex.get(game.createdBy).add(game.id);

    // Si jeu a une réponse, ajouter l'autre user
    if (game.data?.answeredBy && game.data.answeredBy !== game.createdBy) {
      if (!this.userIndex.has(game.data.answeredBy)) {
        this.userIndex.set(game.data.answeredBy, new Set());
      }
      this.userIndex.get(game.data.answeredBy).add(game.id);
    }

    // Index status
    this._addToStatusIndex(game);

    // Index type
    if (!this.typeIndex.has(game.type)) {
      this.typeIndex.set(game.type, new Set());
    }
    this.typeIndex.get(game.type).add(game.id);

    // Index moment (si jeu associé à un moment)
    if (game.data?.momentId) {
      if (!this.momentIndex.has(game.data.momentId)) {
        this.momentIndex.set(game.data.momentId, new Set());
      }
      this.momentIndex.get(game.data.momentId).add(game.id);
    }
  }

  /**
   * Ajouter à l'index status
   */
  _addToStatusIndex(game) {
    if (!this.statusIndex.has(game.status)) {
      this.statusIndex.set(game.status, new Set());
    }
    this.statusIndex.get(game.status).add(game.id);
  }

  /**
   * Retirer de l'index status
   */
  _removeFromStatusIndex(game) {
    const statusSet = this.statusIndex.get(game.status);
    if (statusSet) {
      statusSet.delete(game.id);
    }
  }

  /**
   * Retirer jeu de tous les index
   */
  _removeFromIndexes(game) {
    // Map principale
    this.games.delete(game.id);

    // Index users
    this.userIndex.forEach(gameIds => {
      gameIds.delete(game.id);
    });

    // Index status
    this._removeFromStatusIndex(game);

    // Index type
    const typeSet = this.typeIndex.get(game.type);
    if (typeSet) {
      typeSet.delete(game.id);
    }

    // Index moment
    if (game.data?.momentId) {
      const momentSet = this.momentIndex.get(game.data.momentId);
      if (momentSet) {
        momentSet.delete(game.id);
      }
    }
  }

  /**
   * Mettre à jour statistiques
   */
  _updateStats() {
    this.stats.total = this.games.size;

    // Compter actifs vs complétés
    const completedIds = this.statusIndex.get('completed') || new Set();
    this.stats.completed = completedIds.size;
    this.stats.active = this.stats.total - this.stats.completed;

    // Compter par type
    this.stats.byType = {};
    this.typeIndex.forEach((gameIds, type) => {
      this.stats.byType[type] = gameIds.size;
    });
  }

  /**
   * Déterminer status initial selon type de jeu
   */
  _getInitialStatus(type) {
    switch (type) {
      case 'tu_te_souviens':
      case 'double_vision':
        return 'waiting_answer';

      case 'top3':
      case 'courbe_emotionnelle':
        return 'waiting_submissions'; // Les 2 doivent soumettre

      case 'souvenir_du_jour':
        return 'active'; // Actif jusqu'à minuit

      default:
        return 'active';
    }
  }

  /**
   * Sauvegarder sur Drive
   */
  async _saveToFile() {
    const data = {
      version: '3.0',
      lastUpdated: new Date().toISOString(),
      games: Array.from(this.games.values())
    };

    try {
      await driveSync.saveFile(SAYNETES_FILE, data);
    } catch (error) {
      logger.error('❌ Erreur sauvegarde saynetes.json:', error);
      throw error;
    }
  }
}

// Singleton
export const saynetesManager = new SaynetesManager();

// Exposer pour debug
if (typeof window !== 'undefined') {
  window.saynetesManager = saynetesManager;
}
