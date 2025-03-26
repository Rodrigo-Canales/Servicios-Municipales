import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // No necesitamos Navigate aquí

// Componentes Públicos/Auth
import ClaveUnica from './components/Auth/ClaveUnica';
import Login from './components/Auth/Login';

// Componentes Principales de Portal (Layouts)
import Administrador from './components/Admin/Administrador'; // Layout/Página principal Admin
import Vecinos from './components/Vecinos/Vecino';
import Trabajador from './components/Trabajador/Trabajador';

function App() {
    return (
        <Router>
            <Routes>
                {/* Públicas */}
                <Route path="/" element={<ClaveUnica />} />
                <Route path="/login" element={<Login />} />

                {/* Vecinos */}
                <Route path="/vecinos" element={<Vecinos />} />

                {/* Trabajadores */}
                <Route path="/trabajadores" element={<Trabajador />} />

                {/* Administración */}
                {/* *** MODIFICADO: Una sola ruta para cargar el componente Administrador *** */}
                <Route path="/admin" element={<Administrador />} />

                {/* Not Found (Opcional) */}
                {/* <Route path="*" element={<div>404 - Página No Encontrada</div>} /> */}
            </Routes>
        </Router>
    );
}

export default App;