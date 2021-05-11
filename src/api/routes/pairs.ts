import { sub } from 'date-fns'
import Debug from 'debug'
import { Router } from 'express'

import { Candle, Exchange } from '../../models'
import { JSONData } from '../../types'
import { SqliteDatabase } from '../../services/sqlite-database'
import { Indicatorer } from '../../services/indicatorer'

type Report = {
  time: number
  value: number
}

type ReportApiResponse = {
  period: number
  report: Report[]
}

const debug = Debug('api:routes:pairs')

const router = Router()

export default (app: Router, database: SqliteDatabase) => {
  app.use('/pairs', router)

  router.get('/:id/candles', (req, res) => {
    const { id } = req.params
    const { period } = req.query

    const data: JSONData<Candle> =
      typeof id === 'string' &&
      typeof period === 'string' &&
      database
        .retrieveCandles(Exchange.CoinbasePro, id, period, sub(new Date(), { days: 90 }).getTime())
        .map(({ id, ...candle }) => ({
          id,
          type: 'candle',
          attributes: { ...candle },
        }))

    data ? res.status(200).json(data) : res.status(400)
  })

  router.get('/:id/report', (req, res) => {
    const { id } = req.params

    const periods = [
      // minutes
      5 * 60,
      15 * 60,
      // hours
      1 * 60 * 60,
      6 * 60 * 60,
      24 * 60 * 60,
    ]

    const data: JSONData<ReportApiResponse> =
      typeof id === 'string' &&
      periods.map((period) => {
        const values = database
          .retrieveCandles(
            Exchange.CoinbasePro,
            id,
            period.toString(),
            sub(new Date(), { days: 90 }).getTime()
          )
          .map(({ time, close }) => ({ time, close }))
        return {
          id: '',
          type: 'report',
          attributes: {
            period,
            report: Indicatorer.stc(values.map(({ close }) => close)).map((value, i) => ({
              time: values[i].time,
              value,
            })),
          },
        }
      })

    data ? res.status(200).json(data) : res.status(400)
  })
}
