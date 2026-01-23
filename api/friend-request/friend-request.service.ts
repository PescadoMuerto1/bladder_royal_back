import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import mongoDB from 'mongodb'
const { ObjectId } = mongoDB
import { FriendRequest, FriendRequestToAdd, FriendRequestToUpdate } from '../../types/friend-request.types.js'
import { userService } from '../user/user.service.js'

export const friendRequestService = {
  add,
  getById,
  update,
  remove,
  getPendingRequests,
  getSentRequests,
  getAllRequests,
  getRequestBetweenUsers,
  getFriendsList
}

// Helper function to transform friend request from DB to API format
function transformFriendRequest(request: any): FriendRequest {
  const requestObj = request as any
  const id = requestObj._id ? requestObj._id.toString() : undefined
  return {
    ...requestObj,
    _id: id,
    id: id,
    fromUserId: requestObj.fromUserId,
    toUserId: requestObj.toUserId,
    createdAt: requestObj._id ? new ObjectId(requestObj._id).getTimestamp() : undefined,
    updatedAt: requestObj.updatedAt || requestObj.createdAt
  } as FriendRequest
}

async function add(request: FriendRequestToAdd): Promise<FriendRequest> {
  try {
    // Check if users exist
    const fromUser = await userService.getById(request.fromUserId)
    const toUser = await userService.getById(request.toUserId)
    
    if (!fromUser || !toUser) {
      throw new Error('One or both users not found')
    }
    
    // Check if users are already friends
    const fromUserFriends = fromUser.friends || []
    if (fromUserFriends.includes(request.toUserId)) {
      throw new Error('Users are already friends')
    }
    
    // Check if there's already a pending request
    const existingRequest = await getRequestBetweenUsers(request.fromUserId, request.toUserId)
    if (existingRequest && existingRequest.status === 'pending') {
      throw new Error('Friend request already exists')
    }
    
    // Don't allow self-friend requests
    if (request.fromUserId === request.toUserId) {
      throw new Error('Cannot send friend request to yourself')
    }
    
    const requestToAdd: Partial<FriendRequest> = {
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const collection = await dbService.getCollection('friendRequest')
    const result = await collection.insertOne(requestToAdd as any)
    return transformFriendRequest({ ...requestToAdd, _id: result.insertedId })
  } catch (err) {
    logger.error('cannot add friend request', err)
    throw err
  }
}

async function getById(requestId: string): Promise<FriendRequest | null> {
  try {
    const collection = await dbService.getCollection('friendRequest')
    const request = await collection.findOne({ _id: new ObjectId(requestId) })
    if (!request) return null
    return transformFriendRequest(request)
  } catch (err) {
    logger.error(`while finding friend request by id: ${requestId}`, err)
    throw err
  }
}

async function update(request: FriendRequestToUpdate): Promise<FriendRequest> {
  try {
    const collection = await dbService.getCollection('friendRequest')
    const existingRequest = await collection.findOne({ _id: new ObjectId(request._id) })
    
    if (!existingRequest) {
      throw new Error('Friend request not found')
    }
    
    if (existingRequest.status !== 'pending') {
      throw new Error('Can only update pending requests')
    }
    
    const updateData: any = {
      status: request.status,
      updatedAt: new Date()
    }
    
    await collection.updateOne(
      { _id: new ObjectId(request._id) },
      { $set: updateData }
    )
    
    // If accepted, add to both users' friends arrays
    if (request.status === 'accepted') {
      await addToFriendsList(existingRequest.fromUserId, existingRequest.toUserId)
    }
    
    const updatedRequest = await collection.findOne({ _id: new ObjectId(request._id) })
    return transformFriendRequest(updatedRequest!)
  } catch (err) {
    logger.error(`cannot update friend request ${request._id}`, err)
    throw err
  }
}

async function remove(requestId: string): Promise<void> {
  try {
    const collection = await dbService.getCollection('friendRequest')
    await collection.deleteOne({ _id: new ObjectId(requestId) })
  } catch (err) {
    logger.error(`cannot remove friend request ${requestId}`, err)
    throw err
  }
}

async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const collection = await dbService.getCollection('friendRequest')
    const requests = await collection.find({
      toUserId: userId,
      status: 'pending'
    }).sort({ createdAt: -1 }).toArray()
    return requests.map(transformFriendRequest)
  } catch (err) {
    logger.error(`cannot get pending requests for user ${userId}`, err)
    throw err
  }
}

async function getSentRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const collection = await dbService.getCollection('friendRequest')
    const requests = await collection.find({
      fromUserId: userId,
      status: 'pending'
    }).sort({ createdAt: -1 }).toArray()
    return requests.map(transformFriendRequest)
  } catch (err) {
    logger.error(`cannot get sent requests for user ${userId}`, err)
    throw err
  }
}

async function getAllRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const collection = await dbService.getCollection('friendRequest')
    const requests = await collection.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    }).sort({ createdAt: -1 }).toArray()
    return requests.map(transformFriendRequest)
  } catch (err) {
    logger.error(`cannot get all requests for user ${userId}`, err)
    throw err
  }
}

async function getRequestBetweenUsers(userId1: string, userId2: string): Promise<FriendRequest | null> {
  try {
    const collection = await dbService.getCollection('friendRequest')
    const request = await collection.findOne({
      $or: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 }
      ]
    })
    if (!request) return null
    return transformFriendRequest(request)
  } catch (err) {
    logger.error(`cannot get request between users ${userId1} and ${userId2}`, err)
    throw err
  }
}

async function getFriendsList(userId: string): Promise<string[]> {
  try {
    const user = await userService.getById(userId)
    if (!user) return []
    return user.friends || []
  } catch (err) {
    logger.error(`cannot get friends list for user ${userId}`, err)
    throw err
  }
}

// Helper function to add users to each other's friends list
async function addToFriendsList(userId1: string, userId2: string): Promise<void> {
  try {
    const user1 = await userService.getById(userId1)
    const user2 = await userService.getById(userId2)
    
    if (!user1 || !user2) {
      throw new Error('One or both users not found')
    }
    
    const user1Friends = user1.friends || []
    const user2Friends = user2.friends || []
    
    // Add to user1's friends list if not already there
    if (!user1Friends.includes(userId2)) {
      await userService.update({
        _id: userId1,
        friends: [...user1Friends, userId2]
      })
    }
    
    // Add to user2's friends list if not already there
    if (!user2Friends.includes(userId1)) {
      await userService.update({
        _id: userId2,
        friends: [...user2Friends, userId1]
      })
    }
  } catch (err) {
    logger.error(`cannot add to friends list: ${userId1} and ${userId2}`, err)
    throw err
  }
}
