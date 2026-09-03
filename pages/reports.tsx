import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

import { useAuthOptional } from '@/contexts/AuthContext'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { name as siteName } from '@/lib/config'
import {
  type ContentReport,
  type ContentReportTargetType,
  REPORTS_ADMIN_EMAIL,
  REPORTS_DASHBOARD_OPEN,
  canViewReportsDashboard,
  contentReportTypeLabel
} from '@/lib/content-reports'
import { listContentReports } from '@/lib/content-reports-db'
import styles from '@/styles/reports.module.css'

type FilterId = 'all' | ContentReportTargetType

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'annotation', label: 'Discussions' },
  { id: 'comment', label: 'Comments' },
  { id: 'learning_path', label: 'Learning paths' },
  { id: 'resource', label: 'Resources' }
]

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}

function reporterLabel(report: ContentReport): string {
  const name = report.reporterDisplayName?.trim()
  const email = report.reporterEmail?.trim()
  if (name && email) return `${name} (${email})`
  if (name) return name
  if (email) return email
  return 'Signed-in user'
}

export default function ReportsPage() {
  const auth = useAuthOptional()
  const [filter, setFilter] = useState<FilterId>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<ContentReport[]>([])

  const allowed = canViewReportsDashboard(auth?.user?.email)
  const waitingAuth = !REPORTS_DASHBOARD_OPEN && Boolean(auth?.isLoading)

  useEffect(() => {
    if (waitingAuth || !allowed) return
    let alive = true
    setLoading(true)
    setError(null)
    void listContentReports().then((result) => {
      if (!alive) return
      if (result.ok) {
        setReports(result.reports || [])
        setLoading(false)
        return
      }
      setReports([])
      setError(result.error || 'Reports could not be loaded.')
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [allowed, waitingAuth])

  const visible = useMemo(
    () =>
      filter === 'all'
        ? reports
        : reports.filter((report) => report.targetType === filter),
    [filter, reports]
  )

  return (
    <>
      <Head>
        <title>Reports – {siteName}</title>
        <link rel='preconnect' href='https://use.typekit.net' />
        <link rel='preconnect' href='https://p.typekit.net' />
        <link rel='stylesheet' href='https://use.typekit.net/vxh3dki.css' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin=''
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap'
          rel='stylesheet'
        />
      </Head>
      <main
        style={
          {
            '--home-side': 'clamp(20px, 4.03vw, 58px)',
            '--home-main-max': '1324px',
            '--home-content-max': '1000px',
            '--reports-shell-max': '1100px',
            '--home-footer-side': 'max(28px, 15.28vw)',
            minHeight: '100vh',
            background: 'var(--footer, #F8F7F4)',
            display: 'flex',
            flexDirection: 'column'
          } as React.CSSProperties
        }
      >
        <HomeHeader />
        <div style={{ flex: 1 }}>
          <section className={styles.topSection} aria-label='Reports'>
            <h1 className={styles.heading}>Reports</h1>
            <p className={styles.lede}>
              Content people have flagged on Coursetexts — discussions,
              comments, learning paths, and uploaded resources.
              {REPORTS_DASHBOARD_OPEN
                ? ' This page is open while we test it.'
                : ` Only ${REPORTS_ADMIN_EMAIL} can view this page.`}
            </p>
          </section>

          <div className={styles.pageBody}>
            {waitingAuth ? (
              <p className={styles.muted}>Loading…</p>
            ) : !allowed ? (
              <p className={styles.muted}>
                {auth?.user
                  ? 'You do not have access to this page.'
                  : 'Sign in to view reports.'}
              </p>
            ) : (
              <>
                <div
                  className={styles.filters}
                  role='group'
                  aria-label='Filter reports'
                >
                  {FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type='button'
                      className={
                        filter === item.id ? styles.filterActive : styles.filter
                      }
                      onClick={() => setFilter(item.id)}
                    >
                      {item.label}
                      {item.id === 'all'
                        ? ` (${reports.length})`
                        : ` (${
                            reports.filter((r) => r.targetType === item.id)
                              .length
                          })`}
                    </button>
                  ))}
                </div>
                {loading ? (
                  <p className={styles.muted}>Loading reports…</p>
                ) : error ? (
                  <p className={styles.muted}>{error}</p>
                ) : visible.length === 0 ? (
                  <p className={styles.muted}>No reports yet.</p>
                ) : (
                  <div className={styles.list}>
                    {visible.map((report) => {
                      const title =
                        report.targetTitle?.trim() ||
                        contentReportTypeLabel(report.targetType)
                      const href = report.targetUrl?.trim() || ''
                      return (
                        <article key={report.id} className={styles.card}>
                          <div className={styles.cardTop}>
                            <span className={styles.type}>
                              {contentReportTypeLabel(report.targetType)}
                            </span>
                            <span className={styles.status}>
                              {report.status}
                            </span>
                            <span className={styles.when}>
                              {formatWhen(report.createdAt)}
                            </span>
                          </div>
                          <h2 className={styles.title}>
                            {href ? (
                              <a
                                className={styles.titleLink}
                                href={href}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                {title}
                              </a>
                            ) : (
                              title
                            )}
                          </h2>
                          {report.targetSnippet ? (
                            <p className={styles.snippet}>
                              {report.targetSnippet}
                            </p>
                          ) : null}
                          <p className={styles.reason}>
                            <span className={styles.reasonLabel}>Why: </span>
                            {report.reason}
                          </p>
                          <p className={styles.reporter}>
                            <span className={styles.reporterLabel}>
                              Reported by:{' '}
                            </span>
                            <Link
                              href={`/profile/${report.reporterId}`}
                              className={styles.profileLink}
                            >
                              {reporterLabel(report)}
                            </Link>
                          </p>
                        </article>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <HomeFooterSection />
      </main>
    </>
  )
}
