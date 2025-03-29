// frontend/src/utils/rutUtils.js

/**
 * Calculates the verifier digit (DV) for a given RUT body using the Modulo 11 algorithm.
 * @param {string|number} rutBody - The RUT body without the verifier digit.
 * @returns {string} The calculated verifier digit ('0'-'9' or 'K').
 */
const calculateVerifierDigit = (rutBody) => {
    if (!rutBody) return '';
    const rutClean = String(rutBody).replace(/[^0-9]/g, ''); // Ensure only numbers
    if (!rutClean) return '';
  
    let sum = 0;
    let multiplier = 2;
  
    // Iterate from right to left
    for (let i = rutClean.length - 1; i >= 0; i--) {
      sum += parseInt(rutClean.charAt(i), 10) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
  
    const remainder = sum % 11;
    const dv = 11 - remainder;
  
    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return String(dv);
  };
  
  /**
   * Formats a Chilean RUT string for display.
   * Adds dots as thousands separators and the hyphen before the verifier digit.
   * Example: 123456789 -> 12.345.678-9 or 12345678k -> 12.345.678-K
   *
   * @param {string|null|undefined} rut - The RUT string (can include DV, dots, hyphen).
   * @returns {string} The formatted RUT string or an empty string if input is invalid/empty.
   */
  export const formatRut = (rut) => {
    if (!rut) {
      return '';
    }
  
    // 1. Clean the input: remove dots, hyphen, and keep only numbers and 'K'
    const cleanRut = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
  
    if (cleanRut.length < 2) {
      return cleanRut; // Not enough characters for body and DV
    }
  
    // 2. Separate body and verifier digit
    let body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
  
    // 3. Add dots to the body
    let formattedBody = '';
    let count = 0;
    for (let i = body.length - 1; i >= 0; i--) {
      formattedBody = body.charAt(i) + formattedBody;
      count++;
      if (count === 3 && i !== 0) {
        formattedBody = '.' + formattedBody;
        count = 0;
      }
    }
  
    // 4. Combine formatted body, hyphen, and DV
    return `${formattedBody}-${dv}`;
  };
  
  
  /**
   * Validates a Chilean RUT string (including the verifier digit).
   * Checks format and calculates the verifier digit using Modulo 11.
   *
   * @param {string|null|undefined} rut - The RUT string to validate.
   * @returns {boolean} True if the RUT is valid, false otherwise.
   */
  export const validateRut = (rut) => {
     if (!rut) {
      return false;
    }
  
    // 1. Clean the input
    const cleanRut = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
  
    // 2. Basic length check
    if (cleanRut.length < 2) {
      return false; // Must have at least body and DV
    }
  
    // 3. Separate body and DV
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
  
    // 4. Check if body contains only numbers
    if (!/^[0-9]+$/.test(body)) {
        return false;
    }
  
    // 5. Calculate the expected DV
    const calculatedDv = calculateVerifierDigit(body);
  
    // 6. Compare calculated DV with the provided DV
    return calculatedDv === dv;
  };
  
  // Optional: Function to clean RUT (remove dots and hyphen)
  /**
   * Cleans a RUT string, removing dots and hyphen, keeping only numbers and K.
   * @param {string|null|undefined} rut
   * @returns {string} Cleaned RUT or empty string.
   */
  export const cleanRut = (rut) => {
      if (!rut) return '';
      return String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
  }