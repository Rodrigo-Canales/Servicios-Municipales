import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { MIN_FONT_SIZE, MAX_FONT_SIZE, DEFAULT_FONT_SIZE } from './fontSizeConstants';

const FontSizeContext = createContext();

export function FontSizeProvider({ children }) {
  // Leer de localStorage o usar valor por defecto
  const getInitialFontSize = () => {
    const saved = localStorage.getItem('fontSize');
    const parsed = parseInt(saved, 10);
    return parsed && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE ? parsed : DEFAULT_FONT_SIZE;
  };
  const [fontSize, setFontSize] = useState(getInitialFontSize);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    // Aplica el tamaño de fuente global al body y html
    document.body.style.fontSize = fontSize + 'px';
    document.documentElement.style.fontSize = fontSize + 'px';
  }, [fontSize]);

  const increaseFontSize = () => setFontSize(f => Math.min(f + 2, MAX_FONT_SIZE));
  const decreaseFontSize = () => setFontSize(f => Math.max(f - 2, MIN_FONT_SIZE));
  const value = useMemo(() => ({ fontSize, increaseFontSize, decreaseFontSize }), [fontSize]);

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
// No exports fuera de componentes personalizados, ni export default, ni constantes aquí.
