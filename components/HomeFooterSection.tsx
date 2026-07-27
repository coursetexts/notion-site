import * as React from 'react'

import { HomeFooter } from './HomeFooter'

type HomeFooterSectionProps = {
  className?: string
  style?: React.CSSProperties
  sidePadding?: string
  contentMax?: string
  footerSidePadding?: string
  /** Use 'course' on course pages to match hero background and reduce gap above footer */
  variant?: 'default' | 'course'
}

export function HomeFooterSection({
  className,
  style,
  sidePadding = 'clamp(20px, 4.03vw, 58px)',
  contentMax = '640px',
  footerSidePadding = 'max(28px, 15.28vw)',
  variant = 'default'
}: HomeFooterSectionProps) {
  const cssVars = {
    '--home-side': sidePadding,
    '--home-content-max': contentMax,
    '--home-footer-side': footerSidePadding,
    ...style
  } as React.CSSProperties

  return (
    <section className={className} style={cssVars}>
      <HomeFooter variant={variant} />
    </section>
  )
}
