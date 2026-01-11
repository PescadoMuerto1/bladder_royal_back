export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  username: string
  password: string
  fullName: string
  imgUrl?: string
}

export interface GoogleLoginPayload {
  idToken: string
}

export interface LoginTokenPayload {
  _id: string
  fullName: string
  isAdmin?: boolean
}
