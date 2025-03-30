// // frontend/src/App.jsx
// import React, { useState, useMemo } from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { ThemeProvider, CssBaseline } from '@mui/material';

// // Componentes Públicos/Auth
// import ClaveUnica from './components/Auth/ClaveUnica';
// import Login from './components/Auth/Login';

// // Componentes Principales de Portal (Layouts)
// import Administrador from './components/Admin/Administrador';
// import Vecinos from './components/Vecinos/Vecino';
// import Funcionario from './components/Funcionarios/Funcionario';

// // Contexto de Autenticación
// import { AuthProvider } from './contexts/AuthContext.jsx'; // Asegúrate que la extensión sea .jsx

// // Temas
// import { lightTheme, darkTheme } from './theme';

// // *** 1. Importar ProtectedRoute ***
// import ProtectedRoute from './components/Auth/ProtectedRoute.jsx'; // O .js si lo llamaste así

// function App() {
//     const [mode, setMode] = useState("light");

//     const toggleTheme = () => {
//         setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
//     };

//     const currentTheme = useMemo(
//         () => (mode === "light" ? lightTheme : darkTheme),
//         [mode]
//     );

//     return (
//         <ThemeProvider theme={currentTheme}>
//             <CssBaseline />
//             <AuthProvider>
//                 <Router>
//                     <Routes>
//                         {/* --- Rutas Públicas --- */}
//                         <Route path="/" element={<ClaveUnica />} />
//                         <Route path="/login" element={<Login toggleTheme={toggleTheme} />} />

//                         {/* --- Rutas Protegidas --- */}
//                         {/* *** 2. Envolver cada ruta protegida con ProtectedRoute *** */}

//                         {/* Ruta para Vecinos */}
//                         <Route
//                             path="/vecinos"
//                             element={
//                                 <ProtectedRoute allowedRoles={['Vecino']}> {/* Solo permite rol 'Vecino' */}
//                                     <Vecinos toggleTheme={toggleTheme} />
//                                 </ProtectedRoute>
//                             }
//                         />
//                         {/* Ruta para Funcionarios */}
//                         <Route
//                             path="/funcionarios"
//                             element={
//                                 <ProtectedRoute allowedRoles={['Funcionario']}> {/* Solo permite rol 'Funcionario' */}
//                                     <Funcionario toggleTheme={toggleTheme} />
//                                 </ProtectedRoute>
//                             }
//                         />
//                         {/* Ruta para Administración */}
//                         <Route
//                             path="/admin"
//                             element={
//                                 <ProtectedRoute allowedRoles={['Administrador']}> {/* Solo permite rol 'Administrador' */}
//                                     <Administrador toggleTheme={toggleTheme} />
//                                 </ProtectedRoute>
//                             }
//                         />

//                         {/* --- Ruta Catch-All / Not Found --- */}
//                         <Route path="*" element={
//                             <div style={{ padding: '50px', textAlign: 'center' }}>
//                                 <h1>404 - Página No Encontrada</h1>
//                                 <p>La página que buscas no existe.</p>
//                             </div>
//                         } />
//                     </Routes>
//                 </Router>
//             </AuthProvider>
//         </ThemeProvider>
//     );
// }

// export default App;




// frontend/src/App.jsx
import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

// Componentes Públicos/Auth
import ClaveUnica from './components/Auth/ClaveUnica'; // Página que inicia el flujo CU
import Login from './components/Auth/Login'; // Login para Admin/Funcionario

// Componentes Principales de Portal (Layouts)
import Administrador from './components/Admin/Administrador';
import Vecinos from './components/Vecinos/Vecino'; // El portal de Vecinos
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

    // --- Variable para detectar modo desarrollo ---
    const isDevelopment = import.meta.env.MODE === 'development';
    // --- Fin Variable Desarrollo ---

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

                        {/* Ruta para Vecinos */}
                        <Route
                            path="/vecinos"
                            element={
                                // --- INICIO: Lógica condicional DENTRO del elemento ---
                                // TODO: Cuando Clave Única funcione, elimina la parte 'isDevelopment ? ... :'
                                // y deja solo el componente <ProtectedRoute> ... </ProtectedRoute>.
                                isDevelopment ? (
                                    // MODO DESARROLLO: Muestra Vecinos directamente
                                    <>
                                        {console.warn('>>> MODO DESARROLLO: Accediendo a /vecinos directamente (bypass Clave Única) <<<')}
                                        <Vecinos toggleTheme={toggleTheme} />
                                    </>
                                ) : (
                                    // MODO PRODUCCIÓN: Usa la protección de ruta
                                    <ProtectedRoute allowedRoles={['Vecino']}>
                                        <Vecinos toggleTheme={toggleTheme} />
                                    </ProtectedRoute>
                                )
                                // --- FIN: Lógica condicional DENTRO del elemento ---
                            }
                        />

                        {/* Ruta para Funcionarios (usa protección normal) */}
                        <Route
                            path="/funcionarios"
                            element={
                                <ProtectedRoute allowedRoles={['Funcionario']}>
                                    <Funcionario toggleTheme={toggleTheme} />
                                </ProtectedRoute>
                            }
                        />

                        {/* Ruta para Administración (usa protección normal) */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute allowedRoles={['Administrador']}>
                                    <Administrador toggleTheme={toggleTheme} />
                                </ProtectedRoute>
                            }
                        />

                        {/* --- Ruta Catch-All / Not Found --- */}
                        <Route path="*" element={
                            <div style={{ padding: '50px', textAlign: 'center' }}>
                                <h1>404 - Página No Encontrada</h1>
                                <p>La página que buscas no existe o no tienes permiso para verla.</p>
                            </div>
                        } />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;