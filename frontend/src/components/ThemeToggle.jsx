import { IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';

const ThemeToggle = ({ toggleTheme }) => {
    const theme = useTheme();

    if (!toggleTheme) {
        console.error("❌ Error: toggleTheme no está definido en ThemeToggle");
        return null;
    }

    return (
        <IconButton onClick={toggleTheme} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
    );
};

export default ThemeToggle;
