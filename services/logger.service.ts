import fs from 'fs'
import { asyncLocalStorage } from './als.service.js'

const logsDir = './logs'
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir)
}

function getTime(): string {
  const now = new Date()
  return now.toLocaleString('he')
}

function isError(e: unknown): e is Error {
  return e !== null && typeof e === 'object' && 'stack' in e && 'message' in e
}

function doLog(level: string, ...args: unknown[]): void {
  const strs = args.map(arg =>
    (typeof arg === 'string' || isError(arg)) ? arg : JSON.stringify(arg)
  )

  let line = strs.join(' | ')
  const store = asyncLocalStorage.getStore()
  const userId = store?.loggedinUser?._id
  const str = userId ? `(userId: ${userId})` : ''
  line = `${getTime()} - ${level} - ${line} ${str}\n`
  console.log(line)
  fs.appendFile('./logs/backend.log', line, (err) => {
    if (err) console.log('FATAL: cannot write to log file')
  })
}

export const logger = {
  debug(...args: unknown[]): void {
    if (process.env.NODE_ENV === 'production') return
    doLog('DEBUG', ...args)
  },
  info(...args: unknown[]): void {
    doLog('INFO', ...args)
  },
  warn(...args: unknown[]): void {
    doLog('WARN', ...args)
  },
  error(...args: unknown[]): void {
    doLog('ERROR', ...args)
  }
}
