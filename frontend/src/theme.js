import { createTheme } from '@mui/material/styles';

// --- Tema Claro ---
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: 'rgb(29, 60, 143)', 
            contrastText: 'rgb(255, 255, 255)' 
        },
        secondary: {
            main: 'rgb(211, 47, 47)', 
            contrastText: 'rgb(255, 255, 255)'
        },
        background: {
            default: 'rgb(248, 249, 250)', 
            paper: 'rgb(255, 255, 255)'   
        },
        text: {
            primary: 'rgb(33, 37, 41)',   
            secondary: 'rgb(108, 117, 125)' 
        },
        divider: 'rgb(222, 226, 230)',   
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

// --- Tema Oscuro ---
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: 'rgb(29, 60, 143)', 
            contrastText: 'rgb(255, 255, 255)' 
        },
        secondary: {
            main: 'rgb(229, 115, 115)',
            contrastText: 'rgb(0, 0, 0)' 
        },
        background: {
            default: 'rgb(18, 18, 18)',   
            paper: 'rgb(28, 28, 28)'    
        },
        text: {
            primary: 'rgb(245, 245, 245)',   
            secondary: 'rgb(189, 189, 189)' 
        },
        divider: 'rgb(81, 81, 81)',    
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