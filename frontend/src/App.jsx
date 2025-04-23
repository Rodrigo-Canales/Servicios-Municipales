// frontend/src/App.jsx
import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

// Componentes Públicos/Auth
import ClaveUnica from './components/Auth/ClaveUnica';
import Login from './components/Auth/Login';

 // Componentes Principales de Portal (Layouts)
import Administrador from './components/Admin/Administrador';
import Vecinos from './components/Vecinos/Vecino';
import Funcionario from './components/Funcionarios/Funcionario';

// Contexto de Autenticación
import { AuthProvider } from './contexts/AuthContext.jsx';

// Temas
import { lightTheme, darkTheme } from './theme';

 // Importar ProtectedRoute
 import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';

function App() {
    // Leer preferencia de tema desde localStorage al iniciar
    const getInitialMode = () => {
        const savedMode = localStorage.getItem('themeMode');
        return savedMode === 'dark' ? 'dark' : 'light';
    };
    const [mode, setMode] = useState(getInitialMode);

    const toggleTheme = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode); // Guardar preferencia
            return newMode;
        });
    };

    const currentTheme = useMemo(
        () => (mode === "light" ? lightTheme : darkTheme),
        [mode]
    );

    return (
        <ThemeProvider theme={currentTheme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <Routes>
                         {/* --- Rutas Públicas --- */}
                        <Route path="/" element={<ClaveUnica toggleTheme={toggleTheme} />} />
                        <Route path="/login" element={<Login toggleTheme={toggleTheme} />} />

                        {/* --- Rutas Protegidas --- */}

                        {/* Ruta para Vecinos (ahora sin restricción de rol) */}
                        <Route
                            path="/vecinos"
                            element={
                                <Vecinos toggleTheme={toggleTheme} />
                            }
                        />
                        {/* Ruta para Funcionarios */}
                        <Route
                            path="/funcionarios"
                            element={
                                <ProtectedRoute allowedRoles={['Funcionario', 'Administrador']}> {/* Solo permite rol 'Funcionario' */}
                                    <Funcionario toggleTheme={toggleTheme} />
                                </ProtectedRoute>
                            }
                        />
                         {/* Ruta para Administración */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute allowedRoles={['Administrador']}> {/* Solo permite rol 'Administrador' */}
                                    <Administrador toggleTheme={toggleTheme} />
                                </ProtectedRoute>
                            }
                        />

                        {/* --- Ruta Catch-All / Not Found --- */}
                        <Route path="*" element={
                            <div style={{ padding: '50px', textAlign: 'center' }}>
                                <h1>404 - Página No Encontrada</h1>
                                <p>La página que buscas no existe.</p>
                            </div>
                        } />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;