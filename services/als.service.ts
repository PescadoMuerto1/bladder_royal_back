import { AsyncLocalStorage } from 'async_hooks'
import { User } from '../types/user.types.js'

interface Store {
  loggedinUser?: User | { _id: string; fullName: string }
}

export const asyncLocalStorage = new AsyncLocalStorage<Store>()
