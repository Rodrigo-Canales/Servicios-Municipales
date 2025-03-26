import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    CircularProgress,
    Fade,
    useTheme,
    Card,
    CardContent
    } from "@mui/material";
import Navbar from "../Vecinos/NavbarVecino";
import Sidebar from "../Vecinos/SidebarVecino";

const drawerWidth = 240;
const appBarHeight = 64; // Ajusta esto según tu Navbar

const Vecino = () => {
    const theme = useTheme();
    const [tiposSolicitudes, setTiposSolicitudes] = useState([]);
    const [areaSeleccionada, setAreaSeleccionada] = useState(null);
    const [nombreArea, setNombreArea] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (areaSeleccionada) {
        fetchTiposSolicitudes(areaSeleccionada);
        }
    }, [areaSeleccionada]);

    const fetchTiposSolicitudes = async (areaId) => {
        setLoading(true);
        try {
        const url = `http://localhost:3001/api/tipos_solicitudes/area/${areaId}`;
        const response = await axios.get(url);
        setTiposSolicitudes(response.data);
        } catch (error) {
        console.error("Error al obtener los tipos de solicitudes:", error);
        } finally {
        setLoading(false);
        }
    };

    const handleSelectArea = (areaId, nombre) => {
        setAreaSeleccionada(areaId);
        setNombreArea(nombre);
    };

    return (
        <Box
        sx={{
            display: "flex",
            minHeight: "100vh",
            bgcolor: theme.palette.background.default,
        }}
        >
        {/* SIDEBAR */}
        <Sidebar onSelectArea={handleSelectArea} />

        {/* CONTENIDO PRINCIPAL */}
        <Box
            component="main"
            sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            display: "flex",
            flexDirection: "column",
            }}
        >
            {/* NAVBAR */}
            <Navbar />

            {/* CONTENIDO - lo desplazamos debajo del Navbar */}
            <Box
            sx={{
                mt: `${appBarHeight}px`, // Ajusta si tu AppBar es más alto/bajo
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "auto",
            }}
            >
            {/* CARD (opcional) para la tabla */}
            <Card
                sx={{
                flexGrow: 1,
                borderRadius: 0, // Para que quede "pegado" a los bordes
                boxShadow: 3,
                width : "100%",
                }}
            >
                <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    color={theme.palette.primary.main}
                    sx={{ fontWeight: "bold", textAlign: "center", mb: 3 }}
                >
                    {nombreArea ? `Tipos de Solicitudes - ${nombreArea}` : "Selecciona un área"}
                </Typography>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                    <CircularProgress color="primary" />
                    </Box>
                ) : (
                    <Fade in={!loading}>
                    <TableContainer
                        component={Paper}
                        sx={{
                        flexGrow: 1,
                        boxShadow: 2,
                        borderRadius: 2,
                        overflow: "auto",
                        width : "100%",
                        }}
                    >
                        <Table>
                        <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
                            <TableRow>
                            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Nombre</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Descripción</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Área</TableCell>
                            <TableCell sx={{ fontWeight: "bold", color: "#fff", textAlign: "center" }}>
                                Acción
                            </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tiposSolicitudes.length > 0 ? (
                            tiposSolicitudes.map((tipo) => (
                                <TableRow
                                key={tipo.id_tipo}
                                sx={{
                                    "&:hover": { bgcolor: theme.palette.action.hover },
                                    transition: "background-color 0.3s",
                                }}
                                >
                                <TableCell>{tipo.nombre_tipo}</TableCell>
                                <TableCell>{tipo.descripcion}</TableCell>
                                <TableCell>{tipo.nombre_area}</TableCell>
                                <TableCell sx={{ textAlign: "center" }}>
                                    <Button
                                    variant="contained"
                                    color="secondary"
                                    sx={{
                                        transition: "0.3s",
                                        "&:hover": { transform: "scale(1.05)" },
                                    }}
                                    >
                                    Solicitar
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                {nombreArea
                                    ? "No hay solicitudes disponibles en esta área"
                                    : "Selecciona un área para ver las solicitudes"}
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </TableContainer>
                    </Fade>
                )}
                </CardContent>
            </Card>
            </Box>
        </Box>
        </Box>
    );
};

export default Vecino;
