import fs from 'node:fs'
import { env } from './env.js'

export const llavePrivada = fs.readFileSync(env.JWT_PRIVATE_KEY_PATH)
export const llavePublica = fs.readFileSync(env.JWT_PUBLIC_KEY_PATH)
export const algoritmo = 'RS256'
export const opcionesJwt = { issuer: 'api-svc-personal', audience: 'uttec-dual' }