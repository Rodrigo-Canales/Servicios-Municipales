import { Drawer, List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import { Home, Assignment, ExitToApp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const SidebarTrabajador = () => {
    const navigate = useNavigate();

    const menuItems = [
        { text: "Inicio", icon: <Home />, path: "/trabajador" },
        { text: "Solicitudes", icon: <Assignment />, path: "/trabajador/solicitudes" },
        { text: "Cerrar sesión", icon: <ExitToApp />, path: "/" }
    ];

    return (
        <Drawer variant="permanent" sx={{ width: 240, flexShrink: 0 }}>
            <List>
                {menuItems.map((item) => (
                    <ListItem button key={item.text} onClick={() => navigate(item.path)}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default SidebarTrabajador;
