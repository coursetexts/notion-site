import * as React from 'react'

import '@tiptap/extension-youtube'
import type { Editor } from '@tiptap/react'

import {
  insertBlockMathPrompt,
  insertInlineMathPrompt,
  setImageFromUrlOrFile,
  setLinkFromUrlPrompt
} from '@/lib/tiptap-editor-image'
import { isAllowedPdfEmbedUrl } from '@/lib/tiptap-notebook-pdf'
import {
  indentNotesBlock,
  insertNotesDivider,
  insertNotesTable,
  outdentNotesBlock,
  toggleNotesHighlight,
  toggleNotesUnderline
} from '@/lib/tiptap-notes-blocks'
import { extractYouTubeVideoId } from '@/lib/youtube-thumbnail'

import styles from './NotesEditorToolbar.module.css'

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
      {children}
    </svg>
  )
}

function LetterIcon({
  children,
  italic,
  underline
}: {
  children: string
  italic?: boolean
  underline?: boolean
}) {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
      <text
        x='8'
        y='12.2'
        textAnchor='middle'
        fill='currentColor'
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize='12.5'
        fontWeight='700'
        fontStyle={italic ? 'italic' : 'normal'}
      >
        {children}
      </text>
      {underline ? (
        <path
          d='M3 14.25h10'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
        />
      ) : null}
    </svg>
  )
}

function BoldIcon() {
  return <LetterIcon>B</LetterIcon>
}

function ItalicIcon() {
  return <LetterIcon italic>I</LetterIcon>
}

function UnderlineIcon() {
  return <LetterIcon underline>U</LetterIcon>
}

function HeadingIcon() {
  return <LetterIcon>H</LetterIcon>
}

function HeadingLevelIcon({ level }: { level: 1 | 2 | 3 }) {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden>
      <text
        x='5.2'
        y='12.2'
        textAnchor='middle'
        fill='currentColor'
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize='12.5'
        fontWeight='700'
      >
        H
      </text>
      <text
        x='12.1'
        y='13.2'
        textAnchor='middle'
        fill='currentColor'
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize='7'
        fontWeight='700'
      >
        {level}
      </text>
    </svg>
  )
}

function HighlightIcon() {
  return (
    <Icon>
      <path
        d='M3.2 13.4h3.4L13.4 6.6a1.7 1.7 0 0 0 0-2.4L11.8 2.6a1.7 1.7 0 0 0-2.4 0L2.6 9.4v4h.6z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <path
        d='M8.7 4.3l3 3'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M2.6 13.4h5.2'
        stroke='#e4c44a'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </Icon>
  )
}

function BulletsIcon() {
  return (
    <Icon>
      <circle cx='3.1' cy='4' r='1.05' fill='currentColor' />
      <circle cx='3.1' cy='8' r='1.05' fill='currentColor' />
      <circle cx='3.1' cy='12' r='1.05' fill='currentColor' />
      <path
        d='M6.2 4h7.3M6.2 8h7.3M6.2 12h7.3'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </Icon>
  )
}

function NumberedIcon() {
  return (
    <Icon>
      <path
        d='M6.4 4h7.1M6.4 8h7.1M6.4 12h7.1'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <text
        x='1.15'
        y='5.35'
        fill='currentColor'
        fontFamily="var(--font-sans, 'Hanken Grotesk', sans-serif)"
        fontSize='5.4'
        fontWeight='700'
      >
        1
      </text>
      <text
        x='1.15'
        y='9.35'
        fill='currentColor'
        fontFamily="var(--font-sans, 'Hanken Grotesk', sans-serif)"
        fontSize='5.4'
        fontWeight='700'
      >
        2
      </text>
      <text
        x='1.15'
        y='13.35'
        fill='currentColor'
        fontFamily="var(--font-sans, 'Hanken Grotesk', sans-serif)"
        fontSize='5.4'
        fontWeight='700'
      >
        3
      </text>
    </Icon>
  )
}

function IndentIcon() {
  return (
    <Icon>
      <path
        d='M7.2 3.6h6.5M9.4 8h4.3M9.4 12.4h4.3'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M2.2 8h5.2M5.1 5.4L7.7 8l-2.6 2.6'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Icon>
  )
}

function OutdentIcon() {
  return (
    <Icon>
      <path
        d='M7.2 3.6h6.5M7.2 8h6.5M7.2 12.4h6.5'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M8.2 8H3M5.3 5.4L2.7 8l2.6 2.6'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Icon>
  )
}

function QuoteIcon() {
  return (
    <Icon>
      <path
        d='M3 12.2V8.2C3 6.1 4.5 4.7 6.6 4.7v1.7c-1 0-1.8.7-1.8 1.8H6.6v4H3zm6.4 0V8.2c0-2.1 1.5-3.5 3.6-3.5v1.7c-1 0-1.8.7-1.8 1.8h1.8v4H9.4z'
        fill='currentColor'
      />
    </Icon>
  )
}

