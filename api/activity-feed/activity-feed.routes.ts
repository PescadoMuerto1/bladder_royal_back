import express, { Router } from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import {
  getActivityFeed,
  getActivityFeedUnreadCount
} from './activity-feed.controller.js'

const router: Router = express.Router()

router.use(requireAuth)

router.get('/', getActivityFeed)
router.get('/unread-count', getActivityFeedUnreadCount)

export const activityFeedRoutes = router
