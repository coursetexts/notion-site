/**
 * Karma updates.
 *
 * `profiles.karma_score` is displayed next to usernames (see migration 025),
 * but HOW votes translate into karma is not decided yet, so this module is
 * deliberately a no-op. Call sites are already wired (comment/vote flows) so
 * the rules can land here without touching the UI.
 */

export interface KarmaVoteEvent {
  /** The user whose content received the vote. */
  recipientUserId: string
  /** The user who cast (or cleared) the vote. */
  voterUserId: string
  targetType: 'resource_comment' | 'comment' | 'annotation'
  targetId: string
  /** New vote value; null means the vote was removed. */
  value: 1 | -1 | null
  /** Previous vote value, if any. */
  previousValue: 1 | -1 | null
}

// TODO: karma scoring rules are undecided. When they are, implement the
// update here (likely a Postgres function + trigger so scores can't be
// forged client-side) and remove this stub. Do NOT invent rules in the UI.
export async function applyKarmaForVote(event: KarmaVoteEvent): Promise<void> {
  // Intentionally a no-op until scoring rules are decided.
  void event
}
