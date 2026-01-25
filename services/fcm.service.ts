import admin from 'firebase-admin'
import fs from 'fs'
import mongoDB from 'mongodb'

import { dbService } from './db.service.js'
import { logger } from './logger.service.js'

const { ObjectId } = mongoDB
let initialized = false

export function initFcm(): void {
  if (initialized) return
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (!path) {
    logger.warn('FIREBASE_SERVICE_ACCOUNT_PATH not set; FCM disabled')
    return
  }
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(path, 'utf8'))
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    initialized = true
    logger.info('FCM initialized')
  } catch (err) {
    logger.error('FCM init failed', err)
  }
}

export interface FcmPayload {
  userId: string
  title: string
  body: string
  data: Record<string, string>
}

export async function sendFcmToUser(payload: FcmPayload): Promise<void> {
  if (!initialized || !admin.apps.length) return
  const tokens = await getFcmTokensForUser(payload.userId)
  if (tokens.length === 0) {
    logger.info(`No FCM tokens for user ${payload.userId}`)
    return
  }
  const message: admin.messaging.MulticastMessage = {
    notification: { title: payload.title, body: payload.body },
    data: payload.data,
    tokens,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default', contentAvailable: true } } },
  }
  try {
    const res = await admin.messaging().sendEachForMulticast(message)
    logger.info(
      `FCM sent to ${payload.userId}: ${res.successCount} success, ${res.failureCount} failure`
    )
    await pruneInvalidTokens(payload.userId, tokens, res)
  } catch (err) {
    logger.error('FCM send failed', err)
  }
}

async function getFcmTokensForUser(userId: string): Promise<string[]> {
  const col = await dbService.getCollection('user')
  const user = await col.findOne({ _id: new ObjectId(userId) })
  const tokens = (user?.fcmTokens as string[] | undefined) ?? []
  return tokens.filter(Boolean)
}

async function pruneInvalidTokens(
  userId: string,
  tokens: string[],
  res: admin.messaging.BatchResponse
): Promise<void> {
  const failed = tokens.filter((_, i) => !res.responses[i].success)
  if (failed.length === 0) return
  const col = await dbService.getCollection('user')
  const user = await col.findOne({ _id: new ObjectId(userId) })
  const current = ((user?.fcmTokens as string[] | undefined) ?? []).filter(
    (t) => !failed.includes(t)
  )
  await col.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { fcmTokens: current } }
  )
}
