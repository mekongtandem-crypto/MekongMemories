/**
 * SettingsPage.jsx v4.3 - Phase 25 - DarkMode
 * 
 */
 
import React, { useState, useEffect, useRef } from 'react';
import { APP_VERSION, APP_NAME, PHASE, BUILD_DATE } from '../../config/version.js';
import { useAppState } from '../../hooks/useAppState.js';
import { useTheme } from '../ThemeContext.jsx';
import { userManager } from '../../core/UserManager.js';
import { sortThemes } from '../../utils/themeUtils.js';
import { THEME_COLORS, generateThemeId, countThemeContents } from '../../utils/themeUtils.js';
import { RefreshCw, Database, Users, Info, ChevronDown, Cloud, CloudOff, Plus, Edit, Trash2, Tag, Sun, Moon } from 'lucide-react';

// ✅ Liste réduite de suggestions (12 emojis)
const SUGGESTED_EMOJIS = [
  '🏛️', '🍜', '🚂', '🌴', '🎭', '👥',
  '🏙️', '📸', '🎒', '🗺️', '🧳', '⛺'
];

function generateUserActivityStats(sessions, masterIndex, users) {
  if (!masterIndex || !sessions || !users) return null;

  const totalMoments = masterIndex.moments?.length || 0;
  const exploredMomentIds = new Set(sessions.map(s => s.gameId));
  const exploredCount = exploredMomentIds.size;
  const explorationRate = totalMoments > 0 ? (exploredCount / totalMoments) * 100 : 0;
  const totalMessages = sessions.reduce((sum, s) => sum + (s.notes?.length || 0), 0);

  const userStats = {};
  users.filter(u => u.id !== 'duo').forEach(u => {
    userStats[u.id] = { messages: 0, sessionsCreated: 0 };
  });

  sessions.forEach(session => {
    if (userStats[session.user]) {
      userStats[session.user].sessionsCreated++;
    }
    session.notes?.forEach(note => {
      if (userStats[note.author]) {
        userStats[note.author].messages++;
      }
    });
  });

  let mostTalkativeSession = null;
  if (sessions.length > 0) {
    mostTalkativeSession = sessions
        .filter(s => s.notes && s.notes.length > 0)
        .reduce((max, current) => 
            (current.notes.length || 0) > (max.notes?.length || 0) ? current : max, sessions[0]
        );
  }
  
  const activeSessions = sessions.filter(s => !s.completed && !s.archived && s.notes?.length > 0);
  let oldestActiveSession = null;
  if (activeSessions.length > 0) {
    oldestActiveSession = activeSessions.reduce((min, current) => 
      new Date(current.notes[0].timestamp) < new Date(min.notes[0].timestamp) ? current : min
    );
  }

  return {
    explorationRate,
    totalMessages,
    userStats,
    mostTalkativeSession,
    oldestActiveSession
  };
}

// Composant de confirmation personnalisé
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-600 whitespace-pre-line mb-6">{message}</p>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const app = useAppState();
  const { isDark, toggleTheme } = useTheme();
  
  const [openSections, setOpenSections] = useState({
    users: false,
    theme: false,
    stats: false,
    themes: false,
    connection: false,
    data: false
  });

// ✅ Mémoriser l'état openSections pour éviter fermeture au changement d'user
  const openSectionsRef = useRef(openSections);
  
  useEffect(() => {
    openSectionsRef.current = openSections;
  }, [openSections]);
  
  // ✅ Restaurer openSections après changement d'utilisateur
  useEffect(() => {
    if (app.currentUser) {
      setOpenSections(openSectionsRef.current);
    }
  }, [app.currentUser]);
	
	
  const [themes, setThemes] = useState([]);
  const [themeSortOrder, setThemeSortOrder] = useState(
  localStorage.getItem('mekong_theme_sort_order') || 'usage'
);
 
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  
  const [themeName, setThemeName] = useState('');
  const [themeIcon, setThemeIcon] = useState('');
  const [themeColor, setThemeColor] = useState('purple');

  const [editingUser, setEditingUser] = useState({ id: null, type: null });

  const [regenerationProgress, setRegenerationProgress] = useState({
    isActive: false, step: '', message: '', progress: 0, logs: []
  });

