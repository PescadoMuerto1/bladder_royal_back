import express, { Router } from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getPendingFriendRequests,
  getSentFriendRequests,
  getAllFriendRequests,
  getFriendsList,
  removeFriend
} from './friend-request.controller.js'

const router: Router = express.Router()

// All routes require authentication
router.use(requireAuth)

// Specific routes first (before parameterized routes)
router.get('/all', getAllFriendRequests) // Get all requests (sent and received)
router.get('/pending', getPendingFriendRequests)
router.get('/sent', getSentFriendRequests)
router.get('/friends', getFriendsList) // Get current user's friends
router.get('/friends/:userId', getFriendsList) // Get specific user's friends
router.delete('/friends', removeFriend)

// Friend request actions
router.post('/', sendFriendRequest)
router.put('/:requestId/accept', acceptFriendRequest)
router.put('/:requestId/decline', declineFriendRequest)
router.put('/:requestId/cancel', cancelFriendRequest)

export const friendRequestRoutes = router
