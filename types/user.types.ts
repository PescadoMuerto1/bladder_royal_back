export interface User {
  _id?: string
  username: string
  email: string
  password?: string | null
  fullName: string
  imgUrl?: string | null
  googleId?: string | null
  authMethod?: 'email' | 'google' | 'both'
  isAdmin?: boolean
  score?: number
  createdAt?: Date
}

export interface UserToAdd {
  username: string
  email: string
  password?: string | null
  fullName: string
  imgUrl?: string | null
  googleId?: string | null
  authMethod?: 'email' | 'google' | 'both'
}

export interface UserToUpdate {
  _id: string
  fullName?: string
  score?: number
}

export interface UserFilter {
  txt?: string
  minBalance?: number
}
