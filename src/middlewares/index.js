import { verificaToken } from './verificaToken.js'
import { verificaInternalToken } from './verificaInternalToken.js'
import { requierePermiso, requiereRol } from './permisos.js'
import { limitadorGeneral, limitadorAcceso } from './limitadores.js'
import { noEncontrado, manejadorErrores } from './errores.js'

export default {
  verificaToken, verificaInternalToken, requierePermiso, requiereRol,
  limitadorGeneral, limitadorAcceso, noEncontrado, manejadorErrores,
}