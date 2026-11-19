// Copies sql-wasm.wasm into public/assets/ for the web build's SQLite.
// IMPORTANT: the wasm must match the sql.js glue embedded inside
// jeep-sqlite — NOT the sql.js version in our devDeps (that one is for
// tests only). jeep-sqlite 2.8.0 pairs with sql.js 1.11.0, installed
// here under the `sqljs-jeep` alias. jeep-sqlite's default wasmPath is
// '/assets'.
import { createRequire } from 'node:module'
import { cpSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const wasm = require.resolve('sqljs-jeep/dist/sql-wasm.wasm')

const outDir = join(dirname(new URL(import.meta.url).pathname), '..', 'public', 'assets')
mkdirSync(outDir, { recursive: true })
cpSync(wasm, join(outDir, 'sql-wasm.wasm'))
console.log('copied sql-wasm.wasm ->', outDir)
