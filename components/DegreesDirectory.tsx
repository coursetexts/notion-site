import * as React from 'react'

import type { Icon } from '@phosphor-icons/react'
import { AirplaneTilt } from '@phosphor-icons/react/dist/ssr/AirplaneTilt'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'
import { Atom } from '@phosphor-icons/react/dist/ssr/Atom'
import { Bank } from '@phosphor-icons/react/dist/ssr/Bank'
import { BookOpenText } from '@phosphor-icons/react/dist/ssr/BookOpenText'
import { Books } from '@phosphor-icons/react/dist/ssr/Books'
import { Brain } from '@phosphor-icons/react/dist/ssr/Brain'
import { Briefcase } from '@phosphor-icons/react/dist/ssr/Briefcase'
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings'
import { Calculator } from '@phosphor-icons/react/dist/ssr/Calculator'
import { ChalkboardTeacher } from '@phosphor-icons/react/dist/ssr/ChalkboardTeacher'
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar'
import { ChartLine } from '@phosphor-icons/react/dist/ssr/ChartLine'
import { Chats } from '@phosphor-icons/react/dist/ssr/Chats'
import { Church } from '@phosphor-icons/react/dist/ssr/Church'
import { ClockCounterClockwise } from '@phosphor-icons/react/dist/ssr/ClockCounterClockwise'
import { Code } from '@phosphor-icons/react/dist/ssr/Code'
import { Cpu } from '@phosphor-icons/react/dist/ssr/Cpu'
import { CurrencyDollar } from '@phosphor-icons/react/dist/ssr/CurrencyDollar'
import { Database } from '@phosphor-icons/react/dist/ssr/Database'
import { Detective } from '@phosphor-icons/react/dist/ssr/Detective'
import { Dog } from '@phosphor-icons/react/dist/ssr/Dog'
import { Ear } from '@phosphor-icons/react/dist/ssr/Ear'
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye'
import { Factory } from '@phosphor-icons/react/dist/ssr/Factory'
import { FilmSlate } from '@phosphor-icons/react/dist/ssr/FilmSlate'
import { FirstAid } from '@phosphor-icons/react/dist/ssr/FirstAid'
import { Flask } from '@phosphor-icons/react/dist/ssr/Flask'
import { ForkKnife } from '@phosphor-icons/react/dist/ssr/ForkKnife'
import { Function as FunctionIcon } from '@phosphor-icons/react/dist/ssr/Function'
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear'
import { GlobeHemisphereWest } from '@phosphor-icons/react/dist/ssr/GlobeHemisphereWest'
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap'
import { Heartbeat } from '@phosphor-icons/react/dist/ssr/Heartbeat'
import { Laptop } from '@phosphor-icons/react/dist/ssr/Laptop'
import { Leaf } from '@phosphor-icons/react/dist/ssr/Leaf'
import { Lightbulb } from '@phosphor-icons/react/dist/ssr/Lightbulb'
import { Lightning } from '@phosphor-icons/react/dist/ssr/Lightning'
import { Lock } from '@phosphor-icons/react/dist/ssr/Lock'
import { MaskHappy } from '@phosphor-icons/react/dist/ssr/MaskHappy'
import { Megaphone } from '@phosphor-icons/react/dist/ssr/Megaphone'
import { MusicNotes } from '@phosphor-icons/react/dist/ssr/MusicNotes'
import { Newspaper } from '@phosphor-icons/react/dist/ssr/Newspaper'
import { Palette } from '@phosphor-icons/react/dist/ssr/Palette'
import { PenNib } from '@phosphor-icons/react/dist/ssr/PenNib'
import { PersonSimpleRun } from '@phosphor-icons/react/dist/ssr/PersonSimpleRun'
import { Pill } from '@phosphor-icons/react/dist/ssr/Pill'
import { Scales } from '@phosphor-icons/react/dist/ssr/Scales'
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { Stethoscope } from '@phosphor-icons/react/dist/ssr/Stethoscope'
import { Tooth } from '@phosphor-icons/react/dist/ssr/Tooth'
import { Translate } from '@phosphor-icons/react/dist/ssr/Translate'
import { Truck } from '@phosphor-icons/react/dist/ssr/Truck'
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree'

