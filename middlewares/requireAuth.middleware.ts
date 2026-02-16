import { Request, Response, NextFunction } from 'express'
import { logger } from '../services/logger.service.js'
import { authService } from '../api/auth/auth.service.js'

/** Read token from Authorization header (mobile) or cookie (web) */
function _extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return req.cookies?.loginToken
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = _extractToken(req)
  const loggedinUser = token
    ? authService.validateToken(token) ?? undefined
    : undefined

  req.loggedinUser = loggedinUser

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
  const token = _extractToken(req)
  const loggedinUser = token
    ? authService.validateToken(token) ?? undefined
    : undefined

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
