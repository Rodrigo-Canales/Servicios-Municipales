// frontend/src/components/Inputs/LocationInput.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Importa los estilos de Leaflet.
// CONSIDERACIÓN: Es mejor importar esto UNA SOLA VEZ globalmente
// en tu archivo principal (ej: src/main.jsx o src/App.jsx) y quitarlo de aquí.
import 'leaflet/dist/leaflet.css';
// Imports de MUI
import { Box, Button, Typography, CircularProgress, FormHelperText, FormControl } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';

// --- Arreglo para el icono por defecto de Leaflet (CORREGIDO PARA VITE) ---
// Importa las imágenes usando 'import' para que Vite las maneje correctamente.
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

// Borra la función interna de Leaflet que busca la URL (innecesario con import)
delete L.Icon.Default.prototype._getIconUrl;

// Configura el icono por defecto globalmente usando las imágenes importadas
L.Icon.Default.mergeOptions({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIconRetinaPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
// --- Fin del Arreglo ---


// --- Componente Hijo para manejar eventos y centrado del Mapa ---
function MapInteractionHandler({ position, setPosition, mapRef }) {
    const map = useMap();

    // Guarda la referencia del mapa en el componente padre
    useEffect(() => {
        if (mapRef) {
            mapRef.current = map;
        }
    }, [map, mapRef]);

    // Centra el mapa (con animación) cuando la 'position' cambia desde fuera
    useEffect(() => {
        if (position && map && position.lat != null && position.lng != null) {
            const currentCenter = map.getCenter();
            // Solo centrar si la posición es significativamente diferente
            if (currentCenter.lat.toFixed(5) !== position.lat.toFixed(5) || currentCenter.lng.toFixed(5) !== position.lng.toFixed(5)) {
                 const distance = currentCenter.distanceTo([position.lat, position.lng]);
                 if (distance > 10) { // Umbral para evitar recentrados mínimos
                    map.flyTo([position.lat, position.lng], map.getZoom() < 14 ? 14 : map.getZoom(), { // Asegura un zoom mínimo al volar
                         animate: true,
                         duration: 0.8
                     });
                } else {
                    // Si está muy cerca, solo ajustar sin animación
                    map.setView([position.lat, position.lng], map.getZoom());
                }
            }
        }
    }, [position, map]); // Depende de la posición y la instancia del mapa

    // Manejador de clics en el mapa para seleccionar ubicación
    useMapEvents({
        click(e) {
            // Comprobar si el mapa está efectivamente deshabilitado (mejor que depender solo del CSS)
            const container = map.getContainer();
            if (container.classList.contains('leaflet-disabled') || container.closest('.Mui-disabled')) {
                return; // No hacer nada si está deshabilitado
            }
            const newPosition = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPosition(newPosition); // Llama a la función del padre para actualizar el estado
        },
    });

    return null; // No renderiza UI
}

// PropTypes para el componente hijo
MapInteractionHandler.propTypes = {
    position: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
    }),
    setPosition: PropTypes.func.isRequired,
    mapRef: PropTypes.object, // Debe ser PropTypes.object o PropTypes.shape({ current: PropTypes.any })
};


