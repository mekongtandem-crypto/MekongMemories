/**
 * ThemeModal.jsx v1.3 - Tagging hiérarchique avec checkboxes
 * ✅ Preview moment avec 3 checkboxes
 * ✅ Preview post avec 1 checkbox
 * ✅ Propagation optionnelle
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
  contentType = null,
  momentData = null,
  postData = null
}) {
  const [selectedThemes, setSelectedThemes] = useState([]);
  
  // ✅ Options de propagation hiérarchique
  const [propagationOptions, setPropagationOptions] = useState({
    applyToPosts: false,
    applyToPostPhotos: false,
    applyToMomentPhotos: false,
    applyToPhotos: false // Pour post → photos
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedThemes(currentThemes || []);
      // Reset options à chaque ouverture
      setPropagationOptions({
        applyToPosts: false,
        applyToPostPhotos: false,
        applyToMomentPhotos: false,
        applyToPhotos: false
      });
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
    onSave(selectedThemes, propagationOptions);
    onClose();
  };

  const handleCancel = () => {
    setSelectedThemes(currentThemes || []);
    onClose();
  };

  const handleCreateTheme = () => {
    onClose();
    
    if (window.dataManager) {
      window.dataManager.updateCurrentPage('settings');
      
      setTimeout(() => {
        const themesSection = document.querySelector('[data-section="themes"]');
        if (themesSection && !themesSection.getAttribute('data-open')) {
          themesSection.click();
        }
        
        setTimeout(() => {
          themesSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }, 200);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
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
                {contentType === 'photos' ? 'Plusieurs photos' : 
                 contentType === 'photo' ? 'Une photo' : 
                 contentType === 'post' ? 'Un article' :
                 contentType === 'moment' ? 'Un moment' : contentType}
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

        {/* ✅ PREVIEW MOMENT avec checkboxes */}
        {contentType === 'moment' && momentData && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">🗺️</span>
                <h4 className="font-medium text-purple-900">{momentData.momentTitle}</h4>
              </div>
              
              <p className="text-sm text-purple-700 mb-3 font-medium">
                Où appliquer les thèmes sélectionnés ?
              </p>
              
              <div className="space-y-3">
                {/* Moment lui-même (toujours appliqué) */}
                <div className="flex items-center space-x-2 pl-1">
                  <div className="w-4 h-4 rounded bg-purple-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-purple-900 font-medium">
                    🗺️ Le moment "{momentData.momentTitle}"
                  </span>
                  <span className="text-xs text-purple-600">(toujours)</span>
                </div>
                
                {/* Posts */}
                {momentData.stats.postCount > 0 && (
                  <label className="flex items-start space-x-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={propagationOptions.applyToPosts}
                      onChange={(e) => setPropagationOptions(prev => ({
                        ...prev,
                        applyToPosts: e.target.checked
                      }))}
                      className="w-4 h-4 text-purple-600 rounded mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-purple-900 font-medium">
                        📄 Les {momentData.stats.postCount} article{momentData.stats.postCount > 1 ? 's' : ''} de ce moment
                      </span>
                    </div>
                  </label>
                )}
                
                {/* Photos des posts */}
                {momentData.stats.photoMastodonCount > 0 && (
                  <label className="flex items-start space-x-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors ml-6">
                    <input
                      type="checkbox"
                      checked={propagationOptions.applyToPostPhotos}
                      onChange={(e) => setPropagationOptions(prev => ({
                        ...prev,
                        applyToPostPhotos: e.target.checked
                      }))}
                      className="w-4 h-4 text-purple-600 rounded mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-purple-800">
                        📸 Les {momentData.stats.photoMastodonCount} photo{momentData.stats.photoMastodonCount > 1 ? 's' : ''} des articles
                      </span>
                    </div>
                  </label>
                )}
                
                {/* Photos du moment */}
                {momentData.stats.photoMomentCount > 0 && (
                  <label className="flex items-start space-x-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={propagationOptions.applyToMomentPhotos}
                      onChange={(e) => setPropagationOptions(prev => ({
                        ...prev,
                        applyToMomentPhotos: e.target.checked
                      }))}
                      className="w-4 h-4 text-purple-600 rounded mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-purple-900 font-medium">
                        📸 Les {momentData.stats.photoMomentCount} photo{momentData.stats.photoMomentCount > 1 ? 's' : ''} du moment
                      </span>
                    </div>
                  </label>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-700 italic">
                  💡 Les thèmes seront ajoutés aux éléments cochés (les thèmes existants sont conservés)
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* ✅ PREVIEW POST avec checkbox */}
        {contentType === 'post' && postData && (
          <div className="p-4 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">📄</span>
                <h4 className="font-medium text-blue-900 line-clamp-1">{postData.postTitle}</h4>
              </div>
              
              <p className="text-sm text-blue-700 mb-3 font-medium">
                Où appliquer les thèmes sélectionnés ?
              </p>
              
              <div className="space-y-3">
                {/* Post lui-même (toujours appliqué) */}
                <div className="flex items-center space-x-2 pl-1">
                  <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-blue-900 font-medium">
                    📄 Cet article
                  </span>
                  <span className="text-xs text-blue-600">(toujours)</span>
                </div>
                
                {/* Photos du post */}
                {postData.photoCount > 0 && (
                  <label className="flex items-start space-x-2 cursor-pointer hover:bg-blue-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={propagationOptions.applyToPhotos}
                      onChange={(e) => setPropagationOptions(prev => ({
                        ...prev,
                        applyToPhotos: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600 rounded mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-blue-900 font-medium">
                        📸 Les {postData.photoCount} photo{postData.photoCount > 1 ? 's' : ''} de cet article
                      </span>
                    </div>
                  </label>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700 italic">
                  💡 Les thèmes seront ajoutés aux éléments cochés
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Liste thèmes */}
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