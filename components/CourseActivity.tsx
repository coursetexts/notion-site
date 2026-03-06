import React from 'react'
import styles from './CourseActivity.module.css'

type TabId = 'all' | 'comments' | 'annotations'

interface CommentReply {
  id: string
  author: string
  time: string
  body: string
  votes: number
  isReply?: boolean
}

interface Comment {
  id: string
  author: string
  time: string
  body: string
  votes: number
  replies?: CommentReply[]
}

const PLACEHOLDER_COMMENTS: Comment[] = [
  {
    id: '1',
    author: 'Babak Shammas',
    time: '12d',
    body: 'Can you guys please send me the options that we are proposing to the client tomorrow? I want to review our proposals for option 2 and 3 one more time. Had some concerns around the strategy.',
    votes: 1,
    replies: [
      {
        id: '1a',
        author: 'Aileen Luo',
        time: '11d',
        body: 'You can find it in 2. Robert Bartlett, The Natural and the Supernatural in the Middle Ages, chapter 5',
        votes: 0,
        isReply: true
      }
    ]
  }
]

const PLACEHOLDER_PARTICIPANTS = [
  { name: 'Babak Shammas', count: 1 },
  { name: 'Aileen Luo', count: 0 }
]

export const CourseActivity: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabId>('comments')
  const [commentInput, setCommentInput] = React.useState('')

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'all', label: 'All Activity' },
    { id: 'comments', label: 'Comments', count: 20 },
    { id: 'annotations', label: 'Annotations' }
  ]

  return (
    <section className={styles.root} aria-label="Course activity">
      <h2 className={styles.mainTitle}>Completed the course?</h2>

      <div className={styles.layout}>
        <div className={styles.main}>
          <nav className={styles.tabs} role="tablist" aria-label="Activity tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? styles.tabActive : styles.tab}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count != null && ` (${tab.count})`}
              </button>
            ))}
          </nav>

          {activeTab === 'comments' && (
            <div className={styles.commentsPanel}>
              <h3 className={styles.commentsHeading}>Comments (20)</h3>
              <div className={styles.addWrap}>
                <input
                  type="text"
                  className={styles.addInput}
                  placeholder="Add your thoughts...."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  aria-label="Add comment"
                />
              </div>
              <div className={styles.commentList}>
                {PLACEHOLDER_COMMENTS.map((comment) => (
                  <div key={comment.id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <span className={styles.author}>{comment.author}</span>
                      <span className={styles.time}>{comment.time}</span>
                    </div>
                    <div className={styles.voteRow}>
                      <button type="button" className={styles.voteBtn} aria-label="Upvote">
                        ↑
                      </button>
                      <span className={styles.voteCount}>{comment.votes}</span>
                      <button type="button" className={styles.voteBtn} aria-label="Downvote">
                        ↓
                      </button>
                      <button type="button" className={styles.caret} aria-label="More options">
                        ▾
                      </button>
                    </div>
                    <p className={styles.body}>{comment.body}</p>
                    <button type="button" className={styles.replyBtn}>
                      <span className={styles.replyIcon} aria-hidden>↩</span> Reply
                    </button>
                    {comment.replies?.map((reply) => (
                      <div key={reply.id} className={styles.reply}>
                        <div className={styles.commentHeader}>
                          <span className={styles.author}>✓ {reply.author}</span>
                          <span className={styles.time}>{reply.time}</span>
                        </div>
                        <div className={styles.voteRow}>
                          <button type="button" className={styles.voteBtn} aria-label="Upvote">
                            ↑
                          </button>
                          <span className={styles.voteCount}>{reply.votes}</span>
                          <button type="button" className={styles.voteBtn} aria-label="Downvote">
                            ↓
                          </button>
                          <button type="button" className={styles.caret} aria-label="More options">
                            ▾
                          </button>
                        </div>
                        <p className={styles.body}>{reply.body}</p>
                        <button type="button" className={styles.replyBtn}>
                          <span className={styles.replyIcon} aria-hidden>↩</span> Reply
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'all' && (
            <div className={styles.placeholderPanel}>
              <p className={styles.placeholderText}>All activity will appear here.</p>
            </div>
          )}

          {activeTab === 'annotations' && (
            <div className={styles.placeholderPanel}>
              <p className={styles.placeholderText}>Annotations will appear here.</p>
            </div>
          )}
        </div>

        <aside className={styles.participants} aria-label="Participants">
          {PLACEHOLDER_PARTICIPANTS.map((p, i) => (
            <div key={i} className={styles.participant}>
              <span className={styles.participantCount}>{p.count}</span>
              <span className={styles.participantName}>{p.name}</span>
            </div>
          ))}
        </aside>
      </div>
    </section>
  )
}
