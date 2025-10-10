/**
 * SettingsPage.jsx v4.0 - Avec gestion des thèmes
 */
import React, { useState, useEffect } from 'react';
import { useAppState } from '../../hooks/useAppState.js';
import { userManager } from '../../core/UserManager.js';
import { THEME_COLORS, generateThemeId, countThemeContents } from '../../utils/themeUtils.js';
import { RefreshCw, Database, Users, Info, ChevronDown, Cloud, CloudOff, Smile, Palette, Plus, Edit, Trash2, Tag } from 'lucide-react';

// Liste d'emojis suggérés pour les thèmes
const SUGGESTED_EMOJIS = [
  '🛕', '🏯', '🏰', '🕌', '⛩️', // Architecture/Temples
  '🍜', '🍱', '🍛', '🍲', '🥘', // Nourriture
  '🚂', '🚇', '🚌', '🚕', '🛵', // Transport
  '🌴', '🏝️', '🌾', '🏔️', '🌊', // Nature
  '🎭', '🎨', '🎪', '🎬', '🎸', // Culture
  '👥', '👨‍👩‍👦', '💑', '🤝', '👋', // Personnes
  '🏙️', '🌃', '🌆', '🏘️', '🏞️', // Lieux
  '📸', '🎒', '🗺️', '🧳', '⛺'  // Voyage
];

export default function SettingsPage() {
  const app = useAppState();
  
  // États sections repliables
  const [openSections, setOpenSections] = useState({
    users: true,
    stats: true,
    themes: true,
    connection: false,
    data: false
  });

  // États thèmes
  const [themes, setThemes] = useState([]);
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  
  // Form states
  const [themeName, setThemeName] = useState('');
  const [themeIcon, setThemeIcon] = useState('');
  const [themeColor, setThemeColor] = useState('purple');

  // États utilisateurs
  const [editingUser, setEditingUser] = useState({ id: null, type: null });

  // État régénération index
  const [regenerationProgress, setRegenerationProgress] = useState({
    isActive: false, step: '', message: '', progress: 0, logs: []
  });
  
  const [assignmentsVersion, setAssignmentsVersion] = useState(0);
  
	// Ajouter un useEffect pour écouter les changements
useEffect(() => {
  if (!window.themeAssignments) return;
  
  const unsubscribe = window.themeAssignments.subscribe(() => {
    // Forcer re-render quand assignments changent
    setAssignmentsVersion(v => v + 1);
  });
  
  return unsubscribe;
}, []);

  // Charger thèmes au montage
  useEffect(() => {
    if (app.masterIndex?.themes) {
      setThemes(app.masterIndex.themes);
    }
  }, [app.masterIndex?.themes]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

    // Vérifier si l'ID existe déjà
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

    // Compter les contenus taggués
    const stats = countThemeContents(window.themeAssignments, themeId);
    
    const confirmMessage = stats.totalCount > 0
      ? `⚠️ Ce thème est utilisé sur ${stats.totalCount} contenu(s).\n\nSi vous le supprimez, tous ces contenus seront détaggués.\n\nContinuer ?`
      : `Supprimer le thème "${theme.name}" ?`;

    if (!confirm(confirmMessage)) return;

    // Supprimer les assignments en cascade
    if (stats.totalCount > 0) {
      await window.themeAssignments.deleteThemeAssignments(themeId);
    }

    // Supprimer le thème du masterIndex
    const updatedThemes = themes.filter(t => t.id !== themeId);
    const updatedMasterIndex = {
      ...app.masterIndex,
      themes: updatedThemes
    };

    const result = await window.dataManager.saveMasterIndex(updatedMasterIndex);

    if (result.success) {
      setThemes(updatedThemes);
      console.log('✅ Thème supprimé (cascade)');
    } else {
      alert('Erreur lors de la suppression du thème');
    }
  };

  // ========================================
  // GESTION UTILISATEURS (code existant)
  // ========================================

  const forceUserUpdate = () => {
    const currentId = app.currentUser.id;
    app.setCurrentUser(null);
    setTimeout(() => app.setCurrentUser(currentId), 10);
  };
  
  const handleChangeAvatar = (userId, newEmoji) => {
    userManager.updateUserEmoji(userId, newEmoji);
    forceUserUpdate();
  };

  const handleChangeColor = (userId, newColor) => {
    userManager.updateUserColor(userId, newColor);
    forceUserUpdate();
  };

  // ========================================
  // RÉGÉNÉRATION INDEX (code existant)
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
        await app.regenerateMasterIndex();
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

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      
      {/* Section Utilisateurs (code existant inchangé) */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('users')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Utilisateurs</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openSections.users ? 'rotate-180' : ''}`} />
        </button>
        
        {openSections.users && (
          <div className="p-4 border-t border-gray-100">
            {/* Contenu utilisateurs identique à l'original - je le garde tel quel */}
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
            {editingUser.id && editingUser.type === 'avatar' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Changer l'avatar de {userManager.getUser(editingUser.id).name}
                </label>
                <div className="grid grid-cols-9 sm:grid-cols-12 gap-1 p-2 bg-white rounded border border-gray-200">
                  {['🚴', '🧗', '🏃', '🚶', '🧘', '🏊', '🚣', '👩', '🕺', '😊', '😎', '🤔', '🧐', '🥳', '🤗'].map((emoji, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => { 
                        handleChangeAvatar(editingUser.id, emoji); 
                        setEditingUser({id: null, type: null}); 
                      }} 
                      className="text-2xl p-1 rounded transition-all hover:bg-gray-100"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ✅ NOUVELLE SECTION : MES THÈMES */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('themes')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Mes thèmes</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
            openSections.themes ? 'rotate-180' : ''
          }`} />
        </button>

        {openSections.themes && (
          <div className="p-4 border-t border-gray-100 space-y-4">
            
            {/* Liste des thèmes */}
            {themes.length === 0 && !showThemeForm && !editingTheme && (
              <div className="text-center py-8 text-gray-500">
                <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun thème créé pour l'instant</p>
                <p className="text-sm mt-2">Créez votre premier thème pour organiser vos souvenirs</p>
              </div>
            )}

            {themes.length > 0 && !editingTheme && (
              <div className="space-y-2">
                {themes.map(theme => {
  // Forcer recalcul avec la version (évite le cache)
  const stats = window.themeAssignments?.isLoaded 
    ? countThemeContents(window.themeAssignments, theme.id)
    : { totalCount: 0, postCount: 0, photoCount: 0 };
  
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
                          onClick={() => handleDeleteTheme(theme.id)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icône (emoji) *
                  </label>
                  <input
                    type="text"
                    value={themeIcon}
                    onChange={(e) => setThemeIcon(e.target.value)}
                    placeholder="🛕"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-2xl mb-2"
                    maxLength={2}
                  />
                  <div className="grid grid-cols-10 gap-1">
                    {SUGGESTED_EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => setThemeIcon(emoji)}
                        className="text-xl p-2 hover:bg-gray-200 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <div className="flex space-x-2">
                    {Object.keys(THEME_COLORS).map(colorKey => (
                      <button
                        key={colorKey}
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
                    onClick={editingTheme ? handleSaveEdit : handleCreateTheme}
                    className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
                  >
                    {editingTheme ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </div>
            )}

            {/* Bouton créer (si pas de form actif) */}
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

      {/* Sections existantes (Stats, Connexion, Données) - code original inchangé */}
      {/* Je les laisse tels quels pour ne pas alourdir la réponse */}
      
      <section className="text-center text-sm text-gray-500 pt-4">
        <p>Mémoire du Mékong v2.4 - Phase 16a</p>
      </section>
    </div>
  );
}