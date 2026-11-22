import { HttpError } from '../utilerias/httpError.js'
import { validarId } from './usuarios.js'

const MAX_IDS = 200
const TIPOS_MENTOR = ['MENTOR_UE', 'MENTOR_ACADEMICO']

function validarLote(valor, nombre) {
  if (valor == null) return []
  if (!Array.isArray(valor) || valor.length > MAX_IDS) {
    throw new HttpError(400, `${nombre} debe ser una lista de máximo ${MAX_IDS} ids`)
  }
  return [...new Set(valor.map((v) => validarId(v, nombre)))]
}

// POST /internal/personas/resolver
export const validarResolver = (b = {}) => ({
  persona_ids: validarLote(b.persona_ids, 'persona_ids'),
  personal_dual_ids: validarLote(b.personal_dual_ids, 'personal_dual_ids'),
})

// GET /mentores y GET /internal/personal-dual
export function validarFiltroPersonal(q = {}) {
  const tipo = q.tipo ? String(q.tipo) : null
  if (tipo && !TIPOS_MENTOR.includes(tipo)) throw new HttpError(400, 'Tipo inválido')
  const id_empresa = q.id_empresa ? validarId(q.id_empresa, 'id_empresa') : null
  return { tipo, id_empresa }
}