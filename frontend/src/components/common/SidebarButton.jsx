import React, { useState } from "react";
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
  currentSection, // <-- NUEVO: para saber si es vecino
}) => {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const [localExpanded, setLocalExpanded] = useState(false);
  // Determinar si este botón o alguno de sus subItems está seleccionado
  const isSelected = typeof selected === 'string'
    ? (selected === item.id || selected.startsWith(item.id))
    : selected;
  // Determinar si el ítem debe estar expandido: si está localmente expandido o si el currentSection está dentro de su árbol
  const isTreeExpanded = hasSubItems && (localExpanded || (typeof currentSection === 'string' && (currentSection === item.id || currentSection.startsWith(item.id + '-'))));
  // Solo dos estilos: lista desplegable abierta, o ítem final seleccionado
  const getButtonSx = (theme) => {
    const baseTransition = 'background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s';
    if (hasSubItems && (expanded || localExpanded)) {
      // Lista desplegable abierta
      return {
        borderRadius: 3.5,
        fontWeight: 700,
        color: theme.palette.primary.contrastText,
        background: theme.palette.primary.main,
        px: 1.5,
        py: 0.7,
        mb: 0.3,
        mx: 0.7,
        minHeight: 36,
        fontSize: '0.97rem',
        boxShadow: theme.shadows[4], // más notorio
        transition: baseTransition,
        transform: 'scale(1.03)', // leve agrandamiento
        filter: 'brightness(1.01)',
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.contrastText,
          transition: 'color 0.18s',
        },
        '& .MuiListItemText-primary': {
          color: theme.palette.primary.contrastText,
          fontWeight: 700,
          letterSpacing: 0.5,
          transition: 'color 0.18s',
        },
        '&:hover': {
          bgcolor: theme.palette.primary.dark,
          color: theme.palette.primary.contrastText,
          boxShadow: theme.shadows[8],
          transform: 'scale(1.045)',
          filter: 'brightness(1.04)',
          '& .MuiListItemIcon-root': {
            color: theme.palette.primary.contrastText,
          },
          '& .MuiListItemText-primary': {
            color: theme.palette.primary.contrastText,
          },
        },
        '&:active': {
          boxShadow: theme.shadows[2],
          transform: 'scale(0.99)',
        },
      };
    } else if (!hasSubItems && isSelected) {
      // Ítem final seleccionado (igual que principal seleccionado)
      return {
        borderRadius: '18px 3.5px 3.5px 18px', // Borde izquierdo redondeado
        borderLeft: `6px solid ${theme.palette.primary.main}`,
        fontWeight: 700,
        color: theme.palette.primary.main,
        background: theme.palette.background.paper,
        px: 1.5,
        py: 0.7,
        mb: 0.3,
        mx: 0.7,
        minHeight: 36,
        fontSize: '0.97rem',
        boxShadow: `-6px 0 18px -8px ${theme.palette.primary.main}55`, // Sombra azul a la izquierda
        transition: 'background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s, border-left-width 0.25s cubic-bezier(0.4,0,0.2,1)',
        transform: 'scale(1.06)',
        filter: 'brightness(1.01)',
        animation: 'sidebarSelectedFade 0.35s cubic-bezier(0.4,0,0.2,1)',
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.main,
          transition: 'color 0.18s',
        },
        '& .MuiListItemText-primary': {
          color: theme.palette.primary.main,
          fontWeight: 700,
          letterSpacing: 0.5,
          transition: 'color 0.18s',
        },
        '&:hover': {
          bgcolor: theme.palette.background.paper,
          color: theme.palette.primary.main,
          boxShadow: `-8px 0 22px -8px ${theme.palette.primary.main}77`,
          transform: 'scale(1.08)',
          filter: 'brightness(1.04)',
          '& .MuiListItemIcon-root': {
            color: theme.palette.primary.main,
          },
          '& .MuiListItemText-primary': {
            color: theme.palette.primary.main,
          },
        },
        '&:active': {
          boxShadow: `-4px 0 10px -6px ${theme.palette.primary.main}77`,
          transform: 'scale(0.99)',
        },
      };
    } else {
      // No seleccionado
      return {
        borderRadius: 3.5,
        fontWeight: 500,
        color: theme.palette.primary.main,
        background: theme.palette.background.paper,
        px: 1.5,
        py: 0.7,
        mb: 0.3,
        mx: 0.7,
        minHeight: 36,
        fontSize: '0.97rem',
        boxShadow: 'none',
        transition: baseTransition,
        '& .MuiListItemIcon-root': {
          color: theme.palette.primary.main,
          transition: 'color 0.18s',
        },
        '& .MuiListItemText-primary': {
          color: theme.palette.primary.main,
          fontWeight: 500,
          letterSpacing: 0.5,
          transition: 'color 0.18s',
        },
        '&:hover': {
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow: theme.shadows[4],
          transform: 'scale(1.025)',
          filter: 'brightness(1.04)',
          '& .MuiListItemIcon-root': {
            color: theme.palette.primary.contrastText,
          },
          '& .MuiListItemText-primary': {
            color: theme.palette.primary.contrastText,
          },
        },
        '&:active': {
          boxShadow: theme.shadows[2],
          transform: 'scale(0.98)',
        },
      };
    }
  };
  return (
    <>
      <ListItemButton
        onClick={e => {
          if (hasSubItems) {
            setLocalExpanded(exp => !exp);
            return;
          }
          if (onClick) onClick(e);
        }}
        selected={isSelected}
        sx={theme => ({
          ...getButtonSx(theme, isTreeExpanded),
          ...sx,
          position: 'relative',
          overflow: 'hidden',
          // Asegura que texto e ícono sean blancos al hacer hover sobre el recuadro
          '&:hover .MuiListItemIcon-root, &:hover .MuiListItemText-primary': {
            color: theme.palette.mode === 'dark'
              ? theme.palette.text.textWhite
              : (!hasSubItems && isSelected)
                ? theme.palette.text.textBlue // Ítem seleccionado en claro: azul en hover
                : theme.palette.text.textWhite, // Resto: blanco en hover
          },
          // Si el ítem está seleccionado y no tiene subItems, nunca cambia el color en hover
          ...(theme.palette.mode === 'light' && !hasSubItems && isSelected ? {
            '&:hover .MuiListItemIcon-root, &:hover .MuiListItemText-primary': {
              color: theme.palette.text.textBlue,
            },
          } : {}),
        })}
        // Ripple effect manual
        onMouseDown={e => {
          const btn = e.currentTarget;
          const circle = document.createElement('span');
          const diameter = Math.max(btn.clientWidth, btn.clientHeight);
          const radius = diameter / 2;
          circle.style.width = circle.style.height = `${diameter}px`;
          circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - radius}px`;
          circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - radius}px`;
          circle.style.position = 'absolute';
          circle.style.borderRadius = '50%';
          circle.style.background = 'rgba(0,0,0,0.08)';
          circle.style.pointerEvents = 'none';
          circle.style.transform = 'scale(0)';
          circle.style.opacity = '0.7';
          circle.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.7s';
          circle.classList.add('sidebar-ripple');
          btn.appendChild(circle);
          setTimeout(() => {
            circle.style.transform = 'scale(1)';
            circle.style.opacity = '0';
          }, 10);
          setTimeout(() => {
            if (circle.parentNode) circle.parentNode.removeChild(circle);
          }, 600);
        }}
      >
        {item.icon && (
          <ListItemIcon>
            {item.icon}
          </ListItemIcon>
        )}
        <ListItemText
          primary={
            <Box
              component="span"
              sx={theme => ({
                fontWeight: (hasSubItems && isTreeExpanded) || (!hasSubItems && isSelected) ? 700 : 500,
                letterSpacing: 0.5,
                fontFamily: 'Montserrat, Arial, sans-serif',
                fontSize: level === 0 ? '0.97rem' : '0.93rem',
                color: theme.palette.mode === 'dark' ? theme.palette.text.textWhite : undefined,
                transition: 'color 0.18s',
              })}
            >
              {item.label}
            </Box>
          }
        />
        {hasSubItems && (
          <Box sx={{ transition: 'transform 0.3s', color: theme => theme.palette.primary.contrastText, transform: isTreeExpanded ? 'rotate(180deg)' : 'none' }}>
            {isTreeExpanded ? <ExpandLess /> : <ExpandMore />}
          </Box>
        )}
      </ListItemButton>
      {hasSubItems && (
        <Collapse in={isTreeExpanded} timeout={{ enter: 500, exit: 350 }} unmountOnExit sx={{
          transition: 'max-height 0.5s cubic-bezier(0.4,0,0.2,1)',
          maxHeight: isTreeExpanded ? 1000 : 0,
        }}>
          <List component="div" disablePadding sx={{
            pl: 1.5 + level * 1.2,
            transition: 'padding-left 0.3s',
          }}>
            {item.subItems.map((sub) => (
              <SidebarButton
                key={sub.id}
                item={sub}
                selected={currentSection === sub.id} // Corrige: solo true si es exactamente igual
                expanded={typeof currentSection === 'string' && currentSection.startsWith(sub.id) || currentSection === sub.id}
                onClick={onSelect ? () => onSelect(sub.id) : undefined}
                onSelect={onSelect}
                onCloseDrawer={onCloseDrawer}
                level={level + 1}
                currentSection={currentSection} // Pasa el currentSection a todos los niveles
              />
            ))}
            {children}
          </List>
        </Collapse>
      )}
    </>
  );
};

// Animación para selección
const style = document.createElement('style');
style.innerHTML = `@keyframes sidebarSelectedFade { from { box-shadow: none; transform: scale(1); opacity: 0.7; } to { box-shadow: var(--mui-shadow-8); transform: scale(1.06); opacity: 1; } }`;
document.head.appendChild(style);

export default SidebarButton;
