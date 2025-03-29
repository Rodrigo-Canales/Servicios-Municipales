// frontend/src/contexts/AuthContextValue.jsx
import { createContext } from 'react';

/**
 * Este archivo define y exporta ÚNICAMENTE el objeto Context de React.
 * Se separa del Provider y del Hook para cumplir con las reglas de
 * React Fast Refresh y ESLint (plugin react-refresh/only-export-components).
 *
 * El valor inicial del contexto es `null`, lo que indica que por defecto
 * no hay ningún usuario autenticado cuando la aplicación carga por primera vez,
 * antes de que el AuthProvider verifique el estado.
 */
export const AuthContext = createContext(null);

// No añadir nada más a este archivo.