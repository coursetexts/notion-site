type SchoolLogo = {
  src: string
  alt: string
}

export function getSchoolLogoForMeta(meta: string): SchoolLogo | null {
  const value = meta.toLowerCase()

  if (value.includes('harvard')) {
    return { src: '/images/home/harvard-red.png', alt: 'Harvard' }
  }

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

  if (value.includes('british columbia') || /\bubc\b/.test(value)) {
    return { src: '/images/schools/ubc.png', alt: 'UBC' }
  }

  if (value.includes('new york university') || /\bnyu\b/.test(value)) {
    return { src: '/images/schools/nyu.png', alt: 'NYU' }
  }

  return null
}
