import CoinbasePro, { ProductEvent, WebSocketChannelName, WebSocketEvent } from 'coinbase-pro-node'
import { differenceInMinutes, sub, add } from 'date-fns'
import Debug from 'debug'
import logSymbols from 'log-symbols'
import { Server } from 'socket.io'

import { Candle, Exchange } from '../models'
import { formatInterval, roundDownTo } from '../utils'
import { SqliteDatabase } from './sqlite-database'
import config from '../../config'

type DataSources = {
  coinbaseProClient: CoinbasePro
  database: SqliteDatabase
  io: Server
}

export type DataController = {
  watching: {
    [pair: string]: {
      [period: number]: {
        time: number
      }
    }
  }
  getLatestCandle: (exchange: Exchange, symbol: string, period: string) => Candle
  watchCandles: (exchange: Exchange, pair: string, period: number) => void
  backfillCandles: (exchange: Exchange, pair: string, period: number) => Promise<void>
  backfillManyCandles: (exchange: Exchange, pairs: string[], periods: number[]) => Promise<void>
}

type DataControllerInterface = {
  backfillCandles: (
    dataSources: DataSources,
    exchange: Exchange,
    pair: string,
    period: number
  ) => Promise<void>

  backfillManyCandles: (
    dataSources: DataSources,
    exchange: Exchange,
    pairs: string[],
    periods: number[]
  ) => Promise<void>
}

const debug = Debug('services:data-controller')

const channel = {
  name: WebSocketChannelName.TICKER,
  product_ids: config.pairs,
}

const DataController: DataControllerInterface = {
  backfillCandles: async (dataSources, exchange, pair, period) => {
    const { coinbaseProClient, database } = dataSources
    try {
      const latestCandle = database.retrieveLatestCandle(exchange, pair, period.toString())

      const timeNow = new Date()
      const latestCandleTime = latestCandle?.time
        ? new Date(latestCandle.time)
        : sub(timeNow, { months: 1.5 })

      const difference = differenceInMinutes(timeNow, latestCandleTime)
      const barsSinceLatest = Math.floor(difference / (period / 60))

      const retrieveAndUpsertCandles = async (start: Date, end: Date, bars: number) => {
        const candles = await coinbaseProClient.rest.product.getCandles(pair, {
          granularity: period,
          start: start.toISOString(),
          end: end.toISOString(),
        })

        // candles.map((candle) => {
        //   pair === 'BTC-USD' && period === 60 && console.log(pair, period, new Date(candle.openTimeInMillis))
        // })

        database.upsertCandles(
          candles.map((candle) => ({
            exchange,
            symbol: pair,
            period: period.toString(),
            time: candle.openTimeInMillis,
            ...candle,
          }))
        )

        const newLatestCandle = database.retrieveLatestCandle(exchange, pair, period.toString())
        if (newLatestCandle.time !== roundDownTo(period * 1000)(new Date().getTime()).getTime()) {
          setTimeout(
            async () => await DataController.backfillCandles(dataSources, exchange, pair, period),
            500
          )
        }

        debug(
          `${logSymbols.success} upserted ${pair} ${formatInterval(
            period / 60
          )} (${bars} of ${barsSinceLatest}) candles\n  start: ${start} \n  end: ${end}`
        )
      }

      if (barsSinceLatest <= 300) {
        // pair === 'BTC-USD' &&
        //   period === 60 &&
        //   console.log(pair, period, new Date(latestCandleTime), add(timeNow, { minutes: 1 }))
        await retrieveAndUpsertCandles(latestCandleTime, add(timeNow, { minutes: 1 }), barsSinceLatest)
      } else {
        for (let i = 0; i < barsSinceLatest; ) {
          const startDate = add(latestCandleTime, { minutes: i * (period / 60) })
          const j = i + 300 > barsSinceLatest ? barsSinceLatest : i + 300
          const endDate = add(latestCandleTime, { minutes: j * (period / 60) })

          await retrieveAndUpsertCandles(startDate, endDate, j)

          i = j < barsSinceLatest ? j : barsSinceLatest + 1
        }
      }
    } catch (error) {
      debug('error %o', error)
    }
  },
  backfillManyCandles: async (dataSources, exchange, pairs, periods) => {
    for (const pair of pairs) {
      for (const period of periods) {
        await DataController.backfillCandles(dataSources, exchange, pair, period)
      }
    }
  },
}

export const createDataController = (dataSources: DataSources) => {
  const { coinbaseProClient, database, io } = dataSources
  const dataController: DataController = {
    getLatestCandle: database.retrieveLatestCandle,
    watching: {},
    watchCandles: (exchange, pair, period) => {
      const latestCandle = database.retrieveLatestCandle(exchange, pair, period.toString())

      coinbaseProClient.rest.product.watchCandles(pair, period, new Date(latestCandle.time).toISOString())

      debug(`watching ${pair} for new ${formatInterval(period / 60)} candles`)
    },

    backfillCandles: async (...args) => await DataController.backfillCandles(dataSources, ...args),
    backfillManyCandles: async (...args) => await DataController.backfillManyCandles(dataSources, ...args),
  }

  coinbaseProClient.ws.on(WebSocketEvent.ON_OPEN, () => {
    debug(WebSocketEvent.ON_OPEN)
    coinbaseProClient.ws.subscribe([channel])
  })

  coinbaseProClient.ws.on(WebSocketEvent.ON_SUBSCRIPTION_UPDATE, (subscriptions) => {
    if (subscriptions.channels.length === 0) coinbaseProClient.ws.disconnect()
  })

  coinbaseProClient.ws.on(WebSocketEvent.ON_MESSAGE_TICKER, (tickerMessage) => {
    io.of('/tickers').emit(tickerMessage.product_id, tickerMessage)
  })

  coinbaseProClient.rest.on(ProductEvent.NEW_CANDLE, async (pair, period, candle) => {
    debug(ProductEvent.NEW_CANDLE, pair, formatInterval(period / 60))
    await dataController.backfillCandles(Exchange.CoinbasePro, pair, period)
  })

  return dataController
}
