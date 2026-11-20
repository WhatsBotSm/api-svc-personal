export const nombreCompleto = (p) =>
  p ? [p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ') : ''

// Qué personas se consultan en la API de la Universidad según su rol
export const tipoPersona = (rol) => (rol === 'ALUMNO' || rol === 'MENTOR_ACADEMICO' ? rol : null)