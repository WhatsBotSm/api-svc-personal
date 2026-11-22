import * as personaDao from '../dao/persona.js'
import * as personalDualDao from '../dao/personalDual.js'
import * as catUserDao from '../dao/catUser.js'
import { consultarPersona } from '../funciones/universidad/clienteUniversidad.js'
import { nombreCompleto, tipoPersona } from '../funciones/utilerias/nombre.js'
import { HttpError } from '../funciones/utilerias/httpError.js'
import { validarId } from '../funciones/validaciones/usuarios.js'
import { validarResolver, validarFiltroPersonal } from '../funciones/validaciones/personas.js'

const CONCURRENCIA = 10

// Procesa en grupos de 10 para no lanzar 200 consultas a la Universidad a la vez.
export async function mapLimitado(lista, fn) {
  const salida = []
  for (let i = 0; i < lista.length; i += CONCURRENCIA) {
    salida.push(...(await Promise.all(lista.slice(i, i + CONCURRENCIA).map(fn))))
  }
  return salida
}

// Las personas con origen 'API' se guardan sin nombre y se completan aquí en cada lectura.
export async function hidratarPersona(persona, tipo) {
  if (!persona || !tipo || persona.origen_datos !== 'API') return persona
  const datos = await consultarPersona(tipo, persona.id_externo)
  return {
    ...persona,
    nombre: datos?.nombre ?? persona.nombre ?? '(sin datos de la Universidad)',
    apellido_paterno: datos?.apellido_paterno ?? persona.apellido_paterno ?? '',
    apellido_materno: datos?.apellido_materno ?? persona.apellido_materno ?? '',
    telefono: persona.telefono ?? datos?.telefono ?? null,
  }
}

// Forma pública de una persona: la misma que producía personaDeFila en el boceto.
export async function armarPersona(fila, tipo) {
  const h = await hidratarPersona(fila, tipo)
  return {
    nombre: h.nombre,
    apellido_paterno: h.apellido_paterno,
    apellido_materno: h.apellido_materno,
    telefono: h.telefono,
    correo: h.correo,
    id_externo: h.id_externo,
    origen_datos: h.origen_datos,
    nombre_completo: nombreCompleto(h),
  }
}

// Para el middleware y el login. Devuelve null si la cuenta no existe.
export const cargarContexto = (idCatUser) => catUserDao.cargarContexto(idCatUser)

const resumenPersonalDual = (f) => ({
  id_personal_dual: f.id_personal_dual,
  tipo: f.tipo,
  id_empresa: f.id_empresa,
  id_persona: f.id_persona,
  activo: f.activo ?? false,
})

// POST /internal/personas/resolver
export async function resolverPersonas(body) {
  const { persona_ids, personal_dual_ids } = validarResolver(body)

  const pdFilas = personal_dual_ids.length ? await personalDualDao.buscarPorIds(personal_dual_ids) : []
  const idsPersona = [...new Set([...persona_ids, ...pdFilas.map((f) => f.id_persona)])]
  const filas = idsPersona.length ? await personaDao.buscarPorIds(idsPersona) : []

  // El rol de la cuenta decide si se consulta la Universidad (ALUMNO o MENTOR_ACADEMICO)
  const armadas = await mapLimitado(filas, async (f) => [f.id_persona, await armarPersona(f, tipoPersona(f.rol))])
  const porId = new Map(armadas)

  const personas = {}
  for (const id of persona_ids) if (porId.has(id)) personas[id] = porId.get(id)

  const personal_dual = {}
  for (const f of pdFilas) {
    personal_dual[f.id_personal_dual] = { ...resumenPersonalDual(f), persona: porId.get(f.id_persona) ?? null }
  }
  return { personas, personal_dual }
}

// GET /internal/personal-dual/:id
export async function obtenerPersonalDual(id) {
  const fila = await personalDualDao.buscarPorId(validarId(id, 'id_personal_dual'))
  if (!fila) throw new HttpError(404, 'Personal no encontrado')
  return resumenPersonalDual(fila)
}

// GET /internal/personal-dual?tipo=&id_empresa=  (solo ids, sin nombres)
export async function listarPersonalDual(filtros) {
  const filas = await personalDualDao.listar(validarFiltroPersonal(filtros))
  return filas.map(resumenPersonalDual)
}

// GET /enlace/mentores (misma salida que el boceto)
export async function listarMentores(filtros) {
  const filas = await personalDualDao.listar(validarFiltroPersonal(filtros))
  return mapLimitado(filas, async (f) => ({
    id_personal_dual: f.id_personal_dual,
    tipo: f.tipo,
    id_empresa: f.id_empresa,
    nombre_completo: (await armarPersona(f, tipoPersona(f.tipo))).nombre_completo,
  }))
}