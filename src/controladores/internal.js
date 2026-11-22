import { asyncH } from '../funciones/utilerias/asynch.js'
import * as personas from '../servicios/personas.js'

export const resolver = asyncH(async (req, res) => res.json(await personas.resolverPersonas(req.body)))
export const obtener = asyncH(async (req, res) => res.json(await personas.obtenerPersonalDual(req.params.id)))
export const listar = asyncH(async (req, res) => res.json(await personas.listarPersonalDual(req.query)))