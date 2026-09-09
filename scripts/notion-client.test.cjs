const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { test } = require('node:test')
const { pathToFileURL } = require('node:url')
const ts = require('typescript')

test('Notion requests identify Coursetexts and preserve the API base override', async () => {
  const requests = []
  const server = http.createServer((req, res) => {
    requests.push({ url: req.url, userAgent: req.headers['user-agent'] })
    req.resume()
    res.setHeader('Content-Type', 'application/json')
    if (
      req.headers['user-agent'] !== 'Coursetexts/1.0 (+https://coursetexts.org)'
    ) {
      res.writeHead(403)
      res.end('{}')
      return
    }
    res.end(JSON.stringify({ recordMap: { block: {} } }))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const previousBase = process.env.NOTION_API_BASE_URL
  try {
    process.env.NOTION_API_BASE_URL = `http://127.0.0.1:${
      server.address().port
    }/api/v3`
    // Load the actual TypeScript client without adding a test runtime dependency.
    const source = readFileSync(
      path.join(__dirname, '../lib/notion-api.ts'),
      'utf8'
    )
    const compiled = ts
      .transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020
        }
      })
      .outputText.replace(
        /from ['"]([^'"]+)['"]/g,
        (_, name) =>
          `from ${JSON.stringify(pathToFileURL(require.resolve(name)).href)}`
      )
    const { notion } = await import(
      `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
    )
    const pageId = '00000000-0000-4000-8000-000000000001'
    await notion.getPageRaw(pageId)
    await notion.getBlocks([pageId])
    assert.deepEqual(
      requests.map(({ url }) => url),
      ['/api/v3/loadPageChunk', '/api/v3/syncRecordValues']
    )
    assert.ok(
      requests.every(
        ({ userAgent }) =>
          userAgent === 'Coursetexts/1.0 (+https://coursetexts.org)'
      )
    )
  } finally {
    if (previousBase === undefined) delete process.env.NOTION_API_BASE_URL
    else process.env.NOTION_API_BASE_URL = previousBase
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
})
