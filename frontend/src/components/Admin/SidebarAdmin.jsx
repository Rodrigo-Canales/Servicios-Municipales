import { Drawer, List, ListItem, ListItemText } from "@mui/material";

const SidebarAdmin = () => {
    return (
        <Drawer variant="permanent" sx={{ width: 240, flexShrink: 0 }}>
            <List>
                <ListItem button>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button>
                    <ListItemText primary="Gestión de Usuarios" />
                </ListItem>
                <ListItem button>
                    <ListItemText primary="Solicitudes" />
                </ListItem>
                <ListItem button>
                    <ListItemText primary="Configuración" />
                </ListItem>
            </List>
        </Drawer>
    );
};

export default SidebarAdmin;
