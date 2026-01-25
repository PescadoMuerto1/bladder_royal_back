import { Request, Response } from 'express'
import { userService } from './user.service.js'
import { logger } from '../../services/logger.service.js'

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const mini = req.query.mini === 'true'
    
    if (mini) {
      const user = await userService.getMiniById(userId)
      if (!user) {
        res.status(404).send({ err: 'User not found' })
        return
      }
      res.send(user)
    } else {
      const user = await userService.getById(userId)
      if (!user) {
        res.status(404).send({ err: 'User not found' })
        return
      }
      res.send(user)
    }
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

export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const username = req.query.username as string
    if (!username || username.trim() === '') {
      res.status(400).send({ err: 'Username query parameter is required' })
      return
    }
    
    const mini = req.query.mini === 'true'
    
    if (mini) {
      const users = await userService.searchByUsernameMini(username.trim())
      res.send(users)
    } else {
      const users = await userService.searchByUsername(username.trim())
      res.send(users)
    }
  } catch (err) {
    logger.error('Failed to search users', err)
    res.status(400).send({ err: 'Failed to search users' })
  }
}

export async function updateFcmToken(req: Request, res: Response): Promise<void> {
  try {
    const loggedinUser = req.loggedinUser
    if (!loggedinUser || !loggedinUser._id) {
      res.status(401).send({ err: 'Not authenticated' })
      return
    }
    const { token } = req.body
    if (!token || typeof token !== 'string' || !token.trim()) {
      res.status(400).send({ err: 'token is required' })
      return
    }
    await userService.addFcmToken(loggedinUser._id, token.trim())
    res.send({ msg: 'FCM token updated' })
  } catch (err) {
    logger.error('Failed to update FCM token', err)
    res.status(400).send({ err: 'Failed to update FCM token' })
  }
}

export async function getUsersBatch(req: Request, res: Response): Promise<void> {
  try {
    let ids: string[] = []
    
    // Support both POST (body) and GET (query param with comma-separated IDs)
    if (req.method === 'POST' && req.body.ids) {
      ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids]
    } else if (req.query.ids) {
      const idsParam = req.query.ids as string
      ids = idsParam.split(',').map(id => id.trim()).filter(id => id.length > 0)
    }
    
    if (ids.length === 0) {
      res.status(400).send({ err: 'ids array or comma-separated ids query parameter is required' })
      return
    }
    
    const mini = req.query.mini !== 'false' // default to mini=true
    
    if (mini) {
      const users = await userService.getMiniByIds(ids)
      res.send(users)
    } else {
      const users = await userService.getByIds(ids)
      res.send(users)
    }
  } catch (err) {
    logger.error('Failed to get users batch', err)
    res.status(400).send({ err: 'Failed to get users batch' })
  }
}
