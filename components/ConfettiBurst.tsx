import * as React from 'react'
import { createPortal } from 'react-dom'

import styles from './ConfettiBurst.module.css'

const COLORS = ['#0089c4', '#2a9fd4', '#57b5de', '#7ec8e8', '#006a99', '#b3def0']
const PIECE_COUNT = 120
const DURATION_MS = 3800

type Piece = {
  id: number
  left: number
  top: number
  delay: number
  duration: number
  color: string
  width: number
  height: number
  drift: number
  spin: number
}

function spawnPieces(): Piece[] {
  const pieces: Piece[] = []
  for (let i = 0; i < PIECE_COUNT; i++) {
    const thin = Math.random() > 0.45
    const width = thin ? 7 + Math.random() * 5 : 10 + Math.random() * 8
    const fromTop = Math.random() < 0.4
    pieces.push({
      id: i,
      left: Math.random() * 100,
      top: fromTop ? -5 : 18 + Math.random() * 40,
      delay: Math.random() * 0.35,
      duration: 2.1 + Math.random() * 1.5,
      color: COLORS[i % COLORS.length],
      width,
      height: thin ? 11 + Math.random() * 8 : width,
      drift: (Math.random() - 0.5) * 160,
      spin: (Math.random() > 0.5 ? 1 : -1) * (520 + Math.random() * 420)
    })
  }
  return pieces
}

export function ConfettiBurst({
  active,
  onComplete
}: {
  active: boolean
  onComplete?: () => void
}) {
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const [mounted, setMounted] = React.useState(false)
  const [pieces, setPieces] = React.useState<Piece[]>([])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      onCompleteRef.current?.()
      return
    }
    setPieces(spawnPieces())
    const timer = window.setTimeout(() => {
      onCompleteRef.current?.()
    }, DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [active])

  if (!mounted || !active || pieces.length === 0) return null

  return createPortal(
    <div className={styles.overlay} aria-hidden>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={styles.piece}
          style={
            {
              left: `${piece.left}%`,
              top: `${piece.top}%`,
              width: piece.width,
              height: piece.height,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              '--drift': `${piece.drift}px`,
              '--spin': `${piece.spin}deg`
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body
  )
}
