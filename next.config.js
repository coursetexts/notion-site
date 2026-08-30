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

    return config
  },
  async redirects() {
    return [
      {
        source: '/undergraduate-degrees',
        destination: '/degrees',
        permanent: true
      },
      {
        source: '/curated-course/:courseSlug',
        destination: '/learning-path/:courseSlug',
        permanent: true
      },
      {
        source: '/curated-course/:courseSlug/videos',
        destination: '/learning-path/:courseSlug',
        permanent: true
      },
      {
        source: '/course-learning-path/:courseSlug',
        destination: '/learning-path/:courseSlug',
        permanent: true
      },
      {
        source: '/course-learning-path/:courseSlug/videos',
        destination: '/learning-path/:courseSlug',
        permanent: true
      },
      {
        source: '/human-knowledge-atlas',
        destination: '/field-atlas',
        permanent: true
      }
    ]
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
  }
})
