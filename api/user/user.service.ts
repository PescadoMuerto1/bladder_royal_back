import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import mongoDB from 'mongodb'
const { ObjectId } = mongoDB
import { User, UserToAdd, UserToUpdate } from '../../types/user.types.js'
import { randomColor } from '../../utils/utils.js'

export interface MiniUser {
  _id: string
  id: string
  username?: string
  fullName?: string
  imgUrl?: string | null
  userColor?: string
}

// Helper function to transform user from DB to API format
function transformUser(user: any): User {
  const userObj = user as any
  delete userObj.password
  delete userObj.fcmTokens // don't expose to client
  const id = userObj._id ? userObj._id.toString() : undefined
  // Ensure friends is always an array
  const friends = Array.isArray(userObj.friends) ? userObj.friends : []
  return {
    ...userObj,
    _id: id,
    id: id, // Map _id to id for frontend compatibility
    friends: friends,
    createdAt: userObj._id ? new ObjectId(userObj._id).getTimestamp() : undefined
  } as User
}

export const userService = {
  add,
  getById,
  update,
  remove,
  query,
  getByEmail,
  getByGoogleId,
  searchByUsername,
  searchByUsernameMini,
  getByIds,
  getMiniById,
  getMiniByIds,
  addFcmToken
}

async function query(): Promise<User[]> {
  try {
    const collection = await dbService.getCollection('user')
    const users = await collection.find().toArray()
    return users.map(transformUser)
  } catch (err) {
    logger.error('cannot find users', err)
    throw err
  }
}

async function getById(userId: string): Promise<User | null> {
  try {
    const collection = await dbService.getCollection('user')
    const user = await collection.findOne({ _id: new ObjectId(userId) })
    if (!user) return null
    return transformUser(user)
  } catch (err) {
    logger.error(`while finding user by id: ${userId}`, err)
    throw err
  }
}

async function getMiniById(userId: string): Promise<MiniUser | null> {
  try {
    const collection = await dbService.getCollection('user')
    const projection = {
      _id: 1,
      username: 1,
      fullName: 1,
      imgUrl: 1,
      userColor: 1
    }
    const user = await collection.findOne(
      { _id: new ObjectId(userId) },
      { projection }
    )
    if (!user) return null
    const id = user._id.toString()
    return {
      _id: id,
      id: id,
      username: user.username,
      fullName: user.fullName,
      imgUrl: user.imgUrl || null,
      userColor: user.userColor
    } as MiniUser
  } catch (err) {
    logger.error(`while finding mini user by id: ${userId}`, err)
    throw err
  }
}

async function getByEmail(email: string): Promise<User | null> {
  try {
    const collection = await dbService.getCollection('user')
    const user = await collection.findOne({ email })
    if (!user) return null
    return transformUser(user)
  } catch (err) {
    logger.error(`while finding user by email: ${email}`, err)
    throw err
  }
}

async function getByGoogleId(googleId: string): Promise<User | null> {
  try {
    const collection = await dbService.getCollection('user')
    const user = await collection.findOne({ googleId })
    if (!user) return null
    return transformUser(user)
  } catch (err) {
    logger.error(`while finding user by googleId: ${googleId}`, err)
    throw err
  }
}

async function remove(userId: string): Promise<void> {
  try {
    const collection = await dbService.getCollection('user')
    await collection.deleteOne({ _id: new ObjectId(userId) })
  } catch (err) {
    logger.error(`cannot remove user ${userId}`, err)
    throw err
  }
}

