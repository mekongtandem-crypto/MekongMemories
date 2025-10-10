/**
 * ThemeAssignments.js v1.0
 * Gestionnaire des assignments thèmes ↔ contenus
 * Inspiré de NotificationManager.js
 */

import { driveSync } from './DriveSync.js';

class ThemeAssignments {
  constructor() {
    this.assignments = {}; // { contentKey: { themes: [], assignedBy, assignedAt } }
    this.listeners = new Set();
    this.isLoaded = false;
    console.log('🏷️ ThemeAssignments v1.0: Ready');
  }

  // ========================================
  // INIT & LOAD
  // ========================================

  async init() {
    try {
      await this.loadAssignments();
      console.log('✅ ThemeAssignments initialized');
    } catch (error) {
      console.warn('⚠️ ThemeAssignments init failed:', error);
    }
  }

  async loadAssignments() {
    try {
      const data = await driveSync.loadFile('theme_assignments.json');
      
      if (data) {
        this.assignments = data.assignments || {};
        this.isLoaded = true;
        console.log(`🏷️ ${Object.keys(this.assignments).length} assignments chargés`);
      } else {
        // Créer fichier vide si inexistant
        await this.saveAssignments();
      }
      
      this.notify();
    } catch (error) {
      console.error('❌ Erreur chargement assignments:', error);
      this.assignments = {};
      this.isLoaded = true;
    }
  }

  async saveAssignments() {
    try {
      const data = {
        version: '1.0',
        lastModified: new Date().toISOString(),
        assignments: this.assignments
      };
      
      await driveSync.saveFile('theme_assignments.json', data);
      console.log('💾 Assignments sauvegardés');
      this.notify();
    } catch (error) {
      console.error('❌ Erreur sauvegarde assignments:', error);
      throw error;
    }
  }

  // ========================================
  // CRUD ASSIGNMENTS
  // ========================================

  /**
   * Assigne des thèmes à un contenu
   * @param {string} contentKey - Clé composite (ex: "post:https://...")
   * @param {Array<string>} themeIds - IDs des thèmes
   * @param {string} userId - ID utilisateur qui fait l'action
   */
  async assignThemes(contentKey, themeIds, userId) {
    try {
      if (!contentKey || !Array.isArray(themeIds)) {
        throw new Error('Paramètres invalides');
      }

      this.assignments[contentKey] = {
        themes: themeIds,
        assignedBy: userId,
        assignedAt: new Date().toISOString()
      };

      await this.saveAssignments();

      console.log(`🏷️ Thèmes assignés: ${contentKey} → [${themeIds.join(', ')}]`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur assignation thèmes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retire des thèmes d'un contenu
   * @param {string} contentKey - Clé composite
   * @param {Array<string>} themeIds - IDs des thèmes à retirer
   */
  async removeThemes(contentKey, themeIds) {
    try {
      if (!this.assignments[contentKey]) {
        return { success: true }; // Déjà pas de thèmes
      }

      const currentThemes = this.assignments[contentKey].themes;
      const newThemes = currentThemes.filter(t => !themeIds.includes(t));

      if (newThemes.length === 0) {
        // Plus aucun thème → supprimer l'entrée
        delete this.assignments[contentKey];
      } else {
        this.assignments[contentKey].themes = newThemes;
      }

      await this.saveAssignments();

      console.log(`🏷️ Thèmes retirés: ${contentKey}`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur retrait thèmes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère les thèmes d'un contenu
   * @param {string} contentKey - Clé composite
   * @returns {Array<string>} IDs des thèmes
   */
  getThemesForContent(contentKey) {
    if (!contentKey) return [];
    return this.assignments[contentKey]?.themes || [];
  }

  /**
   * Récupère tous les contenus taggués avec un thème
   * @param {string} themeId - ID du thème
   * @returns {Array<string>} Clés composites des contenus
   */
  getAllContentsByTheme(themeId) {
    return Object.keys(this.assignments).filter(key => 
      this.assignments[key].themes.includes(themeId)
    );
  }

  /**
   * Supprime tous les assignments d'un thème (suppression en cascade)
   * @param {string} themeId - ID du thème
   */
  async deleteThemeAssignments(themeId) {
    try {
      let deletedCount = 0;

      Object.keys(this.assignments).forEach(key => {
        const themes = this.assignments[key].themes;
        const newThemes = themes.filter(t => t !== themeId);

        if (newThemes.length === 0) {
          // Plus aucun thème → supprimer l'entrée
          delete this.assignments[key];
          deletedCount++;
        } else if (newThemes.length < themes.length) {
          // Il reste des thèmes → mettre à jour
          this.assignments[key].themes = newThemes;
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        await this.saveAssignments();
        console.log(`🗑️ ${deletedCount} assignments supprimés pour le thème ${themeId}`);
      }

      return { success: true, deletedCount };
    } catch (error) {
      console.error('❌ Erreur suppression assignments:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // STATS & DEBUG
  // ========================================

  getStats() {
    const totalAssignments = Object.keys(this.assignments).length;
    
    const byType = {
      posts: 0,
      photosMoment: 0,
      photosMastodon: 0
    };

    Object.keys(this.assignments).forEach(key => {
      if (key.startsWith('post:')) byType.posts++;
      else if (key.startsWith('photo_moment:')) byType.photosMoment++;
      else if (key.startsWith('photo_mastodon:')) byType.photosMastodon++;
    });

    return {
      totalAssignments,
      byType,
      isLoaded: this.isLoaded
    };
  }

  // ========================================
  // PUB/SUB
  // ========================================

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  getState() {
    return {
      assignments: this.assignments,
      isLoaded: this.isLoaded
    };
  }
}

export const themeAssignments = new ThemeAssignments();

if (typeof window !== 'undefined') {
  window.themeAssignments = themeAssignments;
}