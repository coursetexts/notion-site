// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({
        enabled: true
      })
    : (config) => config

module.exports = withBundleAnalyzer({
  webpack(config) {
    // Next 12 webpack breaks katex's ESM build (`de is not defined` in katex.mjs).
    // Force the CJS bundle for `import katex from 'katex'` only.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      katex$: require.resolve('katex/dist/katex.js')
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
        destination: '/course-learning-path/:courseSlug',
        permanent: true
      },
      {
        source: '/curated-course/:courseSlug/videos',
        destination: '/course-learning-path/:courseSlug',
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
