/**
 * Run a React state update without jumping the window (or an inner scroller)
 * back to the top. Official course “Next” keeps the viewport still; topic
 * swaps on learning paths remount the focused button and can reset scroll.
 */
export function restoreScrollAfter(
  update: () => void,
  scroller?: HTMLElement | null
) {
  const x = window.scrollX
  const y = window.scrollY
  const inner = scroller?.scrollTop ?? 0
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
  update()
  const restore = () => {
    window.scrollTo(x, y)
    if (scroller) scroller.scrollTop = inner
  }
  restore()
  requestAnimationFrame(() => {
    restore()
    requestAnimationFrame(restore)
  })
}
