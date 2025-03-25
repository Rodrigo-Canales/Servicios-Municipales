import { AppBar, Toolbar, Typography, Box } from "@mui/material";

const NavbarTrabajador = () => {
    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <Box
                    component="img"
                    src="/LOGO PITRUFQUEN.png"
                    alt="Logo Municipalidad"
                    sx={{ width: 50, height: 50, mr: 2 }}
                />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Municipalidad de Pitrufquén
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export default NavbarTrabajador;
