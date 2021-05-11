import { Job } from 'agenda'
import Debug from 'debug'
import logSymbols from 'log-symbols'

import { Exchange } from '../models'
import { formatInterval, getScheduledTime, roundDownTo } from '../utils'
import { DataController } from '../services/data-controller'
import { SqliteDatabase } from '../services/sqlite-database'

const debug = Debug(`jobs:coinbase-pro`)

type UpdateDatabaseWithLatestCandlesJobData = {
  pair: string
  period: number
  repeatFrequency?: string
  shouldSchedule?: boolean
}

export default (dataController: DataController) => ({
  backfillDatabaseCandles: async (job: Job<UpdateDatabaseWithLatestCandlesJobData>) => {
    const {
      attrs: {
        data: { pair, period, repeatFrequency, shouldSchedule },
      },
    } = job

    // repeatFrequency && job.repeatEvery(repeatFrequency)
    job.schedule(getScheduledTime(period).scheduledTime)

    debug(`${logSymbols.info} starting backfill for ${formatInterval(period / 60)} ${pair} candles `)
    await dataController.backfillCandles(Exchange.CoinbasePro, pair, period)
    debug(`${logSymbols.success} completed backfill for ${formatInterval(period / 60)} ${pair} candles`)
  },
})
