import bcrypt from 'bcryptjs'
import { db } from '../configuraciones/baseDatos.js'
import { PERFILES } from '../configuraciones/perfiles.js'
import * as personaDao from '../dao/persona.js'
import * as personalDualDao from '../dao/personalDual.js'
import * as catUserDao from '../dao/catUser.js'
import { consultarPersona } from '../funciones/universidad/clienteUniversidad.js'
import { HttpError } from '../funciones/utilerias/httpError.js'
import { tipoPersona } from '../funciones/utilerias/nombre.js'
import { traducirErrorBd } from '../funciones/utilerias/errorBd.js'
import {
  validarAltaUsuario, validarActualizacionUsuario, validarFiltroUsuarios, validarNombreLocal,
} from '../funciones/validaciones/usuarios.js'
import { armarPersona, mapLimitado } from './personas.js'

const COSTO_BCRYPT = 10

// GET /enlace/usuarios?rol=
export async function listarUsuarios(query) {
  const { rol } = validarFiltroUsuarios(query)
  const filas = await catUserDao.listar(rol)
  return mapLimitado(filas, async (f) => {
    const p = await armarPersona(f, tipoPersona(f.rol))
    return {
      ...f,
      nombre: p.nombre,
      apellido_paterno: p.apellido_paterno,
      apellido_materno: p.apellido_materno,
      nombre_completo: p.nombre_completo,
    }
  })
}

// POST /enlace/usuarios. Devuelve { id_cat_user, id_persona }.
export async function crearUsuario(b = {}) {
  const d = validarAltaUsuario(b)

  // ALUMNO y MENTOR_ACADEMICO se buscan en la Universidad; el resto se captura a mano.
  const deApi = d.apiTipo ? await consultarPersona(d.apiTipo, d.idExterno) : null
  const nombre = deApi
    ? null
    : validarNombreLocal(
        b,
        d.apiTipo
          ? 'La Universidad no devolvió datos de esa persona: captura nombre y apellidos'
          : 'Nombre y apellido paterno son obligatorios',
      )

  const hash = await bcrypt.hash(d.password, COSTO_BCRYPT)
  try {
    return await db.tx(async (t) => {
      const p = await personaDao.crear({
        ...nombre, telefono: d.telefono, correo: d.correo,
        id_externo: d.idExterno, origen_datos: deApi ? 'API' : 'LOCAL',
      }, t)
      if (d.rol !== 'ALUMNO') {
        await personalDualDao.crear({
          puesto: d.puesto, grado_academico: d.grado_academico, tipo: d.rol,
          id_persona: p.id_persona, id_empresa: d.id_empresa,
        }, t)
      }
      const u = await catUserDao.crear({
        id_persona: p.id_persona, usuario: d.correo, password_hash: hash, rol: d.rol,
        modulos: PERFILES[d.rol].modulos, permisos: PERFILES[d.rol].permisos,
      }, t)
      return { id_cat_user: u.id_cat_user, id_persona: p.id_persona }
    })
  } catch (e) {
    throw traducirErrorBd(e)
  }
}

// PUT /enlace/usuarios/:id. `actor` es req.user (quien hace el cambio).
export async function actualizarUsuario(id, b = {}, actor) {
  const d = validarActualizacionUsuario(id, b)
  if (d.activo === false && d.id === actor.id_cat_user) {
    throw new HttpError(400, 'No puedes desactivar tu propia cuenta')
  }
  const hash = d.password ? await bcrypt.hash(d.password, COSTO_BCRYPT) : null
  const fila = await catUserDao.actualizar(d.id, { activo: d.activo, hash })
  if (!fila) throw new HttpError(404, 'Cuenta no encontrada')
  return fila
}