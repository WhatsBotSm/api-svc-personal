import express from 'express'
import middlewares from '../middlewares/index.js'
import controllers from '../controladores/index.js'

const router = express.Router()

// Todo /enlace exige sesión y rol Enlace; la gestión de cuentas además exige el permiso.
const enlace = [middlewares.verificaToken, middlewares.requiereRol('ENLACE_DUAL')]
const gestionPersonas = [...enlace, middlewares.requierePermiso('personas:administrar')]

router.get('/', (_, res) => res.send('UTTEC-DUAL - Servicio Personal!'))

// Autenticación y perfil propio
router.post('/auth/login', middlewares.limitadorAcceso, controllers.auth.login)
router.post('/auth/registro', middlewares.limitadorAcceso, controllers.auth.registro)
router.get('/auth/me', middlewares.verificaToken, controllers.auth.me)
router.put('/auth/me', middlewares.verificaToken, controllers.auth.actualizarMe)
router.put('/auth/me/password', middlewares.verificaToken, controllers.auth.cambiarPassword)
router.post('/auth/refresh', middlewares.verificaToken, controllers.auth.refresh)

// Gestión de cuentas y mentores (Enlace dual)
router.get('/enlace/usuarios', ...gestionPersonas, controllers.usuarios.listar)
router.post('/enlace/usuarios', ...gestionPersonas, controllers.usuarios.crear)
router.put('/enlace/usuarios/:id', ...gestionPersonas, controllers.usuarios.actualizar)
router.get('/enlace/mentores', ...enlace, controllers.mentores.listar)

// Solo entre servicios: llevan x-internal-token, nunca el JWT de un usuario
router.post('/internal/personas/resolver', middlewares.verificaInternalToken, controllers.internal.resolver)
router.get('/internal/personal-dual', middlewares.verificaInternalToken, controllers.internal.listar)
router.get('/internal/personal-dual/:id', middlewares.verificaInternalToken, controllers.internal.obtener)

export default router