async function update(user: UserToUpdate): Promise<UserToUpdate> {
  try {
    const userToSave: Partial<UserToUpdate> = {
      _id: user._id
    }
    if (user.fullName !== undefined) userToSave.fullName = user.fullName
    if (user.phoneNumber !== undefined) userToSave.phoneNumber = user.phoneNumber
    if (user.score !== undefined) userToSave.score = user.score
    if (user.userColor !== undefined) userToSave.userColor = user.userColor
    if (user.friends !== undefined) userToSave.friends = user.friends
    
    const collection = await dbService.getCollection('user')
    const updateData: any = { ...userToSave }
    delete updateData._id
    await collection.updateOne(
      { _id: new ObjectId(userToSave._id!) }, 
      { $set: updateData }
    )
    return userToSave as UserToUpdate
  } catch (err) {
    logger.error(`cannot update user ${user._id}`, err)
    throw err
  }
}

async function add(user: UserToAdd): Promise<User> {
  try {
    const userToAdd: Partial<User> = {
      username: user.username,
      password: user.password || null,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || null,
      imgUrl: user.imgUrl || null,
      email: user.email,
      googleId: user.googleId || null,
      authMethod: user.authMethod || 'email',
      userColor: randomColor(),
      friends: user.friends || []
    }
    const collection = await dbService.getCollection('user')
    const result = await collection.insertOne(userToAdd as any)
    return transformUser({ ...userToAdd, _id: result.insertedId })
  } catch (err) {
    logger.error('cannot add user', err)
    throw err
  }
}

async function searchByUsername(query: string): Promise<User[]> {
  try {
    const collection = await dbService.getCollection('user')
    const users = await collection.find({
      username: { $regex: query, $options: 'i' }
    }).toArray()
    return users.map(transformUser)
  } catch (err) {
    logger.error('cannot search users', err)
    throw err
  }
}

async function searchByUsernameMini(query: string): Promise<MiniUser[]> {
  try {
    const collection = await dbService.getCollection('user')
    const projection = {
      _id: 1,
      username: 1,
      fullName: 1,
      imgUrl: 1,
      userColor: 1
    }
    const users = await collection.find(
      { username: { $regex: query, $options: 'i' } },
      { projection }
    ).toArray()
    return users.map(user => {
      const id = user._id.toString()
      return {
        _id: id,
        id: id,
        username: user.username,
        fullName: user.fullName,
        imgUrl: user.imgUrl || null,
        userColor: user.userColor
      } as MiniUser
    })
  } catch (err) {
    logger.error('cannot search mini users', err)
    throw err
  }
}

async function getByIds(userIds: string[]): Promise<User[]> {
  try {
    const collection = await dbService.getCollection('user')
    const objectIds = userIds.map(id => new ObjectId(id))
    const users = await collection.find({
      _id: { $in: objectIds }
    }).toArray()
    return users.map(transformUser)
  } catch (err) {
    logger.error('cannot get users by ids', err)
    throw err
  }
}

async function getMiniByIds(userIds: string[]): Promise<MiniUser[]> {
  try {
    const collection = await dbService.getCollection('user')
    const objectIds = userIds.map(id => new ObjectId(id))
    const projection = {
      _id: 1,
      username: 1,
      fullName: 1,
      imgUrl: 1,
      userColor: 1
    }
    const users = await collection.find(
      { _id: { $in: objectIds } },
      { projection }
    ).toArray()
    return users.map(user => {
      const id = user._id.toString()
      return {
        _id: id,
        id: id,
        username: user.username,
        fullName: user.fullName,
        imgUrl: user.imgUrl || null,
        userColor: user.userColor
      } as MiniUser
    })
  } catch (err) {
    logger.error('cannot get mini users by ids', err)
    throw err
  }
}

export function toMiniUser(user: User): MiniUser {
  const id = user._id || user.id || ''
  return {
    _id: id,
    id: id,
    username: user.username,
    fullName: user.fullName,
    imgUrl: user.imgUrl,
    userColor: user.userColor
  }
}

async function addFcmToken(userId: string, token: string): Promise<void> {
  try {
    const collection = await dbService.getCollection('user')
    await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { fcmTokens: token } }
    )
  } catch (err) {
    logger.error(`cannot add FCM token for user ${userId}`, err)
    throw err
  }
}
