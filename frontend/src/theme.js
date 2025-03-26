import { createTheme } from '@mui/material/styles';

// --- Tema Claro Profesional (Solo Paleta Actualizada con Workaround) ---
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: 'rgb(29, 60, 143)', // Azul corporativo (#1d3c8f)
            contrastText: 'rgb(255, 255, 255)' // Usando el mismo color que text.primary (casi negro)
        },
        secondary: {
            main: 'rgb(211, 47, 47)', // Rojo (#d32f2f)
            contrastText: 'rgb(255, 255, 255)' // Blanco
        },
        background: {
            default: 'rgb(248, 249, 250)', // Gris muy pálido (#f8f9fa)
            paper: 'rgb(255, 255, 255)'   // Blanco (#ffffff)
        },
        text: {
            primary: 'rgb(33, 37, 41)',    // Casi negro (#212529)
            secondary: 'rgb(108, 117, 125)' // Gris medio (#6c757d)
        },
        divider: 'rgb(222, 226, 230)',   // Gris claro (#dee2e6)
        action: {
            active: 'rgba(0, 0, 0, 0.54)',
            hover: 'rgba(0, 0, 0, 0.04)',
            selected: 'rgba(0, 0, 0, 0.08)',
            disabled: 'rgba(0, 0, 0, 0.26)',
            disabledBackground: 'rgba(0, 0, 0, 0.12)',
        },
        error: { main: 'rgb(220, 53, 69)' },
        warning: { main: 'rgb(255, 193, 7)' },
        info: { main: 'rgb(13, 202, 240)' },
        success: { main: 'rgb(25, 135, 84)' }
    },
});

// --- Tema Oscuro Profesional (Sin cambios aquí, asumiendo que funciona) ---
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: 'rgb(29, 60, 143)', // Azul medio claro (#4F71C2)
            contrastText: 'rgb(255, 255, 255)' // Blanco (Correcto para este azul)
        },
        secondary: {
            main: 'rgb(229, 115, 115)', // Rojo claro (#E57373)
            contrastText: 'rgb(0, 0, 0)' // Texto oscuro
        },
        background: {
            default: 'rgb(18, 18, 18)',   // Negro (#121212)
            paper: 'rgb(28, 28, 28)'    // Gris oscuro (#1c1c1c)
        },
        text: {
            primary: 'rgb(245, 245, 245)',   // Casi blanco (#f5f5f5)
            secondary: 'rgb(189, 189, 189)' // Gris claro (#bdbdbd)
        },
        divider: 'rgb(81, 81, 81)',    // Gris oscuro (#515151)
        action: {
            active: 'rgb(255, 255, 255)',
            hover: 'rgba(255, 255, 255, 0.08)',
            selected: 'rgba(255, 255, 255, 0.16)',
            disabled: 'rgba(255, 255, 255, 0.3)',
            disabledBackground: 'rgba(255, 255, 255, 0.12)',
        },
        error: { main: 'rgb(244, 67, 54)' },
        warning: { main: 'rgb(255, 167, 38)' },
        info: { main: 'rgb(41, 182, 246)' },
        success: { main: 'rgb(102, 187, 106)' }
    },
});