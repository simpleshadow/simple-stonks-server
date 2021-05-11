import { Express } from 'express'
import http from 'http'
import Debug from 'debug'

import coinbaseProClientLoader from './coinbase-pro-client'
import expressLoader from './express'
import jobsLoader from './jobs'
import socketIoLoader from './socket.io'
import sqliteDatabase from '../services/sqlite-database'
import { createDataController } from '../services/data-controller'

const debug = Debug('loaders:index')

export default async ({ expressApp }: { expressApp: Express }) => {
  const httpServer = http.createServer(expressApp)

  const io = socketIoLoader({ httpServer })

  const database = sqliteDatabase()
  const coinbaseProClient = coinbaseProClientLoader()
  const dataController = createDataController({ coinbaseProClient, database, io })

  jobsLoader({ app: expressApp, dataController })
  expressLoader({ app: expressApp, database })

  return { coinbaseProClient, database, httpServer, io }
}
