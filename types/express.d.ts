import { User } from './user.types'

declare global {
  namespace Express {
    interface Request {
      loggedinUser?: User | { _id: string; fullName: string }
    }
  }
}

export {}
