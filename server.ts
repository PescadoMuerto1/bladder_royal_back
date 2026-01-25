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
import { setupSocketAPI } from './services/socket.service.js'
import { logger } from './services/logger.service.js'

const app: Express = express()
const server = http.createServer(app)

// Express App Config
app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('public')))
  const corsOptions = {
    origin: '*',
    credentials: false
  }
  app.use(cors(corsOptions))
  console.log('Production mode: CORS enabled for all origins (mobile APK)')
  console.log('public')
} else {
  const corsOptions = {
    origin: [
      'http://94.75.193.184:3033',
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5173', 
      'http://splash.gleeze.com:3033'
    ],
    credentials: true
  }
  console.log(corsOptions)
  app.use(cors(corsOptions))
}

// routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/area-marker', areaMarkerRoutes)
setupSocketAPI(server)

app.get('/**', (_req, res) => {
  res.sendFile(path.resolve('public/index.html'))
})

const port = process.env.PORT || 3030
server.listen(port, () => {
  logger.info('Server is running on port: ' + port)
})
