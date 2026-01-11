import { Request, Response, NextFunction } from 'express'
import { logger } from '../services/logger.service.js'

export async function log(_req: Request, _res: Response, next: NextFunction): Promise<void> {
  logger.info('Sample Logger Middleware')
  next()
}
