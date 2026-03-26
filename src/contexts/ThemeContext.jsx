import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const themes = [
  { id: 'green', name: 'Courtly Green', color: '#66b319' },
  { id: 'blue', name: 'Ocean Blue', color: '#0ea5e9' },
  { id: 'rose', name: 'Sunset Rose', color: '#f43f5e' },
  { id: 'amber', name: 'Golden Amber', color: '#f59e0b' },
  { id: 'purple', name: 'Royal Purple', color: '#8b5cf6' },
  { id: 'slate', name: 'Midnight Slate', color: '#64748b' },
];

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('courtly_theme') || 'green';
  });

  useEffect(() => {
    const selectedTheme = themes.find((t) => t.id === themeId) || themes[0];
    // Update the CSS variable on the document root
    document.documentElement.style.setProperty('--theme-primary', selectedTheme.color);
    localStorage.setItem('courtly_theme', themeId);
  }, [themeId]);

  const value = {
    themeId,
    setThemeId,
    themes,
    currentTheme: themes.find((t) => t.id === themeId) || themes[0]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
