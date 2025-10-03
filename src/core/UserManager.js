/**
 * UserManager v0.8.2- Ajout des avaters users
 */



export const USERS = {
  tom: {
    id: 'tom',
    name: 'Tom', // Nom simplifié pour l'affichage
    color: 'blue',
    emoji: '👨‍💻', // <-- AJOUT
    description: 'Le jeune aventurier'
  },
  lambert: {
    id: 'lambert',
    name: 'Lambert', // Nom simplifié
    color: 'green',
    emoji: '👨‍🚀', // <-- AJOUT
    description: 'Le sage guide'
  },
  duo: {
    id: 'duo',
    name: 'Duo', // Nom simplifié
    color: 'amber',
    emoji: '🧑‍🤝‍🧑', // <-- AJOUT
    description: 'Session père-fils'
  }
};

export class UserManager {
  constructor() {
    console.log('👤 UserManager: Construction...');
    this.users = [
    { id: 'lambert', name: 'Lambert', color: 'green', emoji: localStorage.getItem('mekong_avatar_lambert') || '🚴', description: 'L\'explorateur intrépide' },
    { id: 'tom', name: 'Tom', color: 'blue', emoji: localStorage.getItem('mekong_avatar_tom') || '👨‍💻', description: 'Le jeune aventurier' },
    { id: 'duo', name: 'Duo', color: 'amber', emoji: localStorage.getItem('mekong_avatar_duo') || '👥', description: 'L\'équipe complète' }
  ];
  }

  /**
   * Obtenir tous les utilisateurs
   */
  getAllUsers() {
    return Object.values(USERS);
  }

  /**
   * Obtenir un utilisateur par ID
   */
  getUser(userId) {
    return USERS[userId] || null;
  }

// Dans UserManager.js, ajoute cette méthode après getUser()

updateUserEmoji(userId, newEmoji) {
  const user = this.users.find(u => u.id === userId);
  if (user) {
    user.emoji = newEmoji;
    // Sauvegarder en localStorage pour persister
    localStorage.setItem(`mekong_avatar_${userId}`, newEmoji);
  }
}




  /**
   * Valider qu'un ID utilisateur existe
   */
  isValidUser(userId) {
    return userId && USERS.hasOwnProperty(userId);
  }

  /**
   * Obtenir les styles CSS pour un utilisateur
   */
  getUserStyle(userId) {
    const user = this.getUser(userId);
    if (!user) return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800' };
    
    const styles = {
      blue: { 
        bg: 'bg-blue-100 hover:bg-blue-200', 
        border: 'border-blue-300', 
        text: 'text-blue-800' 
      },
      green: { 
        bg: 'bg-green-100 hover:bg-green-200', 
        border: 'border-green-300', 
        text: 'text-green-800' 
      },
      amber: { 
        bg: 'bg-amber-100 hover:bg-amber-200', 
        border: 'border-amber-300', 
        text: 'text-amber-800' 
      }
    };
    
    return styles[user.color] || styles.blue;
  }

  /**
   * Obtenir l'utilisateur suivant (pour rotation)
   */
  getNextUser(currentUserId) {
    const userIds = ['', ...Object.keys(USERS)]; // '' = aucun utilisateur
    const currentIndex = userIds.indexOf(currentUserId);
    const nextIndex = (currentIndex + 1) % userIds.length;
    return userIds[nextIndex];
  }

  /**
   * Formater le nom d'affichage
   */
  getDisplayName(userId) {
    if (!userId) return 'Aucun utilisateur';
    const user = this.getUser(userId);
    return user ? user.name : 'Utilisateur inconnu';
  }

  /**
   * Obtenir l'emoji pour un utilisateur
   */
  getUserEmoji(userId) {
    const user = this.getUser(userId);
    return user ? user.emoji : '❓';
  }
}

// Instance globale unique
export const userManager = new UserManager();

// Export pour debugging
if (typeof window !== 'undefined') {
  window.userManager = userManager;
  console.log('🛠️ UserManager disponible via window.userManager');
}