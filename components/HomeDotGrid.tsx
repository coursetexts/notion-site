import * as React from 'react'
import Link from 'next/link'

import styles from './HomeDotGrid.module.css'

type HomeDotGridCourse = {
  id: string
  href: string
  title: string
  meta: string
}

type HotspotPoint = {
  x: number
  y: number
}

type HomeDotGridProps = {
  courses?: HomeDotGridCourse[]
}

type HotspotTarget = HotspotPoint & {
  size: number
}

const HOTSPOT_TARGETS: HotspotTarget[] = [
  { x: 6.5, y: 24.5, size: 84 }, // laptop
  { x: 18.5, y: 29, size: 88 }, // lamp and planters
  { x: 34.5, y: 29, size: 84 }, // heart and vase
  { x: 44, y: 26.5, size: 90 }, // chair
  { x: 56.5, y: 38, size: 96 }, // table
  { x: 69.5, y: 27.5, size: 86 }, // round planter
  { x: 81, y: 27.5, size: 84 }, // right planter
  { x: 90.5, y: 33, size: 92 } // tree and desk
]

export function HomeDotGrid({ courses = [] }: HomeDotGridProps) {
  const hotspotCourses = React.useMemo(
    () => courses.slice(0, HOTSPOT_TARGETS.length),
    [courses]
  )

  return (
    <section className={styles.gridBand}>
      <div className={styles.content}>
        <div className={styles.heroImageWrap}>
          <img
            src='/images/home/dot-grid-hero.png'
            alt=''
            className={styles.heroImage}
          />

          {hotspotCourses.length > 0 ? (
            <div className={styles.hotspotLayer} aria-hidden='true'>
              {hotspotCourses.map((course, index) => {
                const target = HOTSPOT_TARGETS[index]

                return (
                  <Link key={course.id} href={course.href} legacyBehavior>
                    <a
                      className={styles.hotspot}
                      style={
                        {
                          left: `${target.x}%`,
                          top: `${target.y}%`,
                          '--hotspot-size': `${target.size}px`
                        } as React.CSSProperties
                      }
                      aria-label={`Open ${course.title}`}
                    >
                      <span className={styles.hotspotTooltip}>
                        {course.title}
                        <span className={styles.hotspotTooltipMeta}>
                          {course.meta}
                        </span>
                      </span>
                    </a>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>

        <p className={styles.disclaimer}>
          Coursetexts has neither sought nor received permission from any
          university to open-source courses that were taught at that university.
          It is not affiliated with, sponsored by, or endorsed by any
          university.
        </p>
      </div>
    </section>
  )
}