import type { DegreeLevel } from '@/components/UndergraduateDegreesTopSection'
import { type DegreeDirectoryItem } from '@/lib/degrees-directory'
import {
  GRADUATE_DEGREE_SECTIONS,
  type GraduateDegreeSection
} from '@/lib/graduate-degree-sections'
import {
  UNDERGRADUATE_DEGREE_SECTIONS,
  type UndergraduateDegreeSection
} from '@/lib/undergraduate-degree-sections'

import styles from './DegreesDirectory.module.css'

type DirectorySection = GraduateDegreeSection | UndergraduateDegreeSection

type DegreesDirectoryProps = {
  degrees: DegreeDirectoryItem[]
  level: DegreeLevel
  query?: string
}

type IconRule = {
  pattern: RegExp
  icon: Icon
}

const ICON_RULES: IconRule[] = [
  { pattern: /aerospace/, icon: AirplaneTilt },
  { pattern: /computer engineering/, icon: Cpu },
  { pattern: /mechanical|engineering \(general\)|m[es]ng/, icon: Gear },
  { pattern: /electrical/, icon: Lightning },
  { pattern: /civil|architecture/, icon: Buildings },
  { pattern: /industrial engineering/, icon: Factory },
  { pattern: /biomedical/, icon: Heartbeat },
  { pattern: /chemical engineering|chemistry/, icon: Flask },
  { pattern: /cybersecurity/, icon: ShieldCheck },
  { pattern: /data science|information systems/, icon: Database },
  { pattern: /computer science|information technology/, icon: Laptop },
  { pattern: /programming|software/, icon: Code },
  { pattern: /mathematics/, icon: FunctionIcon },
  { pattern: /statistics/, icon: ChartBar },
  { pattern: /physics/, icon: Atom },
  { pattern: /biology|environmental/, icon: Leaf },
  { pattern: /medicine|physician assistant/, icon: Stethoscope },
  { pattern: /dental/, icon: Tooth },
  { pattern: /pharmacy/, icon: Pill },
  { pattern: /veterinary/, icon: Dog },
  { pattern: /optometry/, icon: Eye },
  { pattern: /audiology|speech-language/, icon: Ear },
  {
    pattern: /physical therapy|kinesiology|occupational therapy/,
    icon: PersonSimpleRun
  },
  { pattern: /nursing|health professions|public health/, icon: FirstAid },
  { pattern: /business administration|mba/, icon: Briefcase },
  { pattern: /accounting/, icon: Calculator },
  { pattern: /finance/, icon: CurrencyDollar },
  { pattern: /economics/, icon: ChartLine },
  { pattern: /marketing/, icon: Megaphone },
  { pattern: /hospitality|nutrition/, icon: ForkKnife },
  {
    pattern: /human resources|sociology|social work|family therapy/,
    icon: UsersThree
  },
  { pattern: /supply chain/, icon: Truck },
  {
    pattern: /political science|public administration|public policy/,
    icon: Bank
  },
  { pattern: /criminal justice/, icon: Detective },
  { pattern: /law/, icon: Scales },
  { pattern: /psychology|counseling/, icon: Brain },
  { pattern: /education/, icon: ChalkboardTeacher },
  { pattern: /communications/, icon: Chats },
  { pattern: /journalism/, icon: Newspaper },
  { pattern: /english|liberal arts|library/, icon: Books },
  { pattern: /spanish/, icon: Translate },
  { pattern: /history/, icon: ClockCounterClockwise },
  { pattern: /philosophy/, icon: Lightbulb },
  { pattern: /religious/, icon: Church },
  { pattern: /fine arts/, icon: Palette },
  { pattern: /graphic design/, icon: PenNib },
  { pattern: /music/, icon: MusicNotes },
  { pattern: /theater/, icon: MaskHappy },
  { pattern: /film|media production/, icon: FilmSlate },
  {
    pattern: /anthropology|international relations/,
    icon: GlobeHemisphereWest
  },
  { pattern: /general studies/, icon: BookOpenText },
  { pattern: /security/, icon: Lock }
]

const ICON_COLORS = [
  '#c9510c',
  '#0089c4',
  '#2f7d5c',
  '#6f5aa8',
  '#b85777',
  '#3f6f9d'
] as const

function degreeIcon(name: string): Icon {
  const normalized = name.toLowerCase()
  return (
    ICON_RULES.find((rule) => rule.pattern.test(normalized))?.icon ??
    GraduationCap
  )
}

