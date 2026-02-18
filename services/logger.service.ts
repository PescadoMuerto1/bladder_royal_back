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

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>()
  try {
    return JSON.stringify(value, (_key, val: unknown) => {
      if (typeof val === 'bigint') return val.toString()
      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack
        }
      }
      if (val !== null && typeof val === 'object') {
        if (seen.has(val)) return '[Circular]'
        seen.add(val)
      }
      return val
    })
  } catch {
    return '[Unserializable value]'
  }
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg
  if (isError(arg)) return arg.stack || `${arg.name}: ${arg.message}`
  if (typeof arg === 'undefined') return 'undefined'
  if (typeof arg === 'bigint') return arg.toString()
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg)
  if (typeof arg === 'function') return `[Function: ${arg.name || 'anonymous'}]`
  if (arg === null) return 'null'
  return safeStringify(arg)
}

function doLog(level: string, ...args: unknown[]): void {
  const strs = args.map(formatArg)

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
