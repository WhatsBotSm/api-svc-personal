import { asyncH } from '../funciones/utilerias/asynch.js'
import * as usuarios from '../servicios/usuarios.js'

export const listar = asyncH(async (req, res) => res.json(await usuarios.listarUsuarios(req.query)))
export const crear = asyncH(async (req, res) => res.status(201).json(await usuarios.crearUsuario(req.body)))
export const actualizar = asyncH(async (req, res) =>
  res.json(await usuarios.actualizarUsuario(req.params.id, req.body, req.user)))