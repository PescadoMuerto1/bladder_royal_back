import { Request, Response } from 'express'
import { authService } from './auth.service.js'
import { logger } from '../../services/logger.service.js'
import { LoginCredentials, SignupCredentials, GoogleLoginPayload } from '../../types/auth.types'

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password }: LoginCredentials = req.body
  try {
    const user = await authService.login(email, password)
    const loginToken = authService.getLoginToken(user)
    logger.info('User login: ', user)
    res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true })
    res.json({ success: true, token: loginToken, user })
  } catch (err) {
    logger.error('Failed to login', err)
    res.status(401).send({ err: 'Failed to Login' })
  }
}

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const credentials: SignupCredentials = req.body
    const account = await authService.signup(credentials)
    logger.debug(`auth.route - new account created: ` + JSON.stringify(account))
    const user = await authService.login(credentials.email, credentials.password)
    logger.info('User signup:', user)
    const loginToken = authService.getLoginToken(user)
    res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true })
    res.json({ success: true, token: loginToken, user })
  } catch (err) {
    logger.error('Failed to signup', err)
    res.status(400).send({ err: 'Failed to signup' })
  }
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { idToken }: GoogleLoginPayload = req.body
  
  if (!idToken) {
    logger.warn('Google login rejected: missing Google ID token')
    res.status(400).send({ err: 'Missing Google ID token' })
    return
  }
  
  try {
    const user = await authService.loginWithGoogle(idToken)
    const loginToken = authService.getLoginToken(user)
    logger.info('Google login successful: ', user.email)
    res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true })
    res.json({ success: true, token: loginToken, user })
  } catch (err) {
    logger.error('Failed to login with Google', err)
    res.status(401).send({ err: 'Failed to login with Google' })
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  try {
    res.clearCookie('loginToken')
    res.send({ msg: 'Logged out successfully' })
  } catch (err) {
    logger.error('Failed to logout', err)
    res.status(400).send({ err: 'Failed to logout' })
  }
}
