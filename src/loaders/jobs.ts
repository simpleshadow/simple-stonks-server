import Agenda from 'agenda'
import Agendash from 'agendash'
import Debug from 'debug'
import { Express } from 'express'
import logSymbols from 'log-symbols'

import CoinbaseProJobs from '../jobs/coinbase-pro'
import { DataController } from '../services/data-controller'
import config from '../../config'
import { getScheduledTime } from '../utils'

const debug = Debug('loaders:jobs')

type JobsLoaderProps = {
  app: Express
  dataController: DataController
}

export default ({ app, dataController }: JobsLoaderProps) => {
  const agenda = new Agenda({
    db: {
      address: config.mongodb.uri,
      collection: config.agenda.dbCollection,
      options: {
        useUnifiedTopology: true,
      },
    },
  })

  app.use('/dash', Agendash(agenda))

  const coinbaseProJobs = CoinbaseProJobs(dataController)

  agenda.define(
    'backfill candles',
    {
      priority: 10,
      concurrency: config.agenda.concurrency,
    },
    coinbaseProJobs.backfillDatabaseCandles
  )
  ;(async () => {
    await agenda.start()
    await agenda.cancel({})

    for (const period of config.periods) {
      for (const pair of config.pairs) {
        const { scheduledTime, repeatFrequency } = getScheduledTime(period)

        const jobName = 'backfill candles'

        await agenda.schedule('now', jobName, { pair, period })

        await agenda.schedule(scheduledTime, jobName, {
          pair,
          period,
          repeatFrequency,
          shouldSchedule: true,
        })
      }
    }

    // agenda.on(
    //   `success:backfill candles`,
    //   ({
    //     attrs: {
    //       data: { pair, period },
    //     },
    //   }) => {
    //     dataController.watchCandles(Exchange.CoinbasePro, pair, period)
    //   }
    // )
  })()

  debug(`${logSymbols.success} jobs loaded`)
}
