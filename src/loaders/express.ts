import { Application, ErrorRequestHandler } from 'express'
import cors from 'cors'
import Debug from 'debug'
import logSymbols from 'log-symbols'

import { SqliteDatabase } from '../services/sqlite-database'
import routes from '../api'
import config from '../../config'

const debug = Debug('loaders:express')

type ExpressLoaderProps = {
  app: Application
  database: SqliteDatabase
}

export default ({ app, database }: ExpressLoaderProps) => {
  // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  // It shows the real origin IP in the heroku or Cloudwatch logs
  app.enable('trust proxy')

  // Enable Cross Origin Resource Sharing to all origins by default
  app.use(cors())

  // Load API routes
  app.use(config.api.prefix, routes({ database }))

  /// error handlers
  app.use((_req, _res, next) => {
    const err = new Error('Not Found')
    err['status'] = 404
    next(err)
  })

  app.use(((err: { status: number; message: string }, _req, res, _next) => {
    res.status(err.status || 500)
    res.json({
      errors: {
        message: err.message,
      },
    })
  }) as ErrorRequestHandler)

  debug(`${logSymbols.success} express loaded`)
}