const [confirmDelete, setConfirmDelete] = useState({
  isOpen: false,
  themeId: null,
  message: ''
});

  useEffect(() => {
    if (app.masterIndex?.themes) {
      setThemes(app.masterIndex.themes);
    }
  }, [app.masterIndex?.themes]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Exposer l'action d'ouverture de section pour OverflowMenu
  useEffect(() => {
    window.settingsPageActions = {
      openSection: (sectionName) => {
        setOpenSections(prev => ({ ...prev, [sectionName]: true }));
      }
    };
    
    return () => {
      delete window.settingsPageActions;
    };
  }, []);

  // ========================================
  // GESTION THÈMES
  // ========================================

  const handleCreateTheme = async () => {
    if (!themeName.trim() || !themeIcon.trim()) {
      alert('Nom et icône requis');
      return;
    }

    const newTheme = {
      id: generateThemeId(themeName),
      name: themeName.trim(),
      icon: themeIcon.trim(),
      color: themeColor,
      createdAt: new Date().toISOString(),
      createdBy: app.currentUser?.id || 'unknown'
    };

    if (themes.some(t => t.id === newTheme.id)) {
      alert('Un thème avec ce nom existe déjà');
      return;
    }

    const updatedMasterIndex = {
      ...app.masterIndex,
      themes: [...themes, newTheme]
    };

    const result = await window.dataManager.saveMasterIndex(updatedMasterIndex);

    if (result.success) {
      setThemes([...themes, newTheme]);
      setThemeName('');
      setThemeIcon('');
      setThemeColor('purple');
      setShowThemeForm(false);
      console.log('✅ Thème créé:', newTheme);
    } else {
      alert('Erreur lors de la création du thème');
    }
  };

  const handleStartEdit = (theme) => {
    setEditingTheme(theme.id);
    setThemeName(theme.name);
    setThemeIcon(theme.icon);
    setThemeColor(theme.color);
    setShowThemeForm(false);
  };

  const handleSaveEdit = async () => {
    if (!themeName.trim() || !themeIcon.trim()) {
      alert('Nom et icône requis');
      return;
    }

    const updatedThemes = themes.map(t => 
      t.id === editingTheme 
        ? { ...t, name: themeName.trim(), icon: themeIcon.trim(), color: themeColor }
        : t
    );

    const updatedMasterIndex = {
      ...app.masterIndex,
      themes: updatedThemes
    };

    const result = await window.dataManager.saveMasterIndex(updatedMasterIndex);

    if (result.success) {
      setThemes(updatedThemes);
      setEditingTheme(null);
      setThemeName('');
      setThemeIcon('');
      setThemeColor('purple');
      console.log('✅ Thème modifié');
    } else {
      alert('Erreur lors de la modification du thème');
    }
  };

  const handleCancelEdit = () => {
    setEditingTheme(null);
    setThemeName('');
    setThemeIcon('');
    setThemeColor('purple');
  };

  const handleDeleteTheme = async (themeId) => {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;

  const stats = countThemeContents(window.themeAssignments, themeId);
  
  let confirmMessage;
  if (stats.totalCount === 0) {
    confirmMessage = `Supprimer le thème "${theme.name}" ?`;
  } else if (stats.totalCount > 10) {
    confirmMessage = `⚠️ ATTENTION : Ce thème est utilisé sur ${stats.totalCount} contenus !\n\n` +
      `• ${stats.postCount} article${stats.postCount > 1 ? 's' : ''}\n` +
      `• ${stats.photoCount} photo${stats.photoCount > 1 ? 's' : ''}\n\n` +
      `Si vous le supprimez, tous ces contenus seront détaggués.\n\n` +
      `Êtes-vous VRAIMENT sûr de vouloir continuer ?`;
  } else {
    confirmMessage = `⚠️ Ce thème est utilisé sur ${stats.totalCount} contenu${stats.totalCount > 1 ? 's' : ''}.\n\n` +
      `Si vous le supprimez, ${stats.totalCount === 1 ? 'ce contenu sera détaggué' : 'ces contenus seront détaggués'}.\n\n` +
      `Continuer ?`;
  }

  // ✅ Ouvrir le modal React au lieu de confirm()
  setConfirmDelete({
    isOpen: true,
    themeId: themeId,
    message: confirmMessage,
    stats: stats
  });
};

// ✅ NOUVELLE fonction pour exécuter la suppression
const executeDeleteTheme = async () => {
  const { themeId, stats } = confirmDelete;
  
  if (stats.totalCount > 0) {
    await window.themeAssignments.deleteThemeAssignments(themeId);
  }

  const updatedThemes = themes.filter(t => t.id !== themeId);
  const updatedMasterIndex = {
    ...app.masterIndex,
    themes: updatedThemes
  };

  const result = await window.dataManager.saveMasterIndex(updatedMasterIndex);

  if (result.success) {
    setThemes(updatedThemes);
    console.log(`✅ Thème supprimé (${stats.totalCount} assignations nettoyées)`);
  } else {
    alert('Erreur lors de la suppression du thème');
  }
  
  // Fermer le modal
  setConfirmDelete({ isOpen: false, themeId: null, message: '' });
};

  // ========================================
  // GESTION UTILISATEURS
  // ========================================

  const forceUserUpdate = () => {
    const currentId = app.currentUser?.id;
    if (!currentId) return;
    
    // ✅ CRITIQUE : Sauvegarder l'état des sections ouvertes
    const savedOpenSections = { ...openSections };
    const savedEditingUser = { ...editingUser };
    
    app.setCurrentUser(null);
    
    requestAnimationFrame(() => {
      app.setCurrentUser(currentId);
      
      // ✅ CRITIQUE : Restaurer l'état après le cycle
      setTimeout(() => {
        setOpenSections(savedOpenSections);
        setEditingUser(savedEditingUser);
      }, 50);
    });
  };
  
  const handleChangeAvatar = (userId, newEmoji) => {
    // Validation : emoji non vide et pas juste des espaces
    const trimmed = newEmoji.trim();
    if (!trimmed || trimmed.length === 0) {
      // ✅ Ne pas alerter pour chaque touche, juste revenir à l'emoji précédent
      return;
    }
    
    // Validation : pas de caractères alphanumériques simples
    if (/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
      return; // Bloquer silencieusement
    }
    
    userManager.updateUserEmoji(userId, trimmed);
    forceUserUpdate();
  };

  const handleChangeColor = (userId, newColor) => {
    userManager.updateUserColor(userId, newColor);
    forceUserUpdate();
  };

  // ========================================
  // RÉGÉNÉRATION INDEX
  // ========================================

  const handleRegenerateIndex = async () => {
    if (!confirm('Régénérer l\'index complet ? Cette opération peut prendre quelques minutes.')) return;
    setRegenerationProgress({ isActive: true, step: 'init', message: 'Initialisation...', progress: 0, logs: ['🚀 Démarrage...'] });
    try {
      window.masterIndexGenerator.setProgressCallback((progressData) => {
        setRegenerationProgress(prev => ({ 
          ...prev, 
          isActive: true, 
          ...progressData, 
          logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${progressData.message}`].slice(-20) 
        }));
      });
      const result = await window.masterIndexGenerator.generateMomentsStructure();
      if (result?.success) {
        // ✅ FIX v2.6.5 : Recharger au lieu de RE-générer (évite double génération)
        await app.reloadMasterIndex();
        setRegenerationProgress(prev => ({ 
          ...prev, 
          isActive: false, 
          logs: [...prev.logs, '✅ Index rechargé ! Rechargez la page (F5).'] 
        }));
        setTimeout(() => setRegenerationProgress({ isActive: false, step: '', message: '', progress: 0, logs: [] }), 5000);
      } else { 
        throw new Error(result?.error || 'Erreur inconnue'); 
      }
    } catch (error) {
      console.error('❌ Erreur régénération:', error);
      setRegenerationProgress(prev => ({ 
        ...prev, 
        isActive: false, 
        logs: [...prev.logs, `❌ ERREUR : ${error.message}`] 
      }));
    }
  };

  const users = userManager.getAllUsers();
  const isOnline = app.connection?.isOnline;
  const connectionEmail = 'mekongtandem@gmail.com';

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      
      {/* Section Utilisateurs */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection('users')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Utilisateurs</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${openSections.users ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.users && (
          <div className="p-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-3">
              {users.map(user => {
                const isActive = app.currentUser?.id === user.id;
                const currentUserData = userManager.getUser(user.id) || user;
                const style = userManager.getUserStyle(user.id);
                return (
                  <button
                    key={`${user.id}-selector`}
                    onClick={() => app.setCurrentUser(user.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isActive 
                        ? `${style.bg} ${style.border} ring-2 ring-offset-2 ${style.ring}` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{currentUserData.emoji}</div>
                    <div className={`font-medium ${isActive ? style.text.replace('bg-', 'text-') : 'text-gray-700'}`}>
                      {user.name}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Boutons modifier avatar */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              {users.map(user => (
                <button 
                  key={`${user.id}-avatar`} 
                  onClick={() => setEditingUser(prev => 
                    prev.id === user.id && prev.type === 'avatar' 
                      ? { id: null, type: null } 
                      : { id: user.id, type: 'avatar' }
                  )} 
                  className="w-full p-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span className="text-2xl">{userManager.getUser(user.id).emoji}</span>
                  <span>Avatar</span>
                </button>
              ))}
            </div>
            
            {/* Boutons modifier couleur */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              {users.map(user => {
                const style = userManager.getUserStyle(user.id);
                return (
                  <button 
                    key={`${user.id}-color`} 
                    onClick={() => setEditingUser(prev => 
                      prev.id === user.id && prev.type === 'color' 
                        ? { id: null, type: null } 
                        : { id: user.id, type: 'color' }
                    )} 
                    className={`w-full p-3 ${style.bg} hover:opacity-80 font-medium text-sm rounded-lg transition-colors flex items-center justify-center space-x-2`}
                  >
                    <span className="text-xl">🎨</span>
                    <span>Couleur</span>
                  </button>
                );
              })}
            </div>
            {/* Éditeur avatar */}
            {editingUser.id && editingUser.type === 'avatar' && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Avatar libre pour {userManager.getUser(editingUser.id).name}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      inputMode="text"
                      value={userManager.getUser(editingUser.id).emoji}
                      onFocus={(e) => {
                        // ✅ Sélectionner tout le contenu au focus
                        e.target.select();
                      }}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 2);
                        // ✅ Validation immédiate : bloquer texte alphanumérique
                        if (value && /^[a-zA-Z0-9]+$/.test(value)) {
                          return; // Bloquer la saisie
                        }
                        handleChangeAvatar(editingUser.id, value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Validation finale à l'Enter
                          const value = e.target.value.trim();
                          if (!value) {
                            alert('⚠️ Avatar vide. Choisissez un emoji.');
                            return;
                          }
                          if (/^[a-zA-Z0-9\s]+$/.test(value)) {
                            alert('⚠️ Veuillez utiliser un emoji, pas du texte.');
                            return;
                          }
                          // Fermer l'éditeur si valide
                          setEditingUser({id: null, type: null});
                        }
                      }}
                      onBlur={(e) => {
                        // ✅ Validation au blur (perte de focus)
                        const value = e.target.value.trim();
                        if (!value) {
                          // Remettre emoji par défaut si vide
                          handleChangeAvatar(editingUser.id, '👤');
                        }
                      }}
                      className="w-20 px-3 py-2 text-3xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="😊"
                      maxLength={2}
                    />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">
                        Tapez ou collez n'importe quel emoji de votre clavier
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Ou choisir parmi des suggestions
                  </label>
                  <div className="grid grid-cols-9 sm:grid-cols-12 gap-1 p-2 bg-white rounded border border-gray-200">
                    {['🚴', '🧗', '🏃', '🚶', '🧘', '🏊', '🚣', '👩', '🕺', '😊', '😎', '🤔', '🧐', '🥳', '🤗', '👤', '🧑', '👨', '🙋'].map((emoji, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleChangeAvatar(editingUser.id, emoji)} 
                        className="text-2xl p-1 rounded transition-all hover:bg-gray-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* ✅ Bouton Fermer */}
                <button
                  onClick={() => setEditingUser({id: null, type: null})}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
            
            {/* Éditeur couleur */}
            {editingUser.id && editingUser.type === 'color' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Changer la couleur de {userManager.getUser(editingUser.id).name}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 p-4 bg-white rounded border border-gray-200">
                  {['blue', 'amber', 'purple', 'green', 'red', 'pink', 'indigo', 'orange'].map(color => {
                    const colorClasses = {
                      blue: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
                      amber: 'bg-amber-100 hover:bg-amber-200 border-amber-300',
                      purple: 'bg-purple-100 hover:bg-purple-200 border-purple-300',
                      green: 'bg-green-100 hover:bg-green-200 border-green-300',
                      red: 'bg-red-100 hover:bg-red-200 border-red-300',
                      pink: 'bg-pink-100 hover:bg-pink-200 border-pink-300',
                      indigo: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300',
                      orange: 'bg-orange-100 hover:bg-orange-200 border-orange-300'
                    };
                    
                    const currentColor = userManager.getUser(editingUser.id).color || 'blue';
                    const isSelected = currentColor === color;
                    
                    return (
                      <button
                        key={color}
                        onClick={() => handleChangeColor(editingUser.id, color)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${
                          colorClasses[color]
                        } ${
                          isSelected ? 'ring-4 ring-offset-2 ring-amber-500 scale-110' : ''
                        }`}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                      />
                    );
                  })}
                </div>
                
                {/* ✅ Bouton Fermer */}
                <button
                  onClick={() => setEditingUser({id: null, type: null})}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors mt-4"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        )}
      </section>

{/* Section Thèmes */}
<section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">  <button
    data-section="themes"
    data-open={openSections.themes ? "true" : undefined}
    onClick={() => toggleSection('themes')}
    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
  >
    <div className="flex items-center space-x-2">
      <Tag className="w-5 h-5 text-gray-600" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mes thèmes</h2>
    </div>
    <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
      openSections.themes ? 'rotate-180' : ''
    }`} />
  </button>

  {openSections.themes && (
    <div className="p-4 border-t border-gray-100 space-y-4">
      
      {/* Sélecteur ordre d'affichage */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <label className="block text-sm font-medium text-blue-900 mb-2">
          Ordre d'affichage des thèmes
        </label>
        <select 
          value={themeSortOrder}
          onChange={(e) => {
            const newOrder = e.target.value;
            setThemeSortOrder(newOrder);
            localStorage.setItem('mekong_theme_sort_order', newOrder);
            console.log(`📊 Ordre thèmes changé : ${newOrder}`);
          }}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="usage">📊 Par utilisation (plus tagués en premier)</option>
          <option value="created">📅 Par date de création (récents en premier)</option>
          <option value="alpha">🔤 Alphabétique (A → Z)</option>
          <option value="color">🎨 Par couleur</option>
          <option value="manual">✋ Manuel (ordre personnalisé)</option>
        </select>
        <p className="text-xs text-blue-700 mt-2">
          {themeSortOrder === 'usage' && 'Les thèmes les plus utilisés apparaîtront en premier'}
          {themeSortOrder === 'created' && 'Les thèmes créés récemment apparaîtront en premier'}
          {themeSortOrder === 'alpha' && 'Les thèmes seront triés par ordre alphabétique'}
          {themeSortOrder === 'color' && 'Les thèmes seront groupés par couleur (violet → orange → bleu → vert → rouge)'}
          {themeSortOrder === 'manual' && 'Utilisez les flèches pour réorganiser (à venir)'}
        </p>
      </div>


      {/* Liste des thèmes existants */}
      {themes.length > 0 && !editingTheme && (
        <div className="space-y-2">
          {sortThemes(themes, window.themeAssignments, themeSortOrder).map(theme => {
            const stats = countThemeContents(window.themeAssignments, theme.id);
            const colorClasses = THEME_COLORS[theme.color];
            
            return (
              <div 
                key={theme.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${colorClasses.border} ${colorClasses.bg}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{theme.icon}</span>
                  <div>
                    <div className={`font-medium ${colorClasses.text}`}>{theme.name}</div>
                    <div className="text-xs text-gray-600">
                      {stats.totalCount === 0 ? (
                        'Aucun contenu'
                      ) : (
                        <>
                          {stats.postCount > 0 && `${stats.postCount} post${stats.postCount > 1 ? 's' : ''}`}
                          {stats.postCount > 0 && stats.photoCount > 0 && ' • '}
                          {stats.photoCount > 0 && `${stats.photoCount} photo${stats.photoCount > 1 ? 's' : ''}`}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleStartEdit(theme)}
                    className="p-2 hover:bg-white/50 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
  onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    handleDeleteTheme(theme.id);
  }}
  className="p-2 hover:bg-red-100 rounded transition-colors"
  title="Supprimer"
>
  <Trash2 className="w-4 h-4 text-red-600" />
</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulaire création/édition */}
      {(showThemeForm || editingTheme) && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <h3 className="font-medium text-gray-900">
            {editingTheme ? 'Modifier le thème' : 'Créer un thème'}
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du thème *
            </label>
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="Ex: Temples, Gastronomie..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icône (emoji) *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Tapez ou collez n'importe quel emoji de votre clavier
            </p>
            
            <div className="relative">
              <input
                type="text"
                value={themeIcon}
                onChange={(e) => setThemeIcon(e.target.value)}
                placeholder="Tapez un emoji... 🛕"
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-lg"
                maxLength={4}
              />
              {themeIcon && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-3xl pointer-events-none">
                  {themeIcon}
                </div>
              )}
            </div>
            
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-amber-600 select-none">
                Ou choisir parmi des suggestions
              </summary>
              <div className="grid grid-cols-12 gap-1 mt-2 p-2 bg-white rounded-lg border border-gray-200">
                {['🛕', '🍜', '🚂', '🌴', '🎭', '👥', '🏙️', '📸', '🎒', '🗺️', '🧳', '⛺'].map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setThemeIcon(emoji)}
                    className="text-xl p-1 hover:bg-gray-100 rounded transition-colors"
                    title={`Utiliser ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </details>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="flex space-x-2">
              {Object.keys(THEME_COLORS).map(colorKey => (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => setThemeColor(colorKey)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    THEME_COLORS[colorKey].badge
                  } ${
                    themeColor === colorKey ? 'ring-2 ring-offset-2 ring-amber-500' : 'opacity-60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => {
                if (editingTheme) {
                  handleCancelEdit();
                } else {
                  setShowThemeForm(false);
                  setThemeName('');
                  setThemeIcon('');
                }
              }}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={editingTheme ? handleSaveEdit : handleCreateTheme}
              className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
            >
              {editingTheme ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Bouton créer nouveau thème */}
      {!showThemeForm && !editingTheme && (
        <button
          onClick={() => setShowThemeForm(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Créer un thème</span>
        </button>
      )}
    </div>
  )}
</section>

      {/* Section Statistiques */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection('stats')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Statistiques d'Activité</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${openSections.stats ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.stats && (
          <div className="p-4 border-t border-gray-100 space-y-6">
            {(() => {
              const userActivityStats = generateUserActivityStats(app.sessions, app.masterIndex, users);
              if (!userActivityStats) {
                return <p className="text-sm text-gray-500">Statistiques indisponibles.</p>;
              }
              const totalSessionsCreated = Object.values(userActivityStats.userStats).reduce((sum, s) => sum + s.sessionsCreated, 0);

              return (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Vue d'ensemble</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-800">🗺️ Exploration du voyage</span>
                          <span className="font-bold text-blue-600">{Math.round(userActivityStats.explorationRate)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${userActivityStats.explorationRate}%` }}></div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Engagement des utilisateurs</h3>
                    <div className="bg-gray-50 p-2 text-sm font-semibold text-gray-800 text-center rounded-lg space-y-4">📝 Messages écrits
                      <div>
                        <div className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1">
                          {Object.entries(userActivityStats.userStats).map(([userId, stats]) => (
                            <span key={userId}>{`${userManager.getUser(userId).name} (${stats.messages})`}</span>
                          ))}
                        </div>
                        <div className="w-full flex rounded-full h-4 overflow-hidden bg-gray-200">
                          {Object.entries(userActivityStats.userStats).map(([userId, stats]) => {
                            const user = userManager.getUser(userId);
                            const style = userManager.getUserStyle(userId);
                            const percentage = userActivityStats.totalMessages > 0 ? (stats.messages / userActivityStats.totalMessages) * 100 : 0;
                            return <div key={userId} className={`${style.strong_bg}`} style={{ width: `${percentage}%` }} title={`${user.name}: ${stats.messages} messages (${Math.round(percentage)}%)`}></div>;
                          })}
                        </div>
                      </div>
                    <div className="bg-gray-50 p-2 text-sm font-semibold text-gray-800 text-center rounded-lg space-y-4">💬 Causeries lancées
                        <div className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1">
                          {Object.entries(userActivityStats.userStats).map(([userId, stats]) => (
                            <span key={userId}>{`${userManager.getUser(userId).name} (${stats.sessionsCreated})`}</span>
                          ))}
                        </div>
                         <div className="w-full flex rounded-full h-4 overflow-hidden bg-gray-200">
                           {Object.entries(userActivityStats.userStats).map(([userId, stats]) => {
                            const user = userManager.getUser(userId);
                            const style = userManager.getUserStyle(userId);
                            const percentage = totalSessionsCreated > 0 ? (stats.sessionsCreated / totalSessionsCreated) * 100 : 50;
                            return <div key={userId} className={`${style.strong_bg}`} style={{ width: `${percentage}%` }} title={`${user.name}: ${stats.sessionsCreated} sessions créées (${Math.round(percentage)}%)`}></div>;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Pleins feux sur les causeries</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userActivityStats.mostTalkativeSession ? (
                        <button onClick={() => app.openChatSession(userActivityStats.mostTalkativeSession)} className="text-left bg-gray-50 p-4 rounded-lg hover:bg-gray-100 hover:ring-2 hover:ring-amber-400 transition-all cursor-pointer">
                          <div className="font-semibold text-gray-800">💬 La plus bavarde</div>
                          <p className="text-sm text-amber-700 truncate">{userActivityStats.mostTalkativeSession.gameTitle}</p>
                          <p className="text-xs text-gray-500">{userActivityStats.mostTalkativeSession.notes.length} messages</p>
                        </button>
                      ) : <div />}
                      {userActivityStats.oldestActiveSession ? (
                        <button onClick={() => app.openChatSession(userActivityStats.oldestActiveSession)} className="text-left bg-gray-50 p-4 rounded-lg hover:bg-gray-100 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer">
                           <div className="font-semibold text-gray-800">⏳ Le souvenir oublié</div>
                           <p className="text-sm text-blue-700 truncate">{userActivityStats.oldestActiveSession.gameTitle}</p>
                           <p className="text-xs text-gray-500">En attente depuis le {new Date(userActivityStats.oldestActiveSession.notes[0].timestamp).toLocaleDateString('fr-FR')}</p>
                        </button>
                      ) : <div />}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </section>

      {/* Section Thème visuel */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection('theme')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isDark ? (
              <Moon className="w-5 h-5 text-blue-500" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Thème visuel</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              isDark 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {isDark ? 'Sombre' : 'Clair'}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${openSections.theme ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.theme && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choisissez le thème d'affichage de l'application. Le mode sombre préserve le code couleurs pour une expérience visuelle cohérente.
            </p>
            
            {/* Toggle interactif */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                {isDark ? (
                  <Moon className="w-6 h-6 text-blue-500" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-500" />
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Mode {isDark ? 'sombre' : 'clair'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isDark ? 'Confort visuel pour la nuit' : 'Lumineux pour la journée'}
                  </div>
                </div>
              </div>
              
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  isDark ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Info persistance */}
            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
              💾 Votre préférence est sauvegardée automatiquement
            </div>
          </div>
        )}
      </section>

      {/* Section Connexion */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection('connection')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Cloud className="w-5 h-5 text-green-600 dark:text-green-500" />
            ) : (
              <CloudOff className="w-5 h-5 text-red-600 dark:text-red-500" />
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Connexion</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              isOnline 
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
            }`}>
              {isOnline ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${openSections.connection ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.connection && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            {isOnline ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Cloud className="w-4 h-4 text-green-500" />
                  <span>Connecté en tant que <span className="font-medium">{connectionEmail}</span></span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Se déconnecter ?')) {
                      app.disconnect();
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  <CloudOff className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <CloudOff className="w-4 h-4" />
                  <span>Non connecté à Google Drive</span>
                </div>
                <button
                  onClick={() => app.connect()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Se connecter</span>
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* Section Données */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleSection('data')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Données Brutes</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${openSections.data ? 'rotate-180' : ''}`} />
        </button>
        {openSections.data && (
          <div className="p-4 border-t border-gray-100 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{app.masterIndex?.metadata?.total_moments || 0}</div>
                <div className="text-sm text-gray-600">Moments</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{app.masterIndex?.metadata?.total_posts || 0}</div>
                <div className="text-sm text-gray-600">Articles</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{app.masterIndex?.metadata?.total_photos || 0}</div>
                <div className="text-sm text-gray-600">Photos</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{app.sessions?.length || 0}</div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
            </div>
            {regenerationProgress.isActive && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">{regenerationProgress.message}</span>
                  <span className="text-blue-600 font-mono">{regenerationProgress.progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${regenerationProgress.progress}%` }}/>
                </div>
              </div>
            )}
            <button
              onClick={handleRegenerateIndex}
              disabled={regenerationProgress.isActive}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${regenerationProgress.isActive ? 'animate-spin' : ''}`} />
              <span>{regenerationProgress.isActive ? 'Régénération en cours...' : "Régénérer l'index"}</span>
            </button>
          </div>
        )}
      </section>
      
      {/* Version en bas */}
      <section className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">{APP_NAME}</p>
        <p>Version {APP_VERSION}</p>
        <p className="text-gray-400">{PHASE}</p>
        <p className="text-gray-400 text-xs">{BUILD_DATE}</p>
      </section>
      
{/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Supprimer ce thème ?"
        message={confirmDelete.message}
        onConfirm={executeDeleteTheme}
        onCancel={() => setConfirmDelete({ isOpen: false, themeId: null, message: '' })}
      />
      
    </div>
  );
}