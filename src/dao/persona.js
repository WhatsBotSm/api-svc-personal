import { db } from '../configuraciones/baseDatos.js'

// Origen: INSERT de POST /usuarios y /auth/registro
export const crear = (d, x = db) =>
  x.one(
    `INSERT INTO persona (nombre, apellido_paterno, apellido_materno, telefono, correo, id_externo, origen_datos)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_persona`,
    [
      d.nombre ?? null, d.apellido_paterno ?? null, d.apellido_materno ?? null,
      d.telefono ?? null, d.correo, d.id_externo ?? null, d.origen_datos,
    ],
  )

// Para /internal/resolver: devuelve también el rol de la cuenta (null si no tiene)
export const buscarPorIds = (ids, x = db) =>
  x.all(
    `SELECT p.id_persona, p.nombre, p.apellido_paterno, p.apellido_materno, p.telefono, p.correo,
            p.id_externo, p.origen_datos, cu.cat_roles #>> '{}' AS rol
       FROM persona p
       LEFT JOIN cat_user cu ON cu.id_persona = p.id_persona
      WHERE p.id_persona = ANY($1::int[])`,
    [ids],
  )

// Origen: PUT /auth/me
export const actualizarContacto = (id, { telefono, correo }, x = db) =>
  x.query(`UPDATE persona SET telefono=$1, correo=$2 WHERE id_persona=$3`, [telefono, correo, id])

export const actualizarNombre = (id, { nombre, apellido_paterno, apellido_materno }, x = db) =>
  x.query(
    `UPDATE persona SET nombre=$1, apellido_paterno=$2, apellido_materno=$3 WHERE id_persona=$4`,
    [nombre, apellido_paterno, apellido_materno ?? null, id],
  )