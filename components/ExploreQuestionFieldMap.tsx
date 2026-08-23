import * as React from 'react'

import styles from './ExploreQuestions.module.css'
import {
  EXPLORE_FIELDS,
  EXPLORE_FIELD_LINKS,
  type ExploreFieldId,
  type ExploreQuestion,
  getExploreField
} from '@/lib/explore-questions-seed'

const VIEW_W = 1000
const VIEW_H = 340

function fieldRadius(count: number) {
  return 11 + Math.min(count, 5) * 3.2
}

function satellitePositions(cx: number, cy: number, count: number, orbit: number) {
  if (count <= 0) return []
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i * (Math.PI * 2)) / count
    return {
      x: cx + Math.cos(angle) * orbit,
      y: cy + Math.sin(angle) * orbit
    }
  })
}

export function ExploreQuestionFieldMap({
  questions,
  selectedField,
  selectedQuestionId,
  onSelectField,
  onSelectQuestion
}: {
  questions: ExploreQuestion[]
  selectedField: ExploreFieldId | null
  selectedQuestionId: string
  onSelectField: (id: ExploreFieldId | null) => void
  onSelectQuestion: (id: string) => void
}) {
  const [hovered, setHovered] = React.useState<string | null>(null)

  const byField = React.useMemo(() => {
    const map = new Map<ExploreFieldId, ExploreQuestion[]>()
    for (const field of EXPLORE_FIELDS) map.set(field.id, [])
    for (const question of questions) {
      const list = map.get(question.field)
      if (list) list.push(question)
    }
    return map
  }, [questions])

  const selected = selectedField ? getExploreField(selectedField) : null

  return (
    <div className={styles.fieldMap}>
      <div className={styles.fieldMapHead}>
        <div>
          <p className={styles.fieldMapEyebrow}>Browse by field</p>
          <p className={styles.fieldMapHint}>
            {selected
              ? `Showing questions in ${selected.label}. Click the node again to see every field.`
              : 'A map of where questions collect. Click a field to filter the list below.'}
          </p>
        </div>
        {selected ? (
          <button
            type='button'
            className={styles.fieldMapClear}
            onClick={() => onSelectField(null)}
          >
            All fields
          </button>
        ) : null}
      </div>

      <svg
        className={styles.fieldMapSvg}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role='group'
        aria-label='Map of question fields'
      >
        {[
          { label: 'Curriculum', x: 108, y: 36 },
          { label: 'Physical sciences', x: 478, y: 22 },
          { label: 'Life sciences', x: 718, y: 46 },
          { label: 'Markets', x: 868, y: 148 }
        ].map((cluster) => (
          <text
            key={cluster.label}
            x={cluster.x}
            y={cluster.y}
            textAnchor='middle'
            className={styles.fieldCluster}
          >
            {cluster.label}
          </text>
        ))}

        {EXPLORE_FIELD_LINKS.map(([a, b]) => {
          const from = EXPLORE_FIELDS.find((f) => f.id === a)
          const to = EXPLORE_FIELDS.find((f) => f.id === b)
          if (!from || !to) return null
          const active =
            !selectedField || selectedField === a || selectedField === b
          return (
            <line
              key={`${a}-${b}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={`${styles.fieldLink}${
                active ? '' : ` ${styles.fieldLinkMuted}`
              }`}
            />
          )
        })}

        {EXPLORE_FIELDS.map((field) => {
          const items = byField.get(field.id) ?? []
          const count = items.length
          const r = fieldRadius(count)
          const orbit = r + 16
          const sats = satellitePositions(field.x, field.y, count, orbit)
          const isSelected = selectedField === field.id
          const isDimmed = Boolean(selectedField) && !isSelected
          const isHovered = hovered === field.id

          return (
            <g
              key={field.id}
              className={`${styles.fieldGroup}${
                isDimmed ? ` ${styles.fieldGroupMuted}` : ''
              }`}
            >
              {sats.map((pos, i) => {
                const question = items[i]
                const satSelected = question.id === selectedQuestionId
                return (
                  <circle
                    key={question.id}
                    cx={pos.x}
                    cy={pos.y}
                    r={satSelected ? 4.2 : 3.2}
                    className={`${styles.fieldSat}${
                      satSelected ? ` ${styles.fieldSatActive}` : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectField(field.id)
                      onSelectQuestion(question.id)
                    }}
                    onMouseEnter={() => setHovered(question.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <title>{question.title}</title>
                  </circle>
                )
              })}

              <g
                role='button'
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${field.label}, ${count} ${
                  count === 1 ? 'question' : 'questions'
                }`}
                className={styles.fieldHit}
                onClick={() =>
                  onSelectField(isSelected ? null : field.id)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectField(isSelected ? null : field.id)
                  }
                }}
                onMouseEnter={() => setHovered(field.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle
                  cx={field.x}
                  cy={field.y}
                  r={isHovered || isSelected ? r + 2.5 : r}
                  className={`${styles.fieldNode}${
                    isSelected ? ` ${styles.fieldNodeActive}` : ''
                  }`}
                />
                <text
                  x={field.x}
                  y={field.y + 1}
                  textAnchor='middle'
                  dominantBaseline='middle'
                  className={styles.fieldCount}
                >
                  {count}
                </text>
                <text
                  x={field.x}
                  y={field.y + r + 16}
                  textAnchor='middle'
                  className={styles.fieldLabel}
                >
                  {field.label}
                </text>
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
