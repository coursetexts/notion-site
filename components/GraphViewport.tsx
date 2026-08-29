import * as React from 'react'

import styles from './LearningPath.module.css'

const PAN_THRESHOLD_PX = 6

type GraphViewportProps = {
  scrollerClassName: string
  padClassName: string
  canvasClassName: string
  canvasStyle?: React.CSSProperties
  onMouseLeave?: () => void
  overlay?: React.ReactNode
  children: React.ReactNode
}

type PanState = {
  pointerId: number | null
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
  moved: boolean
}

const EMPTY_PAN: PanState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  scrollLeft: 0,
  scrollTop: 0,
  moved: false
}

/**
 * Fixed-size map frame. Drag to pan; wheel/trackpad still scroll.
 * Clicking a node selects it and scrolls it toward the center.
 */
export function GraphViewport({
  scrollerClassName,
  padClassName,
  canvasClassName,
  canvasStyle,
  onMouseLeave,
  overlay,
  children
}: GraphViewportProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const panRef = React.useRef<PanState>({ ...EMPTY_PAN })
  const [panning, setPanning] = React.useState(false)

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const target = event.target
    if (
      target instanceof Element &&
      target.closest('a, input, textarea, select, [data-no-pan]')
    ) {
      return
    }
    const el = scrollerRef.current
    if (!el) return
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      moved: false
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    const el = scrollerRef.current
    if (pan.pointerId !== event.pointerId || !el) return
    const dx = event.clientX - pan.startX
    const dy = event.clientY - pan.startY
    if (!pan.moved) {
      if (dx * dx + dy * dy < PAN_THRESHOLD_PX * PAN_THRESHOLD_PX) return
      pan.moved = true
      setPanning(true)
      el.setPointerCapture(event.pointerId)
    }
    event.preventDefault()
    el.scrollLeft = pan.scrollLeft - dx
    el.scrollTop = pan.scrollTop - dy
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    if (pan.pointerId !== event.pointerId) return
    const el = scrollerRef.current
    if (el?.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId)
    }
    const didPan = pan.moved
    pan.pointerId = null
    if (!didPan) return
    setPanning(false)
    window.setTimeout(() => {
      panRef.current.moved = false
    }, 0)
  }

  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!panRef.current.moved) return
    event.preventDefault()
    event.stopPropagation()
    panRef.current.moved = false
  }

  return (
    <div
      className={`${styles.graphViewportFrame}${
        panning ? ` ${styles.graphViewportPanning}` : ''
      }`}
    >
      <div
        ref={scrollerRef}
        className={scrollerClassName}
        data-graph-scroll=''
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        onClickCapture={handleClickCapture}
      >
        <div className={padClassName}>
          <div
            className={canvasClassName}
            style={canvasStyle}
            onMouseLeave={onMouseLeave}
          >
            {children}
          </div>
        </div>
      </div>
      {overlay}
    </div>
  )
}
