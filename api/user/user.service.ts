import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import mongoDB from 'mongodb'
const { ObjectId } = mongoDB
import { User, UserToAdd, UserToUpdate } from '../../types/user.types.js'

export const userService = {
  add,
  getById,
  update,
  remove,
  query,
  getByEmail,
  getByGoogleId
}

async function query(): Promise<User[]> {
  try {
    const collection = await dbService.getCollection('user')
    const users = await collection.find().toArray()
    return users.map(user => {
      const userObj = user as any
      delete userObj.password
      userObj.createdAt = new ObjectId(userObj._id).getTimestamp()
      return {
        ...userObj,
        _id: userObj._id.toString()
      } as User
    })
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
    const userObj = user as any
    delete userObj.password
    return {
      ...userObj,
      _id: userObj._id.toString()
    } as User
  } catch (err) {
    logger.error(`while finding user by id: ${userId}`, err)
    throw err
  }
}

async function getByEmail(email: string): Promise<User | null> {
  try {
    const collection = await dbService.getCollection('user')
    const user = await collection.findOne({ email })
    if (!user) return null
    const userObj = user as any
    return {
      ...userObj,
      _id: userObj._id.toString()
    } as User
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
    const userObj = user as any
    return {
      ...userObj,
      _id: userObj._id.toString()
    } as User
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
    const userToSave: UserToUpdate = {
      _id: user._id,
      fullName: user.fullName,
      score: user.score,
    }
    const collection = await dbService.getCollection('user')
    await collection.updateOne(
      { _id: new ObjectId(userToSave._id) }, 
      { $set: userToSave }
    )
    return userToSave
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
      imgUrl: user.imgUrl || null,
      email: user.email,
      googleId: user.googleId || null,
      authMethod: user.authMethod || 'email'
    }
    const collection = await dbService.getCollection('user')
    const result = await collection.insertOne(userToAdd as any)
    return { 
      ...userToAdd, 
      _id: result.insertedId.toString() 
    } as User
  } catch (err) {
    logger.error('cannot add user', err)
    throw err
  }
}
