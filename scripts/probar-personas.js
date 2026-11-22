import { db, pool } from '../src/configuraciones/baseDatos.js'
import { PERFILES } from '../src/configuraciones/perfiles.js'
import * as persona from '../src/dao/persona.js'
import * as personalDual from '../src/dao/personalDual.js'
import * as catUser from '../src/dao/catUser.js'
import * as personas from '../src/servicios/personas.js'

const creadas = []
try {
  // Alumno cuyo nombre viene de la Universidad (se guarda sin nombre)
  const a = await persona.crear({ correo: 'tmp-alumno@x.com', id_externo: '20231001', origen_datos: 'API' })
  creadas.push(a.id_persona)
  await catUser.crear({ id_persona: a.id_persona, usuario: 'tmp-alumno@x.com', password_hash: 'x', rol: 'ALUMNO',
    modulos: PERFILES.ALUMNO.modulos, permisos: PERFILES.ALUMNO.permisos })

  // Mentor UE con nombre local y empresa 7 (sin FK)
  const m = await persona.crear({ nombre: 'Mario', apellido_paterno: 'Prueba', correo: 'tmp-mentor@x.com', origen_datos: 'LOCAL' })
  creadas.push(m.id_persona)
  const pd = await personalDual.crear({ tipo: 'MENTOR_UE', id_persona: m.id_persona, id_empresa: 7 })
  await catUser.crear({ id_persona: m.id_persona, usuario: 'tmp-mentor@x.com', password_hash: 'x', rol: 'MENTOR_UE',
    modulos: PERFILES.MENTOR_UE.modulos, permisos: PERFILES.MENTOR_UE.permisos })

  console.log(JSON.stringify(await personas.resolverPersonas({
    persona_ids: [a.id_persona], personal_dual_ids: [pd.id_personal_dual, 99999],
  }), null, 2))
  console.log('obtener:', await personas.obtenerPersonalDual(pd.id_personal_dual))
  console.log('mentores:', await personas.listarMentores({ tipo: 'MENTOR_UE', id_empresa: 7 }))
  console.log('lote inválido:', await personas.resolverPersonas({ persona_ids: ['x'] }).catch((e) => `${e.status} ${e.message}`))
} finally {
  await db.query('DELETE FROM cat_user WHERE id_persona = ANY($1::int[])', [creadas])
  await db.query('DELETE FROM personal_dual WHERE id_persona = ANY($1::int[])', [creadas])
  await db.query('DELETE FROM persona WHERE id_persona = ANY($1::int[])', [creadas])
  await pool.end()
}