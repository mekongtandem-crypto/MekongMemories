/**
 * ThemeModal.jsx v1.2 - Phase 16 - Corrections bugs
 * ✅ Bug 4 : Bouton "Créer thème" redirige vers Settings
 * ✅ Bug 5 : z-index 10000 (devant PhotoViewer)
 */
import React, { useState, useEffect } from 'react';
import { X, Tag, Plus } from 'lucide-react';
import { THEME_COLORS } from '../utils/themeUtils.js';

export default function ThemeModal({ 
  isOpen, 
  onClose, 
  availableThemes,
  currentThemes,
  onSave,
  title = "Assigner des thèmes",
  description = null,
  contentType = null
}) {
  const [selectedThemes, setSelectedThemes] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedThemes(currentThemes || []);
    }
  }, [isOpen, currentThemes]);

  if (!isOpen) return null;

  const toggleTheme = (themeId) => {
    if (selectedThemes.includes(themeId)) {
      setSelectedThemes(prev => prev.filter(t => t !== themeId));
    } else {
      setSelectedThemes(prev => [...prev, themeId]);
    }
  };

  const handleSave = () => {
    onSave(selectedThemes);
    onClose();
  };

  const handleCancel = () => {
    setSelectedThemes(currentThemes || []);
    onClose();
  };

  // ✅ CORRECTION BUG 4 : Redirection vers Settings
  const handleCreateTheme = () => {
    onClose();
    
    // Changer de page vers Settings (utilise dataManager, pas app)
    if (window.dataManager) {
      window.dataManager.updateCurrentPage('settings');
      
      // Auto-ouvrir section Thèmes après 200ms
      setTimeout(() => {
        const themesSection = document.querySelector('[data-section="themes"]');
        if (themesSection && !themesSection.getAttribute('data-open')) {
          themesSection.click();
        }
        
        // Scroll vers la section
        setTimeout(() => {
          themesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }, 200);
    } else {
      console.error('❌ window.dataManager non disponible');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }} // ✅ CORRECTION BUG 5 : z-index au-dessus de PhotoViewer (9999)
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
            {contentType && (
              <p className="text-xs text-gray-500 mt-1">
                {contentType === 'photos' ? 'Plusieurs photos' : contentType === 'photo' ? 'Une photo' : 'Un article'}
              </p>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Liste thèmes en grille 2 colonnes */}
        <div className="p-4">
          {availableThemes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun thème créé pour l'instant</p>
              <p className="text-sm mt-2">Créez vos thèmes dans Réglages</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availableThemes.map(theme => {
                const isSelected = selectedThemes.includes(theme.id);
                const colorClasses = THEME_COLORS[theme.color] || THEME_COLORS.purple;
                
                return (
                  <button
                    key={theme.id}
                    onClick={() => toggleTheme(theme.id)}
                    className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? `${colorClasses.bg} ${colorClasses.border}` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? colorClasses.border : 'border-gray-300'
                    }`}>
                      {isSelected && <div className={`w-2.5 h-2.5 rounded ${colorClasses.badge}`} />}
                    </div>
                    
                    <span className="text-lg flex-shrink-0">{theme.icon}</span>
                    <span className={`flex-1 text-left font-medium text-sm truncate ${
                      isSelected ? colorClasses.text : 'text-gray-700'
                    }`}>
                      {theme.name}
                    </span>
                  </button>
                );
              })}
              
              {/* ✅ Bouton créer un thème FONCTIONNEL */}
              <button
                onClick={handleCreateTheme}
                className="flex items-center justify-center space-x-2 p-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all"
                title="Ouvrir Réglages → Thèmes"
              >
                <Plus className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Créer un thème</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t bg-gray-50 sticky bottom-0">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={availableThemes.length === 0}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Valider {selectedThemes.length > 0 && `(${selectedThemes.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}