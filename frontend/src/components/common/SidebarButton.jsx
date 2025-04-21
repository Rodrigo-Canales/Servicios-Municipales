import React from "react";
import { ListItemButton, ListItemIcon, ListItemText, Box, Collapse, List } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

/**
 * SidebarButton: Botón reutilizable para sidebar con estilos consistentes.
 * Props:
 * - item: { id, label, icon, subItems }
 * - selected: boolean
 * - expanded: boolean
 * - onClick: function
 * - onSelect: function (para subItems)
 * - onCloseDrawer: function
 * - sx: estilos extra opcionales
 * - children: para subItems anidados
 */
const SidebarButton = ({
  item,
  selected = false,
  expanded = false,
  onClick,
  onSelect,
  onCloseDrawer,
  sx = {},
  children,
  level = 0,
  currentSection,
}) => {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  // Determinar si este botón o alguno de sus subItems está seleccionado
  const isSelected = typeof selected === 'string' ? selected === item.id : selected;
  // Estilo visual según nivel y selección
  const getButtonSx = (theme) => {
    // Nivel 0: principal, Nivel 1+: subniveles
    if (level === 0) {
      return {
        borderRadius: 3.5,
        fontWeight: expanded || isSelected ? 800 : 500,
        color: expanded || isSelected ? theme.palette.primary.contrastText : theme.palette.primary.main,
        px: 1.5, // más compacto
        py: 0.7, // más compacto
        mb: 0.3, // menos margen
        mx: 0.7, // menos margen
        minHeight: 36, // más compacto
        fontSize: '0.97rem', // más chiva
        boxShadow: expanded || isSelected ? theme.shadows[2] : 'none',
        background: expanded || isSelected ? theme.palette.primary.main : theme.palette.background.paper,
        transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
        '&:hover': {
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        },
        // --- Forzar mismo estilo de selección para cualquier item seleccionado (con o sin subItems) ---
        ...(isSelected ? {
          background: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow: theme.shadows[2],
          '& .MuiListItemIcon-root': {
            color: theme.palette.primary.contrastText,
          },
          '& .MuiListItemText-primary': {
            color: theme.palette.primary.contrastText,
            fontWeight: 800,
            letterSpacing: 0.5,
          },
        } : {})
      };
    } else {
      // Subniveles: gradiente, indicador lateral, etc.
      return {
        pl: 2.5 + (level - 1) * 1.5, // más compacto
        borderRadius: 2.5,
        mb: 0.2,
        mx: 0.7,
        minHeight: 30,
        fontWeight: isSelected ? 800 : 500,
        fontSize: '0.93rem', // más chiva
        color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
        bgcolor: isSelected ? `linear-gradient(90deg, ${theme.palette.primary.light} 80%, ${theme.palette.background.paper} 100%)` : 'transparent',
        border: 'none',
        transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isSelected ? '0 4px 24px 0 rgba(0,0,0,0.08), 0 0 0 2px ' + theme.palette.primary.light : 'none',
        '&:before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          width: isSelected ? 8 : 3,
          height: '100%',
          bgcolor: isSelected ? theme.palette.primary.main : 'transparent',
          borderRadius: '2px',
          boxShadow: isSelected ? `0 0 8px 2px ${theme.palette.primary.main}33` : 'none',
          transition: 'background 0.18s, width 0.18s, box-shadow 0.18s',
        },
        '&:hover': {
          bgcolor: `linear-gradient(90deg, ${theme.palette.primary.light} 80%, ${theme.palette.background.paper} 100%)`,
          color: theme.palette.primary.main,
        },
      };
    }
  };
  return (
    <>
      <ListItemButton
        onClick={onClick}
        selected={isSelected}
        sx={theme => ({
          ...getButtonSx(theme),
          ...sx,
        })}
      >
        {item.icon && (
          <ListItemIcon sx={{ color: (theme) => (isSelected ? theme.palette.primary.main : theme.palette.primary.main), minWidth: 28, transition: 'none' }}>
            {item.icon}
          </ListItemIcon>
        )}
        <ListItemText primary={<span style={{ fontWeight: 800, letterSpacing: 0.5, fontFamily: 'Montserrat, Arial, sans-serif', fontSize: level === 0 ? '0.97rem' : '0.89rem' }}>{item.label}</span>} />
        {hasSubItems && (
          <Box sx={{ transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </Box>
        )}
      </ListItemButton>
      {hasSubItems && (
        <Collapse in={expanded} timeout={400} unmountOnExit>
          <List component="div" disablePadding>
            {item.subItems.map((sub) => (
              <SidebarButton
                key={sub.id}
                item={sub}
                selected={selected === sub.id}
                expanded={selected && (selected.startsWith(sub.id) || selected === sub.id)}
                onClick={onSelect ? () => onSelect(sub.id) : undefined}
                onSelect={onSelect}
                onCloseDrawer={onCloseDrawer}
                level={level + 1}
                currentSection={currentSection}
              />
            ))}
            {children}
          </List>
        </Collapse>
      )}
    </>
  );
};

export default SidebarButton;
