import { logger } from './logger.service.js'
import { Server, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'

let gIo: Server | null = null

interface ExtendedSocket extends Socket {
  boardId?: string
  userId?: string
}

interface EmitToParams {
  type: string
  data: unknown
  label?: string | number
}

interface EmitToUserParams {
  type: string
  data: unknown
  userId: string | number
}

interface BroadcastParams {
  type: string
  data: unknown
  boardId?: string | null
  userId?: string | number
}

export function setupSocketAPI(http: HttpServer): void {
  gIo = new Server(http, {
    cors: {
      origin: '*',
    }
  })

  gIo.on('connection', (socket: ExtendedSocket) => {
    logger.info(`New connected socket [id: ${socket.id}]`)

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected [id: ${socket.id}]`)
    })

    socket.on('board-changed', (board: unknown) => {
      logger.info(`Board changed emitting to topic ${socket.boardId}`)
      
      if (socket.boardId && gIo) {
        gIo.to(socket.boardId).emit('board-changed', board)
      }
    })
    
    socket.on('board-set-id', (boardId: string) => {
      if (socket.boardId === boardId) return
      if (socket.boardId) {
        socket.leave(socket.boardId)
        logger.info(`Socket is leaving board ${socket.boardId}`)
      }
      socket.join(boardId)
      socket.boardId = boardId
    })
  })
}

function emitTo({ type, data, label }: EmitToParams): void {
  if (!gIo) return
  if (label) {
    gIo.to('watching:' + label.toString()).emit(type, data)
  } else {
    gIo.emit(type, data)
  }
}

async function emitToUser({ type, data, userId }: EmitToUserParams): Promise<void> {
  if (!gIo) return
  const userIdStr = userId.toString()
  const socket = await _getUserSocket(userIdStr)

  if (socket) {
    logger.info(`Emitting event: ${type} to user: ${userIdStr} socket [id: ${socket.id}]`)
    socket.emit(type, data)
  } else {
    logger.info(`No active socket for user: ${userIdStr}`)
  }
}

async function broadcast({ type, data, boardId = null, userId }: BroadcastParams): Promise<void> {
  if (!gIo) return

  logger.info(`Broadcasting event: ${type}`)
  const excludedSocket = userId ? await _getUserSocket(userId.toString()) : null
  
  if (boardId && excludedSocket) {
    logger.info(`Broadcast to room ${boardId}`)
    excludedSocket.broadcast.to(boardId).emit(type, data)
  } else if (excludedSocket) {
    logger.info(`Broadcast to all excluding user`)
    excludedSocket.broadcast.emit(type, data)
  } else if (boardId) {
    logger.info(`Emit to room: ${boardId}`)
    gIo.to(boardId).emit(type, data)
  } else {
    logger.info(`Emit to all`)
    gIo.emit(type, data)
  }
}

async function _getUserSocket(userId: string): Promise<ExtendedSocket | null> {
  if (!gIo) return null
  const sockets = await _getAllSockets()
  const socket = sockets.find((s: ExtendedSocket) => s.userId === userId)
  return socket || null
}

async function _getAllSockets(): Promise<ExtendedSocket[]> {
  if (!gIo) return []
  const sockets = await gIo.fetchSockets()
  return sockets as unknown as ExtendedSocket[]
}

// Uncomment if needed for debugging
// async function _printSockets(): Promise<void> {
//   const sockets = await _getAllSockets()
//   console.log(`Sockets: (count: ${sockets.length}):`)
//   sockets.forEach(_printSocket)
// }

// function _printSocket(socket: ExtendedSocket): void {
//   console.log(`Socket - socketId: ${socket.id} userId: ${socket.userId}`)
// }

export const socketService = {
  setupSocketAPI,
  emitTo,
  emitToUser,
  broadcast,
}
