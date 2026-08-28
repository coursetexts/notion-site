import * as React from 'react'
import { GetServerSideProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain, pageUrlAdditions, pageUrlOverrides } from '@/lib/config'
import { notionPageHref } from '@/lib/map-page-url'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { PageProps, Params } from '@/lib/types'

function isRootNotionOverride(rawPageId: string): boolean {
  return Boolean(pageUrlOverrides[rawPageId] || pageUrlAdditions[rawPageId])
}

export const getServerSideProps: GetServerSideProps<PageProps, Params> = async (
  context
) => {
  const rawPageId = context.params?.pageId
  if (typeof rawPageId !== 'string' || !rawPageId.trim()) {
    return { notFound: true }
  }

  if (!isRootNotionOverride(rawPageId)) {
    return {
      redirect: {
        destination: notionPageHref(rawPageId),
        permanent: true
      }
    }
  }

  try {
    const props = await resolveNotionPage(domain, rawPageId)
    return { props }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)
    return { notFound: true }
  }
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />
}
