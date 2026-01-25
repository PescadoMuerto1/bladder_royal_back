import 'dotenv/config'
import 'dotenv/config'
import http from 'http'
import path from 'path'
import cors from 'cors'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { areaMarkerRoutes } from './api/area marker/area-marker.routes.js'
import { friendRequestRoutes } from './api/friend-request/friend-request.routes.js'
import { setupSocketAPI } from './services/socket.service.js'
import { initFcm } from './services/fcm.service.js'
import { logger } from './services/logger.service.js'

initFcm()

const app: Express = express()
const server = http.createServer(app)

// Log all incoming requests FIRST (before any other middleware)
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    hasAuthHeader: !!req.headers.authorization
  })
  next()
})

// Express App Config
app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('public')))
  console.log('public')
} else {
  const corsOptions = {
    origin: [
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5173'
    ],
    credentials: true
  }
  console.log(corsOptions)
  app.use(cors(corsOptions))
}

// routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/friend-request', friendRequestRoutes)
app.use('/api/area-marker', areaMarkerRoutes)
setupSocketAPI(server)

app.get('/**', (_req, res) => {
  res.sendFile(path.resolve('public/index.html'))
})

const port = process.env.PORT || 3030
server.listen(port, () => {
  logger.info('Server is running on port: ' + port)
})
