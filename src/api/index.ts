import { Router } from 'express'

import pairs from './routes/pairs'
import { SqliteDatabase } from '../services/sqlite-database'

export default ({ database }: { database: SqliteDatabase }) => {
  const router = Router()

  pairs(router, database)

  return router
}
