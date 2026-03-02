import { Collection } from 'mongodb'
import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ACTIVITY_FEED_COLLECTION } from '../../types/activity-feed.types.js'

export const activityFeedService = {
  getCollection,
  ensureCollectionAndIndexes
}

let didEnsureActivityFeedIndexes = false

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