function LinkIcon() {
  return (
    <Icon>
      <path
        d='M6.7 9.4L5.4 10.7a2.15 2.15 0 1 1-3-3L4.7 5.4a2.15 2.15 0 0 1 3 0'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M9.3 6.6l1.3-1.3a2.15 2.15 0 1 1 3 3L11.3 10.6a2.15 2.15 0 0 1-3 0'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </Icon>
  )
}

function ImageIcon() {
  return (
    <Icon>
      <rect
        x='2'
        y='3'
        width='12'
        height='10'
        rx='1.4'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <circle cx='5.6' cy='6.3' r='1.05' fill='currentColor' />
      <path
        d='M2.4 11.4l3.2-3.1 2.4 2.3 2.3-2.5 3.3 3.3'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
    </Icon>
  )
}

function LatexIcon() {
  return (
    <Icon>
      <path
        d='M1.5 8.3h1.8L5.6 13.4 8.1 3.2h3.2'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <text
        x='10.3'
        y='10.4'
        fill='currentColor'
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize='8'
        fontStyle='italic'
      >
        x
      </text>
    </Icon>
  )
}

function LatexBlockIcon() {
  return (
    <Icon>
      <rect
        x='1.6'
        y='2.8'
        width='12.8'
        height='10.4'
        rx='1.2'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path
        d='M4.1 8.1h1.5L7.2 11.4 8.8 4.8h3.3'
        stroke='currentColor'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Icon>
  )
}

function TableIcon() {
  return (
    <Icon>
      <rect
        x='2'
        y='3'
        width='12'
        height='10'
        rx='1.2'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path
        d='M2 7.2h12M2 10.8h12M6.2 3v10M9.8 3v10'
        stroke='currentColor'
        strokeWidth='1.5'
      />
    </Icon>
  )
}

function LineIcon() {
  return (
    <Icon>
      <path
        d='M2.2 8h11.6'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </Icon>
  )
}

function YoutubeIcon() {
  return (
    <Icon>
      <rect
        x='1.4'
        y='3.6'
        width='13.2'
        height='8.8'
        rx='2.2'
        stroke='currentColor'
        strokeWidth='1.5'
      />
      <path d='M6.6 6.2v3.6L10.4 8 6.6 6.2z' fill='currentColor' />
    </Icon>
  )
}

function PdfIcon() {
  return (
    <Icon>
      <path
        d='M4 2.4h5.2L12.6 6v7.6H4V2.4z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <path
        d='M9.2 2.4V6h3.4'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <path
        d='M5.6 9.2h4.8M5.6 11.4h3.2'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </Icon>
  )
}

function ExportPdfIcon() {
  return (
    <Icon>
      <path
        d='M4 2.4h5.2L12.6 6v2.2'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <path
        d='M9.2 2.4V6h3.4'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <path
        d='M8 8.4v5.4M6.1 11.9L8 13.8l1.9-1.9'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </Icon>
  )
}

