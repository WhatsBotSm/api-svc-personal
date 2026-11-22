import { pool } from '../src/configuraciones/baseDatos.js'
import { crearUsuario } from '../src/servicios/usuarios.js'

console.log(await crearUsuario({
  rol: 'ENLACE_DUAL', correo: 'enlace@uttec.test', password: 'Enlace12345',
  nombre: 'Elena', apellido_paterno: 'Enlace', puesto: 'Enlace dual',
}))
await pool.end()