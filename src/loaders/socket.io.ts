import Debug from 'debug'
import http from 'http'
import logSymbols from 'log-symbols'
import socketIO from 'socket.io'

const debug = Debug('loaders:socket.io')

type SocketIoLoaderProps = {
  httpServer: http.Server
}

export default ({ httpServer }: SocketIoLoaderProps) => {
  let activeSockets: string[] = []

  const io = new socketIO.Server(httpServer, {
    cors: {
      origin: '*',
    },
  })

  io.on('connection', (socket) => {
    const existingSocket = activeSockets.find((existingSocket) => existingSocket === socket.id)

    if (!existingSocket) activeSockets.push(socket.id)

    socket.on('disconnect', () => {
      activeSockets = activeSockets.filter((existingSocket) => existingSocket !== socket.id)
    })
  })

  debug(`${logSymbols.success} socket.io loaded`)

  return io
}
