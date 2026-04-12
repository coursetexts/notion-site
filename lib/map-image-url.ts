import { Block } from 'notion-types'

import { defaultPageCover, defaultPageIcon } from './config'

// Default implementation of image URL mapping
// Pass-through function that returns the URL as-is
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultMapImageUrl = (url: string, _block?: Block | undefined): string => {
  return url
}

export const mapImageUrl = (url: string, block: Block) => {
  if (url === defaultPageCover || url === defaultPageIcon) {
    return url
  }

  return defaultMapImageUrl(url, block)
}
