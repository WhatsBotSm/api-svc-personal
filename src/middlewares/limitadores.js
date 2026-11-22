import { rateLimit } from 'express-rate-limit'
import { env } from '../configuraciones/env.js'

const base = env.BASE_API

// Quedan fuera: llamadas entre servicios y la sonda de healthcheck (GET a BASE_API).
const exenta = (req) => {
  const url = req.originalUrl
  return url === base || url === `${base}/` || url.startsWith(`${base}/internal`)
}

// Tope general por IP y por minuto
export const limitadorGeneral = rateLimit({
  windowMs: 60 * 1000,
  limit: env.NUM_REQ_MAX_API,
  message: { error: `Puede hacer solo ${env.NUM_REQ_MAX_API} peticiones por minuto` },
  skip: exenta,
  standardHeaders: true,
  legacyHeaders: false,
})

// Login y registro: cuenta SOLO los intentos fallidos (frena la fuerza bruta)
export const limitadorAcceso = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NUM_REQ_MAX_ACCESO,
  message: { error: 'Demasiados intentos fallidos, intenta de nuevo en unos minutos' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
})