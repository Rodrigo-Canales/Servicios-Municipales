import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Helper para colores según modo
function getSwalThemeColors() {
    const mode = localStorage.getItem('themeMode') === 'dark' ? 'dark' : 'light';
    if (mode === 'dark') {
        return {
            background: '#23272b', // gris oscuro
            color: '#fff',
            confirmButtonColor: '#1976d2', // azul MUI
            cancelButtonColor: '#bdbdbd', // gris claro
        };
    } else {
        return {
            background: '#fff',
            color: '#222',
            confirmButtonColor: '#1976d2',
            cancelButtonColor: '#d33',
        };
    }
}

/**
 * Muestra una alerta de éxito simple.
 * @param {string} title Título (opcional, defecto '¡Éxito!')
 * @param {string} text Mensaje principal.
 */
export const mostrarAlertaExito = (title = '¡Éxito!', text) => {
    const theme = getSwalThemeColors();
    MySwal.fire({
        icon: 'success',
        title: title,
        text: text,
        timer: 2000,
        showConfirmButton: false,
        background: theme.background,
        color: theme.color,
        customClass: { popup: 'swal-popup-success', title: 'swal-title', htmlContainer: 'swal-text' }
    });
};

/**
 * Muestra una alerta de error simple.
 * @param {string} title Título (opcional, defecto 'Error')
 * @param {string} text Mensaje principal del error.
 */
export const mostrarAlertaError = (title = 'Error', text) => {
    const theme = getSwalThemeColors();
    MySwal.fire({
        icon: 'error',
        title: title,
        text: text || 'Ha ocurrido un error inesperado.',
        confirmButtonColor: theme.confirmButtonColor,
        background: theme.background,
        color: theme.color,
        customClass: { popup: 'swal-popup-error', title: 'swal-title-error', htmlContainer: 'swal-text' }
    });
};

/**
 * Muestra una alerta de advertencia simple.
 * @param {string} title Título (opcional, defecto 'Advertencia')
 * @param {string} text Mensaje principal.
 */
export const mostrarAlertaAdvertencia = (title = 'Advertencia', text) => {
    const theme = getSwalThemeColors();
    MySwal.fire({
        icon: 'warning',
        title: title,
        text: text,
        confirmButtonColor: theme.confirmButtonColor,
        background: theme.background,
        color: theme.color,
        customClass: { popup: 'swal-popup-warning', title: 'swal-title-warning', htmlContainer: 'swal-text' }
    });
};

/**
 * Muestra un diálogo de confirmación.
 * @param {string} title Título del diálogo.
 * @param {string} text Mensaje de confirmación.
 * @param {string} confirmButtonText Texto del botón confirmar (opcional).
 * @param {string} cancelButtonText Texto del botón cancelar (opcional).
 * @param {string} icon Icono del diálogo (opcional, defecto 'warning').
 * @param {string} confirmButtonColor Color del botón confirmar (opcional).
 * @param {string} cancelButtonColor Color del botón cancelar (opcional).
 * @returns {Promise<boolean>} Resuelve a true si se confirma, false si se cancela.
 */
export const mostrarConfirmacion = async (
    title,
    text,
    confirmButtonText = 'Sí, confirmar',
    cancelButtonText = 'Cancelar',
    icon = 'warning',
    confirmButtonColor = null,
    cancelButtonColor = null
) => {
    const theme = getSwalThemeColors();
    const result = await MySwal.fire({
        title: title,
        text: text,
        icon: icon,
        showCancelButton: true,
        confirmButtonColor: confirmButtonColor || (icon === 'error' ? '#d33' : theme.confirmButtonColor),
        cancelButtonColor: cancelButtonColor || (theme.background === '#23272b' ? '#424242' : '#bdbdbd'), // gris oscuro en dark, gris claro en light
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        reverseButtons: true,
        background: theme.background,
        color: theme.color,
        customClass: {
            cancelButton: 'swal-cancel-btn',
            confirmButton: 'swal-confirm-btn',
        },
    });
    return result.isConfirmed;
};

/**
 * Muestra una alerta con un campo de input.
 * @param {string} title Título
 * @param {string} inputLabel Label para el input
 * @param {string} inputType Tipo de input (text, password, etc.)
 * @param {function} inputValidator Función de validación (opcional)
 * @returns {Promise<string|null|undefined>} Resuelve con el valor ingresado, undefined si se cancela.
 */
export const mostrarAlertaConInput = async (title, inputLabel, inputType = 'text', inputValidator = null) => {
    const theme = getSwalThemeColors();
    const { value: inputValue } = await MySwal.fire({
        title: title,
        input: inputType,
        inputLabel: inputLabel,
        inputPlaceholder: `Ingrese ${inputLabel.toLowerCase()}...`,
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        background: theme.background,
        color: theme.color,
        inputValidator: inputValidator ? (value) => {
            if (!value) {
                return '¡Necesitas escribir algo!';
            }
            const error = inputValidator(value);
            if (error) return error;
                return null; // No hay error
        } : undefined,
    });
    return inputValue;
};