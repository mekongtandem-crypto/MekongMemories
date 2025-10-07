/**
 * UserManager.js v2.2 - Système de couleurs dynamique
 */


class UserManager {
  constructor() {
    this.users = [
      { 
        id: 'lambert', 
        name: 'Lambert', 
        color: localStorage.getItem('mekong_color_lambert') || 'green',
        emoji: localStorage.getItem('mekong_avatar_lambert') || '🚴', 
        description: 'L\'explorateur intrépide' 
      },
      { 
        id: 'tom', 
        name: 'Tom', 
        color: localStorage.getItem('mekong_color_tom') || 'blue',
        emoji: localStorage.getItem('mekong_avatar_tom') || '👨‍💻', 
        description: 'Le jeune aventurier' 
      },
      { 
        id: 'duo', 
        name: 'Duo', 
        color: localStorage.getItem('mekong_color_duo') || 'amber', 
        emoji: localStorage.getItem('mekong_avatar_duo') || '👥', 
        description: 'L\'équipe complète' 
      }
    ];
  }

  getUser(userId) {
    return this.users.find(user => user.id === userId);
  }

  getAllUsers() {
    return this.users;
  }

  // ✅ VERSION AMÉLIORÉE AVEC TOUTES LES COULEURS ET STYLES
  getUserStyle(userId) {
    const user = this.getUser(userId);
    if (!user) {
      // Style par défaut pour les cas non prévus
      return { 
        bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300',
        strong_bg: 'bg-gray-500', strong_border: 'border-gray-700', ring: 'ring-gray-400'
      };
    }

    const colorMap = {
      green: { 
        bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300',
        strong_bg: 'bg-green-500', strong_border: 'border-green-700', ring: 'ring-green-400'
      },
      blue: { 
        bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300',
        strong_bg: 'bg-blue-500', strong_border: 'border-blue-700', ring: 'ring-blue-400'
      },
      amber: { 
        bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300',
        strong_bg: 'bg-amber-500', strong_border: 'border-amber-700', ring: 'ring-amber-400'
      },
      purple: { 
        bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300',
        strong_bg: 'bg-purple-500', strong_border: 'border-purple-700', ring: 'ring-purple-400'
      },
      red: { 
        bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300',
        strong_bg: 'bg-red-500', strong_border: 'border-red-700', ring: 'ring-red-400'
      }
    };

    return colorMap[user.color] || colorMap.amber;
  }

  updateUserColor(userId, newColor) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.color = newColor;
      localStorage.setItem(`mekong_color_${userId}`, newColor);
      console.log(`✅ Couleur mise à jour pour ${userId}: ${newColor}`);
    }
  }

  updateUserEmoji(userId, newEmoji) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.emoji = newEmoji;
      localStorage.setItem(`mekong_avatar_${userId}`, newEmoji);
      console.log(`✅ Avatar mis à jour pour ${userId}: ${newEmoji}`);
    }
  }
}

// On s'assure que l'export est bien un "export nommé"
export const userManager = new UserManager();