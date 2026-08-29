function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const LAYOUT_MS = 580

function scrollNodeToCenter(node: HTMLElement, behavior: ScrollBehavior) {
  const scroller = node.closest('[data-graph-scroll]') as HTMLElement | null

  if (!scroller) {
    node.scrollIntoView({
      block: 'center',
      inline: 'center',
      behavior
    })
    return
  }

  const frame = scroller.getBoundingClientRect()
  const box = node.getBoundingClientRect()
  const left =
    scroller.scrollLeft +
    (box.left + box.width / 2) -
    (frame.left + frame.width / 2)
  const top =
    scroller.scrollTop +
    (box.top + box.height / 2) -
    (frame.top + frame.height / 2)
  const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)

  scroller.scrollTo({
    left: Math.min(maxLeft, Math.max(0, left)),
    top: Math.min(maxTop, Math.max(0, top)),
    behavior
  })
}

/**
 * Pan the nearest graph scroller so `node` sits in the middle of the map.
 * A second pass runs after the hover-layout animation so the node stays
 * centered if its neighbors expand.
 */
export function centerGraphNode(
  node: HTMLElement,
  behavior?: ScrollBehavior
) {
  const scrollBehavior: ScrollBehavior =
    behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth')

  scrollNodeToCenter(node, scrollBehavior)
  window.setTimeout(() => {
    if (node.isConnected) scrollNodeToCenter(node, scrollBehavior)
  }, LAYOUT_MS)
}
