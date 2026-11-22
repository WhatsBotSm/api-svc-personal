import { db } from '../configuraciones/baseDatos.js'

const COLUMNAS = `pd.id_personal_dual, pd.tipo, pd.puesto, pd.grado_academico, pd.id_persona, pd.id_empresa,
                  p.nombre, p.apellido_paterno, p.apellido_materno, p.telefono, p.correo,
                  p.id_externo, p.origen_datos, cu.activo`

const DESDE = `FROM personal_dual pd
                 JOIN persona p ON p.id_persona = pd.id_persona
                 LEFT JOIN cat_user cu ON cu.id_persona = pd.id_persona`

// Origen: INSERT de POST /usuarios (rama que no es ALUMNO)
export const crear = (d, x = db) =>
  x.one(
    `INSERT INTO personal_dual (puesto, grado_academico, tipo, id_persona, id_empresa)
     VALUES ($1,$2,$3,$4,$5) RETURNING id_personal_dual`,
    [d.puesto ?? null, d.grado_academico ?? null, d.tipo, d.id_persona, d.id_empresa ?? null],
  )

export const buscarPorId = (id, x = db) =>
  x.one(
    `SELECT ${COLUMNAS} ${DESDE}
      WHERE pd.id_personal_dual = $1`,
    [id],
  )

export const buscarPorIds = (ids, x = db) =>
  x.all(
    `SELECT ${COLUMNAS} ${DESDE}
      WHERE pd.id_personal_dual = ANY($1::int[])`,
    [ids],
  )

// Origen: GET /mentores (solo MENTOR_UE y MENTOR_ACADEMICO)
export const listar = ({ tipo, id_empresa } = {}, x = db) => {
  const params = []
  const where = [`pd.tipo IN ('MENTOR_UE','MENTOR_ACADEMICO')`]
  if (tipo) { params.push(tipo); where.push(`pd.tipo = $${params.length}`) }
  if (id_empresa) { params.push(id_empresa); where.push(`pd.id_empresa = $${params.length}`) }
  return x.all(
    `SELECT ${COLUMNAS} ${DESDE} WHERE ${where.join(' AND ')} ORDER BY pd.id_personal_dual`,
    params,
  )
}