import { Box, Toolbar } from "@mui/material";
import Navbar from "./NavbarVecino";
import Sidebar from "./SidebarVecino";

const Vecinos = ({ children }) => {
    return (
        <Box sx={{ display: "flex", height: "100vh", bgcolor: "#f4f6f8" }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Contenido principal */}
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Navbar />
                <Toolbar /> {/* Espaciado para evitar superposición */}
                <Box sx={{ flexGrow: 1, p: 3 }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default Vecinos;
