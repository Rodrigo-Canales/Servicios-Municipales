//frontend/src/utils/stringUtils.js
export function normalizeToCamelCase(name) {
    if (!name) return 'default';

    // 1. Quitar tildes y caracteres especiales (similar a kebab-case)
    let normalized = name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9\s]/g, '') // Quitar no alfanuméricos excepto espacios
        .trim();

    // 2. Convertir a CamelCase
    const words = normalized.split(/\s+/); // Dividir por espacios
    if (words.length === 0) return 'default';

    // La primera palabra queda en minúscula, las siguientes capitalizadas
    return words.map((word, index) => {
        if (index === 0) {
            return word; // Primera palabra en minúscula
        }
        // Capitalizar la primera letra del resto de palabras
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(''); // Unir sin espacios
}