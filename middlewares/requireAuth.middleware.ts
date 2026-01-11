import { Request, Response, NextFunction } from 'express'
import { config } from '../config/index.js'
import { logger } from '../services/logger.service.js'
import { asyncLocalStorage } from '../services/als.service.js'

export function requireAuth(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  const store = asyncLocalStorage.getStore()
  const loggedinUser = store?.loggedinUser
  req.loggedinUser = loggedinUser
  
  if (config.isGuestMode && !loggedinUser) {
    req.loggedinUser = { _id: '', fullName: 'Guest' }
    return next()
  }
  if (!loggedinUser) {
    res.status(401).send('Not Authenticated')
    return
  }
  next()
}

export function requireAdmin(
  _req: Request, 
  res: Response, 
  next: NextFunction
): void {
  const store = asyncLocalStorage.getStore()
  const loggedinUser = store?.loggedinUser
  if (!loggedinUser) {
    res.status(401).send('Not Authenticated')
    return
  }
  if ('isAdmin' in loggedinUser && !loggedinUser.isAdmin) {
    logger.warn(loggedinUser.fullName + ' attempted to perform admin action')
    res.status(403).end('Not Authorized')
    return
  }
  next()
}
