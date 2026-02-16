export interface User {
  _id?: string
  id?: string // mapped from _id for frontend compatibility
  username?: string
  email: string
  password?: string | null
  fullName?: string
  phoneNumber?: string | null
  imgUrl?: string | null
  googleId?: string | null
  authMethod?: 'email' | 'google' | 'both'
  isAdmin?: boolean
  score?: number
  createdAt?: Date
  userColor?: string
  friends?: string[] // array of user IDs
  fcmTokens?: string[] // FCM device tokens for push notifications
}

export interface UserToAdd {
  username?: string
  email: string
  password?: string | null
  fullName?: string
  phoneNumber?: string | null
  imgUrl?: string | null
  googleId?: string | null
  authMethod?: 'email' | 'google' | 'both'
  userColor?: string
  friends?: string[]
}

export interface UserToUpdate {
  _id: string
  fullName?: string
  phoneNumber?: string | null
  score?: number
  userColor?: string
  friends?: string[]
}

export interface UserFilter {
  txt?: string
  minBalance?: number
}

export interface MiniUser {
  _id: string
  id: string
  username?: string
  fullName?: string
  imgUrl?: string | null
  userColor?: string
}
