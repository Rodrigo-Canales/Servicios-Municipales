import React, { useMemo, useState } from "react";
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse, Box, Typography, Divider, useTheme } from "@mui/material";
import {
  Settings, People, Business, Category, Description, QuestionAnswer, RateReview, ListAlt, HelpOutline, AccountBox, CheckCircleOutline, CircleOutlined, ExpandLess, ExpandMore
} from '@mui/icons-material';

function Sidebar({
  panelType, // 'admin' | 'funcionario' | 'vecino'
  currentSection,
  onSelectSection,
  onCloseDrawer,
  areas = [],
  tiposDelArea = [],
  user = null,
  sx = {}
}) {
  const theme = useTheme();
  const [openGestionar, setOpenGestionar] = useState(true);

  // --- Menú dinámico según panel ---
  const menu = useMemo(() => {
    if (panelType === 'admin') {
      return [
        {
          id: 'gestionar',
          label: 'Gestionar',
          icon: <Settings fontSize="small" />,
          subItems: [
            { id: 'areas', label: 'Áreas', icon: <Business fontSize="small" /> },
            { id: 'tipos-solicitudes', label: 'Tipos de Solicitudes', icon: <Category fontSize="small" /> },
            { id: 'solicitudes', label: 'Solicitudes', icon: <Description fontSize="small" /> },
            { id: 'respuestas', label: 'Respuestas', icon: <RateReview fontSize="small" /> },
            { id: 'preguntas-frecuentes', label: 'Preguntas Frecuentes', icon: <QuestionAnswer fontSize="small" /> },
            { id: 'usuarios', label: 'Usuarios', icon: <People fontSize="small" /> },
          ]
        }
      ];
    }
    if (panelType === 'vecino') {
      return [
        {
          id: 'areas',
          label: 'Áreas',
          icon: <Business fontSize="small" />,
          subItems: areas.map(area => ({
            id: `area-${area.id_area}`,
            label: area.nombre_area,
            icon: <Business fontSize="small" />
          }))
        },
        { id: 'mis-solicitudes', label: 'Mis Solicitudes', icon: <ListAlt fontSize="small" /> },
        { id: 'consultas', label: 'Consultas', icon: <HelpOutline fontSize="small" /> },
        { id: 'preguntas-frecuentes', label: 'Preguntas Frecuentes', icon: <QuestionAnswer fontSize="small" /> }
      ];
    }
    if (panelType === 'funcionario') {
      return [
        {
          id: 'tipos',
          label: user?.nombre_area ? user.nombre_area.toUpperCase() : 'ÁREA FUNCIONARIO',
          icon: <Business fontSize="small" />,
          subItems: tiposDelArea.length > 0 ? tiposDelArea.flatMap(tipo => ([
            {
              id: `tipo-${tipo.id_tipo}-pendientes`,
              label: `${tipo.nombre_tipo} (Pendientes)`,
              icon: <CircleOutlined fontSize="small" />
            },
            {
              id: `tipo-${tipo.id_tipo}-resueltas`,
              label: `${tipo.nombre_tipo} (Resueltas)`,
              icon: <CheckCircleOutline fontSize="small" />
            }
          ])) : []
        }
      ];
    }
    return [];
  }, [panelType, areas, tiposDelArea, user]);

  // --- Render Sidebar ---
  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', bgcolor: 'background.paper', ...sx, boxShadow: 'none', borderRight: `1px solid ${theme.palette.divider}` }}>
      {/* Logo solo, sin contenedor */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 3, pb: 2 }}>
        <img src="/LOGO PITRUFQUEN.png" alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', display: 'block', marginBottom: 8 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', letterSpacing: 0.5, textAlign: 'center', fontSize: '1.05rem', mb: 0.5 }}>
          Municipalidad de Pitrufquén
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: '0.85rem', textAlign: 'center', mb: 0.5 }}>
          {panelType === 'admin' ? 'Administrador' : panelType === 'funcionario' ? 'Funcionario' : 'Vecino'}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2, mx: 2 }} />
      {/* Menú principal minimalista */}
      <List sx={{ pt: 0, pb: 0, px: 0 }}>
        {panelType === 'funcionario' && user?.nombre_area ? (
          <React.Fragment>
            {/* Área principal como lista desplegable */}
            <ListItemButton onClick={() => setOpenGestionar(o => !o)} sx={{ borderRadius: 2, fontWeight: 600, color: 'text.primary', px: 2, py: 1, mb: 0.5, transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover' } }}>
              <ListItemIcon sx={{ color: 'primary.main', minWidth: 36 }}><Business fontSize="small" /></ListItemIcon>
              <ListItemText primary={user.nombre_area.toUpperCase()} />
              {openGestionar ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openGestionar} timeout={250} unmountOnExit>
              <List component="div" disablePadding>
                {tiposDelArea.map(tipo => (
                  <React.Fragment key={tipo.id_tipo}>
                    {/* Tipo de solicitud como lista desplegable */}
                    <ListItemButton onClick={() => setOpenGestionar(prev => ({ ...prev, [tipo.id_tipo]: !openGestionar[tipo.id_tipo] }))} sx={{ pl: 4, borderRadius: 2, mb: 0.5, fontWeight: 600, color: 'text.primary', transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover' } }}>
                      <ListItemIcon sx={{ color: 'primary.main', minWidth: 32 }}><Category fontSize="small" /></ListItemIcon>
                      <ListItemText primary={tipo.nombre_tipo} />
                      {openGestionar && openGestionar[tipo.id_tipo] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={openGestionar && openGestionar[tipo.id_tipo]} timeout={200} unmountOnExit>
                      <List component="div" disablePadding>
                        <ListItemButton
                          selected={currentSection === `tipo-${tipo.id_tipo}-pendientes`}
                          onClick={() => {
                            if (onSelectSection) onSelectSection(`tipo-${tipo.id_tipo}-pendientes`);
                            if (onCloseDrawer) onCloseDrawer();
                          }}
                          sx={{ pl: 8, borderRadius: 2, mb: 0.5, fontWeight: currentSection === `tipo-${tipo.id_tipo}-pendientes` ? 600 : 400, color: currentSection === `tipo-${tipo.id_tipo}-pendientes` ? 'primary.main' : 'text.secondary', bgcolor: currentSection === `tipo-${tipo.id_tipo}-pendientes` ? 'action.selected' : 'transparent', transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
                        >
                          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}><CircleOutlined fontSize="small" /></ListItemIcon>
                          <ListItemText primary="Pendientes" />
                        </ListItemButton>
                        <ListItemButton
                          selected={currentSection === `tipo-${tipo.id_tipo}-resueltas`}
                          onClick={() => {
                            if (onSelectSection) onSelectSection(`tipo-${tipo.id_tipo}-resueltas`);
                            if (onCloseDrawer) onCloseDrawer();
                          }}
                          sx={{ pl: 8, borderRadius: 2, mb: 0.5, fontWeight: currentSection === `tipo-${tipo.id_tipo}-resueltas` ? 600 : 400, color: currentSection === `tipo-${tipo.id_tipo}-resueltas` ? 'primary.main' : 'text.secondary', bgcolor: currentSection === `tipo-${tipo.id_tipo}-resueltas` ? 'action.selected' : 'transparent', transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
                        >
                          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}><CheckCircleOutline fontSize="small" /></ListItemIcon>
                          <ListItemText primary="Resueltas" />
                        </ListItemButton>
                      </List>
                    </Collapse>
                  </React.Fragment>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ) : (
          // ...existing code for admin and vecino...
          menu.map((item) => (
            <React.Fragment key={item.id}>
              {/* Botón expandible solo para admin */}
              {panelType === 'admin' && item.id === 'gestionar' ? (
                <>
                  <ListItemButton
                    onClick={() => setOpenGestionar(o => !o)}
                    sx={{ borderRadius: 2, fontWeight: 600, color: 'text.primary', px: 2, py: 1, mb: 0.5, transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <ListItemIcon sx={{ color: 'primary.main', minWidth: 36 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={<span style={{ fontWeight: 600, letterSpacing: 0.5 }}>Gestionar</span>} />
                    {openGestionar ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse in={openGestionar} timeout={250} unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((sub) => (
                        <ListItemButton
                          key={sub.id}
                          selected={currentSection === sub.id}
                          onClick={() => {
                            if (onSelectSection) onSelectSection(sub.id);
                            if (onCloseDrawer) onCloseDrawer();
                          }}
                          sx={{ pl: 4, borderRadius: 2, mb: 0.5, mx: 0.5, fontWeight: currentSection === sub.id ? 600 : 400, color: currentSection === sub.id ? 'primary.main' : 'text.secondary', bgcolor: currentSection === sub.id ? 'action.selected' : 'transparent', transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
                        >
                          {sub.icon && <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{sub.icon}</ListItemIcon>}
                          <ListItemText primary={sub.label} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <>
                  <ListItemButton
                    selected={currentSection === item.id}
                    onClick={() => {
                      if (onSelectSection) onSelectSection(item.id);
                      if (onCloseDrawer) onCloseDrawer();
                    }}
                    sx={{ borderRadius: 2, mb: 0.5, mx: 1.5, fontWeight: currentSection === item.id ? 600 : 400, color: currentSection === item.id ? 'primary.main' : 'text.secondary', bgcolor: currentSection === item.id ? 'action.selected' : 'transparent', transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
                  >
                    {item.icon && <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{item.icon}</ListItemIcon>}
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                  {item.subItems && item.subItems.length > 0 && (
                    <Collapse in={currentSection === item.id || item.id === 'areas' || item.id === 'tipos'} timeout={250} unmountOnExit>
                      <List component="div" disablePadding>
                        {item.subItems.map((sub) => (
                          <ListItemButton
                            key={sub.id}
                            selected={currentSection === sub.id}
                            onClick={() => {
                              if (onSelectSection) onSelectSection(sub.id);
                              if (onCloseDrawer) onCloseDrawer();
                            }}
                            sx={{ pl: 4, borderRadius: 2, mb: 0.5, mx: 1.5, fontWeight: currentSection === sub.id ? 600 : 400, color: currentSection === sub.id ? 'primary.main' : 'text.secondary', bgcolor: currentSection === sub.id ? 'action.selected' : 'transparent', transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
                          >
                            {sub.icon && <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{sub.icon}</ListItemIcon>}
                            <ListItemText primary={sub.label} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </>
              )}
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  );
}

export default Sidebar;
