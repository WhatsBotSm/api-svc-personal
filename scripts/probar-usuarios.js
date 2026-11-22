import { db, pool } from '../src/configuraciones/baseDatos.js'
import * as usuarios from '../src/servicios/usuarios.js'

const falla = (p) => p.then(() => 'NO FALLÓ').catch((e) => `${e.status} ${e.message}`)
const actor = { id_cat_user: -1 }
const correos = ['tmp-a@x.com', 'tmp-m@x.com', 'tmp-ma@x.com', 'tmp-e@x.com', 'tmp-m2@x.com']
const base = { password: 'Clave12345' }
try {
  const alu = await usuarios.crearUsuario({ ...base, rol: 'ALUMNO', correo: correos[0], matricula: '20231003' })
  const men = await usuarios.crearUsuario({ ...base, rol: 'MENTOR_UE', correo: correos[1], nombre: 'Mario', apellido_paterno: 'Prueba', id_empresa: '7' })
  const aca = await usuarios.crearUsuario({ ...base, rol: 'MENTOR_ACADEMICO', correo: correos[2], id_externo: 'EMP-0001' })
  console.log('creados:', { alu, men, aca })

  console.log('MENTOR_UE sin empresa:', await falla(usuarios.crearUsuario({ ...base, rol: 'MENTOR_UE', correo: correos[4], nombre: 'X', apellido_paterno: 'Y' })))
  console.log('ENLACE sin nombre:', await falla(usuarios.crearUsuario({ ...base, rol: 'ENLACE_DUAL', correo: correos[3] })))
  console.log('rol inválido:', await falla(usuarios.crearUsuario({ ...base, rol: 'constructor', correo: correos[3] })))
  console.log('correo duplicado:', await falla(usuarios.crearUsuario({ ...base, rol: 'ALUMNO', correo: correos[0], matricula: '20231004' })))

  console.log('alumnos:', (await usuarios.listarUsuarios({ rol: 'ALUMNO' })).map((u) => `${u.nombre_completo} (${u.rol})`))
  console.log('todos:', (await usuarios.listarUsuarios({})).length)
  console.log('desactivar:', await usuarios.actualizarUsuario(alu.id_cat_user, { activo: false }, actor))
  console.log('desactivarme:', await falla(usuarios.actualizarUsuario(men.id_cat_user, { activo: false }, { id_cat_user: men.id_cat_user })))
  console.log('no existe:', await falla(usuarios.actualizarUsuario(999999, { activo: true }, actor)))
} finally {
  const ids = '(SELECT id_persona FROM persona WHERE correo = ANY($1))'
  await db.query(`DELETE FROM cat_user WHERE id_persona IN ${ids}`, [correos])
  await db.query(`DELETE FROM personal_dual WHERE id_persona IN ${ids}`, [correos])
  await db.query('DELETE FROM persona WHERE correo = ANY($1)', [correos])
  await pool.end()
}