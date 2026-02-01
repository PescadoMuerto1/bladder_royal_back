import { Request, Response, NextFunction } from 'express'
import { config } from '../config/index.js'
import { logger } from '../services/logger.service.js'
import { authService } from '../api/auth/auth.service.js'

export function requireAuth(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  // Read token from Authorization header (for mobile) or cookies (for web)
  let loggedinUser: { _id: string; fullName: string; isAdmin?: boolean } | undefined
  let token: string | undefined
  
  // Check Authorization header first (common for mobile apps)
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } 
  // Fallback to cookie (for web)
  else if (req.cookies?.loginToken) {
    token = req.cookies.loginToken
  }
  
  if (token) {
    const tokenPayload = authService.validateToken(token)
    if (tokenPayload) {
      loggedinUser = tokenPayload
    }
  }
  
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
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  // Read token directly from cookies
  let loggedinUser: { _id: string; fullName: string; isAdmin?: boolean } | undefined
  
  if (req.cookies?.loginToken) {
    const tokenPayload = authService.validateToken(req.cookies.loginToken)
    if (tokenPayload) {
      loggedinUser = tokenPayload
    }
  }
  
  if (!loggedinUser) {
    res.status(401).send('Not Authenticated')
    return
  }
  if (!loggedinUser.isAdmin) {
    logger.warn(loggedinUser.fullName + ' attempted to perform admin action')
    res.status(403).end('Not Authorized')
    return
  }
  next()
}