function ExpandIcon() {
  return (
    <svg
      className={styles.expandIcon}
      width='18'
      height='18'
      viewBox='0 0 18 18'
      fill='none'
      aria-hidden
    >
      <path
        d='M10.5 2.5H15.5V7.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M15.5 2.5L10 8'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M7.5 15.5H2.5V10.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M2.5 15.5L8 10'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function insertYoutubePrompt(editor: Editor) {
  const url = window.prompt('YouTube URL')
  if (url === null || !url.trim()) return
  const trimmed = url.trim()
  if (!extractYouTubeVideoId(trimmed)) {
    window.alert('Please paste a valid YouTube link.')
    return
  }
  editor.chain().focus().setYoutubeVideo({ src: trimmed }).run()
}

function insertPdfPrompt(editor: Editor) {
  const url = window.prompt(
    'PDF URL (https link to the file — must allow embedding in an iframe; many academic PDFs work)',
    'https://'
  )
  if (url === null || !url.trim()) return
  const trimmed = url.trim()
  if (!isAllowedPdfEmbedUrl(trimmed)) {
    window.alert('Please paste an http(s) URL to a PDF file.')
    return
  }
  const ok = editor.chain().focus().setNotebookPdf({ src: trimmed }).run()
  if (!ok) {
    window.alert('Could not insert PDF embed.')
  }
}

function ToolBtn({
  label,
  active,
  disabled,
  onClick,
  children
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      className={`${styles.toolBtn}${active ? ` ${styles.toolBtnActive}` : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      aria-busy={disabled ? true : undefined}
      data-tooltip={label}
    >
      {children}
    </button>
  )
}

export function NotesEditorToolbar({
  editor,
  imageInputRef,
  onExpand,
  onExportPdf,
  exportingPdf = false,
  headingLevels = [2],
  showYoutube = false,
  showPdf = false,
  className,
  disabled = false,
  saveStatus = null
}: {
  editor: Editor
  imageInputRef: React.RefObject<HTMLInputElement | null>
  onExpand?: () => void
  onExportPdf?: () => void
  exportingPdf?: boolean
  headingLevels?: Array<1 | 2 | 3>
  showYoutube?: boolean
  showPdf?: boolean
  className?: string
  disabled?: boolean
  saveStatus?: 'saving' | 'saved' | null
}) {
  const showHeadingLevels = headingLevels.length > 1
  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving'
      : saveStatus === 'saved'
      ? 'Saved'
      : null

  return (
    <div
      className={`${styles.toolbar}${
        onExpand ? ` ${styles.toolbarWithExpand}` : ''
      }${disabled ? ` ${styles.toolbarDisabled}` : ''}${
        className ? ` ${className}` : ''
      }`}
      role='toolbar'
      aria-label='Note formatting'
      aria-disabled={disabled}
    >
      <div className={styles.toolbarTools}>
        <div className={styles.group}>
          <ToolBtn
            label='Bold'
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon />
          </ToolBtn>
          <ToolBtn
            label='Italic'
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon />
          </ToolBtn>
          <ToolBtn
            label='Highlight'
            active={editor.isActive('highlight')}
            onClick={() => toggleNotesHighlight(editor)}
          >
            <HighlightIcon />
          </ToolBtn>
          <ToolBtn
            label='Underline'
            active={editor.isActive('underline')}
            onClick={() => toggleNotesUnderline(editor)}
          >
            <UnderlineIcon />
          </ToolBtn>
        </div>
        <div className={styles.group}>
          <ToolBtn
            label='Bullets'
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <BulletsIcon />
          </ToolBtn>
          <ToolBtn
            label='Numbered'
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <NumberedIcon />
          </ToolBtn>
          <ToolBtn label='Indent' onClick={() => indentNotesBlock(editor)}>
            <IndentIcon />
          </ToolBtn>
          <ToolBtn label='Outdent' onClick={() => outdentNotesBlock(editor)}>
            <OutdentIcon />
          </ToolBtn>
        </div>
        <div className={styles.group}>
          {showHeadingLevels ? (
            headingLevels.map((level) => (
              <ToolBtn
                key={level}
                label={`Heading ${level}`}
                active={editor.isActive('heading', { level })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level }).run()
                }
              >
                <HeadingLevelIcon level={level} />
              </ToolBtn>
            ))
          ) : (
            <ToolBtn
              label='Heading'
              active={editor.isActive('heading', {
                level: headingLevels[0] ?? 2
              })}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: headingLevels[0] ?? 2 })
                  .run()
              }
            >
              <HeadingIcon />
            </ToolBtn>
          )}
          <ToolBtn
            label='Quote'
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <QuoteIcon />
          </ToolBtn>
        </div>
        <div className={styles.group}>
          <ToolBtn
            label='Link'
            active={editor.isActive('link')}
            onClick={() => setLinkFromUrlPrompt(editor)}
          >
            <LinkIcon />
          </ToolBtn>
          <ToolBtn
            label='Image'
            onClick={() =>
              setImageFromUrlOrFile(editor, () =>
                imageInputRef.current?.click()
              )
            }
          >
            <ImageIcon />
          </ToolBtn>
          {showYoutube ? (
            <ToolBtn
              label='YouTube'
              onClick={() => insertYoutubePrompt(editor)}
            >
              <YoutubeIcon />
            </ToolBtn>
          ) : null}
          {showPdf ? (
            <ToolBtn label='PDF' onClick={() => insertPdfPrompt(editor)}>
              <PdfIcon />
            </ToolBtn>
          ) : null}
        </div>
        <div className={styles.group}>
          <ToolBtn label='LaTeX' onClick={() => insertInlineMathPrompt(editor)}>
            <LatexIcon />
          </ToolBtn>
          <ToolBtn
            label='LaTeX block'
            onClick={() => insertBlockMathPrompt(editor)}
          >
            <LatexBlockIcon />
          </ToolBtn>
        </div>
        <div className={styles.group}>
          <ToolBtn label='Table' onClick={() => insertNotesTable(editor)}>
            <TableIcon />
          </ToolBtn>
          <ToolBtn label='Line' onClick={() => insertNotesDivider(editor)}>
            <LineIcon />
          </ToolBtn>
          {onExportPdf ? (
            <ToolBtn
              label={exportingPdf ? 'Exporting PDF' : 'Export PDF'}
              disabled={exportingPdf}
              onClick={onExportPdf}
            >
              <ExportPdfIcon />
            </ToolBtn>
          ) : null}
        </div>
      </div>
      {saveLabel ? (
        <span className={styles.saveStatus} aria-live='polite'>
          {saveLabel}
        </span>
      ) : null}
      {onExpand ? (
        <button
          type='button'
          className={styles.expandIconBtn}
          onClick={onExpand}
          aria-label='Expand notes'
          data-tooltip='Expand notes'
        >
          <ExpandIcon />
        </button>
      ) : null}
    </div>
  )
}
