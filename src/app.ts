import Debug from 'debug'
import express from 'express'

import config from '../config'
import startLoaders from './loaders'

const debug = Debug('app')

export const startServer = async () => {
  const app = express()

  const { httpServer, coinbaseProClient } = await startLoaders({ expressApp: app })

  httpServer.listen(config.port, () => {
    debug(
      `#################################\nš¤ ready to stonk on port ${config.port} š¤\n#################################`
    )

    coinbaseProClient.ws.connect()
  })
}

startServer()
