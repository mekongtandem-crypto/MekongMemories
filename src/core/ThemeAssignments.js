/**
 * ThemeAssignments.js v2.0 - Optimisé
 * ✅ Index inversé pour performance
 * ✅ Batch operations
 * ✅ Support moment tagging (désactivé mais prévu)
 */

import { driveSync } from './DriveSync.js';

class ThemeAssignments {
  constructor() {
    this.assignments = {}; // { contentKey: { themes: [], assignedBy, assignedAt } }
    this.invertedIndex = {}; // { themeId: Set([contentKey, ...]) } - NOUVEAU
    this.listeners = new Set();
    this.isLoaded = false;
    this.allowMomentTagging = false; // ✅ NOUVEAU : Option pour tagging moments entiers
    console.log('🏷️ ThemeAssignments v2.0: Ready');
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
        this.rebuildInvertedIndex(); // ✅ NOUVEAU : Reconstruire index
        this.isLoaded = true;
        console.log(`🏷️ ${Object.keys(this.assignments).length} assignments chargés`);
      } else {
        await this.saveAssignments();
      }
      
      this.notify();
    } catch (error) {
      console.error('❌ Erreur chargement assignments:', error);
      this.assignments = {};
      this.invertedIndex = {};
      this.isLoaded = true;
    }
  }

  // ✅ NOUVEAU : Reconstruction index inversé
  rebuildInvertedIndex() {
    this.invertedIndex = {};
    
    Object.entries(this.assignments).forEach(([contentKey, data]) => {
      data.themes.forEach(themeId => {
        if (!this.invertedIndex[themeId]) {
          this.invertedIndex[themeId] = new Set();
        }
        this.invertedIndex[themeId].add(contentKey);
      });
    });
    
    console.log(`📊 Index inversé: ${Object.keys(this.invertedIndex).length} thèmes indexés`);
  }

  async saveAssignments() {
    try {
      const data = {
        version: '2.0',
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

      // Retirer des anciens index
      const oldThemes = this.assignments[contentKey]?.themes || [];
      oldThemes.forEach(themeId => {
        this.invertedIndex[themeId]?.delete(contentKey);
      });

      // Nouvelle assignation
      this.assignments[contentKey] = {
        themes: themeIds,
        assignedBy: userId,
        assignedAt: new Date().toISOString()
      };

      // Ajouter aux nouveaux index
      themeIds.forEach(themeId => {
        if (!this.invertedIndex[themeId]) {
          this.invertedIndex[themeId] = new Set();
        }
        this.invertedIndex[themeId].add(contentKey);
      });

      await this.saveAssignments();

      console.log(`🏷️ Thèmes assignés: ${contentKey} → [${themeIds.join(', ')}]`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur assignation thèmes:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ NOUVEAU : Batch assignation (pour plusieurs contenus)
  async assignThemesBatch(contentKeys, themeIds, userId) {
    try {
      if (!Array.isArray(contentKeys) || !Array.isArray(themeIds)) {
        throw new Error('Paramètres invalides');
      }

      for (const contentKey of contentKeys) {
        // Retirer des anciens index
        const oldThemes = this.assignments[contentKey]?.themes || [];
        oldThemes.forEach(themeId => {
          this.invertedIndex[themeId]?.delete(contentKey);
        });

        // Nouvelle assignation
        this.assignments[contentKey] = {
          themes: themeIds,
          assignedBy: userId,
          assignedAt: new Date().toISOString()
        };

        // Ajouter aux nouveaux index
        themeIds.forEach(themeId => {
          if (!this.invertedIndex[themeId]) {
            this.invertedIndex[themeId] = new Set();
          }
          this.invertedIndex[themeId].add(contentKey);
        });
      }

      await this.saveAssignments();

      console.log(`🏷️ Batch: ${contentKeys.length} contenus → [${themeIds.join(', ')}]`);
      
      return { success: true, count: contentKeys.length };
    } catch (error) {
      console.error('❌ Erreur batch assignation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retire des thèmes d'un contenu
   */
  async removeThemes(contentKey, themeIds) {
    try {
      if (!this.assignments[contentKey]) {
        return { success: true };
      }

      const currentThemes = this.assignments[contentKey].themes;
      const newThemes = currentThemes.filter(t => !themeIds.includes(t));

      // Retirer de l'index inversé
      themeIds.forEach(themeId => {
        this.invertedIndex[themeId]?.delete(contentKey);
      });

      if (newThemes.length === 0) {
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
   */
  getThemesForContent(contentKey) {
    if (!contentKey) return [];
    return this.assignments[contentKey]?.themes || [];
  }

  /**
   * ✅ OPTIMISÉ : Récupère tous les contenus taggués avec un thème (O(1) au lieu de O(n))
   */
  getAllContentsByTheme(themeId) {
    return Array.from(this.invertedIndex[themeId] || []);
  }

  /**
   * Supprime tous les assignments d'un thème (cascade)
   */
  async deleteThemeAssignments(themeId) {
    try {
      let deletedCount = 0;

      // Récupérer tous les contenus via index inversé (rapide)
      const affectedContents = Array.from(this.invertedIndex[themeId] || []);

      affectedContents.forEach(contentKey => {
        const themes = this.assignments[contentKey].themes;
        const newThemes = themes.filter(t => t !== themeId);

        if (newThemes.length === 0) {
          delete this.assignments[contentKey];
          deletedCount++;
        } else {
          this.assignments[contentKey].themes = newThemes;
          deletedCount++;
        }
      });

      // Nettoyer l'index inversé
      delete this.invertedIndex[themeId];

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
  // ✅ NOUVEAU : MOMENT TAGGING (désactivé)
  // ========================================

  /**
   * Tag un moment entier (tous ses contenus)
   * @param {Object} moment - Moment complet
   * @param {Array<string>} themeIds - IDs des thèmes
   * @param {string} userId - ID utilisateur
   */
  async assignThemesToMoment(moment, themeIds, userId) {
    if (!this.allowMomentTagging) {
      console.warn('⚠️ Moment tagging désactivé');
      return { success: false, error: 'Feature désactivée' };
    }

    try {
      const contentKeys = [];

      // Collecter tous les posts
      moment.posts?.forEach(post => {
        contentKeys.push(`post:${post.id}`);
      });

      // Collecter toutes les photos moment
      moment.dayPhotos?.forEach(photo => {
        if (photo.google_drive_id) {
          contentKeys.push(`photo_moment:${photo.google_drive_id}`);
        }
      });

      // Collecter toutes les photos Mastodon
      moment.posts?.forEach(post => {
        post.photos?.forEach(photo => {
          if (photo.google_drive_id) {
            contentKeys.push(`photo_mastodon:${photo.google_drive_id}`);
          }
        });
      });

      // Batch assign
      const result = await this.assignThemesBatch(contentKeys, themeIds, userId);

      console.log(`✅ Moment "${moment.displayTitle}" taggué (${contentKeys.length} contenus)`);

      return result;
    } catch (error) {
      console.error('❌ Erreur moment tagging:', error);
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
      isLoaded: this.isLoaded,
      indexSize: Object.keys(this.invertedIndex).length
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