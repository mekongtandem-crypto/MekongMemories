/**
 * NotificationManager.js v1.0
 * Gestion notifications asynchrones entre utilisateurs
 */

import { driveSync } from './DriveSync.js';

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.listeners = new Set();
    this.isLoaded = false;
    console.log('🔔 NotificationManager v1.0: Ready');
  }

  // ========================================
  // INIT & LOAD
  // ========================================

  async init() {
    try {
      await this.loadNotifications();
      console.log('✅ NotificationManager initialized');
    } catch (error) {
      console.warn('⚠️ NotificationManager init failed:', error);
    }
  }

  async loadNotifications() {
    try {
      const data = await driveSync.loadFile('notifications.json');
      
      if (data) {
        this.notifications = data.notifications || [];
        this.isLoaded = true;
        console.log(`🔔 ${this.notifications.length} notifications chargées`);
      } else {
        // Créer fichier vide si inexistant
        await this.saveNotifications();
      }
      
      this.notify();
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
      this.notifications = [];
      this.isLoaded = true;
    }
  }

  async saveNotifications() {
    try {
      const data = {
        version: '1.0',
        notifications: this.notifications
      };
      
      await driveSync.saveFile('notifications.json', data);
      console.log('💾 Notifications sauvegardées');
      this.notify();
    } catch (error) {
      console.error('❌ Erreur sauvegarde notifications:', error);
      throw error;
    }
  }

  // ========================================
  // CRUD NOTIFICATIONS
  // ========================================

  async sendNotification({ from, to, sessionId, sessionTitle }) {
    try {
      const notification = {
        id: `notif_${Date.now()}`,
        from,
        to,
        sessionId,
        sessionTitle,
        timestamp: new Date().toISOString(),
        read: false
      };

      this.notifications.push(notification);
      await this.saveNotifications();

      console.log(`🔔 Notification envoyée: ${from} → ${to} pour "${sessionTitle}"`);
      
      return { success: true, notification };
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      return { success: false, error: error.message };
    }
  }

  getNotifications(userId) {
    return this.notifications.filter(n => n.to === userId);
  }

  getUnreadNotifications(userId) {
    return this.notifications.filter(n => n.to === userId && !n.read);
  }

  getUnreadCount(userId) {
    return this.getUnreadNotifications(userId).length;
  }

  async markAsRead(notificationId) {
    try {
      const notif = this.notifications.find(n => n.id === notificationId);
      
      if (notif) {
        notif.read = true;
        await this.saveNotifications();
        console.log(`✅ Notification ${notificationId} marquée lue`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur marquage lu:', error);
      return { success: false, error: error.message };
    }
  }

  async markAllAsRead(userId) {
    try {
      let markedCount = 0;
      
      this.notifications.forEach(n => {
        if (n.to === userId && !n.read) {
          n.read = true;
          markedCount++;
        }
      });

      if (markedCount > 0) {
        await this.saveNotifications();
        console.log(`✅ ${markedCount} notifications marquées lues`);
      }

      return { success: true, count: markedCount };
    } catch (error) {
      console.error('❌ Erreur marquage tout lu:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteNotification(notificationId) {
    try {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      await this.saveNotifications();
      console.log(`🗑️ Notification ${notificationId} supprimée`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // HELPERS
  // ========================================

  getNotificationForSession(sessionId, userId) {
    return this.notifications.find(n => 
      n.sessionId === sessionId && 
      n.to === userId && 
      !n.read
    );
  }

  hasUnreadNotificationForSession(sessionId, userId) {
    return !!this.getNotificationForSession(sessionId, userId);
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
      notifications: this.notifications,
      isLoaded: this.isLoaded
    };
  }

  // ========================================
  // DEBUG
  // ========================================

  getStats() {
    const totalNotifs = this.notifications.length;
    const unreadNotifs = this.notifications.filter(n => !n.read).length;
    const byUser = {};

    this.notifications.forEach(n => {
      if (!byUser[n.to]) byUser[n.to] = { total: 0, unread: 0 };
      byUser[n.to].total++;
      if (!n.read) byUser[n.to].unread++;
    });

    return {
      total: totalNotifs,
      unread: unreadNotifs,
      byUser
    };
  }
}

export const notificationManager = new NotificationManager();

if (typeof window !== 'undefined') {
  window.notificationManager = notificationManager;
}