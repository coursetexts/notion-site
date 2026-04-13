import { Block } from 'notion-types'

import { defaultPageCover, defaultPageIcon } from './config'

const defaultMapImageUrl = (url: string, block: Block) => {
  if (!url) return url

  if (url.startsWith('data:')) {
    return url
  }

  if (url.startsWith('/images')) {
    return url
  }

  return `https://www.notion.so${url.startsWith('/') ? url : `/${url}`}`
}

export const mapImageUrl = (url: string, block: Block) => {
  if (url === defaultPageCover || url === defaultPageIcon) {
    return url
  }

  return defaultMapImageUrl(url, block)
}
