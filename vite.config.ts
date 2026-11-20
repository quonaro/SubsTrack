/// <reference types="vitest/config" />
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import pkg from './package.json'

const gitVersion = (args: string): string | null => {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' }).trim() || null
  } catch {
    return null
  }
}

// Release CI passes VITE_APP_VERSION explicitly; locally fall back to the git
// tag/description so dev builds don't all report package.json's version.
// Under vitest keep package.json — tests must not depend on git state.
const appVersion =
  process.env.VITE_APP_VERSION ||
  (process.env.VITEST ? null : gitVersion('describe --tags --always --dirty')) ||
  pkg.version

// Browser logger bridge: src/log.ts beacons entries here in dev so they
// show up in the terminal next to vite's own output (handy on-device too —
// the WebView's console is otherwise only reachable via remote debugging).
const terminalLogs: Plugin = {
  name: 'substrack-terminal-logs',
  configureServer(server) {
    server.middlewares.use('/__substrack-log', (req, res) => {
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => {
        res.statusCode = 204
        res.end()
        try {
          const { level, ns, args } = JSON.parse(body) as {
            level: string
            ns: string
            args: string[]
          }
          const line = `[web] [${ns}] ${args.join(' ')}`
          if (level === 'error') console.error(line)
          else if (level === 'warn') console.warn(line)
          else console.log(line)
        } catch {
          /* malformed log body — ignore */
        }
      })
    })
  },
}

// Dev-only file DB: the web build's Db backend POSTs SQL here instead of
// using jeep-sqlite/IndexedDB, and this middleware executes it through
// sql.js against a real file at data/substrack.db — inspect or seed it with
// any sqlite tool while vite runs. Web preview/prod still use IndexedDB.
const devDb: Plugin = {
  name: 'substrack-dev-db',
  configureServer(server) {
    const require = createRequire(import.meta.url)
    const dir = resolve(process.cwd(), 'data')
    const file = join(dir, 'substrack.db')
    let db: import('sql.js').Database | null = null
    const persist = (): void => {
      if (!db) return
      mkdirSync(dir, { recursive: true })
      writeFileSync(`${file}.tmp`, db.export())
      renameSync(`${file}.tmp`, file)
    }
    const open = async () => {
      if (db) return db
      const { default: initSqlJs } = await import('sql.js')
      const SQL = await initSqlJs({
        wasmBinary: readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')),
      })
      mkdirSync(dir, { recursive: true })
      db = existsSync(file) ? new SQL.Database(readFileSync(file)) : new SQL.Database()
      // Match the production backends: foreign keys enforce CASCADE/SET NULL.
      db.exec('PRAGMA foreign_keys = ON')
      if (!existsSync(file)) persist()
      return db
    }
    server.middlewares.use('/__substrack-db', (req, res) => {
      // GET is a liveness probe for the frontend fallback to jeep-sqlite.
      if (req.method === 'GET') {
        res.statusCode = 204
        res.end()
        return
      }
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.end()
        return
      }
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', async () => {
        try {
          const { method, statement, values } = JSON.parse(body) as {
            method: string
            statement: string
            values?: unknown[]
          }
          const d = await open()
          res.setHeader('content-type', 'application/json')
          if (method === 'execute') {
            d.exec(statement)
            persist()
          } else if (method === 'query') {
            const stmt = d.prepare(statement)
            try {
              if (values) stmt.bind(values as never)
              const rows: Record<string, unknown>[] = []
              while (stmt.step()) rows.push(stmt.getAsObject() as Record<string, unknown>)
              res.end(JSON.stringify({ result: { values: rows } }))
            } finally {
              stmt.free()
            }
            return
          } else if (method === 'run') {
            d.run(statement, values as never)
            const lastId = d.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0] ?? 0
            const changes = d.getRowsModified()
            persist()
            res.end(JSON.stringify({ result: { changes: { changes, lastId } } }))
            return
          } else {
            res.statusCode = 400
            res.end(JSON.stringify({ error: `unknown method ${method}` }))
            return
          }
          res.end(JSON.stringify({ result: {} }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
        }
      })
    })
  },
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  plugins: [vueDevTools(), vue(), tailwindcss(), terminalLogs, devDb],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 7358,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test.setup.ts'],
  },
})
