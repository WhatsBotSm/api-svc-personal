import 'dotenv/config'

const obligatorias = [
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'INTERNAL_TOKEN', 'JWT_PRIVATE_KEY_PATH', 'JWT_PUBLIC_KEY_PATH',
]
const faltantes = obligatorias.filter((k) => !process.env[k])
if (faltantes.length) {
  throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}`)
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4001),
  BASE_API: process.env.BASE_API ?? '/api',
  NUM_REQ_MAX_API: Number(process.env.NUM_REQ_MAX_API ?? 100),
  DB: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  JWT_PRIVATE_KEY_PATH: process.env.JWT_PRIVATE_KEY_PATH,
  JWT_PUBLIC_KEY_PATH: process.env.JWT_PUBLIC_KEY_PATH,
  JWT_EXPIRES: process.env.JWT_EXPIRES ?? '1h',
  INTERNAL_TOKEN: process.env.INTERNAL_TOKEN,
  NUM_REQ_MAX_ACCESO: Number(process.env.NUM_REQ_MAX_ACCESO ?? 20),
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') ?? true,
  USE_DEMO_UNIVERSIDAD: process.env.USE_DEMO_UNIVERSIDAD === 'true',
  API_URL_UNIVERSIDAD: process.env.API_URL_UNIVERSIDAD,
  API_KEY_UNIVERSIDAD: process.env.API_KEY_UNIVERSIDAD,
}