import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';  
import { CssBaseline } from '@mui/material';
import './global.css'
import 'leaflet/dist/leaflet.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* El ThemeProvider se maneja en App.js, así que aquí solo necesitamos CssBaseline */}
    <CssBaseline />
    <App />
  </StrictMode>
);