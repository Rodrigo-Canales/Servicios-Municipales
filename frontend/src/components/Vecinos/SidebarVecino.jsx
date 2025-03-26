import React, { useState, useEffect } from "react";
import axios from "axios";
import { Drawer, List, ListItem, ListItemText, Collapse, Box } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

const drawerWidth = 240;

const SidebarVecino = ({ onSelectArea }) => {
    const [areas, setAreas] = useState([]);
    const [openSolicitudes, setOpenSolicitudes] = useState(false);

    useEffect(() => {
        const fetchAreas = async () => {
        try {
            const response = await axios.get("http://localhost:3001/api/areas");
            setAreas(response.data);
        } catch (error) {
            console.error("Error al obtener áreas:", error);
        }
        };

        fetchAreas();
    }, []);

    return (
        <Drawer
        variant="permanent"
        sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "primary.main",
            color: "#fff",
            },
        }}
        >
        {/* Espacio para que no choque con el AppBar */}
        <Box sx={{ mt: 8 }} />

        <List>
            <ListItem
            button
            onClick={() => setOpenSolicitudes(!openSolicitudes)}
            sx={{
                "&:hover": { bgcolor: "primary.dark" },
                transition: "background-color 0.3s",
            }}
            >
            <ListItemText
                primary="Solicitudes"
                primaryTypographyProps={{ fontWeight: "bold" }}
            />
            {openSolicitudes ? <ExpandLess /> : <ExpandMore />}
            </ListItem>

            <Collapse in={openSolicitudes} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
                {areas.map((area) => (
                <ListItem
                    button
                    key={area.id_area}
                    onClick={() => onSelectArea(area.id_area, area.nombre_area)}
                    sx={{
                    pl: 4,
                    "&:hover": { bgcolor: "primary.dark" },
                    transition: "background-color 0.3s",
                    }}
                >
                    <ListItemText
                    primary={area.nombre_area}
                    primaryTypographyProps={{ fontWeight: 500 }}
                    />
                </ListItem>
                ))}
            </List>
            </Collapse>
        </List>
        </Drawer>
    );
};

export default SidebarVecino;
