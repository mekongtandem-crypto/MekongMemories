/**
 * ContentLinks.js v1.1 - Phase 18b (CORRIGÉ)
 * Manager de liens bidirectionnels contenus ↔ sessions
 * Architecture Map pour performance
 */

import { driveSync } from './DriveSync.js';

const CONTENT_LINKS_FILE = 'content-links.json';

class ContentLinks {
  constructor() {
    this.links = new Map();              // linkId → link object
    this.sessionIndex = new Map();       // sessionId → Set<linkId>
    this.contentIndex = new Map();       // contentKey → Set<linkId>
    this.messageIndex = new Map();       // messageId → linkId
    this.isLoaded = false;
  }

  /**
   * Initialisation - Charger depuis Drive
   */
  async init() {
    console.log('🔗 ContentLinks: Initialisation...');
    
    try {
      // ✅ CORRIGÉ : Utiliser loadFile() comme ThemeAssignments
      const data = await driveSync.loadFile(CONTENT_LINKS_FILE);
      
      if (data) {
        console.log(`✅ ContentLinks: ${data.links?.length || 0} liens chargés`);
        
        // Rebuild indexes
        (data.links || []).forEach(link => {
          this.links.set(link.id, link);
          
          // Session index
          if (!this.sessionIndex.has(link.sessionId)) {
            this.sessionIndex.set(link.sessionId, new Set());
          }
          this.sessionIndex.get(link.sessionId).add(link.id);
          
          // Content index
          const contentKey = this._getContentKey(link.contentType, link.contentId);
          if (!this.contentIndex.has(contentKey)) {
            this.contentIndex.set(contentKey, new Set());
          }
          this.contentIndex.get(contentKey).add(link.id);
          
          // Message index
          this.messageIndex.set(link.messageId, link.id);
        });
        
        this.isLoaded = true;
      } else {
        console.log('ℹ️ ContentLinks: Fichier inexistant, création structure vide');
        await this._saveToFile();
        this.isLoaded = true;
      }
    } catch (error) {
      console.error('❌ Erreur init ContentLinks:', error);
      // ✅ Créer fichier vide si erreur
      try {
        await this._saveToFile();
        this.isLoaded = true;
        console.log('✅ ContentLinks: Fichier créé (vide)');
      } catch (saveError) {
        console.error('❌ Impossible de créer le fichier:', saveError);
        this.isLoaded = false;
      }
    }
  }

  /**
   * Ajouter un lien
   */
  async addLink({ sessionId, messageId, contentType, contentId, contentTitle, linkedBy }) {
    const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const link = {
      id: linkId,
      sessionId,
      messageId,
      contentType,
      contentId,
      contentTitle,
      linkedAt: new Date().toISOString(),
      linkedBy
    };
    
    // Add to maps
    this.links.set(linkId, link);
    
    if (!this.sessionIndex.has(sessionId)) {
      this.sessionIndex.set(sessionId, new Set());
    }
    this.sessionIndex.get(sessionId).add(linkId);
    
    const contentKey = this._getContentKey(contentType, contentId);
    if (!this.contentIndex.has(contentKey)) {
      this.contentIndex.set(contentKey, new Set());
    }
    this.contentIndex.get(contentKey).add(linkId);
    
    this.messageIndex.set(messageId, linkId);
    
    await this._saveToFile();
    console.log('✅ Lien créé:', linkId, contentKey);
    
    return linkId;
  }

  /**
   * Récupérer liens d'une session
   */
  getLinksForSession(sessionId) {
    const linkIds = this.sessionIndex.get(sessionId);
    if (!linkIds) return [];
    return Array.from(linkIds).map(id => this.links.get(id));
  }

  /**
   * Récupérer liens d'un contenu
   */
  getLinksForContent(contentType, contentId) {
    const contentKey = this._getContentKey(contentType, contentId);
    const linkIds = this.contentIndex.get(contentKey);
    if (!linkIds) return [];
    return Array.from(linkIds).map(id => this.links.get(id));
  }

  /**
   * Récupérer sessions liées à un contenu (pour compteur bulles)
   */
  getSessionsForContent(contentType, contentId) {
    const links = this.getLinksForContent(contentType, contentId);
    const sessionIds = new Set(links.map(link => link.sessionId));
    return Array.from(sessionIds);
  }

  /**
   * Récupérer lien dans un message
   */
  getLinkInMessage(messageId) {
    const linkId = this.messageIndex.get(messageId);
    return linkId ? this.links.get(linkId) : null;
  }

  /**
   * Supprimer un lien
   */
  async removeLink(linkId) {
    const link = this.links.get(linkId);
    if (!link) return;
    
    this.links.delete(linkId);
    
    const sessionLinks = this.sessionIndex.get(link.sessionId);
    if (sessionLinks) sessionLinks.delete(linkId);
    
    const contentKey = this._getContentKey(link.contentType, link.contentId);
    const contentLinks = this.contentIndex.get(contentKey);
    if (contentLinks) contentLinks.delete(linkId);
    
    this.messageIndex.delete(link.messageId);
    
    await this._saveToFile();
    console.log('🗑️ Lien supprimé:', linkId);
  }

  /**
   * Supprimer tous les liens d'un message
   */
  async removeLinksForMessage(messageId) {
    const linkId = this.messageIndex.get(messageId);
    if (linkId) {
      await this.removeLink(linkId);
    }
  }

  /**
   * Supprimer tous les liens d'une session
   */
  async removeLinksForSession(sessionId) {
    const linkIds = this.sessionIndex.get(sessionId);
    if (!linkIds) return;
    
    const idsToRemove = Array.from(linkIds);
    for (const linkId of idsToRemove) {
      await this.removeLink(linkId);
    }
  }

  /**
   * Stats d'une session
   */
  getLinkStats(sessionId) {
    const links = this.getLinksForSession(sessionId);
    return {
      momentCount: links.filter(l => l.contentType === 'moment').length,
      postCount: links.filter(l => l.contentType === 'post').length,
      photoCount: links.filter(l => l.contentType === 'photo').length,
      totalCount: links.length
    };
  }

  /**
   * Générer clé de contenu
   * @private
   */
  _getContentKey(contentType, contentId) {
    return `${contentType}:${contentId}`;
  }

  /**
   * Sauvegarder sur Drive
   * @private
   */
  async _saveToFile() {
    const data = {
      version: '1.0',
      lastModified: new Date().toISOString(),
      links: Array.from(this.links.values())
    };
    
    // ✅ CORRIGÉ : Utiliser saveFile() comme ThemeAssignments
    await driveSync.saveFile(CONTENT_LINKS_FILE, data);
    console.log('💾 ContentLinks sauvegardé');
  }
}

// Singleton
export const contentLinks = new ContentLinks();

// Exposer globalement
if (typeof window !== 'undefined') {
  window.contentLinks = contentLinks;
}