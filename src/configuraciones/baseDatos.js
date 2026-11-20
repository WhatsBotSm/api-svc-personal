import pg from 'pg'
import { env } from './env.js'

export const pool = new pg.Pool({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.database,
    options: '-c search_path=public',
})

// Mismos tres helpers para el pool y para el cliente de una transacción,
// así cada función de dao/ sirve dentro y fuera de una transacción.
const envolver = (ejecutor) => ({
    query: (text, params) => ejecutor.query(text, params),
    one: async (text, params) => (await ejecutor.query(text, params)).rows[0] ?? null,
    all: async (text, params) => (await ejecutor.query(text, params)).rows,
})

export const db = {
    ...envolver(pool),
    async tx(fn) {
        const client = await pool.connect()
        try {
            await client.query('BEGIN')
            const resultado = await fn(envolver(client))
            await client.query('COMMIT')
            return resultado
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    },
}