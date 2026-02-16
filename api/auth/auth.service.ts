import Cryptr from 'cryptr'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import { userService } from '../user/user.service.js'
import { logger } from '../../services/logger.service.js'
import { config } from '../../config/index.js'
import { SignupCredentials, LoginTokenPayload } from '../../types/auth.types'
import { User } from '../../types/user.types'
import mongoDB from 'mongodb'
const { ObjectId } = mongoDB
import { dbService } from '../../services/db.service.js'

const secret = process.env.SECRET || 'Secret-Puk-1234'
logger.info('Auth Service initialized with secret ending in: ...' + secret.substring(secret.length - 4))
const cryptr = new Cryptr(secret)
const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null

export const authService = {
  signup,
  login,
  loginWithGoogle,
  getLoginToken,
  validateToken
}

async function login(email: string, password: string): Promise<User> {
  logger.debug(`auth.service - login with email: ${email}`)

  const user = await userService.getByEmail(email)
  if (!user) return Promise.reject('Invalid email or password')

  if (!user.password) {
    return Promise.reject('Invalid email or password')
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) return Promise.reject('Invalid username or password')

  const userToReturn = { ...user }
  delete userToReturn.password
  userToReturn._id = userToReturn._id?.toString() || ''
  return userToReturn
}

async function signup(credentials: SignupCredentials): Promise<User> {
  const saltRounds = 10

  logger.debug(`auth.service - signup with username: ${credentials.username}, fullName: ${credentials.fullName}`)
  if (!credentials.email || !credentials.username || !credentials.password || !credentials.fullName) {
    return Promise.reject('Missing required signup information')
  }

  const userExist = await userService.getByEmail(credentials.email)
  if (userExist) return Promise.reject('Email already taken')

  const hash = await bcrypt.hash(credentials.password, saltRounds)
  return userService.add({
    email: credentials.email,
    username: credentials.username,
    password: hash,
    fullName: credentials.fullName,
    imgUrl: credentials.imgUrl,
    authMethod: 'email'
  })
}

async function loginWithGoogle(idToken: string): Promise<User> {
  logger.debug('auth.service - loginWithGoogle')

  try {
    if (!googleClient || !config.googleClientId) {
      return Promise.reject('Google Client ID not configured')
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return Promise.reject('Invalid Google token')
    }

    const { sub: googleId, email, name, picture } = payload

    if (!email) {
      return Promise.reject('Google account missing email')
    }

    let user = await userService.getByGoogleId(googleId)

    if (user) {
      const userToReturn = { ...user }
      delete userToReturn.password
      userToReturn._id = userToReturn._id?.toString() || ''
      return userToReturn
    }

    user = await userService.getByEmail(email)

    if (user) {
      const collection = await dbService.getCollection('user')
      await collection.updateOne(
        { _id: new ObjectId(user._id) },
        {
          $set: {
            googleId,
            authMethod: user.authMethod === 'email' ? 'both' : 'google',
            imgUrl: picture || user.imgUrl
          }
        }
      )
      const userToReturn = { ...user }
      userToReturn.googleId = googleId
      userToReturn.imgUrl = picture || user.imgUrl
      userToReturn.authMethod = user.authMethod === 'email' ? 'both' : 'google'
      delete userToReturn.password
      userToReturn._id = userToReturn._id?.toString() || ''
      return userToReturn
    }

    const username = email.split('@')[0]
    const newUser = await userService.add({
      email,
      username,
      password: null,
      fullName: name || email.split('@')[0],
      imgUrl: picture || null,
      googleId,
      authMethod: 'google'
    })

    const userToReturn = { ...newUser }
    delete userToReturn.password
    userToReturn._id = userToReturn._id?.toString() || ''
    return userToReturn

  } catch (err) {
    logger.error('Google login failed', err)
    return Promise.reject('Invalid Google token')
  }
}

function getLoginToken(user: User): string {
  const userInfo: LoginTokenPayload = {
    _id: (user._id || user.id || '') as string,
    fullName: (user.fullName || '') as string,
    isAdmin: user.isAdmin
  }
  return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken: string): LoginTokenPayload | null {
  try {
    const json = cryptr.decrypt(loginToken)
    const loggedinUser = JSON.parse(json) as LoginTokenPayload
    return loggedinUser
  } catch (err) {
    logger.error('Invalid login token', err)
    logger.error('Token received:', loginToken.substring(0, 20) + '...')
  }
  return null
}
