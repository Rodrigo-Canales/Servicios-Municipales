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
    const [mode, setMode] = useState("light");

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
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
                        <Route path="/" element={<ClaveUnica />} />
                        <Route path="/login" element={<Login toggleTheme={toggleTheme} />} />

                        {/* --- Rutas Protegidas --- */}

                        {/* Ruta para Vecinos (CON ACCESO TEMPORAL PARA ADMIN) */}
                        <Route
                            path="/vecinos"
                            element={
                                <ProtectedRoute allowedRoles={['Vecino', 'Administrador']}>
                                    <Vecinos toggleTheme={toggleTheme} />
                                </ProtectedRoute>
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