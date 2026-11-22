import { db, pool } from '../src/configuraciones/baseDatos.js'
import * as auth from '../src/servicios/auth.js'
import { cargarContexto } from '../src/servicios/personas.js'
import { verificarToken } from '../src/funciones/seguridad/tokens.js'

const correo = 'tmp-registro@x.com'
const falla = (p) => p.then(() => 'NO FALLÓ').catch((e) => `${e.status} ${e.message}`)
try {
  const r = await auth.registrar({ correo, password: 'Clave12345', matricula: '20231002', telefono: '7770000000' })
  console.log('registro:', r.usuario)
  console.log('claims:', verificarToken(r.token))

  const l = await auth.login({ usuario: correo.toUpperCase(), password: 'Clave12345' })
  console.log('login ok:', l.usuario.nombre)
  console.log('login contraseña mala:', await falla(auth.login({ usuario: correo, password: 'otra' })))
  console.log('login usuario inexistente:', await falla(auth.login({ usuario: 'nadie@x.com', password: 'otra' })))
  console.log('matrícula repetida:', await falla(auth.registrar({ correo: 'otro@x.com', password: 'Clave12345', matricula: '20231002' })))
  console.log('correo repetido:', await falla(auth.registrar({ correo, password: 'Clave12345', matricula: '20231003' })))
  console.log('matrícula desconocida sin nombre:', await falla(auth.registrar({ correo: 'z@x.com', password: 'Clave12345', matricula: '99999999' })))

  const ctx = await cargarContexto(l.usuario.id_cat_user)
  console.log('refresh:', Object.keys(await auth.refrescar(ctx)))
  await auth.cambiarPassword(ctx, { actual: 'Clave12345', nueva: 'NuevaClave123' })
  console.log('login con la nueva:', (await auth.login({ usuario: correo, password: 'NuevaClave123' })).token ? 'ok' : 'falló')
} finally {
  const correos = [correo, 'otro@x.com', 'z@x.com']
  await db.query('DELETE FROM cat_user WHERE id_persona IN (SELECT id_persona FROM persona WHERE correo = ANY($1))', [correos])
  await db.query('DELETE FROM persona WHERE correo = ANY($1)', [correos])
  await pool.end()
}