import { Request, Response } from 'express'
import { userService } from './user.service.js'
import { logger } from '../../services/logger.service.js'

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const user = await userService.getById(userId)
    res.send(user)
  } catch (err) {
    logger.error('Failed to get user', err)
    res.status(400).send({ err: 'Failed to get user' })
  }
}

export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await userService.query()
    res.send(users)
  } catch (err) {
    logger.error('Failed to get users', err)
    res.status(400).send({ err: 'Failed to get users' })
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    await userService.remove(userId)
    res.send({ msg: 'Deleted successfully' })
  } catch (err) {
    logger.error('Failed to delete user', err)
    res.status(400).send({ err: 'Failed to delete user' })
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const user = req.body
    const savedUser = await userService.update(user)
    res.send(savedUser)
  } catch (err) {
    logger.error('Failed to update user', err)
    res.status(400).send({ err: 'Failed to update user' })
  }
}