// --- Componente Principal: LocationInput ---
const LocationInput = ({
    value, // Valor controlado desde el formulario: { lat, lng } o null
    onChange, // Función para notificar cambios al formulario: (newValue) => void
    name, // Nombre del campo (para accesibilidad y estado del form)
    label, // Etiqueta del campo
    helperText, // Texto de ayuda
    disabled = false, // Estado deshabilitado
    required = false, // Si el campo es obligatorio
    initialCenter = [-33.45694, -70.64827], // Centro inicial si no hay valor (Ej: Santiago)
    initialZoom = 13, // Zoom inicial del mapa
}) => {
    // Estado interno para la posición actual en el mapa
    const [localPosition, setLocalPosition] = useState(value || null);
    const [loadingGeo, setLoadingGeo] = useState(false); // Estado de carga para geolocalización
    const [geoError, setGeoError] = useState(''); // Mensaje de error de geolocalización
    const mapRef = useRef(null); // Referencia a la instancia del mapa Leaflet

    // Sincronizar estado interno si el 'value' externo cambia
    useEffect(() => {
        // Solo actualiza si el valor externo es realmente diferente para evitar bucles
        // Usar comparación profunda simple con JSON.stringify
        if (JSON.stringify(value) !== JSON.stringify(localPosition)) {
             setLocalPosition(value || null);
             // Si el valor externo se anula o cambia, limpiar error de geolocalización
             if (!value) setGeoError('');
        }
    }, [value, localPosition]); // Dependencia: 'value' y 'localPosition' para evitar bucle

    // Función llamada por MapInteractionHandler y Geolocalización
    // Actualiza el estado local Y notifica al formulario principal
    const handlePositionUpdate = useCallback((newPosition) => {
        setLocalPosition(newPosition); // Actualiza UI local
        if (onChange) {
            // Solo llamar a onChange si la nueva posición es diferente de la actual externa 'value'
            if (JSON.stringify(newPosition) !== JSON.stringify(value)) {
                 onChange(newPosition); // Notifica al formulario padre
            }
        }
        setGeoError(''); // Limpiar error de geo si se selecciona manualmente
    }, [onChange, value]); // Dependencias: onChange y value

    // Función para solicitar geolocalización del navegador
    const handleGeolocate = useCallback(() => {
        if (disabled || loadingGeo) return;

        if (!navigator.geolocation) {
            setGeoError('La geolocalización no está soportada por tu navegador.');
            return;
        }

        setLoadingGeo(true);
        setGeoError('');

        navigator.geolocation.getCurrentPosition(
            (geoPosition) => {
                const newPos = {
                    lat: geoPosition.coords.latitude,
                    lng: geoPosition.coords.longitude,
                };
                handlePositionUpdate(newPos); // Actualiza estado y notifica
                setLoadingGeo(false);
            },
            (error) => {
                console.error("Error de Geolocalización:", error);
                let message = `Error al obtener ubicación: ${error.message}`;
                if (error.code === 1) message = "Permiso de ubicación denegado.";
                if (error.code === 2) message = "Ubicación no disponible.";
                if (error.code === 3) message = "Tiempo de espera agotado.";
                setGeoError(message);
                setLoadingGeo(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [handlePositionUpdate, disabled, loadingGeo]);

    // Determinar estados de error para UI
    const isPositionValid = localPosition && localPosition.lat != null && localPosition.lng != null;
    const validationError = required && !isPositionValid; // Error si es requerido y no hay posición válida
    const hasError = validationError || !!geoError; // Error general si hay error de validación o de geolocalización

    // IDs para accesibilidad
    const fieldsetId = name ? `location-fieldset-${name}` : undefined;
    const legendId = name ? `location-legend-${name}` : undefined;
    const helperTextId = name ? `location-helper-${name}` : undefined;

    return (
        <FormControl
            fullWidth
            margin="dense"
            required={required}
            disabled={disabled}
            error={hasError}
            component="fieldset" // Usa fieldset para agrupar mapa y botón
            aria-labelledby={legendId} // Enlaza la leyenda al fieldset
            id={fieldsetId}
            sx={{ mt: 1, mb: 1 }}
        >
            {/* Leyenda para el Fieldset (etiqueta principal) */}
            <Typography
                component="legend"
                variant="body2"
                id={legendId}
                sx={{
                    mb: 0.8,
                    color: hasError ? 'error.main' : (disabled ? 'text.disabled' : 'text.secondary'),
                    fontSize: '0.75rem',
                    lineHeight: 1.66,
                    textAlign: 'left',
                }}
            >
                {label}
                 {/* MUI añade el asterisco visualmente si required=true en FormControl */}
            </Typography>

            {/* Contenedor del Mapa y Botón */}
            <Box sx={{
                position: 'relative',
                border: 1,
                borderColor: hasError ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
                borderRadius: 1,
                overflow: 'hidden',
                height: 300,
                opacity: disabled ? 0.6 : 1,
                bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
                transition: (theme) => theme.transitions.create(['border-color', 'background-color', 'opacity']),
                '&:hover': {
                    borderColor: !disabled && !hasError ? 'text.primary' : undefined,
                },
                pointerEvents: disabled ? 'none' : 'auto',
            }}>
                <MapContainer
                    center={isPositionValid ? [localPosition.lat, localPosition.lng] : initialCenter}
                    zoom={initialZoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={!disabled}
                    className={disabled ? 'leaflet-disabled' : ''} // Añade clase si está deshabilitado
                    // No pasar whenCreated, usar mapRef con el componente hijo
                >
                    <TileLayer
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapInteractionHandler
                        position={localPosition}
                        setPosition={handlePositionUpdate} // Pasa la función que actualiza el estado
                        mapRef={mapRef} // Pasa la referencia
                    />
                    {/* Marcador (solo si hay posición válida) */}
                    {isPositionValid && (
                        // El icono por defecto ya está configurado globalmente
                        <Marker position={[localPosition.lat, localPosition.lng]} />
                    )}
                </MapContainer>

                {/* Botón de Geolocalización (solo si no está deshabilitado) */}
                {!disabled && (
                    <Button
                        aria-label="Obtener mi ubicación actual"
                        title="Obtener mi ubicación actual" // Tooltip básico
                        variant="contained"
                        size="small"
                        onClick={handleGeolocate}
                        disabled={loadingGeo} // Deshabilitado mientras carga
                        sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 1000, // Sobre las capas del mapa
                            bgcolor: 'white',
                            color: loadingGeo ? 'grey.500' : 'primary.main',
                            '&:hover': { bgcolor: 'grey.100' },
                            minWidth: 'auto',
                            p: 0.8,
                            boxShadow: 3,
                        }}
                    >
                        {loadingGeo ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <MyLocationIcon fontSize="small" />
                        )}
                    </Button>
                )}
            </Box>

            {/* Texto de Ayuda y Errores */}
            {(helperText || hasError || isPositionValid) && ( // Mostrar si hay texto, error o coordenadas
                <FormHelperText
                    id={helperTextId}
                    error={hasError}
                    sx={{ ml: '14px', mr: '14px' }} // Alineación estándar de MUI
                >
                    {validationError
                        ? 'Este campo es obligatorio.' // Mensaje de error de validación
                        : geoError
                            ? geoError // Mensaje de error de geolocalización
                            : isPositionValid
                                ? `Lat: ${localPosition.lat.toFixed(5)}, Lng: ${localPosition.lng.toFixed(5)}` // Muestra coordenadas
                                : helperText // Muestra texto de ayuda normal
                    }
                </FormHelperText>
            )}
        </FormControl>
    );
};

// Definición de PropTypes para validación y documentación
LocationInput.propTypes = {
    /** Valor actual del input: objeto con lat y lng, o null */
    value: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
    }),
    /** Función llamada cuando la ubicación cambia. Recibe el nuevo objeto {lat, lng} o null */
    onChange: PropTypes.func.isRequired,
    /** Nombre del campo, usado para IDs de accesibilidad y manejo en formularios */
    name: PropTypes.string,
    /** Etiqueta que se muestra sobre el mapa */
    label: PropTypes.string.isRequired,
    /** Texto de ayuda que se muestra debajo del mapa */
    helperText: PropTypes.string,
    /** Si el campo debe estar deshabilitado */
    disabled: PropTypes.bool,
    /** Si el campo es obligatorio */
    required: PropTypes.bool,
    /** Coordenadas [lat, lng] para centrar el mapa inicialmente si no hay valor */
    initialCenter: PropTypes.arrayOf(PropTypes.number),
    /** Nivel de zoom inicial del mapa */
    initialZoom: PropTypes.number,
};

export default LocationInput;