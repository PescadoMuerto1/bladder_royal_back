import express, { Router } from 'express'
import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { getUser, getUsers, deleteUser, updateUser } from './user.controller.js'

const router: Router = express.Router()

router.get('/', getUsers)
router.get('/:id', getUser)
router.put('/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, requireAdmin, deleteUser)

export const userRoutes = router
