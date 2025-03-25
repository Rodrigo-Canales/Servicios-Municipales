import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lightTheme, darkTheme } from './theme';
import ClaveUnica from './components/Auth/ClaveUnica';
import Login from './components/Auth/Login';
import Administrador from './components/Admin/Administrador';
import Vecinos from './components/Vecinos/Vecino';

function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = () => {
        console.log("Cambiando tema...");
        setIsDarkMode((prevMode) => !prevMode);
    };

    return (
        <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/loginClaveUnica" element={<ClaveUnica toggleTheme={toggleTheme} />} />
                    <Route path="/login" element={<Login toggleTheme={toggleTheme} />} />
                    <Route path="/admin" element={<Administrador />} />
                    <Route path="/vecino" element={<Vecinos />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
