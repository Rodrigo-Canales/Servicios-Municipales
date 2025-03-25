import { Drawer, List, ListItem, ListItemText } from "@mui/material";

const SidebarVecino = () => {
    return (
        <Drawer variant="permanent" sx={{ width: 240, flexShrink: 0 }}>
            <List>
                <ListItem button>
                    <ListItemText primary="Inicio" />
                </ListItem>
                <ListItem button>
                    <ListItemText primary="Mis Solicitudes" />
                </ListItem>
                <ListItem button>
                    <ListItemText primary="Perfil" />
                </ListItem>
            </List>
        </Drawer>
    );
};

export default SidebarVecino;
