import bcrypt from 'bcryptjs'
import { db } from '../configuraciones/baseDatos.js'
import { PERFILES } from '../configuraciones/perfiles.js'
import * as personaDao from '../dao/persona.js'
import * as catUserDao from '../dao/catUser.js'
import { firmarToken } from '../funciones/seguridad/tokens.js'
import { consultarPersona } from '../funciones/universidad/clienteUniversidad.js'
import { HttpError } from '../funciones/utilerias/httpError.js'
import { tipoPersona } from '../funciones/utilerias/nombre.js'
import { traducirErrorBd } from '../funciones/utilerias/errorBd.js'
import {
  validarRegistro, validarNombreLocal, validarMiPerfil, validarCambioPassword,
} from '../funciones/validaciones/usuarios.js'
import { armarPersona, cargarContexto } from './personas.js'

const COSTO_BCRYPT = 10
const HASH_FALSO = bcrypt.hashSync('contraseña-inexistente', COSTO_BCRYPT)

// Forma que recibe el frontend en login, registro, /me y refresh.
export async function serializarUsuario(ctx) {
  const p = await armarPersona(ctx, tipoPersona(ctx.rol))
  return {
    id_cat_user: ctx.id_cat_user,
    id_persona: ctx.id_persona,
    rol: ctx.rol,
    modulos: ctx.modulos,
    permisos: ctx.permisos,
    nombre: p.nombre_completo,
    nombre_pila: p.nombre,
    apellido_paterno: p.apellido_paterno,
    apellido_materno: p.apellido_materno,
    correo: ctx.correo,
    telefono: ctx.telefono,
    id_externo: ctx.id_externo,
    datos_de_universidad: ctx.origen_datos === 'API',
    id_personal_dual: ctx.id_personal_dual ?? null,
  }
}

const sesion = async (ctx) => ({ token: firmarToken(ctx), usuario: await serializarUsuario(ctx) })

// POST /auth/login
export async function login(b = {}) {
  const usuario = typeof b.usuario === 'string' ? b.usuario.trim() : ''
  if (!usuario || typeof b.password !== 'string' || !b.password) {
    throw new HttpError(400, 'Usuario y contraseña requeridos')
  }
  const u = await catUserDao.buscarCredenciales(usuario)
  const coincide = await bcrypt.compare(b.password, u?.password_hash ?? HASH_FALSO)
  if (!u || !u.activo || !coincide) throw new HttpError(401, 'Usuario o contraseña incorrectos')

  await catUserDao.registrarAcceso(u.id_cat_user)
  return sesion(await cargarContexto(u.id_cat_user))
}

// POST /auth/registro (solo alumnos; el perfil académico se completa en academy)
export async function registrar(b = {}) {
  const d = validarRegistro(b)

  // El nombre lo entrega la Universidad; si no la conoce, se captura a mano.
  const deApi = await consultarPersona('ALUMNO', d.matricula)
  const nombre = deApi
    ? null
    : validarNombreLocal(b, 'No se encontró la matrícula en la Universidad: captura tu nombre y apellidos')

  const hash = await bcrypt.hash(d.password, COSTO_BCRYPT)
  try {
    const idCatUser = await db.tx(async (t) => {
      const p = await personaDao.crear({
        ...nombre, telefono: d.telefono, correo: d.correo,
        id_externo: d.matricula, origen_datos: deApi ? 'API' : 'LOCAL',
      }, t)
      const u = await catUserDao.crear({
        id_persona: p.id_persona, usuario: d.correo, password_hash: hash, rol: 'ALUMNO',
        modulos: PERFILES.ALUMNO.modulos, permisos: PERFILES.ALUMNO.permisos,
      }, t)
      return u.id_cat_user
    })
    return sesion(await cargarContexto(idCatUser))
  } catch (e) {
    throw traducirErrorBd(e)
  }
}

// PUT /auth/me. `ctx` es req.user.
export async function actualizarMe(ctx, b = {}) {
  const { correo, telefono, nombre } = validarMiPerfil(b, ctx)
  try {
    await db.tx(async (t) => {
      await personaDao.actualizarContacto(ctx.id_persona, { telefono, correo }, t)
      await catUserDao.cambiarUsuario(ctx.id_cat_user, correo, t) // el usuario de acceso es el correo
      if (nombre) await personaDao.actualizarNombre(ctx.id_persona, nombre, t)
    })
  } catch (e) {
    throw traducirErrorBd(e)
  }
  return serializarUsuario(await cargarContexto(ctx.id_cat_user))
}

// PUT /auth/me/password
export async function cambiarPassword(ctx, b = {}) {
  const { actual, nueva } = validarCambioPassword(b)
  const fila = await catUserDao.obtenerHash(ctx.id_cat_user)
  if (!(await bcrypt.compare(actual, fila.password_hash))) {
    throw new HttpError(400, 'La contraseña actual no coincide')
  }
  await catUserDao.cambiarHash(ctx.id_cat_user, await bcrypt.hash(nueva, COSTO_BCRYPT))
  return { ok: true }
}

// POST /auth/refresh. El middleware ya verificó el token y que la cuenta siga activa,
// y req.user se cargó de la BD en esta misma petición, así que los permisos son los vigentes.
export const refrescar = (ctx) => sesion(ctx)