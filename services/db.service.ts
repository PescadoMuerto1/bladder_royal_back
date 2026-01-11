import mongoDB, { Db, Collection } from 'mongodb'
import { config } from '../config/index.js'
import { logger } from './logger.service.js'

const { MongoClient: Client } = mongoDB

export const dbService = {
  getCollection
}

let dbConn: Db | null = null

async function getCollection(collectionName: string): Promise<Collection> {
  try {
    const db = await connect()
    const collection = await db.collection(collectionName)
    return collection
  } catch (err) {
    logger.error('Failed to get Mongo collection', err)
    throw err
  }
}

async function connect(): Promise<Db> {
  if (dbConn) return dbConn
  try {
    if (!config.dbURL) {
      throw new Error('Database URL not configured')
    }
    const client = await Client.connect(config.dbURL)
    const db = client.db(config.dbName)
    dbConn = db
    return db
  } catch (err) {
    logger.error('Cannot Connect to DB', err)
    throw err
  }
}
