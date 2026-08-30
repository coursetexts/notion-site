import * as React from 'react'
import { createPortal } from 'react-dom'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import styles from './FormSelect.module.css'

export type FormSelectOption<T extends string = string> = {
  value: T
  label: string
}

type FormSelectProps<T extends string> = {
  value: T
  options: FormSelectOption<T>[]
  onChange: (value: T) => void
  id?: string
  labelledBy?: string
  ariaLabel?: string
  disabled?: boolean
}

type MenuBox = {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
  openUp: boolean
}

function optionIndex<T extends string>(
  options: FormSelectOption<T>[],
  value: T
) {
  const i = options.findIndex((option) => option.value === value)
  return i < 0 ? 0 : i
}

export function FormSelect<T extends string>({
  value,
  options,
  onChange,
  id,
  labelledBy,
  ariaLabel,
  disabled
}: FormSelectProps<T>) {
  const reduceMotion = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(() =>
    optionIndex(options, value)
  )
  const [menuBox, setMenuBox] = React.useState<MenuBox | null>(null)
  const [portalReady, setPortalReady] = React.useState(false)

  const selected = options.find((option) => option.value === value) ?? options[0]

  React.useEffect(() => {
    setPortalReady(true)
  }, [])

  const updateMenuBox = React.useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const gutter = 8
    const spaceBelow = window.innerHeight - rect.bottom - gutter
    const spaceAbove = rect.top - gutter
    const openUp = spaceBelow < 168 && spaceAbove > spaceBelow
    const maxHeight = Math.min(280, Math.max(120, openUp ? spaceAbove : spaceBelow))
    setMenuBox({
      left: rect.left,
      width: rect.width,
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      maxHeight,
      openUp
    })
  }, [])

  React.useLayoutEffect(() => {
    if (!open) return
    setActiveIndex(optionIndex(options, value))
    updateMenuBox()
  }, [open, options, updateMenuBox, value])

  React.useEffect(() => {
    if (!open) return
    function onScrollOrResize() {
      updateMenuBox()
    }
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, updateMenuBox])

  const close = React.useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  const selectValue = React.useCallback(
    (next: T) => {
      onChange(next)
      close()
    },
    [close, onChange]
  )

  React.useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      event.preventDefault()
      close()
    }
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [close, open])

  function moveActive(delta: number) {
    if (!options.length) return
    setActiveIndex((prev) => (prev + delta + options.length) % options.length)
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (event.key === 'ArrowDown') moveActive(1)
      if (event.key === 'ArrowUp') moveActive(-1)
      if (event.key === 'Enter' || event.key === ' ') {
        const next = options[activeIndex]
        if (next) selectValue(next.value)
      }
    }
  }

  function onOptionKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActive(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActive(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const next = options[index]
      if (next) selectValue(next.value)
    }
  }

  const menu =
    portalReady && typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {open && menuBox ? (
              <motion.div
                key='form-select-menu'
                ref={menuRef}
                className={`${styles.menu}${
                  menuBox.openUp ? ` ${styles.menuUp}` : ''
                }`}
                style={{
                  position: 'fixed',
                  left: menuBox.left,
                  width: menuBox.width,
                  top: menuBox.top,
                  bottom: menuBox.bottom
                }}
                role='listbox'
                aria-labelledby={labelledBy}
                aria-label={labelledBy ? undefined : ariaLabel}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: menuBox.openUp ? 8 : -8, scale: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: menuBox.openUp ? 8 : -8, scale: 0.98 }
                }
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className={styles.list}
                  style={{ maxHeight: menuBox.maxHeight }}
                >
                  {options.map((option, index) => {
                    const isSelected = option.value === value
                    const isActive = index === activeIndex
                    return (
                      <button
                        key={option.value}
                        type='button'
                        role='option'
                        aria-selected={isSelected}
                        tabIndex={isActive ? 0 : -1}
                        className={`${styles.option}${
                          isSelected ? ` ${styles.optionSelected}` : ''
                        }${isActive ? ` ${styles.optionActive}` : ''}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => selectValue(option.value)}
                        onKeyDown={(event) => onOptionKeyDown(event, index)}
                      >
                        <span>{option.label}</span>
                        {isSelected ? (
                          <svg
                            className={styles.check}
                            viewBox='0 0 12 12'
                            fill='none'
                            aria-hidden
                          >
                            <path
                              d='M2.5 6.2L5 8.7L9.5 3.5'
                              stroke='currentColor'
                              strokeWidth='1.4'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )
      : null

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        id={id}
        type='button'
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ''}`}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((prev) => !prev)
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={styles.triggerLabel}>{selected?.label ?? ''}</span>
        <svg
          className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ''}`}
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 12 12'
          fill='none'
          aria-hidden
        >
          <path
            d='M2.5 4.5L6 8L9.5 4.5'
            stroke='currentColor'
            strokeWidth='1.3'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </button>
      {menu}
    </div>
  )
}
