import Sqlite, { Database } from 'better-sqlite3'
import Debug from 'debug'
import logSymbols from 'log-symbols'

import { Candle } from '../models/candle'

const debug = Debug('services:database')

export type SqliteDatabase = {
  database: Database

  retrieveCandles: (exchange: string, symbol: string, period: string, start: number) => Candle[]
  retrieveLatestCandle: (exchange: string, symbol: string, period: string) => Candle
  upsertCandles: (candles: Candle[]) => void
}

export default () => {
  const databaseController: SqliteDatabase = {
    database: null,

    retrieveCandles: (...args) => {
      const query = databaseController.database.prepare(
        'SELECT * from candlesticks where exchange = ? AND symbol = ? and period = ? and time > ? order by time DESC LIMIT 10000'
      )

      return query.all(args).reverse() as Candle[]
    },

    retrieveLatestCandle: (...args) => {
      const query = databaseController.database.prepare(
        'SELECT * from candlesticks where exchange = ? AND symbol = ? and period = ? order by time DESC'
      )

      return query.get(args)
    },

    upsertCandles: (candles) => {
      const upsert = databaseController.database.prepare(
        'INSERT INTO candlesticks(exchange, symbol, period, time, open, high, low, close, volume) VALUES ($exchange, $symbol, $period, $time, $open, $high, $low, $close, $volume) ' +
          'ON CONFLICT(exchange, symbol, period, time) DO UPDATE SET open=$open, high=$high, low=$low, close=$close, volume=$volume'
      )

      databaseController.database.transaction(() => candles.forEach((candle) => upsert.run(candle)))()
    },
  }

  const db = Sqlite('stonks.db')
  db.pragma('journal_mode = WAL')

  db.pragma('SYNCHRONOUS = 1;')

  databaseController.database = db

  debug(`${logSymbols.success} database loaded`)

  return databaseController
}
