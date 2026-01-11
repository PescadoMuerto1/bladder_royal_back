import { Config } from '../types/config.types.js'

const config: Config = {
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  dbURL: process.env.MONGO_URL || '',
  dbName: process.env.DB_NAME || 'bladder_db',
}

export default config
