import { HttpError } from '../funciones/utilerias/httpError.js'

export const requierePermiso = (permiso) => (req, _res, next) => {
  if (!req.user.permisos.includes(permiso)) throw new HttpError(403, 'No tienes permiso para esta acción')
  next()
}

export const requiereRol = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.rol)) throw new HttpError(403, 'Tu rol no puede realizar esta acción')
  next()
}