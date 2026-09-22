// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
const path = require('path')

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({
        enabled: true
      })
    : (config) => config

function resolveServerDir(outputPath) {
  if (fs.existsSync(path.join(outputPath, 'pages'))) {
    return outputPath
  }
  const parent = path.join(outputPath, '..')
  if (fs.existsSync(path.join(parent, 'pages'))) {
    return parent
  }
  return path.join(process.cwd(), '.next', 'server')
}

function writePagesManifest(serverDir) {
  const pagesDir = path.join(serverDir, 'pages')
  if (!fs.existsSync(pagesDir)) {
    return
  }

  const manifest = {}

  function walk(dir, rel) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), relPath)
        continue
      }
      if (!entry.name.endsWith('.js')) {
        continue
      }
      const withoutExt = relPath.replace(/\.js$/, '').replace(/\\/g, '/')
      const route = withoutExt === 'index' ? '/' : `/${withoutExt}`
      manifest[route] = `pages/${withoutExt}.js`
    }
  }

  walk(pagesDir, '')
  fs.writeFileSync(
    path.join(serverDir, 'pages-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
}

class FixPagesManifestPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('FixPagesManifestPlugin', () => {
      writePagesManifest(resolveServerDir(compiler.outputPath))
    })
  }
}

module.exports = withBundleAnalyzer({
  webpack(config, { isServer, dev }) {
    // Next 12 webpack breaks katex's ESM build (`de is not defined` in katex.mjs).
    // Force the CJS bundle for `import katex from 'katex'` only.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      katex$: require.resolve('katex/dist/katex.js')
    }

    // Next 12's PagesManifestPlugin shares module state between the Node and
    // Edge compilers (middleware.ts). The Edge compiler can overwrite
    // pages-manifest.json without /404, which then fails page-data collection.
    if (isServer && !dev) {
      config.plugins.push(new FixPagesManifestPlugin())
    }

    // @xenova/transformers is ESM-only ("type": "module"). Next 12.3 already
    // externalizes those imports as import("..."). A commonjs external emits
    // require() and Node throws ERR_REQUIRE_ESM.
    // onnxruntime-node is a separate native CJS addon. Keep it external so a
    // server compile does not bundle its .node binary.
    if (isServer) {
      config.externals.push({
        'onnxruntime-node': 'commonjs onnxruntime-node'
      })
    }

    return config
  },
  staticPageGenerationTimeout: 600,
  images: {
    domains: [
      'www.notion.so',
      'notion.so',
      'images.unsplash.com',
      'pbs.twimg.com',
      'abs.twimg.com',
      's3.us-west-2.amazonaws.com',
      'transitivebullsh.it'
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  async redirects() {
    return [
      {
        source: '/learning-path/:path*',
        destination: '/paths/learning-path/:path*',
        permanent: true
      },
      {
        source: '/learning-paths',
        destination: '/paths/learning-paths',
        permanent: true
      },
      {
        source: '/profile',
        destination: '/paths/profile',
        permanent: true
      },
      {
        source: '/profile/:userId',
        destination: '/paths/profile/:userId',
        permanent: true
      },
      {
        source: '/community',
        destination: '/paths/community',
        permanent: true
      },
      {
        source: '/community-resources',
        destination: '/paths/community-resources',
        permanent: true
      },
      {
        source: '/degrees',
        destination: '/paths/degrees',
        permanent: true
      },
      {
        source: '/knowledge-graph',
        destination: '/paths/knowledge-graph',
        permanent: true
      },
      {
        source: '/field-atlas',
        destination: '/paths/field-atlas',
        permanent: true
      },
      {
        source: '/users',
        destination: '/paths/users',
        permanent: true
      },
      {
        source: '/all-courses',
        has: [{ type: 'query', key: 'view', value: 'all' }],
        destination: '/paths/all-courses?view=all',
        permanent: false
      },
      {
        source: '/all-courses',
        has: [{ type: 'query', key: 'view', value: 'learning-paths' }],
        destination: '/paths/all-courses?view=learning-paths',
        permanent: false
      },
      {
        source: '/all-courses',
        has: [{ type: 'query', key: 'view', value: 'paths' }],
        destination: '/paths/all-courses?view=learning-paths',
        permanent: false
      },
      {
        source: '/all-courses',
        has: [{ type: 'query', key: 'view', value: 'research' }],
        destination: '/paths/all-courses?view=research',
        permanent: false
      },
      {
        source: '/all-courses',
        has: [{ type: 'query', key: 'view', value: 'degrees' }],
        destination: '/paths/all-courses?view=degrees',
        permanent: false
      },
      {
        source: '/all-courses',
        has: [{ type: 'query', key: 'topic' }],
        destination: '/paths/all-courses',
        permanent: false
      }
    ]
  }
})
