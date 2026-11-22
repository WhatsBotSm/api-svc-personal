import { HttpError } from './httpError.js'

const MENSAJES = {
  uq_persona_id_externo: 'Esa matrícula o clave ya tiene una cuenta',
  persona_correo_key: 'Ese correo ya está registrado',
  cat_user_usuario_key: 'Ese correo ya está registrado',
  cat_user_id_persona_key: 'Esa persona ya tiene una cuenta',
  personal_dual_id_persona_key: 'Esa persona ya tiene un perfil de personal',
}

// Convierte un error de duplicado de Postgres (23505) en un 409; deja pasar cualquier otro.
export const traducirErrorBd = (e) =>
  e?.code === '23505' ? new HttpError(409, MENSAJES[e.constraint] ?? 'Ya existe un registro con esos datos') : e