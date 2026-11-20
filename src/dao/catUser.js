import { db } from '../configuraciones/baseDatos.js'

// Origen: INSERT de POST /usuarios y /auth/registro. El servicio manda el rol y copia los perfiles.
export const crear = (d, x = db) =>
  x.one(
    `INSERT INTO cat_user (id_persona, usuario, password_hash, cat_roles, cat_modulos, cat_permisos)
     VALUES ($1, $2, $3, to_jsonb($4::text), $5::jsonb, $6::jsonb) RETURNING id_cat_user`,
    [d.id_persona, d.usuario, d.password_hash, d.rol, JSON.stringify(d.modulos), JSON.stringify(d.permisos)],
  )

// Origen: POST /auth/login
export const buscarCredenciales = (usuario, x = db) =>
  x.one(
    `SELECT id_cat_user, password_hash, activo FROM cat_user WHERE LOWER(usuario) = LOWER($1)`,
    [usuario],
  )

// Origen: auth.js cargarContexto, sin el join a alumno
export const cargarContexto = (id, x = db) =>
  x.one(
    `SELECT cu.id_cat_user, cu.usuario, cu.cat_roles #>> '{}' AS rol, cu.cat_modulos AS modulos,
            cu.cat_permisos AS permisos, cu.activo, cu.id_persona,
            p.nombre, p.apellido_paterno, p.apellido_materno, p.telefono, p.correo, p.id_externo, p.origen_datos,
            pd.id_personal_dual, pd.id_empresa AS id_empresa_mentor
       FROM cat_user cu
       JOIN persona p ON p.id_persona = cu.id_persona
       LEFT JOIN personal_dual pd ON pd.id_persona = cu.id_persona
      WHERE cu.id_cat_user = $1`,
    [id],
  )

// Origen: GET /usuarios, sin los joins de alumno, programa, empresa ni asignacion
export const listar = (rol, x = db) =>
  x.all(
    `SELECT cu.id_cat_user, cu.cat_roles #>> '{}' AS rol, cu.activo, cu.usuario, cu.ultimo_acceso,
            cu.id_persona, p.nombre, p.apellido_paterno, p.apellido_materno, p.telefono, p.correo,
            p.id_externo, p.origen_datos,
            pd.id_personal_dual, pd.puesto, pd.tipo, pd.id_empresa
       FROM cat_user cu
       JOIN persona p ON p.id_persona = cu.id_persona
       LEFT JOIN personal_dual pd ON pd.id_persona = cu.id_persona
      ${rol ? `WHERE cu.cat_roles #>> '{}' = $1` : ''}
      ORDER BY cu.id_cat_user`,
    rol ? [rol] : [],
  )

// Origen: PUT /usuarios/:id (COALESCE: solo cambia lo que se mande)
export const actualizar = (id, { activo, hash }, x = db) =>
  x.one(
    `UPDATE cat_user SET activo = COALESCE($1, activo), password_hash = COALESCE($2, password_hash)
      WHERE id_cat_user = $3 RETURNING id_cat_user, activo`,
    [activo ?? null, hash ?? null, id],
  )

export const registrarAcceso = (id, x = db) =>
  x.query(`UPDATE cat_user SET ultimo_acceso = NOW() WHERE id_cat_user = $1`, [id])

// Origen: PUT /auth/me/password
export const obtenerHash = (id, x = db) =>
  x.one(`SELECT password_hash FROM cat_user WHERE id_cat_user = $1`, [id])

export const cambiarHash = (id, hash, x = db) =>
  x.query(`UPDATE cat_user SET password_hash = $1 WHERE id_cat_user = $2`, [hash, id])

// Origen: PUT /auth/me (el usuario es el correo)
export const cambiarUsuario = (id, usuario, x = db) =>
  x.query(`UPDATE cat_user SET usuario = $1 WHERE id_cat_user = $2`, [usuario, id])