import { Request, Response } from 'express'
import { friendRequestService } from './friend-request.service.js'
import { logger } from '../../services/logger.service.js'
import { userService } from '../user/user.service.js'

export async function sendFriendRequest(req: Request, res: Response): Promise<void> {
  logger.info('sendFriendRequest called', { method: req.method, url: req.url, body: req.body })
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    const { toUserId } = req.body
    if (!toUserId) {
      res.status(400).send({ err: 'toUserId is required' })
      return
    }
    
    const request = await friendRequestService.add({
      fromUserId: loggedinUser._id!,
      toUserId
    })
    
    res.status(201).send(request)
  } catch (err: any) {
    logger.error('Failed to send friend request', err)
    const errorMessage = err.message || 'Failed to send friend request'
    res.status(400).send({ err: errorMessage })
  }
}

export async function acceptFriendRequest(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      logger.error('Failed to accept friend request: Not authenticated')
      return
    }
    
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId
    
    // Verify the request belongs to the logged-in user
    const request = await friendRequestService.getById(requestId)
    if (!request) {
      res.status(404).send({ err: 'Friend request not found' })
      logger.error('Failed to accept friend request: Friend request not found')
      return
    }
    
    if (request.toUserId !== loggedinUser._id) {
      res.status(403).send({ err: 'Not authorized to accept this request' })
      logger.error('Failed to accept friend request: Not authorized to accept this request')
      return
    }
    
    const updatedRequest = await friendRequestService.update({
      _id: requestId,
      status: 'accepted'
    })
    
    res.send(updatedRequest)
  } catch (err: any) {
    logger.error('Failed to accept friend request', err)
    const errorMessage = err.message || 'Failed to accept friend request'
    res.status(400).send({ err: errorMessage })
  }
}

export async function rejectFriendRequest(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId
    
    // Verify the request belongs to the logged-in user
    const request = await friendRequestService.getById(requestId)
    if (!request) {
      res.status(404).send({ err: 'Friend request not found' })
      return
    }
    
    if (request.toUserId !== loggedinUser._id) {
      res.status(403).send({ err: 'Not authorized to reject this request' })
      return
    }
    
    const updatedRequest = await friendRequestService.update({
      _id: requestId,
      status: 'rejected'
    })
    
    res.send(updatedRequest)
  } catch (err: any) {
    logger.error('Failed to reject friend request', err)
    const errorMessage = err.message || 'Failed to reject friend request'
    res.status(400).send({ err: errorMessage })
  }
}

export async function cancelFriendRequest(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId
    
    // Verify the request was sent by the logged-in user
    const request = await friendRequestService.getById(requestId)
    if (!request) {
      res.status(404).send({ err: 'Friend request not found' })
      return
    }
    
    if (request.fromUserId !== loggedinUser._id) {
      res.status(403).send({ err: 'Not authorized to cancel this request' })
      return
    }
    
    const updatedRequest = await friendRequestService.update({
      _id: requestId,
      status: 'cancelled'
    })
    
    res.send(updatedRequest)
  } catch (err: any) {
    logger.error('Failed to cancel friend request', err)
    const errorMessage = err.message || 'Failed to cancel friend request'
    res.status(400).send({ err: errorMessage })
  }
}

export async function getPendingFriendRequests(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    
    const requests = await friendRequestService.getPendingRequests(loggedinUser._id)
    
    // Populate user details for each request
    const populatedRequests = await Promise.all(
      requests.map(async (request) => {
        const fromUser = await userService.getMiniById(request.fromUserId)
        return {
          ...request,
          fromUser
        }
      })
    )
    
    // Ensure it's always an array
    const result = Array.isArray(populatedRequests) ? populatedRequests : []
    res.json(result)
  } catch (err) {
    logger.error('Failed to get pending friend requests', err)
    res.status(400).json({ err: 'Failed to get pending friend requests' })
  }
}

