import React from 'react';
import PropTypes from 'prop-types';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography, Box, List, ListItem, ListItemText, Divider, CircularProgress, TextField, Alert
} from '@mui/material';
import { formatRut } from '../../utils/rutUtils';

// Obtén la URL base del backend desde la variable de entorno
const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
console.log('VITE_BACKEND_URL (backendUrl):', backendUrl);

const sectionBoxStyle = {
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 1,
    p: { xs: 1.5, sm: 2 },
    mb: 2,
    border: theme => `1px solid ${theme.palette.divider}`,
};
const sectionTitleStyle = {
    fontWeight: 'bold',
    color: 'primary.main',
    mb: 1,
    fontSize: '1.1rem',
    letterSpacing: 0.2,
};
const fileListStyle = {
    mt: 1,
    mb: 1,
    bgcolor: 'action.hover',
    borderRadius: 1,
    p: 1,
    boxShadow: 0,
};
const pdfLinkStyle = {
    display: 'inline-block',
    mt: 1,
    fontWeight: 500,
    color: 'secondary.main',
    textDecoration: 'underline',
    fontSize: '0.98rem',
};

const VerRespuestaModal = ({ open, onClose, solicitudOriginal, respuesta }) => {
    if (!open || !solicitudOriginal) return null;
    // Manejo robusto: si respuesta es null o undefined, mostrar mensaje claro
    if (!respuesta) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper" aria-labelledby="ver-respuesta-dialog-title">
                <DialogTitle id="ver-respuesta-dialog-title" sx={{ m: 0, p: '12px 24px', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    Detalle de Solicitud Resuelta #{solicitudOriginal.id_formateado || solicitudOriginal.id_solicitud}
                </DialogTitle>
                <DialogContent dividers>
                    <Alert severity="error">No se pudo cargar la respuesta del funcionario. Intente nuevamente.</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="secondary" variant="outlined">Cerrar</Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper" aria-labelledby="ver-respuesta-dialog-title">
            <DialogTitle id="ver-respuesta-dialog-title" sx={{ m: 0, p: '16px 28px', bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, fontSize: '1.25rem', letterSpacing: 0.5 }}>
                Detalle de Solicitud Resuelta #{solicitudOriginal.id_formateado || solicitudOriginal.id_solicitud}
            </DialogTitle>
            <DialogContent dividers sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default' }}>
                <Grid container spacing={3} alignItems="flex-start">
                    {/* Columna Izquierda: Info del Solicitante y archivos de la solicitud */}
                    <Grid item xs={12} md={6}>
                        <Box sx={sectionBoxStyle}>
                            <Typography sx={sectionTitleStyle}>Detalles de la Solicitud</Typography>
                            <TextField InputProps={{ readOnly: true, sx: { bgcolor: 'action.disabledBackground' } }} variant="outlined" size="small" margin="dense" fullWidth label="Tipo Solicitud" value={solicitudOriginal.nombre_tipo || 'N/A'} sx={{ mb: 1 }} />
                            <TextField InputProps={{ readOnly: true, sx: { bgcolor: 'action.disabledBackground' } }} variant="outlined" size="small" margin="dense" fullWidth label="RUT Solicitante" value={formatRut(solicitudOriginal.RUT_ciudadano) || 'N/A'} sx={{ mb: 1 }} />
                            <TextField InputProps={{ readOnly: true, sx: { bgcolor: 'action.disabledBackground' } }} variant="outlined" size="small" margin="dense" fullWidth label="Nombre Solicitante" value={`${solicitudOriginal.nombre_ciudadano || ''} ${solicitudOriginal.apellido_ciudadano || ''}`.trim() || 'N/A'} sx={{ mb: 1 }} />
                            <TextField InputProps={{ readOnly: true, sx: { bgcolor: 'action.disabledBackground' } }} variant="outlined" size="small" margin="dense" fullWidth label="Fecha Envío" value={solicitudOriginal.fecha_hora_envio ? new Date(solicitudOriginal.fecha_hora_envio).toLocaleString('es-CL') : 'N/A'} sx={{ mb: 1 }} />
                            {solicitudOriginal.correo_notificacion && (
                                <TextField InputProps={{ readOnly: true, sx: { bgcolor: 'action.disabledBackground' } }} variant="outlined" size="small" margin="dense" fullWidth label="Correo Notif." value={solicitudOriginal.correo_notificacion} sx={{ mb: 1 }} />
                            )}
                            {Array.isArray(respuesta?.archivos_adjuntos_solicitante) && respuesta.archivos_adjuntos_solicitante.length > 0 && (
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, mt: 1 }}>Archivos Adjuntos:</Typography>
                                    <List dense sx={fileListStyle}>
                                        {respuesta.archivos_adjuntos_solicitante.map((archivo, idx) => (
                                            <ListItem key={archivo.url || archivo.nombre || idx} disableGutters>
                                                <ListItemText
                                                    primary={<a href={backendUrl + archivo.url} target="_blank" rel="noopener noreferrer" download>{archivo.nombre}</a>}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                            {respuesta?.pdf_solicitud && (
                                <Box>
                                    <a href={backendUrl + respuesta.pdf_solicitud} target="_blank" rel="noopener noreferrer" download style={{ ...pdfLinkStyle }}>
                                        Descargar PDF de la Solicitud
                                    </a>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                    {/* Columna Derecha: Respuesta del Funcionario y archivos de la respuesta */}
                    <Grid item xs={12} md={6}>
                        <Box sx={sectionBoxStyle}>
                            <Typography sx={sectionTitleStyle}>Respuesta del Funcionario</Typography>
                            {respuesta && !respuesta.error ? (
                                <>
                                    <TextField InputProps={{ readOnly: true, sx: { bgcolor: 'action.disabledBackground' } }} variant="outlined" size="small" margin="dense" fullWidth label="ID Respuesta" value={respuesta.id_respuesta_formateado || respuesta.id_respuesta || 'N/A'} sx={{ mb: 1 }} />
                                    <TextField InputProps={{ readOnly: true, sx: { bgcolor: 'action.disabledBackground' } }} variant="outlined" size="small" margin="dense" fullWidth label="Nombre Funcionario" value={`${respuesta.nombre_trabajador || ''} ${respuesta.apellido_trabajador || ''}`.trim() || 'N/A'} sx={{ mb: 1 }} />
                                    <TextField InputProps={{ readOnly: true, sx: { bgcolor: 'action.disabledBackground' } }} variant="outlined" size="small" margin="dense" fullWidth label="RUT Funcionario" value={respuesta.RUT_trabajador || 'N/A'} sx={{ mb: 1 }} />
                                    <TextField InputProps={{ readOnly: true, sx: { bgcolor: 'action.disabledBackground' } }} variant="outlined" size="small" margin="dense" fullWidth label="Fecha Respuesta" value={respuesta.fecha_hora_respuesta ? new Date(respuesta.fecha_hora_respuesta).toLocaleString('es-CL') : 'N/A'} sx={{ mb: 1 }} />
                                    {Array.isArray(respuesta.archivos_adjuntos_funcionario) && respuesta.archivos_adjuntos_funcionario.length > 0 && (
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, mt: 1 }}>Archivos Adjuntos:</Typography>
                                            <List dense sx={fileListStyle}>
                                                {respuesta.archivos_adjuntos_funcionario.map((archivo, idx) => (
                                                    <ListItem key={archivo.url || archivo.nombre || idx} disableGutters>
                                                        <ListItemText
                                                            primary={<a href={backendUrl + archivo.url} target="_blank" rel="noopener noreferrer" download>{archivo.nombre}</a>}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}
                                    {respuesta.pdf_respuesta && (
                                        <Box>
                                            <a href={backendUrl + respuesta.pdf_respuesta} target="_blank" rel="noopener noreferrer" download style={{ ...pdfLinkStyle }}>
                                                Descargar PDF de la Respuesta
                                            </a>
                                        </Box>
                                    )}
                                </>
                            ) : respuesta && respuesta.error ? (
                                <Alert severity="error" sx={{ mt: 2 }}>{respuesta.error}</Alert>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                                    <CircularProgress size={32} sx={{ mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">Cargando respuesta...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Button onClick={onClose} color="secondary" variant="outlined">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

VerRespuestaModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    solicitudOriginal: PropTypes.object,
    respuesta: PropTypes.shape({
        nombre_trabajador: PropTypes.string,
        apellido_trabajador: PropTypes.string,
        fecha_hora_respuesta: PropTypes.string,
        estado_solicitud: PropTypes.string,
        respuesta_texto: PropTypes.string,
        archivos_adjuntos: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string, nombre: PropTypes.string })),
        pdf_url: PropTypes.string,
        error: PropTypes.string,
        archivos_adjuntos_solicitante: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string, nombre: PropTypes.string })),
        pdf_solicitud: PropTypes.string,
        archivos_adjuntos_funcionario: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string, nombre: PropTypes.string })),
        pdf_respuesta: PropTypes.string,
    })
};

export default VerRespuestaModal;
