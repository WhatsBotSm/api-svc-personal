import { asyncH } from '../funciones/utilerias/asynch.js'
import * as auth from '../servicios/auth.js'

export const login = asyncH(async (req, res) => res.json(await auth.login(req.body)))
export const registro = asyncH(async (req, res) => res.status(201).json(await auth.registrar(req.body)))
export const me = asyncH(async (req, res) => res.json(await auth.serializarUsuario(req.user)))
export const actualizarMe = asyncH(async (req, res) => res.json(await auth.actualizarMe(req.user, req.body)))
export const cambiarPassword = asyncH(async (req, res) => res.json(await auth.cambiarPassword(req.user, req.body)))
export const refresh = asyncH(async (req, res) => res.json(await auth.refrescar(req.user)))