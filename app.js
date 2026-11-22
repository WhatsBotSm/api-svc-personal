import { randomUUID } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './src/configuraciones/env.js'
import { pool } from './src/configuraciones/baseDatos.js'
import routes from './src/rutas/index.js'
import middlewares from './src/middlewares/index.js'

const baseApi = env.BASE_API

const app = express()
app.set('trust proxy', 1) // un salto: el gateway. Con `true` se puede falsear la IP con X-Forwarded-For
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN }))
app.use(express.json({ limit: '100kb' }))

// Id de seguimiento: se reutiliza el que mande otro servicio o se genera uno (32 hex)
app.use((req, res, next) => {
  const entrante = String(req.headers.idtrackingreq ?? '').replace(/[^\w-]/g, '').slice(0, 64)
  const id = entrante || randomUUID().replace(/-/g, '')
  res.locals.idTrackingReq = id
  res.setHeader('idTrackingReq', id)
  next()
})

// Credenciales y datos personales fuera del log de peticiones
const SENSIBLES = new Set([
  'authorization', 'cookie', 'x-internal-token',
  'password', 'actual', 'nueva', 'token',
  'nombre', 'apellido_paterno', 'apellido_materno', 'telefono', 'correo', 'usuario', 'matricula', 'id_externo',
])
const redact = (valor, nivel = 0) => {
  if (!valor || typeof valor !== 'object' || nivel > 4) return valor
  if (Array.isArray(valor)) return valor.map((v) => redact(v, nivel + 1))
  return Object.fromEntries(
    Object.entries(valor).map(([k, v]) => [k, SENSIBLES.has(k.toLowerCase()) ? '[REDACTED]' : redact(v, nivel + 1)]),
  )
}
morgan.token('id', (_req, res) => res.locals.idTrackingReq)
morgan.token('headers', (req) => JSON.stringify(redact(req.headers)))
morgan.token('body', (req) => JSON.stringify(redact(req.body)))

// Las sondas del healthcheck (wget a /health y a BASE_API) no se registran
const esSonda = (req) =>
  req.path === '/health' ||
  (req.method === 'GET' && [baseApi, `${baseApi}/`].includes(req.originalUrl) && /^wget/i.test(req.headers['user-agent'] ?? ''))
app.use(morgan(':id :status ":method :url" :headers :body', { skip: esSonda }))

app.get('/health', (_req, res) =>
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() }))

app.use(baseApi, middlewares.limitadorGeneral, routes)
app.use(baseApi, middlewares.noEncontrado)
app.use(middlewares.manejadorErrores)

const server = app
  .listen(env.PORT, () => {
    console.log(`Servicio listo en el puerto: ${env.PORT}${baseApi}`)
    console.log(`Entorno: ${env.NODE_ENV}`)
  })
  .on('error', (err) => {
    console.error('Error al iniciar servidor:', err)
    throw err
  })

server.keepAliveTimeout = 60000
server.headersTimeout = 65000

const cerrar = () => {
  console.log('Cerrando servidor...')
  server.close(async () => {
    await pool.end()
    console.log('Servidor cerrado')
    process.exit(0)
  })
}
process.on('SIGTERM', cerrar)
process.on('SIGINT', cerrar)

export default app