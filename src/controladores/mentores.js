import { asyncH } from '../funciones/utilerias/asynch.js'
import * as personas from '../servicios/personas.js'

export const listar = asyncH(async (req, res) =>
  res.json(await personas.listarMentores({ tipo: req.query.tipo, id_empresa: req.query.empresa })))