export async function getSentFriendRequests(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    
    const requests = await friendRequestService.getSentRequests(loggedinUser._id)
    
    // Populate user details for each request
    const populatedRequests = await Promise.all(
      requests.map(async (request) => {
        const toUser = await userService.getMiniById(request.toUserId)
        return {
          ...request,
          toUser
        }
      })
    )
    
    // Ensure it's always an array
    const result = Array.isArray(populatedRequests) ? populatedRequests : []
    res.json(result)
  } catch (err) {
    logger.error('Failed to get sent friend requests', err)
    res.status(400).json({ err: 'Failed to get sent friend requests' })
  }
}

export async function getAllFriendRequests(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    
    const requests = await friendRequestService.getAllRequests(loggedinUser._id)
    
    // Separate sent and received requests
    const sentRequests = requests.filter(r => r.fromUserId === loggedinUser._id)
    const receivedRequests = requests.filter(r => r.toUserId === loggedinUser._id)
    
    // Populate user details for sent requests
    const populatedSentRequests = await Promise.all(
      sentRequests.map(async (request) => {
        const toUser = await userService.getMiniById(request.toUserId)
        return {
          ...request,
          toUser
        }
      })
    )
    
    // Populate user details for received requests
    const populatedReceivedRequests = await Promise.all(
      receivedRequests.map(async (request) => {
        const fromUser = await userService.getMiniById(request.fromUserId)
        return {
          ...request,
          fromUser
        }
      })
    )
    
    res.json({
      sentRequests: Array.isArray(populatedSentRequests) ? populatedSentRequests : [],
      receivedRequests: Array.isArray(populatedReceivedRequests) ? populatedReceivedRequests : []
    })
  } catch (err) {
    logger.error('Failed to get all friend requests', err)
    res.status(400).json({ err: 'Failed to get all friend requests' })
  }
}

export async function getFriendsList(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    const targetUserId = userId || loggedinUser._id
    // Only allow users to see their own friends list (unless admin)
    if (
      targetUserId !== loggedinUser._id &&
      !(typeof loggedinUser === 'object' && 'isAdmin' in loggedinUser && loggedinUser.isAdmin)
    ) {
      res.status(403).send({ err: 'Not authorized' })
      return
    }
    const friendIds = await friendRequestService.getFriendsList(targetUserId)
    
    // Get full user details for each friend
    const friends = await Promise.all(
      friendIds.map(id => userService.getMiniById(id))
    )
    
    // Filter out null values (in case a friend was deleted)
    const validFriends = friends.filter(friend => friend !== null)
    
    // Ensure it's always an array
    const result = Array.isArray(validFriends) ? validFriends : []
    res.json(result)
  } catch (err) {
    logger.error('Failed to get friends list', err)
    res.status(400).json({ err: 'Failed to get friends list' })
  }
}

export async function removeFriend(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    
    const { friendId } = req.body
    if (!friendId) {
      res.status(400).send({ err: 'friendId is required' })
      return
    }
    
    // Get current user's friends list
    const user = await userService.getById(loggedinUser._id!)
    if (!user) {
      res.status(404).send({ err: 'User not found' })
      return
    }
    
    const friends = user.friends || []
    if (!friends.includes(friendId)) {
      res.status(400).send({ err: 'User is not in your friends list' })
      return
    }
    
    // Remove from current user's friends list
    await userService.update({
      _id: loggedinUser._id!,
      friends: friends.filter(id => id !== friendId)
    })
    
    // Remove from friend's friends list
    const friend = await userService.getById(friendId)
    if (friend) {
      const friendFriends = friend.friends || []
      await userService.update({
        _id: friendId,
        friends: friendFriends.filter(id => id !== loggedinUser._id)
      })
    }
    
    res.send({ msg: 'Friend removed successfully' })
  } catch (err) {
    logger.error('Failed to remove friend', err)
    res.status(400).send({ err: 'Failed to remove friend' })
  }
}
