/**
     * MastodonData.js v0.8 - Fiabilisé pour la simulation
     */
    import { stateManager } from './StateManager.js';
    import { driveSync } from './DriveSync.js';

    class MastodonData {
      constructor() {
        this.posts = [];
        this.isImported = false;
        this.importedAt = null;
        console.log('📚 MastodonData: Construction...');
        this.init();
      }

  async init() {
    try {
      // Charger posts depuis StateManager si disponibles
      const savedPosts = await stateManager.get('mastodon_posts', []);
      if (savedPosts.length > 0) {
        this.posts = savedPosts;
        this.isImported = true;
        this.importedAt = await stateManager.get('mastodon_imported_at', null);
        console.log(`📚 MastodonData: ${this.posts.length} posts chargés depuis StateManager`);
      }
    } catch (error) {
      console.error('❌ MastodonData init error:', error);
    }
  }

  // ========================================
  // IMPORT DEPUIS GOOGLE DRIVE - VERSION CORRIGÉE
  // ========================================

  async importFromGoogleDrive() {
        try {
          console.log('📥 Import outbox.json...depuis /Medias/Mastodon/...');
          
                const outboxData = await driveSync.loadFileFromPath('outbox.json', ['Medias', 'Mastodon']);
      
      if (!outboxData) {
        throw new Error('Fichier outbox.json introuvable dans /Medias/Mastodon/');
      }
      
      const parsedPosts = this.parseOutboxData(outboxData);
      await this.savePosts(parsedPosts);
      
      console.log(`✅ Import terminé: ${parsedPosts.length} posts importés`);
      return { success: true, postsCount: parsedPosts.length };
      
    } catch (error) {
      console.error('❌ Erreur import Mastodon:', error);
      throw error;
    }
}

  // ========================================
  // NOUVELLE MÉTHODE : Import automatique au démarrage
  // ========================================

  async autoImportIfNeeded() {
    try {
      // Vérifier si on a déjà des posts
      const existingPosts = await stateManager.get('mastodon_posts', []);
      if (existingPosts.length > 0) {
        console.log('📚 Posts Mastodon déjà importés, pas d\'import automatique');
        return { skipped: true, reason: 'already_imported' };
      }
      
      // Vérifier connexion Google Drive
      if (!connectionManager.getState().isOnline) {
        console.log('⚠️ Pas de connexion Google Drive pour import automatique');
        return { skipped: true, reason: 'no_connection' };
      }
      
      console.log('🔄 Tentative d\'import automatique outbox.json...');
      return await this.importFromGoogleDrive();
      
    } catch (error) {
      console.warn('⚠️ Import automatique échoué:', error.message);
      return { skipped: true, reason: 'error', error: error.message };
    }
  }

  // ========================================
  // PARSING OUTBOX MASTODON
  // ========================================

  parseOutboxData(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      // Gérer structure ActivityPub
      let orderedItems;
      if (data.orderedItems) {
        orderedItems = data.orderedItems;
      } else if (data.data?.orderedItems) {
        orderedItems = data.data.orderedItems;
      } else {
        throw new Error('Format ActivityPub invalide - orderedItems non trouvé');
      }

      if (!Array.isArray(orderedItems)) {
        throw new Error('orderedItems n\'est pas un tableau');
      }

      console.log(`📄 Traitement de ${orderedItems.length} items ActivityPub...`);

      // Traiter tous les posts
      const allPosts = orderedItems
        .filter(item => item.type === 'Create' && item.object?.type === 'Note')
        .map((item, index) => {
          const note = item.object;
          const content = note.content || '';
          
          // Nettoyer HTML et décoder entités
          const cleanContent = this.cleanHtmlContent(content);
          const decodedContent = this.decodeHtmlEntities(cleanContent);
          
          // Extraire numéro de jour - format "Jnnn:" ou "Jnnn "
          const dayMatch = decodedContent.match(/^J(\d{1,3})[\s:]/);
          const dayNumber = dayMatch ? parseInt(dayMatch[1], 10) : null;
          
          // Extraire titre (première ligne nettoyée)
          const firstLine = decodedContent.split('\n')[0] || '';
          const title = this.cleanTitle(
            dayNumber ? firstLine.replace(/^J\d{1,3}[\s:]*/, '') : firstLine
          ).substring(0, 100);
          
          // Extraire photos attachées (nouvellement ajouté)
          const imageAttachments = this.extractImageAttachments(note.attachment || []);
          
          return {
            id: note.id || `post_${index}`,
            originalIndex: index,
            dayNumber: dayNumber,
            hasJourNumber: dayNumber !== null,
            title: title || `Post ${index + 1}`,
            content: decodedContent,
            cleanContent: this.stripAllHtml(decodedContent),
            published: note.published,
            url: note.url,
            photos: imageAttachments, // NOUVEAU: Liste des photos
            photoCount: imageAttachments.length, // NOUVEAU: Compteur photos
            attachment: note.attachment
          };
        });

      // Séparer posts avec/sans numéro de jour
      const postsWithDay = allPosts.filter(post => post.hasJourNumber);
      const postsWithoutDay = allPosts.filter(post => !post.hasJourNumber);

      // Attribuer numéros pour posts sans jour
      const maxDayNumber = postsWithDay.length > 0 ? 
        Math.max(...postsWithDay.map(p => p.dayNumber)) : 0;
      postsWithoutDay.forEach((post, index) => {
        post.dayNumber = maxDayNumber + index + 1;
        post.isExtraPost = true;
      });

      // Combiner tous les posts
      const finalPosts = [...postsWithDay, ...postsWithoutDay];

      // Nettoyer propriétés temporaires
      finalPosts.forEach(post => {
        delete post.hasJourNumber;
        delete post.originalIndex;
      });

      console.log(`✅ ${finalPosts.length} posts traités`);
      console.log(`   - ${postsWithDay.length} posts avec numéro (J1 à J${maxDayNumber})`);
      console.log(`   - ${postsWithoutDay.length} posts additionnels`);
      
      const postsWithPhotos = finalPosts.filter(p => p.photoCount > 0);
      const totalPhotos = finalPosts.reduce((sum, p) => sum + p.photoCount, 0);
      console.log(`📷 ${postsWithPhotos.length} posts avec photos (${totalPhotos} total)`);
      
      return finalPosts;
      
    } catch (error) {
      console.error('❌ Erreur parsing outbox:', error);
      throw error;
    }
  }

  // ========================================
  // UTILITAIRES PARSING
  // ========================================

  cleanHtmlContent(htmlContent) {
    // Supprimer balises HTML mais garder structure
    return htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  stripAllHtml(content) {
    // Version texte pur pour recherche
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  decodeHtmlEntities(text) {
    // ⭐ v2.17i : Méthode plus robuste pour décoder émojis et entités HTML
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      return doc.documentElement.textContent || '';
    } catch (e) {
      // Fallback: méthode textarea si DOMParser échoue
      const textArea = document.createElement('textarea');
      textArea.innerHTML = text;
      return textArea.value;
    }
  }

  cleanTitle(title) {
    // ⭐ v2.17h : Garder les émojis dans les titres (ne plus les supprimer)
    return title
      // .replace(/[⛩️🦩✈️🇨🇵🔥⚡🌟🎯💪🚀✨🎉🎊🎈🎁🎀🎇🎆]/g, '')  // Désactivé pour garder émojis
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractImageAttachments(attachments) {
    if (!Array.isArray(attachments)) return [];
    
    return attachments
      .filter(attachment => 
        attachment.type === 'Document' && 
        attachment.mediaType && 
        attachment.mediaType.startsWith('image/')
      )
      .map(attachment => ({
        url: attachment.url,
        name: attachment.name || 'Photo',
        mediaType: attachment.mediaType,
        width: attachment.width,
        height: attachment.height,
        blurhash: attachment.blurhash
      }));
  }

  // ========================================
  // GESTION DES DONNÉES
  // ========================================

  async savePosts(posts) {
    try {
      this.posts = posts;
      this.isImported = true;
      this.importedAt = new Date().toISOString();
      
      // Sauvegarder dans StateManager
      await stateManager.set('mastodon_posts', posts);
      await stateManager.set('mastodon_imported_at', this.importedAt);
      
      console.log('💾 Posts Mastodon sauvegardés dans StateManager');
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde posts:', error);
      throw error;
    }
  }

  // ========================================
  // API PUBLIQUE
  // ========================================

  getPosts() {
    return this.posts;
  }

  getPostByDay(dayNumber) {
    return this.posts.find(post => post.dayNumber === dayNumber);
  }

  getPostsByDayRange(startDay, endDay) {
    return this.posts.filter(post => 
      post.dayNumber >= startDay && post.dayNumber <= endDay
    );
  }

  searchPosts(query) {
    if (!query.trim()) return this.posts;
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    return this.posts.filter(post => 
      searchTerms.every(term => 
        post.cleanContent.toLowerCase().includes(term) ||
        post.title.toLowerCase().includes(term)
      )
    );
  }

  getRandomPost() {
    if (this.posts.length === 0) return null;
    return this.posts[Math.floor(Math.random() * this.posts.length)];
  }

  getStats() {
    const extraPosts = this.posts.filter(p => p.isExtraPost);
    const postsWithPhotos = this.posts.filter(p => p.photoCount > 0);
    const totalPhotos = this.posts.reduce((sum, p) => sum + p.photoCount, 0);
    
    return {
      totalPosts: this.posts.length,
      regularPosts: this.posts.length - extraPosts.length,
      extraPosts: extraPosts.length,
      postsWithPhotos: postsWithPhotos.length,
      totalMastodonPhotos: totalPhotos,
      dayRange: this.posts.length > 0 ? {
        min: Math.min(...this.posts.map(p => p.dayNumber)),
        max: Math.max(...this.posts.map(p => p.dayNumber))
      } : null,
      isImported: this.isImported,
      importedAt: this.importedAt
    };
  }

  async reset() {
    this.posts = [];
    this.isImported = false;
    this.importedAt = null;
    
    await stateManager.remove('mastodon_posts');
    await stateManager.remove('mastodon_imported_at');
    
    console.log('🔄 MastodonData reset');
  }
}

// Instance globale unique
export const mastodonData = new MastodonData();

// Export pour debugging
if (typeof window !== 'undefined') {
  window.mastodonData = mastodonData;
  console.log('🛠️ MastodonData disponible via window.mastodonData');
}