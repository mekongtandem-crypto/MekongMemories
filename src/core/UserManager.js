/**
 * UserManager.js v2.1 - Ajout getAllUsers()
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

  // ✅ AJOUT : Retourne tous les utilisateurs
  getAllUsers() {
    return this.users;
  }

  getUserStyle(userId) {
    const user = this.getUser(userId);
    if (!user) return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };

    const colorMap = {
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' }
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

export const userManager = new UserManager();