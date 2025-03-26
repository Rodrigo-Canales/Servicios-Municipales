import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

/**
 * Muestra una alerta de éxito simple.
 * @param {string} title Título (opcional, defecto '¡Éxito!')
 * @param {string} text Mensaje principal.
 */
export const mostrarAlertaExito = (title = '¡Éxito!', text) => {
    MySwal.fire({
        icon: 'success',
        title: title,
        text: text,
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'swal-popup-success', title: 'swal-title', htmlContainer: 'swal-text' }
    });
};

/**
 * Muestra una alerta de error simple.
 * @param {string} title Título (opcional, defecto 'Error')
 * @param {string} text Mensaje principal del error.
 */
export const mostrarAlertaError = (title = 'Error', text) => {
    MySwal.fire({
        icon: 'error',
        title: title,
        text: text || 'Ha ocurrido un error inesperado.',
        confirmButtonColor: '#d33',
        customClass: { popup: 'swal-popup-error', title: 'swal-title-error', htmlContainer: 'swal-text' }
    });
};

/**
 * Muestra una alerta de advertencia simple.
 * @param {string} title Título (opcional, defecto 'Advertencia')
 * @param {string} text Mensaje principal.
 */
export const mostrarAlertaAdvertencia = (title = 'Advertencia', text) => {
    MySwal.fire({
        icon: 'warning',
        title: title,
        text: text,
        confirmButtonColor: '#ffc107',
        customClass: { popup: 'swal-popup-warning', title: 'swal-title-warning', htmlContainer: 'swal-text' }
    });
};

/**
 * Muestra un diálogo de confirmación.
 * @param {string} title Título del diálogo.
 * @param {string} text Mensaje de confirmación.
 * @param {string} confirmButtonText Texto del botón confirmar (opcional).
 * @param {string} cancelButtonText Texto del botón cancelar (opcional).
 * @returns {Promise<boolean>} Resuelve a true si se confirma, false si se cancela.
 */
export const mostrarConfirmacion = async (
    title,
    text,
    confirmButtonText = 'Sí, confirmar',
    cancelButtonText = 'Cancelar'
) => {
    const result = await MySwal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        reverseButtons: true
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
    const { value: inputValue } = await MySwal.fire({
        title: title,
        input: inputType,
        inputLabel: inputLabel,
        inputPlaceholder: `Ingrese ${inputLabel.toLowerCase()}...`,
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
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