import { defaultMapImageUrl } from 'react-notion-x'

import { defaultPageCover, defaultPageIcon } from './config'

export const mapImageUrl = (url: string, block: any) => {
  if (url === defaultPageCover || url === defaultPageIcon) {
    return url
  }

  return defaultMapImageUrl(url, block)
}
