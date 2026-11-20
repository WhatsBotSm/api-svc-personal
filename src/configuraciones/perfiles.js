// CONTRATO DE PERMISOS: personal los define y los pone en el JWT; academy y docs los exigen
// por nombre. Renombrar o quitar un permiso aquí rompe a los otros servicios.

// Módulos de navegación y permisos por rol. Se copian a cat_user (cat_modulos / cat_permisos) al
// crear la cuenta; el middleware lee los vigentes de la base de datos en cada petición.
export const PERFILES = {
  ALUMNO: {
    modulos: ['dashboard', 'catalogo', 'estadia', 'formatos', 'perfil'],
    permisos: [
      'solicitudes:crear', 'solicitudes:ver_propias', 'estadia:ver_propia', 'formatos:ver_propios',
      'formatos:editar_propios', 'formatos:enviar', 'actividades:gestionar_propias', 'puestos:gestionar_propios',
      'perfil:editar',
    ],
  },
  MENTOR_UE: {
    modulos: ['alumnos', 'perfil'],
    permisos: [
      'alumnos:ver_asignados_ue', 'evaluacion:calificar', 'formatos:ver_asignados', 'catalogo_competencias:ver', 'perfil:editar',
    ],
  },
  MENTOR_ACADEMICO: {
    modulos: ['alumnos', 'perfil'],
    permisos: ['alumnos:ver_supervisados', 'formatos:ver_asignados', 'historial:ver', 'perfil:editar'],
  },
  ENLACE_DUAL: {
    modulos: [
      'dashboard', 'empresas', 'programas', 'competencias', 'planeacion', 'personas', 'solicitudes', 'asignaciones',
      'revision', 'perfil',
    ],
    permisos: [
      'catalogos:administrar', 'personas:administrar', 'solicitudes:gestionar', 'asignaciones:gestionar',
      'formatos:revisar', 'formatos:ver_todos', 'dashboard:ver', 'perfil:editar',
    ],
  },
}