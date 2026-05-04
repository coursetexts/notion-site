import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { HomeFooterSection } from '@/components/HomeFooterSection'
import { HomeHeader } from '@/components/HomeHeader'
import { name as siteName } from '@/lib/config'
import {
  type UserDirectoryEntry,
  listUsersDirectory
} from '@/lib/users-directory-db'
import styles from '@/styles/users.module.css'

const PAGE_SIZE = 24

function buildUsersQuery(q: {
  page: number
  q: string
  interest: string
}): string {
  const p = new URLSearchParams()
  if (q.page > 1) p.set('page', String(q.page))
  if (q.q.trim()) p.set('q', q.q.trim())
  if (q.interest.trim()) p.set('interest', q.interest.trim())
  const s = p.toString()
  return s ? `/users?${s}` : '/users'
}

function paginationItems(
  current: number,
  total: number
): Array<number | 'ellipsis'> {
  if (total <= 11) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const set = new Set<number>([1, total, current])
  for (let d = -2; d <= 2; d++) {
    const p = current + d
    if (p >= 1 && p <= total) set.add(p)
  }
  const sorted = [...set].sort((a, b) => a - b)
  const out: Array<number | 'ellipsis'> = []
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]
    const prev = sorted[i - 1]
    if (prev != null && n - prev > 1) out.push('ellipsis')
    out.push(n)
  }
  return out
}

