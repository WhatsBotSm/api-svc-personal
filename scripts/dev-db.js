// Arranca un PostgreSQL embebido (sin instalar nada) para desarrollo local y deja corriendo.
// En producción/Docker usa DATABASE_URL apuntando a un PostgreSQL real (ver docker-compose.yml).
import EmbeddedPostgres from 'embedded-postgres'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', '.pgdata')
const PORT = Number(process.env.PGPORT || 5433)

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'uttec',
  password: 'uttec_dev',
  port: PORT,
  persistent: true,
})

const inicializado = fs.existsSync(path.join(dataDir, 'PG_VERSION'))
if (!inicializado) await pg.initialise()
await pg.start()
try {
  await pg.createDatabase('uttec_dual')
} catch {
  /* ya existe */
}
console.log(`PostgreSQL embebido listo en postgres://uttec:uttec_dev@localhost:${PORT}/uttec_dual`)

const salir = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', salir)
process.on('SIGTERM', salir)
setInterval(() => {}, 1 << 30)
