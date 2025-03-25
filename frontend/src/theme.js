import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#2a4ce8' },
        secondary: { main: '#f50057' },
        background: { default: '#f4f4f4', paper: '#ffffff' },
        text: { primary: '#000000', secondary: '#333333' },
    },
});

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#2a4ce8' },
        secondary: { main: '#f50057' },
        background: { default: '#121212', paper: '#1e1e1e' },
        text: { primary: '#ffffff', secondary: '#bbbbbb' },
    },
});
