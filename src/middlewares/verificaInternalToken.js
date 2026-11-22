import crypto from 'node:crypto'
import { env } from '../configuraciones/env.js'
import { HttpError } from '../funciones/utilerias/httpError.js'

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest()
const ESPERADO = sha(env.INTERNAL_TOKEN)

// Solo para llamadas entre servicios (/internal). Nunca acepta el JWT de un usuario.
export const verificaInternalToken = (req, _res, next) => {
  if (!crypto.timingSafeEqual(sha(req.headers['x-internal-token'] ?? ''), ESPERADO)) {
    throw new HttpError(401, 'Servicio no autorizado')
  }
  next()
}