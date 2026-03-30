type SchoolLogo = {
  src: string
  alt: string
}

const DEFAULT_LOGO: SchoolLogo = {
  src: '/images/home/harvard-red.png',
  alt: 'Harvard'
}

export function getSchoolLogoForMeta(meta: string): SchoolLogo {
  const value = meta.toLowerCase()

  if (value.includes('princeton')) {
    return { src: '/images/home/princeton.png', alt: 'Princeton' }
  }

  if (value.includes('yale')) {
    return { src: '/images/home/yale.png', alt: 'Yale' }
  }

  if (
    /\bcolumbia university\b/.test(value) ||
    value.startsWith('columbia /') ||
    value === 'columbia'
  ) {
    return { src: '/images/home/columbia.png', alt: 'Columbia' }
  }

  if (value.includes('stanford')) {
    return { src: '/images/home/stanford.png', alt: 'Stanford' }
  }

  if (value.includes('waterloo')) {
    return { src: '/images/home/waterloo.png', alt: 'Waterloo' }
  }

  return DEFAULT_LOGO
}
