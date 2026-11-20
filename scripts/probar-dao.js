import { db, pool } from '../src/configuraciones/baseDatos.js'
import { PERFILES } from '../src/configuraciones/perfiles.js'
import * as persona from '../src/dao/persona.js'
import * as personalDual from '../src/dao/personalDual.js'
import * as catUser from '../src/dao/catUser.js'

try {
  await db.tx(async (t) => {
    const p = await persona.crear({ nombre: 'Prueba', apellido_paterno: 'Dao', correo: 'prueba@x.com', origen_datos: 'LOCAL' }, t)
    await personalDual.crear({ tipo: 'MENTOR_UE', id_persona: p.id_persona, id_empresa: null }, t)
    const u = await catUser.crear({
      id_persona: p.id_persona, usuario: 'prueba@x.com', password_hash: 'x', rol: 'MENTOR_UE',
      modulos: PERFILES.MENTOR_UE.modulos, permisos: PERFILES.MENTOR_UE.permisos,
    }, t)
    console.log('contexto:', await catUser.cargarContexto(u.id_cat_user, t))
    console.log('listar MENTOR_UE:', (await catUser.listar('MENTOR_UE', t)).length)
    console.log('mentores:', (await personalDual.listar({}, t)).length)
    throw new Error('ROLLBACK_INTENCIONAL')
  })
} catch (e) {
  if (e.message !== 'ROLLBACK_INTENCIONAL') throw e
  console.log('OK: todo funcionó y se revirtió')
} finally {
  await pool.end()
}