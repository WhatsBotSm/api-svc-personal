import { env } from '../../configuraciones/env.js'

// Contrato esperado de la API real (ajustar cuando la Universidad entregue el oficial):
//   GET {URL}/alumnos/{matricula}          -> { nombre, apellido_paterno, apellido_materno, telefono?, correo? }
//   GET {URL}/mentores-academicos/{clave}  -> idem
// TODO: confirmar rutas, autenticación y campos con el contrato oficial.

const TTL_MS = 5 * 60 * 1000
const TIMEOUT_MS = 3000
const cache = new Map()

// Directorio de demostración (solo con USE_DEMO_UNIVERSIDAD=true)
const DIRECTORIO_DEMO = {
  alumnos: {
    20231001: { nombre: 'Ana', apellido_paterno: 'Ramírez', apellido_materno: 'Soto' },
    20231002: { nombre: 'Luis', apellido_paterno: 'Mendoza', apellido_materno: 'Cruz' },
    20231003: { nombre: 'Paola', apellido_paterno: 'Vargas', apellido_materno: 'Lima' },
    20231004: { nombre: 'Jorge', apellido_paterno: 'Torres', apellido_materno: 'Nava' },
    20231005: { nombre: 'Daniela', apellido_paterno: 'Ortiz', apellido_materno: 'Reyes' },
    20231006: { nombre: 'Carlos', apellido_paterno: 'Peña', apellido_materno: 'Gómez' },
  },
  'mentores-academicos': {
    'EMP-0001': { nombre: 'Lorena', apellido_paterno: 'Ramírez', apellido_materno: 'Campoy' },
    'EMP-0002': { nombre: 'Héctor', apellido_paterno: 'Salgado', apellido_materno: 'Ibarra' },
  },
}

const RECURSO = { ALUMNO: 'alumnos', MENTOR_ACADEMICO: 'mentores-academicos' }

export async function consultarPersona(tipo, idExterno) {
  const recurso = RECURSO[tipo]
  if (!recurso || !idExterno) return null

  const clave = `${recurso}:${idExterno}`
  const hit = cache.get(clave)
  if (hit && Date.now() - hit.t < TTL_MS) return hit.v

  let valor = null
  if (env.API_URL_UNIVERSIDAD) {
    try {
      const res = await fetch(`${env.API_URL_UNIVERSIDAD}/${recurso}/${encodeURIComponent(idExterno)}`, {
        headers: env.API_KEY_UNIVERSIDAD ? { Authorization: `Bearer ${env.API_KEY_UNIVERSIDAD}` } : {},
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (res.ok) valor = await res.json()
    } catch (e) {
      console.error('[clienteUniversidad] error consultando', clave, e.message)
    }
  } else if (env.USE_DEMO_UNIVERSIDAD) {
    valor = DIRECTORIO_DEMO[recurso]?.[idExterno] ?? null
  }

  if (valor) cache.set(clave, { t: Date.now(), v: valor })
  return valor
}