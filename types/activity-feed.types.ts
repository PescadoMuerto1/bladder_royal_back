export const ACTIVITY_FEED_COLLECTION = 'activity_feed_items' as const

export const ACTIVITY_FEED_EVENT_TYPES = [
  'friend_request_received',
  'friend_request_accepted',
  'friend_request_declined',
  'friend_removed',
  'new_conquest',
  'territory_taken',
  'activity_feed_update',
  'test'
] as const

export type ActivityFeedEventType = (typeof ACTIVITY_FEED_EVENT_TYPES)[number]

export const ACTIVITY_FEED_TARGET_TYPES = [
  'marker',
  'user',
  'friend_request'
] as const

export type ActivityFeedTargetType = (typeof ACTIVITY_FEED_TARGET_TYPES)[number]

export interface ActivityFeedActorSnapshot {
  _id?: string
  id?: string
  username: string
  fullName?: string | null
  imgUrl?: string | null
  userColor?: string | null
  markerCount?: number | null
}

export interface ActivityFeedItem {
  _id?: string
  id?: string
  recipientUserId: string
  type: ActivityFeedEventType
  createdAt: Date
  actor?: ActivityFeedActorSnapshot | null
  targetId?: string | null
  targetType?: ActivityFeedTargetType
  title: string
  body?: string | null
  metadata?: Record<string, unknown>
  isRead: boolean
  readAt?: Date | null
  dedupeKey?: string
}
