import { AppBar, Toolbar, Typography, Box } from "@mui/material";

const NavbarAdmin = () => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Box
                    component="img"
                    src="/LOGO PITRUFQUEN.png"
                    alt="Logo Municipalidad"
                    sx={{ width: "50px", marginRight: "16px" }}
                />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Panel de Administrador
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export default NavbarAdmin;