function stableColor(id: string): string {
  const hash = Array.from(id).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0
  )
  return ICON_COLORS[hash % ICON_COLORS.length]
}

function groupDegrees(
  degrees: DegreeDirectoryItem[],
  sections: readonly DirectorySection[]
) {
  const byId = new Map(degrees.map((degree) => [degree.id, degree]))
  const assigned = new Set<string>()
  const groups = sections
    .map((section) => {
      const sectionDegrees = section.degreeIds
        .map((id) => byId.get(id))
        .filter((degree): degree is DegreeDirectoryItem => degree !== undefined)

      sectionDegrees.forEach((degree) => assigned.add(degree.id))

      return { section, degrees: sectionDegrees }
    })
    .filter((group) => group.degrees.length > 0)

  const unassigned = degrees.filter((degree) => !assigned.has(degree.id))
  if (unassigned.length > 0) {
    groups.push({
      section: {
        id: 'other',
        title: 'Other',
        description: '',
        degreeIds: []
      },
      degrees: unassigned
    })
  }

  return groups
}

function DegreeRow({
  degree,
  level
}: {
  degree: DegreeDirectoryItem
  level: DegreeLevel
}) {
  const DegreeIcon = degreeIcon(degree.name)
  const iconColor = stableColor(degree.id)

  return (
    <a
      href={`/degrees/${level}/${degree.id}`}
      target='_blank'
      rel='noopener noreferrer'
      className={styles.degreeRow}
      aria-label={`Open ${degree.name} curriculum in a new tab`}
    >
      <span
        className={styles.iconTile}
        style={{ backgroundColor: iconColor }}
        aria-hidden='true'
      >
        <DegreeIcon size={22} weight='fill' />
      </span>
      <span className={styles.degreeCopy}>
        <span className={styles.degreeName}>{degree.name}</span>
        <span className={styles.degreeCount}>
          {degree.courseCount} {degree.courseCount === 1 ? 'course' : 'courses'}
        </span>
      </span>
      <span className={styles.openIcon} aria-hidden='true'>
        <ArrowUpRight size={17} weight='bold' />
      </span>
    </a>
  )
}

export function DegreesDirectory({
  degrees,
  level,
  query = ''
}: DegreesDirectoryProps) {
  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return degrees
    return degrees.filter((degree) => degree.searchText.includes(needle))
  }, [degrees, query])

  const sections =
    level === 'graduate'
      ? GRADUATE_DEGREE_SECTIONS
      : UNDERGRADUATE_DEGREE_SECTIONS
  const groups = React.useMemo(
    () => groupDegrees(filtered, sections),
    [filtered, sections]
  )
  const levelLabel = level === 'graduate' ? 'graduate' : 'undergraduate'

  return (
    <section
      id='degrees-panel'
      aria-labelledby='degrees-level-label'
      className={styles.section}
      aria-label={`${levelLabel} degree directory`}
    >
      <div className={styles.inner}>
        {groups.length > 0 ? (
          <aside className={styles.tableOfContents}>
            <p className={styles.tableTitle}>Table of contents</p>
            <nav aria-label='Degree categories'>
              <ol className={styles.tableList}>
                {groups.map((group, index) => (
                  <li key={group.section.id}>
                    <a
                      className={styles.tableLink}
                      href={`#degree-section-${level}-${group.section.id}`}
                    >
                      <span className={styles.tableIndex}>{index + 1}</span>
                      <span>{group.section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        ) : null}

        <div className={styles.categoryList}>
          {groups.length === 0 ? (
            <p className={styles.emptyState}>
              {degrees.length === 0
                ? `${
                    level === 'graduate' ? 'Graduate' : 'Undergraduate'
                  } degrees coming soon.`
                : `No ${levelLabel} degrees matched your search.`}
            </p>
          ) : (
            groups.map((group) => (
              <section
                id={`degree-section-${level}-${group.section.id}`}
                className={styles.categorySection}
                aria-labelledby={`degree-section-title-${level}-${group.section.id}`}
                key={group.section.id}
              >
                <h2
                  id={`degree-section-title-${level}-${group.section.id}`}
                  className={styles.categoryHeading}
                >
                  {group.section.title}
                </h2>
                <div className={styles.degreeList}>
                  {group.degrees.map((degree) => (
                    <DegreeRow key={degree.id} degree={degree} level={level} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
