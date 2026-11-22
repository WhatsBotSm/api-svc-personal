import { HttpError } from '../funciones/utilerias/httpError.js'

export const noEncontrado = (_req, _res, next) => next(new HttpError(404, 'Ruta no encontrada'))

// eslint-disable-next-line no-unused-vars
export const manejadorErrores = (err, _req, res, _next) => {
    if (err.status) return res.status(err.status).json({ error: err.message })
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un registro con esos datos (duplicado)' })
    if (err.code === '23503') return res.status(409).json({ error: 'El registro está relacionado con otros datos' })
    if (err.code === '23514' || err.code === '22P02') return res.status(400).json({ error: 'Datos inválidos' })
    console.error(res.locals.idTrackingReq, err)
    res.status(500).json({ error: 'Error interno del servidor', requestId: res.locals.idTrackingReq })
}