import { Request, Response, NextFunction } from 'express'
import { authService } from '../api/auth/auth.service.js'
import { asyncLocalStorage } from '../services/als.service.js'

export async function setupAsyncLocalStorage(
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> {
  const storage: { loggedinUser?: { _id: string; fullName: string; isAdmin?: boolean } } = {}
  asyncLocalStorage.run(storage, () => {
    console.log(req.cookies)
    if (!req.cookies) return next()

    const loggedinUser = authService.validateToken(req.cookies.loginToken)

    if (loggedinUser) {
      const alsStore = asyncLocalStorage.getStore()
      if (alsStore) {
        alsStore.loggedinUser = loggedinUser
      }
    }
    next()
  })
}
