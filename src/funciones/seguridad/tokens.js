import jwt from 'jsonwebtoken'
import { env } from '../../configuraciones/env.js'
import { llavePrivada, llavePublica, algoritmo, opcionesJwt } from '../../configuraciones/jwt.js'

// ctx es el resultado de catUser.cargarContexto (se construye en el Paso 2).
export const firmarToken = (ctx) =>
  jwt.sign(
    {
      id_persona: ctx.id_persona,
      rol: ctx.rol,
      permisos: ctx.permisos,
      id_personal_dual: ctx.id_personal_dual ?? null,
      id_empresa: ctx.id_empresa_mentor ?? null,
    },
    llavePrivada,
    { algorithm: algoritmo, expiresIn: env.JWT_EXPIRES, subject: String(ctx.id_cat_user), ...opcionesJwt },
  )

export const verificarToken = (token) =>
  jwt.verify(token, llavePublica, { algorithms: [algoritmo], ...opcionesJwt })