export default function UsersPage() {
  const router = useRouter()
  const [list, setList] = useState<UserDirectoryEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [formQ, setFormQ] = useState('')
  const [formInterest, setFormInterest] = useState('')

  const page = useMemo(() => {
    const raw = router.query.page
    const n = typeof raw === 'string' ? parseInt(raw, 10) : 1
    return Number.isFinite(n) && n >= 1 ? n : 1
  }, [router.query.page])

  const urlQ = typeof router.query.q === 'string' ? router.query.q : ''
  const urlInterest =
    typeof router.query.interest === 'string' ? router.query.interest : ''

  useEffect(() => {
    if (!router.isReady) return
    setFormQ(urlQ)
    setFormInterest(urlInterest)
  }, [router.isReady, urlQ, urlInterest])

  const load = useCallback(async () => {
    if (!router.isReady) return
    setLoading(true)
    const { users, total: t } = await listUsersDirectory({
      page,
      pageSize: PAGE_SIZE,
      search: urlQ,
      interest: urlInterest
    })
    setList(users)
    setTotal(t)
    setLoading(false)
  }, [router.isReady, page, urlQ, urlInterest])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageLinks = useMemo(
    () => paginationItems(page, totalPages),
    [page, totalPages]
  )

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    void router.push(
      buildUsersQuery({
        page: 1,
        q: formQ,
        interest: formInterest
      })
    )
  }

  return (
    <>
      <Head>
        <title>Users – {siteName}</title>
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
            '--users-shell-max': '1100px',
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
          <section className={styles.topSection} aria-label='Users directory'>
            <h1 className={styles.heading}>Users</h1>
            <form className={styles.filtersForm} onSubmit={applyFilters}>
              <div className={styles.searchBar}>
                <input
                  type='search'
                  className={styles.searchInput}
                  value={formQ}
                  onChange={(e) => setFormQ(e.target.value)}
                  placeholder='Search by name'
                  aria-label='Filter by name'
                  autoComplete='off'
                />
                <span className={styles.fieldDivider} aria-hidden />
                <input
                  type='search'
                  className={styles.searchInput}
                  value={formInterest}
                  onChange={(e) => setFormInterest(e.target.value)}
                  placeholder='Interest tag'
                  aria-label='Filter by interest tag'
                  autoComplete='off'
                />
                <button type='submit' className={styles.applyBtn}>
                  Apply
                </button>
              </div>
            </form>
          </section>

          <div className={styles.pageBody}>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : list.length === 0 ? (
          <p className={styles.muted}>No users match these filters.</p>
        ) : (
          <div className={styles.grid}>
            {list.map((u) => {
              const name =
                u.display_name?.trim() ||
                u.user_id.slice(0, 8) + '…'
              return (
                <div key={u.user_id} className={styles.card}>
                  <Link
                    href={`/profile/${u.user_id}`}
                    legacyBehavior={false}
                    className={styles.cardTop}
                  >
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt=''
                        className={styles.avatar}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder} aria-hidden>
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={styles.meta}>
                      <p className={styles.name}>{name}</p>
                      <p className={styles.followers}>
                        {u.follower_count}{' '}
                        {u.follower_count === 1 ? 'follower' : 'followers'}
                      </p>
                    </div>
                  </Link>
                  <div className={styles.tags}>
                    {u.tags.length === 0
                      ? null
                      : u.tags.map((t, i) => (
                          <React.Fragment key={t}>
                            {i > 0 ? (
                              <span className={styles.tagSep}>, </span>
                            ) : null}
                            <Link
                              href={buildUsersQuery({
                                page: 1,
                                q: urlQ,
                                interest: t
                              })}
                              legacyBehavior={false}
                              className={styles.tag}
                            >
                              {t}
                            </Link>
                          </React.Fragment>
                        ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && total > 0 ? (
          <nav className={styles.pagination} aria-label='Pagination'>
            {page > 1 ? (
              <Link
                href={buildUsersQuery({
                  page: page - 1,
                  q: urlQ,
                  interest: urlInterest
                })}
                legacyBehavior={false}
                className={styles.pageBtn}
              >
                Prev
              </Link>
            ) : (
              <span className={styles.pageBtn} style={{ opacity: 0.4 }}>
                Prev
              </span>
            )}
            {pageLinks.map((item, idx) =>
              item === 'ellipsis' ? (
                <span
                  key={`e-${idx}`}
                  className={styles.pageEllipsis}
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Link
                  key={item}
                  href={buildUsersQuery({
                    page: item,
                    q: urlQ,
                    interest: urlInterest
                  })}
                  legacyBehavior={false}
                  className={
                    item === page
                      ? `${styles.pageBtn} ${styles.pageBtnActive}`
                      : styles.pageBtn
                  }
                >
                  {item}
                </Link>
              )
            )}
            {page < totalPages ? (
              <Link
                href={buildUsersQuery({
                  page: page + 1,
                  q: urlQ,
                  interest: urlInterest
                })}
                legacyBehavior={false}
                className={styles.pageBtn}
              >
                Next
              </Link>
            ) : (
              <span className={styles.pageBtn} style={{ opacity: 0.4 }}>
                Next
              </span>
            )}
            <span className={styles.muted} style={{ marginLeft: '0.5rem' }}>
              Page {page} of {totalPages} ({total} users)
            </span>
          </nav>
        ) : null}

        <section
          className={styles.discordCta}
          aria-labelledby='discord-cta-title'
        >
          <div className={styles.discordCtaInner}>
            <div className={styles.discordCtaImageWrap}>
              <img
                src='/images/coursepage/FurnitureSignInCTA.png'
                alt=''
                className={styles.discordCtaImage}
                width={280}
                height={200}
                loading='lazy'
              />
            </div>
            <div className={styles.discordCtaCopy}>
              <h2
                id='discord-cta-title'
                className={styles.discordCtaTitle}
              >
                Join the Coursetexts Discord
              </h2>
              <p className={styles.discordCtaBody}>
                Meet other learners, swap study tips, and get help when you
                get stuck — all in one friendly community.
              </p>
              <a
                href='https://discord.gg/6xBECjtC55'
                className={styles.discordCtaBtn}
                target='_blank'
                rel='noopener noreferrer'
              >
                Join Discord
              </a>
            </div>
          </div>
        </section>
          </div>
        </div>
        <HomeFooterSection />
      </main>
    </>
  )
}
