import { Request, Response } from 'express'
import { friendRequestService } from './friend-request.service.js'
import { logger } from '../../services/logger.service.js'
import { userService } from '../user/user.service.js'


export async function sendFriendRequest(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      logger.warn('Send friend request rejected: not authenticated')
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    const { toUserId } = req.body
    if (!toUserId) {
      logger.warn('Send friend request rejected: missing toUserId')
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
      logger.warn('Accept friend request rejected: not authenticated')
      res.status(401).send({ err: 'Not authenticated' })
      return
    }

    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId

    // Verify the request belongs to the logged-in user
    const request = await friendRequestService.getById(requestId)
    if (!request) {
      logger.warn(`Accept friend request rejected: request not found (${requestId})`)
      res.status(404).send({ err: 'Friend request not found' })
      return
    }

    if (request.toUserId !== loggedinUser._id) {
      logger.warn(`Accept friend request rejected: unauthorized user ${loggedinUser._id} for request ${requestId}`)
      res.status(403).send({ err: 'Not authorized to accept this request' })
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

export async function declineFriendRequest(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      logger.warn('Decline friend request rejected: not authenticated')
      res.status(401).send({ err: 'Not authenticated' })
      return
    }

    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId

    // Verify the request belongs to the logged-in user
    const request = await friendRequestService.getById(requestId)
    if (!request) {
      logger.warn(`Decline friend request rejected: request not found (${requestId})`)
      res.status(404).send({ err: 'Friend request not found' })
      return
    }

    if (request.toUserId !== loggedinUser._id) {
      logger.warn(`Decline friend request rejected: unauthorized user ${loggedinUser._id} for request ${requestId}`)
      res.status(403).send({ err: 'Not authorized to decline this request' })
      return
    }

    const updatedRequest = await friendRequestService.update({
      _id: requestId,
      status: 'declined'
    })

    res.send(updatedRequest)
  } catch (err: any) {
    logger.error('Failed to decline friend request', err)
    const errorMessage = err.message || 'Failed to decline friend request'
    res.status(400).send({ err: errorMessage })
  }
}

export async function cancelFriendRequest(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      logger.warn('Cancel friend request rejected: not authenticated')
      res.status(401).send({ err: 'Not authenticated' })
      return
    }

    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId

    // Verify the request was sent by the logged-in user
    const request = await friendRequestService.getById(requestId)
    if (!request) {
      logger.warn(`Cancel friend request rejected: request not found (${requestId})`)
      res.status(404).send({ err: 'Friend request not found' })
      return
    }

    if (request.fromUserId !== loggedinUser._id) {
      logger.warn(`Cancel friend request rejected: unauthorized user ${loggedinUser._id} for request ${requestId}`)
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
      logger.warn('Get pending friend requests rejected: not authenticated')
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
      logger.warn('Get sent friend requests rejected: not authenticated')
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

export async function checkFriendRequestByUserId(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      logger.warn('Check friend request rejected: not authenticated')
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    if (!userId) {
      logger.warn('Check friend request rejected: missing userId route parameter')
      res.status(400).send({ err: 'userId is required' })
      return
    }
    const request = await friendRequestService.getRequestBetweenUsers(loggedinUser._id, userId)
    res.json(request ?? null)
  } catch (err: any) {
    logger.error('Failed to check friend request by user id', err)
    res.status(400).json({ err: err.message || 'Failed to check friend request' })
  }
}

export async function getAllFriendRequests(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      logger.warn('Get all friend requests rejected: not authenticated')
      res.status(401).send({ err: 'Not authenticated' })
      return
    }

    const requests = await friendRequestService.getAllRequests(loggedinUser._id)

    // Separate sent and received requests
    const sentRequests = requests.filter(r => r.fromUserId === loggedinUser._id)
    const receivedRequests = requests.filter(r => r.toUserId === loggedinUser._id)

    // Batch fetch user details for all requests
    const toUserIds = sentRequests.map(r => r.toUserId)
    const fromUserIds = receivedRequests.map(r => r.fromUserId)
    const allUserIds = [...new Set([...toUserIds, ...fromUserIds])]
    const users = await userService.getMiniByIds(allUserIds)
    const userMap = new Map(users.map(u => [u._id, u]))

    // Populate user details for sent requests
    const populatedSentRequests = sentRequests.map(request => ({
      ...request,
      toUser: userMap.get(request.toUserId) || null
    }))

    // Populate user details for received requests
    const populatedReceivedRequests = receivedRequests.map(request => ({
      ...request,
      fromUser: userMap.get(request.fromUserId) || null
    }))

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
      logger.warn('Get friends list rejected: not authenticated')
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
      logger.warn(`Get friends list rejected: unauthorized access by ${loggedinUser._id} to ${targetUserId}`)
      res.status(403).send({ err: 'Not authorized' })
      return
    }
    const friendIds = await friendRequestService.getFriendsList(targetUserId)

    // Batch fetch user details for all friends
    const friends = await userService.getMiniByIds(friendIds)

    // Ensure it's always an array
    const result = Array.isArray(friends) ? friends : []
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
      logger.warn('Remove friend rejected: not authenticated')
      res.status(401).send({ err: 'Not authenticated' })
      return
    }

    const { friendId } = req.body
    if (!friendId) {
      logger.warn('Remove friend rejected: missing friendId')
      res.status(400).send({ err: 'friendId is required' })
      return
    }

    // Verify they are actually friends
    const user = await userService.getById(loggedinUser._id!)
    if (!user) {
      logger.warn(`Remove friend rejected: current user not found (${loggedinUser._id})`)
      res.status(404).send({ err: 'User not found' })
      return
    }

    const friends = user.friends || []
    if (!friends.includes(friendId)) {
      logger.warn(`Remove friend rejected: ${friendId} not in friends list of ${loggedinUser._id}`)
      res.status(400).send({ err: 'User is not in your friends list' })
      return
    }

    await friendRequestService.removeFromFriendsList(loggedinUser._id!, friendId)

    res.send({ msg: 'Friend removed successfully' })
  } catch (err) {
    logger.error('Failed to remove friend', err)
    res.status(400).send({ err: 'Failed to remove friend' })
  }
}
