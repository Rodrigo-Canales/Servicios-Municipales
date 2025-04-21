import React, { useMemo, useState } from "react";
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse, Box, Typography, Divider } from "@mui/material";
import {
  Settings, People, Business, Category, Description, QuestionAnswer, RateReview, ListAlt, HelpOutline, AccountBox, CheckCircleOutline, CircleOutlined, ExpandLess, ExpandMore
} from '@mui/icons-material';
import SidebarButton from "./SidebarButton";

function Sidebar({
  panelType, // 'admin' | 'funcionario' | 'vecino'
  currentSection,
  onSelectSection,
  onCloseDrawer,
  areas = [],
  tiposDelArea = [],
  user = null,
}) {
  const [openGestionar, setOpenGestionar] = useState(true);

  // --- Menú dinámico según panel ---
  const menu = useMemo(() => {
    if (panelType === 'vecino' && Array.isArray(areas) && areas.length > 0) {
      // Sidebar idéntica a admin/funcionario, pero para vecinos
      return [
        {
          id: 'gestionar',
          label: 'Solicitudes',
          icon: <Description fontSize="small" />,
          subItems: areas.map(area => ({
            id: `area-${area.id_area}`,
            label: area.nombre_area,
            icon: <Business fontSize="small" />,
            subItems: [],
          })),
        },
        { id: 'mis-solicitudes', label: 'Mis Solicitudes', icon: <ListAlt fontSize="small" />, subItems: [] },
        { id: 'consultas', label: 'Consultas', icon: <HelpOutline fontSize="small" />, subItems: [] },
        { id: 'preguntas-frecuentes', label: 'Preguntas Frecuentes', icon: <QuestionAnswer fontSize="small" />, subItems: [] },
      ];
    }
    if (panelType === 'funcionario' && user?.nombre_area && Array.isArray(tiposDelArea)) {
      // Para funcionario: solo su área y tipos del área
      return [
        {
          id: 'area-funcionario',
          label: user.nombre_area.toUpperCase(),
          icon: <Business fontSize="small" />,
          subItems: tiposDelArea.map(tipo => ({
            id: `tipo-${tipo.id_tipo}`,
            label: tipo.nombre_tipo,
            icon: <Category fontSize="small" />,
            subItems: [
              { id: `tipo-${tipo.id_tipo}-pendientes`, label: 'Pendientes', icon: <CircleOutlined fontSize="small" /> },
              { id: `tipo-${tipo.id_tipo}-resueltas`, label: 'Resueltas', icon: <CheckCircleOutline fontSize="small" /> },
            ],
          })),
        },
      ];
    }
    // Admin usa el menú completo
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
  }, [panelType, areas, user, tiposDelArea]);

  // --- Render Sidebar ---
  return (
    <Box
      sx={{
        width: 240,
        minWidth: 240,
        maxWidth: 240,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden', // Evita scroll horizontal
        background: (theme) => theme.palette.background.paper,
        boxShadow: (theme) => theme.shadows[4],
        borderRight: (theme) => `1.5px solid ${theme.palette.primary.light}`,
        color: (theme) => theme.palette.text.primary,
        transition: 'background 0.3s',
        px: 0,
        py: 0,
      }}
    >
      {/* Logo grande, sin Box ni fondo ni borde */}
      <img
        src="/LOGO PITRUFQUEN.png"
        alt="Logo Municipalidad de Pitrufquén"
        style={{
          width: '120px',
          height: '120px',
          objectFit: 'contain',
          display: 'block',
          margin: '40px auto 28px auto', // Más espacio arriba y abajo
        }}
      />
      <Typography variant="subtitle2" sx={{
        fontWeight: 700, // Más grueso que el rol
        color: (theme) => theme.palette.primary.main,
        letterSpacing: 0.7,
        textAlign: 'center',
        fontSize: '0.98rem',
        mb: 1.5, // Más espacio abajo
        mt: 0.5,
        textShadow: (theme) => `0 2px 8px ${theme.palette.primary.light}33`,
        textTransform: 'uppercase',
      }}>
        Municipalidad de Pitrufquén
      </Typography>
      <Typography variant="caption" sx={{
        color: (theme) => theme.palette.text.secondary,
        fontWeight: 400, // Más delgado que el título
        fontSize: '0.82rem',
        display: 'block',
        textAlign: 'center',
        mb: 2.5, // Más espacio abajo
        mt: 0.5,
        letterSpacing: 0.2,
        opacity: 0.85,
        textTransform: 'uppercase',
      }}>
        {panelType === 'admin' ? 'Administrador' : panelType === 'funcionario' ? 'Funcionario' : 'Vecino'}
      </Typography>
      <Divider sx={{ mb: 2.5, mx: 2, borderColor: (theme) => theme.palette.primary.light, opacity: 0.5 }} />
      {/* Menú principal */}
      <List sx={{ pt: 0, pb: 0, px: 0 }}>
        {menu.map((item) => (
          <SidebarButton
            key={item.id}
            item={item}
            expanded={openGestionar && (item.id === 'gestionar' || item.id === 'area-funcionario')}
            onClick={() => {
              // Si el ítem tiene subItems, expandir/collapse (sin cerrar sidebar)
              if (item.subItems && item.subItems.length > 0) {
                if (item.id === 'gestionar' || item.id === 'area-funcionario') {
                  setOpenGestionar(o => !o);
                }
                return;
              }
              if (onSelectSection) onSelectSection(item.id);
              if (onCloseDrawer) onCloseDrawer();
            }}
            selected={currentSection === item.id}
            onSelect={subId => {
              if (onSelectSection) onSelectSection(subId);
              // Solo cerrar si el subId corresponde a un ítem final (sin subItems), en cualquier nivel
              const findIsFinal = (items, id) => {
                for (const it of items) {
                  if (it.id === id) return !it.subItems || it.subItems.length === 0;
                  if (it.subItems && it.subItems.length > 0) {
                    const found = findIsFinal(it.subItems, id);
                    if (found) return true;
                  }
                }
                return false;
              };
              if (findIsFinal(menu, subId) && onCloseDrawer) onCloseDrawer();
            }}
            onCloseDrawer={onCloseDrawer}
            currentSection={currentSection}
          />
        ))}
      </List>
      {/* Animación fadeIn global */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </Box>
  );
}

export default Sidebar;
