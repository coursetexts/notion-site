/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Load .env into process.env before any config is read.
 * Ensures NEXT_PUBLIC_NOTION_PAGE_ID etc. are available when site.config runs.
 */
function loadEnv(): void {
  if (typeof process === 'undefined' || !process.env) return
  try {
    const path = require('path') as typeof import('path')
    const fs = require('fs') as typeof import('fs')
    // Prefer project root (parent of lib/) then cwd
    const projectRoot = path.resolve(__dirname, '..')
    const cwd = process.cwd()
    const envPath = fs.existsSync(path.join(projectRoot, '.env'))
      ? path.join(projectRoot, '.env')
      : path.join(cwd, '.env')
    if (!fs.existsSync(envPath)) return
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match) continue
      const key = match[1]
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  } catch {
    // ignore
  }
}

loadEnv()

export {}
