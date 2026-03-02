import mongoDB, { Collection } from 'mongodb'
import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import {
  ACTIVITY_FEED_COLLECTION,
  ActivityFeedItem,
  ActivityFeedPage,
  GetActivityFeedPageOptions
} from '../../types/activity-feed.types.js'

const { ObjectId } = mongoDB
const DEFAULT_FEED_LIMIT = 20
const MAX_FEED_LIMIT = 50

export const activityFeedService = {
  getCollection,
  ensureCollectionAndIndexes,
  getFeedPage,
  getUnreadCount
}

let didEnsureActivityFeedIndexes = false

interface FeedCursorPayload {
  createdAt: string
  id: string
}

interface DecodedFeedCursor {
  createdAt: Date
  objectId: mongoDB.ObjectId
}

async function getCollection(): Promise<Collection> {
  return dbService.getCollection(ACTIVITY_FEED_COLLECTION)
}

async function ensureCollectionAndIndexes(): Promise<void> {
  if (didEnsureActivityFeedIndexes) return

  try {
    const collection = await getCollection()

    await Promise.all([
      collection.createIndex(
        { recipientUserId: 1, createdAt: -1, _id: -1 },
        { name: 'recipient_createdAt__id_desc' }
      ),
      collection.createIndex(
        { recipientUserId: 1, isRead: 1, createdAt: -1 },
        { name: 'recipient_isRead_createdAt_desc' }
      ),
      collection.createIndex(
        { recipientUserId: 1, dedupeKey: 1 },
        {
          name: 'recipient_dedupeKey_unique',
          unique: true,
          partialFilterExpression: {
            dedupeKey: { $exists: true, $type: 'string' }
          }
        }
      )
    ])

    didEnsureActivityFeedIndexes = true
    logger.info('Activity feed collection and indexes are ready')
  } catch (err) {
    logger.error('Failed to initialize activity feed collection/indexes', err)
    throw err
  }
}

async function getFeedPage(
  recipientUserId: string,
  options: GetActivityFeedPageOptions = {}
): Promise<ActivityFeedPage> {
  try {
    const normalizedRecipientUserId = normalizeRecipientUserId(recipientUserId)
    const limit = normalizeLimit(options.limit)
    const decodedCursor = decodeCursor(options.cursor)

    const query: any = { recipientUserId: normalizedRecipientUserId }
    if (decodedCursor) {
      query.$or = [
        { createdAt: { $lt: decodedCursor.createdAt } },
        { createdAt: decodedCursor.createdAt, _id: { $lt: decodedCursor.objectId } }
      ]
    }

    const collection = await getCollection()
    const docs = await collection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .toArray()

    const hasMore = docs.length > limit
    const pageDocs = hasMore ? docs.slice(0, limit) : docs
    const items = pageDocs.map(toActivityFeedItem)
    const nextCursor = hasMore ? buildNextCursor(pageDocs) : null

    return {
      items,
      hasMore,
      nextCursor
    }
  } catch (err) {
    logger.error('Failed to get activity feed page', err)
    throw err
  }
}

async function getUnreadCount(recipientUserId: string): Promise<number> {
  try {
    const normalizedRecipientUserId = normalizeRecipientUserId(recipientUserId)
    const collection = await getCollection()
    return collection.countDocuments({
      recipientUserId: normalizedRecipientUserId,
      isRead: false
    })
  } catch (err) {
    logger.error('Failed to get activity feed unread count', err)
    throw err
  }
}

function buildNextCursor(docs: any[]): string | null {
  if (docs.length === 0) return null

  const lastDoc = docs[docs.length - 1]
  const id = toObjectIdString(lastDoc._id)
  const createdAt = normalizeDate(lastDoc.createdAt, id)

  return encodeCursor({
    id,
    createdAt: createdAt.toISOString()
  })
}

function toActivityFeedItem(doc: any): ActivityFeedItem {
  const id = toObjectIdString(doc._id)

  return {
    ...(doc as ActivityFeedItem),
    _id: id,
    id,
    createdAt: normalizeDate(doc.createdAt, id),
    metadata: isPlainObject(doc.metadata) ? doc.metadata : {},
    isRead: typeof doc.isRead === 'boolean' ? doc.isRead : false,
    readAt: normalizeOptionalDate(doc.readAt)
  }
}

function normalizeRecipientUserId(recipientUserId: string): string {
  const normalized = recipientUserId?.trim()
  if (!normalized) {
    throw new Error('recipientUserId is required')
  }
  return normalized
}

function normalizeLimit(limit?: number): number {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return DEFAULT_FEED_LIMIT
  const parsed = Math.floor(limit)
  if (parsed <= 0) return DEFAULT_FEED_LIMIT
  return Math.min(parsed, MAX_FEED_LIMIT)
}

function encodeCursor(payload: FeedCursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

function decodeCursor(cursor?: string | null): DecodedFeedCursor | null {
  if (!cursor) return null

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64').toString('utf8')
    ) as Partial<FeedCursorPayload>

    if (typeof parsed.id !== 'string' || !ObjectId.isValid(parsed.id)) {
      throw new Error('Invalid cursor id')
    }

    if (typeof parsed.createdAt !== 'string') {
      throw new Error('Invalid cursor createdAt')
    }

    const createdAt = new Date(parsed.createdAt)
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor createdAt')
    }

    return {
      createdAt,
      objectId: new ObjectId(parsed.id)
    }
  } catch (err) {
    logger.warn('Invalid activity feed cursor provided', err)
    throw new Error('Invalid cursor')
  }
}

function normalizeDate(value: unknown, idFallback: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value

  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  if (ObjectId.isValid(idFallback)) {
    return new ObjectId(idFallback).getTimestamp()
  }

  return new Date(0)
}

function normalizeOptionalDate(value: unknown): Date | null | undefined {
  if (typeof value === 'undefined') return undefined
  if (value === null) return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) return value

  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  return null
}

function toObjectIdString(idValue: unknown): string {
  if (typeof idValue === 'string' && ObjectId.isValid(idValue)) return idValue
  if (idValue instanceof ObjectId) return idValue.toString()
  throw new Error('Invalid activity feed item _id')
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
