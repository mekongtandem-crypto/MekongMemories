/**
 * ThemeContext.jsx v1.1
 * Gestion du mode clair/sombre avec persistance localStorage
 * ✅ Dark mode par défaut si aucune préférence
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Récupération depuis localStorage
    const saved = localStorage.getItem('mekong_theme_mode');
    // ✅ Si aucune préférence sauvegardée, dark mode par défaut
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    // Appliquer la classe sur <html>
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('mekong_theme_mode', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}