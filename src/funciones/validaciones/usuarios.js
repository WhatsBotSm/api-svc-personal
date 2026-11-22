import { HttpError } from '../utilerias/httpError.js'
import { PERFILES } from '../../configuraciones/perfiles.js'
import { tipoPersona } from '../utilerias/nombre.js'

const REGEX_CORREO = /^\S+@\S+\.\S+$/
const MIN_PASSWORD = 8
const MAX_PASSWORD_BYTES = 72 // bcrypt solo usa los primeros 72 bytes

const texto = (v) => (typeof v === 'string' ? v.trim() : '')
const opcional = (v) => texto(v) || null

export const normalizarCorreo = (v) => texto(v).toLowerCase()

export function validarCorreo(correo) {
  if (!REGEX_CORREO.test(correo) || correo.length > 150) throw new HttpError(400, 'Correo inválido')
  return correo
}

export function validarPassword(password, mensaje = 'La contraseña debe tener al menos 8 caracteres') {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) throw new HttpError(400, mensaje)
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    throw new HttpError(400, 'La contraseña es demasiado larga (máximo 72 caracteres)')
  }
  return password
}

export function validarId(valor, nombre = 'id') {
  const n = typeof valor === 'string' && /^\d+$/.test(valor) ? Number(valor) : valor
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(400, `${nombre} inválido`)
  return n
}

const validarLargos = (campos) => {
  for (const [nombre, valor, max] of campos) {
    if (valor && valor.length > max) throw new HttpError(400, `${nombre} es demasiado largo`)
  }
}

// Nombre capturado a mano (cuando la Universidad no devolvió datos o el rol no viene de ella).
export function validarNombreLocal(b, mensaje = 'Nombre y apellido paterno son obligatorios') {
  const nombre = texto(b.nombre)
  const apellido_paterno = texto(b.apellido_paterno)
  const apellido_materno = opcional(b.apellido_materno)
  if (!nombre || !apellido_paterno) throw new HttpError(422, mensaje)
  validarLargos([['El nombre', nombre, 100], ['El apellido paterno', apellido_paterno, 100], ['El apellido materno', apellido_materno, 100]])
  return { nombre, apellido_paterno, apellido_materno }
}

// POST /auth/registro (alumno). Ya no pide programa ni cuatrimestre: eso es del perfil en academy.
export function validarRegistro(b = {}) {
  const correo = normalizarCorreo(b.correo)
  const matricula = texto(b.matricula)
  if (!correo || !matricula) throw new HttpError(400, 'Faltan datos obligatorios')
  validarCorreo(correo)
  validarPassword(b.password)
  const telefono = opcional(b.telefono)
  validarLargos([['La matrícula', matricula, 100], ['El teléfono', telefono, 30]])
  return { correo, matricula, password: b.password, telefono }
}

// POST /enlace/usuarios. El nombre se valida aparte (validarNombreLocal) solo si la API no responde.
export function validarAltaUsuario(b = {}) {
  const rol = b.rol
  if (typeof rol !== 'string' || !Object.hasOwn(PERFILES, rol)) throw new HttpError(400, 'Rol inválido')

  const correo = normalizarCorreo(b.correo)
  if (!correo || typeof b.password !== 'string' || b.password.length < MIN_PASSWORD) {
    throw new HttpError(400, 'Correo y contraseña inicial (mínimo 8 caracteres) son obligatorios')
  }
  validarCorreo(correo)
  validarPassword(b.password)

  const apiTipo = tipoPersona(rol) // ALUMNO o MENTOR_ACADEMICO: se consultan en la Universidad
  const idExterno = opcional(rol === 'ALUMNO' ? b.matricula : b.id_externo)
  if (apiTipo && !idExterno) {
    throw new HttpError(400, rol === 'ALUMNO' ? 'La matrícula es obligatoria' : 'La clave de empleado es obligatoria')
  }

  let id_empresa = null
  if (rol === 'MENTOR_UE') {
    if (!b.id_empresa) throw new HttpError(400, 'La unidad económica es obligatoria para el Mentor de UE')
    id_empresa = validarId(b.id_empresa, 'La unidad económica')
  }

  const telefono = opcional(b.telefono)
  const puesto = opcional(b.puesto)
  const grado_academico = opcional(b.grado_academico)
  validarLargos([['El id externo', idExterno, 100], ['El teléfono', telefono, 30], ['El puesto', puesto, 150], ['El grado académico', grado_academico, 100]])

  return { rol, correo, password: b.password, apiTipo, idExterno, telefono, puesto, grado_academico, id_empresa }
}

// PUT /enlace/usuarios/:id
export function validarActualizacionUsuario(id, b = {}) {
  const { activo, password } = b
  if (activo != null && typeof activo !== 'boolean') throw new HttpError(400, 'El campo activo debe ser verdadero o falso')
  if (password != null) validarPassword(password)
  return { id: validarId(id, 'Cuenta'), activo: activo ?? null, password: password ?? null }
}

// PUT /auth/me. `actual` es req.user. Solo las personas de origen LOCAL pueden cambiar su nombre.
export function validarMiPerfil(b = {}, actual) {
  const correo = b.correo ? normalizarCorreo(b.correo) : actual.correo
  validarCorreo(correo)
  const telefono = b.telefono !== undefined ? opcional(b.telefono) : actual.telefono
  validarLargos([['El teléfono', telefono, 30]])

  let nombre = null
  if (actual.origen_datos === 'LOCAL' && b.nombre) {
    nombre = validarNombreLocal({
      nombre: b.nombre,
      apellido_paterno: b.apellido_paterno ?? actual.apellido_paterno,
      apellido_materno: b.apellido_materno,
    })
  }
  return { correo, telefono, nombre }
}

// PUT /auth/me/password
export function validarCambioPassword(b = {}) {
  validarPassword(b.nueva, 'La nueva contraseña debe tener al menos 8 caracteres')
  return { actual: typeof b.actual === 'string' ? b.actual : '', nueva: b.nueva }
}

export function validarFiltroUsuarios(q = {}) {
  const rol = q.rol ? String(q.rol) : null
  if (rol && !Object.hasOwn(PERFILES, rol)) throw new HttpError(400, 'Rol inválido')
  return { rol }
}