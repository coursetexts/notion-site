import * as React from 'react'

import { DefinedTerm } from '@/components/DefinedTerm'

type AutodidactTermProps = {
  children: React.ReactNode
}

export function AutodidactTerm({ children }: AutodidactTermProps) {
  return (
    <DefinedTerm
      title='Autodidact'
      pronunciation='/ˌôdəˈdīˌdak(t)/'
      definition='An autodidact is a person who is self-taught and learns a subject or skill independently without the guidance of formal teachers, schools, or institutions.'
    >
      {children}
    </DefinedTerm>
  )
}
