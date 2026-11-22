import { verificarToken as verificarJwt } from '../funciones/seguridad/tokens.js'
import { HttpError } from '../funciones/utilerias/httpError.js'
import { asyncH } from '../funciones/utilerias/asynch.js'
import { cargarContexto } from '../servicios/personas.js'

export const verificaToken = asyncH(async (req, _res, next) => {
  const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1]
  if (!token) throw new HttpError(401, 'Sesión requerida')

  let payload
  try {
    payload = verificarJwt(token)
  } catch {
    throw new HttpError(401, 'Sesión inválida o expirada')
  }

  const id = Number(payload.sub)
  const ctx = Number.isSafeInteger(id) ? await cargarContexto(id) : null
  if (!ctx || !ctx.activo) throw new HttpError(401, 'Cuenta inactiva o inexistente')

  req.user = ctx // rol y permisos vigentes, leídos de la BD en esta petición
  next()
})