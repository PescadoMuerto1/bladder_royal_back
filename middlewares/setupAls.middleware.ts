import { Request, Response, NextFunction } from 'express'
import { authService } from '../api/auth/auth.service.js'
import { asyncLocalStorage } from '../services/als.service.js'

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return req.cookies?.loginToken
}

export async function setupAsyncLocalStorage(
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> {
  const storage: { loggedinUser?: { _id: string; fullName: string; isAdmin?: boolean } } = {}
  asyncLocalStorage.run(storage, () => {
    const token = extractToken(req)
    if (!token) return next()
    const loggedinUser = authService.validateToken(token)

    if (loggedinUser) {
      const alsStore = asyncLocalStorage.getStore()
      if (alsStore) {
        alsStore.loggedinUser = loggedinUser
      }
    }
    next()
  })
}
